import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { buildDocuments, dedupeCitations, mapCitation } from "./cite";
import type { RetrievedChunk } from "./types";

const fixture = JSON.parse(readFileSync(path.join(process.cwd(), "fixtures", "recorded", "chat-mentor.v1.sample.json"), "utf8")) as {
  chunks: RetrievedChunk[];
  response: Anthropic.Beta.BetaMessage;
};

describe("buildDocuments", () => {
  it("one content document per chunk with the label as title and citations enabled", () => {
    const docs = buildDocuments(fixture.chunks);
    expect(docs).toHaveLength(2);
    expect(docs[0].title).toBe(fixture.chunks[0].label);
    expect(docs[0].citations).toEqual({ enabled: true });
    expect(docs[0].source.type).toBe("content");
    const src = docs[0].source as Anthropic.Beta.BetaContentBlockSource;
    expect(Array.isArray(src.content) && src.content[0]).toMatchObject({ type: "text" });
  });
});

describe("mapCitation (recorded response)", () => {
  it("maps document_index → chunk_id and locates the quote", () => {
    const cited = fixture.response.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text" && !!b.citations);
    const mapped = cited.flatMap((b) => (b.citations ?? []).map((c) => mapCitation(c, fixture.chunks)!));
    expect(mapped).toHaveLength(2);
    expect(mapped[0].chunk_id).toBe(fixture.chunks[0].id);
    expect(mapped[0].source_id).toBe(fixture.chunks[0].source_id);
    expect(mapped[0].label).toBe(fixture.chunks[0].label);
    expect(mapped[0].quote.startsWith("Add net debt")).toBe(true);
    // Q&A documents are "Q: …\n\nA: …", so the quote starts after the question.
    expect(mapped[0].start).toBeGreaterThan(0);
    expect(fixture.chunks[0].text.slice(mapped[0].start, mapped[0].end)).toBe(mapped[0].quote);
    expect(mapped[1].chunk_id).toBe(fixture.chunks[1].id);
    expect(mapped[1].kind).toBe("corpus");
  });
  it("returns null for an out-of-range document index", () => {
    const c: Anthropic.Beta.BetaCitationContentBlockLocation = {
      type: "content_block_location", cited_text: "x", document_index: 9, document_title: null, start_block_index: 0, end_block_index: 1, file_id: null,
    };
    expect(mapCitation(c, fixture.chunks)).toBeNull();
  });
  it("char_location keeps the API offsets", () => {
    const c: Anthropic.Beta.BetaCitationCharLocation = {
      type: "char_location", cited_text: "Add net debt.", document_index: 0, document_title: null, start_char_index: 56, end_char_index: 69, file_id: null,
    };
    const m = mapCitation(c, fixture.chunks)!;
    expect(m.start).toBe(56);
    expect(m.end).toBe(69);
  });
  it("dedupes by chunk keeping first quote", () => {
    const a = { chunk_id: "1", source_id: "s", kind: "corpus" as const, label: "l", quote: "first", start: 0, end: 5 };
    expect(dedupeCitations([a, { ...a, quote: "second" }, { ...a, chunk_id: "2" }])).toHaveLength(2);
  });
});
