// Type-aware chunking (docs/research/rag-design.md). Pure functions — no I/O, unit-tested.
//   qa    → exactly one chunk (question + answer)
//   pdf   → one chunk per page (kind slide) with page_ref; pages under MIN_PAGE_TOKENS merge into the previous
//   text / photo → heading-aware windows of 200–400 tokens with ~15 % overlap; paragraphs and formulas never split
import type { CorpusExtraction } from "./extract";

export type ChunkKind = "note" | "slide" | "qa" | "paragraph" | "formula" | "table";
export type DraftChunk = {
  kind: ChunkKind;
  ordinal: number;
  text: string;
  question?: string;
  answer?: string;
  page_ref?: number;
  region?: Record<string, unknown>;
  token_count: number;
};

export const TARGET_TOKENS = 400;
export const MIN_WINDOW_TOKENS = 200;
export const OVERLAP = 0.15;
export const MIN_PAGE_TOKENS = 40;

/** Cheap token estimate (~4 chars/token for English prose; formulas run denser). */
export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function chunkQa(question: string, answer: string): DraftChunk[] {
  const q = question.trim();
  const a = answer.trim();
  const text = `Q: ${q}\n\nA: ${a}`;
  return [{ kind: "qa", ordinal: 0, text, question: q, answer: a, token_count: estimateTokens(text) }];
}

/** Parses the stored raw_text of a Q&A source ("Q: …\n\nA: …"). */
export function parseQa(raw: string): { question: string; answer: string } | null {
  const m = raw.match(/^\s*Q:\s*([\s\S]*?)\n\s*A:\s*([\s\S]*)$/);
  if (!m) return null;
  return { question: m[1].trim(), answer: m[2].trim() };
}

export function chunkPdf(extraction: CorpusExtraction): DraftChunk[] {
  const out: DraftChunk[] = [];
  const pages = [...extraction.pages].sort((a, b) => a.page - b.page);
  for (const p of pages) {
    const text = pageText(p.markdown, p.formulas, p.tables);
    if (!text) continue;
    const tokens = estimateTokens(text);
    const prev = out[out.length - 1];
    if (prev && tokens < MIN_PAGE_TOKENS) {
      prev.text = `${prev.text}\n\n${text}`;
      prev.token_count = estimateTokens(prev.text);
      prev.region = { ...(prev.region ?? {}), pages: [...((prev.region?.pages as number[] | undefined) ?? [prev.page_ref!]), p.page] };
      continue;
    }
    out.push({ kind: "slide", ordinal: out.length, text, page_ref: p.page, region: { pages: [p.page], confidence: p.confidence }, token_count: tokens });
  }
  return out;
}

/** Photo extractions → note chunks (per page, then windowed if a page is long). */
export function chunkPhoto(extraction: CorpusExtraction): DraftChunk[] {
  const out: DraftChunk[] = [];
  for (const p of [...extraction.pages].sort((a, b) => a.page - b.page)) {
    const text = pageText(p.markdown, p.formulas, p.tables);
    if (!text) continue;
    for (const w of chunkText(text, "note")) {
      out.push({ ...w, ordinal: out.length, page_ref: p.page, region: { pages: [p.page], confidence: p.confidence } });
    }
  }
  return out;
}

function pageText(markdown: string, formulas: { latex: string; plain: string }[], tables: { caption: string; rows: string[][] }[]): string {
  const parts = [markdown.trim()];
  const extraFormulas = formulas.filter((f) => f.latex && !markdown.includes(f.latex));
  if (extraFormulas.length) parts.push(extraFormulas.map((f) => `$$${f.latex}$$ — ${f.plain}`).join("\n"));
  for (const t of tables) {
    if (!t.rows.length || markdown.includes(`| ${t.rows[0][0]}`)) continue;
    const md = [`| ${t.rows[0].join(" | ")} |`, `| ${t.rows[0].map(() => "---").join(" | ")} |`, ...t.rows.slice(1).map((r) => `| ${r.join(" | ")} |`)];
    parts.push((t.caption ? `**${t.caption}**\n` : "") + md.join("\n"));
  }
  return parts.filter(Boolean).join("\n\n").trim();
}

