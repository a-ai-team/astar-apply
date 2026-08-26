import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildDisagreementInput, disagreementComment, disagreementTargets, fileDisagreement, parseDisagreement, shouldCheck, splitByOrigin, detectDisagreement,
} from "./disagreement";
import type { Citation, RetrievedChunk } from "./types";

const fixture = JSON.parse(readFileSync(path.join(process.cwd(), "fixtures", "recorded", "chat-disagreement.v1.sample.json"), "utf8")) as {
  question: string; answer: string; chunks: RetrievedChunk[]; citations: Citation[]; parsed_output: unknown; response: { content: { type: string; text: string }[] };
};

describe("disagreement detector (recorded Haiku response)", () => {
  it("only runs when both rungs contributed", () => {
    expect(shouldCheck(fixture.chunks, fixture.citations)).toBe(true);
    expect(shouldCheck(fixture.chunks.filter((c) => c.origin === "corpus"), [])).toBe(false);
    expect(shouldCheck(fixture.chunks, [fixture.citations[0]])).toBe(false); // only the corpus chunk was cited
    const { corpus, content } = splitByOrigin(fixture.chunks, fixture.citations);
    expect(corpus.map((c) => c.id)).toEqual([fixture.chunks[0].id]);
    expect(content.map((c) => c.id)).toEqual([fixture.chunks[1].id]);
  });
  it("never calls the API in fixture mode", async () => {
    expect(await detectDisagreement({ question: fixture.question, answer: fixture.answer, chunks: fixture.chunks, citations: fixture.citations }, "fixture")).toBeNull();
  });
  it("parses the recorded structured output (and the raw text block) into {disagreement, summary}", () => {
    const d = parseDisagreement(fixture.parsed_output)!;
    expect(d.disagreement).toBe(true);
    expect(d.summary).toMatch(/^Mentor: subtract cash once/);
    const raw = JSON.parse(fixture.response.content[0].text);
    expect(parseDisagreement(raw)).toEqual(d);
    expect(parseDisagreement({ disagreement: false, summary: "ignored" })).toEqual({ disagreement: false, summary: "" });
    expect(parseDisagreement({ nope: 1 })).toBeNull();
  });
  it("builds the Haiku input with mentor and curriculum passages tagged", () => {
    const { corpus, content } = splitByOrigin(fixture.chunks, fixture.citations);
    const input = buildDisagreementInput(fixture.question, fixture.answer, corpus, content);
    expect(input).toContain(`<question>${fixture.question}</question>`);
    expect(input).toContain('<mentor title="Mentor – Do I subtract cash');
    expect(input).toContain('<curriculum title="Technicals › Equity value vs enterprise value › Placeholder bridge › Worked example">');
    expect(input).toContain("Q: Do I subtract cash"); // Q&A chunks are presented as question + answer
  });
  it("targets one review per distinct lesson/question", () => {
    const { content } = splitByOrigin(fixture.chunks, fixture.citations);
    expect(disagreementTargets([...content, ...content])).toEqual([{ target_type: "lesson", target_id: "44444444-4444-4444-8444-444444444444", label: fixture.chunks[1].label }]);
  });
  it("files a content_reviews row from the system-bot reviewer with a changes_requested decision, without touching the lesson", async () => {
    const inserted: Record<string, unknown>[] = [];
    const tables: string[] = [];
    const db = {
      from(table: string) {
        tables.push(table);
        if (table === "profiles") return { select: () => ({ eq: () => ({ limit: () => ({ maybeSingle: async () => ({ data: { id: "bot-1" } }) }) }) }) };
        if (table === "content_reviews") return { insert: (rows: Record<string, unknown>[]) => { inserted.push(...rows); return { select: async () => ({ data: rows.map((_, i) => ({ id: `rev-${i}` })), error: null }) }; } };
        throw new Error(`unexpected table ${table}`);
      },
    } as unknown as SupabaseClient;
    const d = parseDisagreement(fixture.parsed_output)!;
    const { content } = splitByOrigin(fixture.chunks, fixture.citations);
    const ids = await fileDisagreement(db, d, content, { threadId: "thread-1", messageId: null, question: fixture.question });
    expect(ids).toEqual(["rev-0"]);
    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({ target_type: "lesson", target_id: "44444444-4444-4444-8444-444444444444", reviewer_id: "bot-1", decision: "changes_requested" });
    const comment = inserted[0].comment as string;
    expect(comment).toBe(disagreementComment(d, { threadId: "thread-1", messageId: null, question: fixture.question }));
    expect(comment).toMatch(/^\[system-bot\] Mentor corpus disagrees/);
    expect(comment).toContain("Thread: /home/mentor/thread-1");
    expect(comment).toContain("the content was not changed");
    expect(tables).not.toContain("lessons");
  });
  it("does nothing when there is no disagreement", async () => {
    const db = { from: vi.fn() } as unknown as SupabaseClient;
    expect(await fileDisagreement(db, { disagreement: false, summary: "" }, fixture.chunks, { threadId: null, messageId: null, question: "" })).toEqual([]);
    expect((db.from as unknown as { mock: { calls: unknown[] } }).mock.calls).toHaveLength(0);
  });
});
