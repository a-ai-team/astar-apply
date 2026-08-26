import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { chunkPdf, chunkPhoto, chunkQa, chunkText, estimateTokens, parseQa, splitBlocks, TARGET_TOKENS } from "./chunk";
import { CorpusExtractionSchema } from "./extract";
import { extractPdfText } from "./pdf-text";
import { buildSamplePdf, SAMPLE_PDF_PAGES } from "../../../fixtures/corpus/sample-pdf";
import { heuristicTags } from "./tags";

describe("chunkQa", () => {
  it("produces exactly one atomic chunk with question and answer", () => {
    const [c, ...rest] = chunkQa("How early should I apply for spring weeks?", "As soon as they open — most close by late October.");
    expect(rest).toHaveLength(0);
    expect(c.kind).toBe("qa");
    expect(c.question).toMatch(/spring weeks/);
    expect(c.answer).toMatch(/October/);
    expect(parseQa(c.text)).toEqual({ question: c.question, answer: c.answer });
  });
});

describe("chunkPdf", () => {
  it("3-page fixture PDF → 3 slide chunks with page_ref", async () => {
    const pdf = await buildSamplePdf();
    const text = await extractPdfText(pdf);
    expect(text.pageCount).toBe(3);
    const extraction = { pages: text.pages.map((markdown, i) => ({ page: i + 1, markdown, formulas: [], tables: [], confidence: 0.7, illegible_regions: [] })) };
    const chunks = chunkPdf(extraction);
    expect(chunks).toHaveLength(3);
    expect(chunks.map((c) => c.page_ref)).toEqual([1, 2, 3]);
    expect(chunks.every((c) => c.kind === "slide")).toBe(true);
    expect(chunks[2].text).toContain(SAMPLE_PDF_PAGES[2].title);
  });
  it("merges tiny pages into the previous chunk", () => {
    const chunks = chunkPdf({ pages: [
      { page: 1, markdown: "# Big slide\n\n" + "words ".repeat(80), formulas: [], tables: [], confidence: 1, illegible_regions: [] },
      { page: 2, markdown: "Thanks!", formulas: [], tables: [], confidence: 1, illegible_regions: [] },
    ] });
    expect(chunks).toHaveLength(1);
    expect(chunks[0].region?.pages).toEqual([1, 2]);
  });
});

describe("chunkText", () => {
  const para = (i: number) => `Paragraph ${i}. ` + "The sponsor funds the deal with debt and equity, and returns depend on paydown, growth and the exit multiple. ".repeat(4);
  it("windows long text into 200–400 token chunks with overlap", () => {
    const md = `# Section A\n\n${[1, 2, 3, 4, 5, 6].map(para).join("\n\n")}\n\n## Section B\n\n${[7, 8, 9, 10, 11, 12].map(para).join("\n\n")}`;
    const chunks = chunkText(md);
    expect(chunks.length).toBeGreaterThanOrEqual(3);
    for (const c of chunks) expect(c.token_count).toBeLessThanOrEqual(TARGET_TOKENS + 60);
    // heading prepended to every window
    expect(chunks.every((c) => /^#{1,2} Section/.test(c.text))).toBe(true);
    // overlap: some paragraph appears in two consecutive chunks
    const overlaps = chunks.slice(1).some((c, i) => {
      const prev = chunks[i].text.split("\n\n").filter((b) => b.startsWith("Paragraph"));
      return prev.some((p) => c.text.includes(p));
    });
    expect(overlaps).toBe(true);
  });
  it("never carries the previous section's overlap under a new heading (Loop 02 retro bug)", () => {
    const md = `# Depreciation walk\n\n${[1, 2, 3, 4, 5].map(para).join("\n\n")}\n\n## Equity value to enterprise value\n\n${[6, 7, 8].map(para).join("\n\n")}`;
    const chunks = chunkText(md);
    const ev = chunks.filter((c) => c.text.startsWith("## Equity value"));
    expect(ev.length).toBeGreaterThanOrEqual(1);
    for (const c of ev) {
      expect(c.text.split("\n\n")[1]).toMatch(/^Paragraph [678]\./);
      expect(c.text).not.toMatch(/Paragraph [1-5]\./);
    }
    // the last window of the first section keeps its own heading
    const dep = chunks.filter((c) => c.text.startsWith("# Depreciation"));
    expect(dep.some((c) => c.text.includes("Paragraph 5."))).toBe(true);
    expect(dep.every((c) => !c.text.includes("Paragraph 6."))).toBe(true);
  });
  it("keeps formula blocks intact", () => {
    const md = `# F\n\n${para(1)}\n\n$$\nEV = Eq + ND\n$$\n\n${para(2)}`;
    const blocks = splitBlocks(md);
    expect(blocks).toContain("$$\nEV = Eq + ND\n$$");
    const joined = chunkText(md).map((c) => c.text).join("\n");
    expect(joined).toContain("$$\nEV = Eq + ND\n$$");
  });
  it("short text → one chunk", () => {
    expect(chunkText("Just one line.")).toHaveLength(1);
  });
});

describe("recorded extraction fixture", () => {
  it("parses with CorpusExtractionSchema and chunks to ≥ 1 note", () => {
    const raw = JSON.parse(readFileSync("fixtures/recorded/corpus-extract.v1.sample-note.json", "utf8"));
    const extraction = CorpusExtractionSchema.parse(raw.extraction);
    expect(extraction.pages[0].confidence).toBeGreaterThan(0.6);
    const chunks = chunkPhoto(extraction);
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    expect(chunks[0].kind).toBe("note");
    expect(chunks[0].page_ref).toBe(1);
    expect(estimateTokens(chunks[0].text)).toBeGreaterThan(20);
    const tags = heuristicTags(chunks[0].text);
    expect(tags.topic_tags).toContain("spring-weeks");
  });
});
