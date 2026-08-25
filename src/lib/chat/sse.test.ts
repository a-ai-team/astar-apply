import { describe, expect, it } from "vitest";
import { createSseParser, encodeSse, sseResponse } from "./sse";
import type { ChatEvent } from "./types";

describe("sse", () => {
  it("encodes event + data frames", () => {
    expect(encodeSse({ type: "delta", text: "hi\nthere" })).toBe('event: delta\ndata: {"type":"delta","text":"hi\\nthere"}\n\n');
  });
  it("parser round-trips across arbitrary chunk boundaries", () => {
    const events: ChatEvent[] = [
      { type: "delta", text: "a" },
      { type: "citation", citation: { chunk_id: "c", source_id: "s", kind: "corpus", label: "L", quote: "q", start: 0, end: 1 }, index: 1 },
      { type: "error", message: "x" },
    ];
    const wire = events.map(encodeSse).join("");
    const feed = createSseParser();
    const out: ChatEvent[] = [];
    for (let i = 0; i < wire.length; i += 7) out.push(...feed(wire.slice(i, i + 7)));
    expect(out).toEqual(events);
  });
  it("sseResponse streams a generator and appends an error frame on throw", async () => {
    async function* gen(): AsyncGenerator<ChatEvent> {
      yield { type: "delta", text: "ok" };
      throw new Error("boom");
    }
    const res = sseResponse(gen(), { onError: () => {} });
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");
    const text = await res.text();
    const feed = createSseParser();
    const out = feed(text);
    expect(out[0]).toEqual({ type: "delta", text: "ok" });
    expect(out[1]).toEqual({ type: "error", message: "boom" });
  });
});
