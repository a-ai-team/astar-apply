import { describe, expect, it } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { collectSearchResults, digestFixture, enforceSources, hostOf, textOf } from "./generate";
import { validateDigest, weekStart, isWeekStart } from "./schema";

describe("pulse digest schema", () => {
  it("the fixture digest is schema-valid with ≥ 3 sourced stories", () => {
    const d = digestFixture();
    expect(d.body.stories.length).toBeGreaterThanOrEqual(3);
    expect(d.body.stories.every((s) => s.sources.length >= 1 && s.talking_points.length === 3)).toBe(true);
    expect(validateDigest(d.body).ok).toBe(true);
  });
  it("rejects a digest with two stories or four talking points", () => {
    const d = digestFixture().body;
    expect(validateDigest({ ...d, stories: d.stories.slice(0, 2) }).ok).toBe(false);
    expect(validateDigest({ ...d, stories: d.stories.map((s) => ({ ...s, talking_points: [...s.talking_points, "x"] })) }).ok).toBe(false);
  });
  it("weekStart is the Monday on or before the date", () => {
    expect(weekStart(new Date("2026-08-25T10:00:00Z"))).toBe("2026-08-24");
    expect(weekStart(new Date("2026-08-24T00:00:00Z"))).toBe("2026-08-24");
    expect(weekStart(new Date("2026-08-30T23:00:00Z"))).toBe("2026-08-24");
    expect(isWeekStart("2026-08-24")).toBe(true);
    expect(isWeekStart("2026-08-25")).toBe(false);
  });
});

describe("search result handling", () => {
  const ok = { type: "web_search_tool_result", tool_use_id: "t1", content: [{ type: "web_search_result", title: "A", url: "https://www.ft.com/a", encrypted_content: "x", page_age: null }, { type: "web_search_result", title: "A again", url: "https://www.ft.com/a", encrypted_content: "x", page_age: null }] } as unknown as Anthropic.Beta.BetaContentBlock;
  const err = { type: "web_search_tool_result", tool_use_id: "t2", content: { type: "web_search_tool_result_error", error_code: "max_uses_exceeded" } } as unknown as Anthropic.Beta.BetaContentBlock;
  const use = { type: "server_tool_use", id: "t1", name: "web_search", input: { query: "q" } } as unknown as Anthropic.Beta.BetaContentBlock;
  const text = { type: "text", text: "notes", citations: null } as unknown as Anthropic.Beta.BetaContentBlock;
  it("collects unique results, counts searches and records errors without throwing", () => {
    const r = collectSearchResults([use, ok, use, err, text]);
    expect(r.results).toEqual([{ title: "A", url: "https://www.ft.com/a" }]);
    expect(r.errors).toEqual(["max_uses_exceeded"]);
    expect(r.searches).toBe(2);
    expect(textOf([text])).toBe("notes");
  });
  it("enforceSources drops unseen off-domain URLs and stories left without sources", () => {
    const d = digestFixture().body;
    const tampered = { ...d, stories: [...d.stories, { ...d.stories[0], headline: "Invented story with a fake source", sources: [{ title: "fake", url: "https://forum.example.org/x" }] }] };
    const r = enforceSources(tampered, [], ["example.com"]);
    expect(r.body?.stories.length).toBe(3);
    expect(r.dropped).toEqual(["Invented story with a fake source"]);
    expect(enforceSources({ ...d, stories: d.stories.slice(0, 3) }, [], ["ft.com"]).body).toBeNull();
    expect(hostOf("https://www.reuters.com/x")).toBe("reuters.com");
  });
});