/**
 * Heading-aware windows. Splits markdown into blocks (headings, paragraphs, list items, fenced
 * code/formula blocks kept intact), then packs blocks into windows of ≤ TARGET_TOKENS. A window
 * closes early at a heading once it holds ≥ MIN_WINDOW_TOKENS. The last ~15 % of tokens of each
 * window is repeated at the start of the next (block-aligned) for context continuity. The current
 * heading is prepended to every window so a chunk always knows what section it came from.
 */
export function chunkText(markdown: string, kind: "paragraph" | "note" = "paragraph"): DraftChunk[] {
  const blocks = splitBlocks(markdown);
  const out: DraftChunk[] = [];
  let heading = "";
  let cur: string[] = [];
  let curTokens = 0;

  const flush = () => {
    if (!cur.length) return;
    const body = cur.join("\n\n");
    const text = heading && !body.startsWith(heading) ? `${heading}\n\n${body}` : body;
    out.push({ kind, ordinal: out.length, text, token_count: estimateTokens(text) });
    // carry over trailing blocks worth ~15 % of the window as overlap
    const budget = Math.floor(curTokens * OVERLAP);
    const carry: string[] = [];
    let carried = 0;
    for (let i = cur.length - 1; i >= 0 && carried < budget; i--) {
      const t = estimateTokens(cur[i]);
      if (carried + t > budget && carry.length) break;
      carry.unshift(cur[i]);
      carried += t;
    }
    cur = carry.length < cur.length ? carry : [];
    curTokens = cur.reduce((s, b) => s + estimateTokens(b), 0);
  };

  for (const b of blocks) {
    const t = estimateTokens(b);
    if (isHeading(b)) {
      if (curTokens >= MIN_WINDOW_TOKENS) flush();
      // a heading starts a new section: drop overlap carried from the previous section
      if (cur.length && curTokens < MIN_WINDOW_TOKENS && cur.every((x) => !isHeading(x))) {
        // keep short preamble together with the new heading
      }
      heading = b;
      cur.push(b);
      curTokens += t;
      continue;
    }
    if (curTokens + t > TARGET_TOKENS && curTokens >= MIN_WINDOW_TOKENS) flush();
    cur.push(b);
    curTokens += t;
  }
  if (cur.length && (out.length === 0 || cur.some((b) => !out[out.length - 1].text.includes(b)))) flush();
  return out;
}

function isHeading(b: string): boolean {
  return /^#{1,6}\s/.test(b);
}

/** Markdown → blocks. Fenced ``` and $$ blocks stay whole; list items stay whole; blank lines separate. */
export function splitBlocks(markdown: string): string[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let buf: string[] = [];
  let fence: string | null = null;
  const push = () => {
    const t = buf.join("\n").trim();
    if (t) blocks.push(t);
    buf = [];
  };
  for (const line of lines) {
    if (fence) {
      buf.push(line);
      if (line.trim().startsWith(fence)) {
        fence = null;
        push();
      }
      continue;
    }
    const trimmed = line.trim();
    if (trimmed.startsWith("```") || trimmed.startsWith("$$")) {
      push();
      buf.push(line);
      fence = trimmed.startsWith("```") ? "```" : "$$";
      // single-line $$…$$ formula
      if (fence === "$$" && trimmed.length > 2 && trimmed.endsWith("$$")) {
        fence = null;
        push();
      }
      continue;
    }
    if (trimmed === "") {
      push();
      continue;
    }
    if (isHeading(trimmed)) {
      push();
      buf.push(trimmed);
      push();
      continue;
    }
    if (/^([-*+]|\d+[.)])\s/.test(trimmed) && buf.length) {
      push();
    }
    buf.push(line);
  }
  push();
  return blocks;
}
