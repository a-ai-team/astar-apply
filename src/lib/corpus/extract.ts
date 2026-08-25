// Extraction: photos + PDFs → CorpusExtraction (structured pages) via Opus 5 `messages.parse`.
// Text/Q&A sources need no extraction (see ingest.ts). Rules: .claude/rules/ai.md.
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type Anthropic from "@anthropic-ai/sdk";
import { MODEL_CHAT, OPUS_BETAS, OPUS_FALLBACKS, getClient, hasAnthropicKey } from "@/lib/ai/client";
import { corpusExtractPrompt } from "@/lib/ai/prompts/corpus-extract.v1";
import { extractPdfText } from "./pdf-text";

export const CorpusPageSchema = z.object({
  page: z.number().int().min(1),
  markdown: z.string(),
  formulas: z.array(z.object({ latex: z.string(), plain: z.string() })),
  tables: z.array(z.object({ caption: z.string(), rows: z.array(z.array(z.string())) })),
  confidence: z.number().min(0).max(1),
  illegible_regions: z.array(z.string()),
});
export const CorpusExtractionSchema = z.object({ pages: z.array(CorpusPageSchema) });
export type CorpusPage = z.infer<typeof CorpusPageSchema>;
export type CorpusExtraction = z.infer<typeof CorpusExtractionSchema>;

export type ExtractionResult = {
  extraction: CorpusExtraction;
  model: string;
  /** Mean page confidence (0–1). */
  confidence: number;
  prompt_version: number;
  usage?: { input_tokens: number; output_tokens: number; cache_read_input_tokens: number | null };
};

export type ImageMime = "image/png" | "image/jpeg" | "image/webp" | "image/gif";
export const MAX_IMAGES_PER_CALL = 4;
const MAX_PDF_PAGES_PER_CALL = 100;

/**
 * CORPUS_EXTRACTION_MODE=fixture (set by playwright.config.ts and CI) short-circuits the API and
 * returns the recorded fixture so the pipeline can be exercised without spend. "auto" uses the API
 * when ANTHROPIC_API_KEY is set, else the fixture.
 */
export function extractionMode(): "api" | "fixture" {
  const m = process.env.CORPUS_EXTRACTION_MODE;
  if (m === "fixture") return "fixture";
  if (m === "api") return "api";
  return hasAnthropicKey() ? "api" : "fixture";
}

async function loadFixture(name: "sample-note" | "sample-deck"): Promise<ExtractionResult> {
  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");
  const raw = await readFile(path.join(process.cwd(), "fixtures", "recorded", `corpus-extract.v1.${name}.json`), "utf8");
  const parsed = JSON.parse(raw) as ExtractionResult;
  return { ...parsed, extraction: CorpusExtractionSchema.parse(parsed.extraction), model: `${parsed.model} (fixture)` };
}

export function meanConfidence(pages: CorpusPage[]): number {
  if (pages.length === 0) return 0;
  return pages.reduce((s, p) => s + p.confidence, 0) / pages.length;
}

async function runExtraction(content: Anthropic.Beta.BetaContentBlockParam[], effort: "high" | "medium" = "high") {
  const client = getClient();
  const res = await client.beta.messages.parse({
    model: MODEL_CHAT,
    max_tokens: 16000,
    betas: [...OPUS_BETAS],
    fallbacks: OPUS_FALLBACKS,
    system: [{ type: "text", text: corpusExtractPrompt.system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content }],
    output_config: { format: betaZodOutputFormat(CorpusExtractionSchema), effort },
  });
  if (res.stop_reason === "refusal") throw new Error("extraction refused by the model");
  if (!res.parsed_output) throw new Error(`extraction returned no parsable output (stop_reason=${res.stop_reason})`);
  return { parsed: res.parsed_output, model: res.model, usage: res.usage };
}

/** Photos: ≤ 4 images per call; page numbers are renumbered to be global across calls. */
export async function extractImages(images: { data: Uint8Array; mime: ImageMime }[]): Promise<ExtractionResult> {
  if (extractionMode() === "fixture") {
    const fx = await loadFixture("sample-note");
    const pages = images.map((_, i) => ({ ...fx.extraction.pages[0], page: i + 1 }));
    return { ...fx, extraction: { pages }, confidence: meanConfidence(pages) };
  }
  const pages: CorpusPage[] = [];
  let model = MODEL_CHAT;
  let usage: ExtractionResult["usage"];
  for (let i = 0; i < images.length; i += MAX_IMAGES_PER_CALL) {
    const batch = images.slice(i, i + MAX_IMAGES_PER_CALL);
    const content: Anthropic.Beta.BetaContentBlockParam[] = batch.map((img) => ({
      type: "image",
      source: { type: "base64", media_type: img.mime, data: Buffer.from(img.data).toString("base64") },
    }));
    content.push({ type: "text", text: `Transcribe ${batch.length === 1 ? "this photo" : `these ${batch.length} photos, one page each, in order`}.` });
    const out = await runExtraction(content);
    for (const p of out.parsed.pages) pages.push({ ...p, page: i + p.page });
    model = out.model;
    usage = pickUsage(out.usage);
  }
  return { extraction: { pages }, model, confidence: meanConfidence(pages), prompt_version: corpusExtractPrompt.version, usage };
}

/** PDFs: document block (split > 100 pages) + pdfjs text as a hint. */
export async function extractPdf(data: Uint8Array): Promise<ExtractionResult & { pageCount: number; rawText: string }> {
  const text = await extractPdfText(data);
  const rawText = text.pages.map((p, i) => `--- page ${i + 1} ---\n${p}`).join("\n\n");
  if (extractionMode() === "fixture") {
    // Offline (CI / no key / fixture mode): pdfjs text layer becomes the page markdown, moderate
    // confidence so the source lands in review rather than auto-approving.
    const pages = text.pages.map((markdown, i) => ({ page: i + 1, markdown, formulas: [], tables: [], confidence: 0.7, illegible_regions: [] }));
    return { extraction: { pages }, model: "pdfjs-only (fixture)", confidence: 0.7, prompt_version: corpusExtractPrompt.version, pageCount: text.pageCount, rawText };
  }
  const pages: CorpusPage[] = [];
  let model = MODEL_CHAT;
  let usage: ExtractionResult["usage"];
  const parts = text.pageCount > MAX_PDF_PAGES_PER_CALL ? await splitPdf(data, MAX_PDF_PAGES_PER_CALL) : [{ data, offset: 0, count: text.pageCount }];
  for (const part of parts) {
    const hint = text.pages.slice(part.offset, part.offset + part.count).map((p, i) => `[page ${i + 1}] ${p}`).join("\n");
    const content: Anthropic.Beta.BetaContentBlockParam[] = [
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: Buffer.from(part.data).toString("base64") } },
      { type: "text", text: `Transcribe every page of this ${part.count}-page PDF in order. Extracted text layer, as a hint only (may be incomplete or mis-ordered):\n\n${hint}` },
    ];
    const out = await runExtraction(content, "medium");
    for (const p of out.parsed.pages) pages.push({ ...p, page: part.offset + p.page });
    model = out.model;
    usage = pickUsage(out.usage);
  }
  return { extraction: { pages }, model, confidence: meanConfidence(pages), prompt_version: corpusExtractPrompt.version, pageCount: text.pageCount, rawText, usage };
}

async function splitPdf(data: Uint8Array, size: number) {
  const { PDFDocument } = await import("pdf-lib");
  const src = await PDFDocument.load(data);
  const total = src.getPageCount();
  const out: { data: Uint8Array; offset: number; count: number }[] = [];
  for (let offset = 0; offset < total; offset += size) {
    const doc = await PDFDocument.create();
    const idx = Array.from({ length: Math.min(size, total - offset) }, (_, i) => offset + i);
    const pages = await doc.copyPages(src, idx);
    pages.forEach((p) => doc.addPage(p));
    out.push({ data: await doc.save(), offset, count: idx.length });
  }
  return out;
}

function pickUsage(u: Anthropic.Beta.BetaUsage | undefined): ExtractionResult["usage"] {
  if (!u) return undefined;
  return { input_tokens: u.input_tokens, output_tokens: u.output_tokens, cache_read_input_tokens: u.cache_read_input_tokens ?? null };
}
