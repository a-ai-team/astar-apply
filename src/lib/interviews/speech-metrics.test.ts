import { describe, expect, it } from "vitest";
import { countFillers, deliveryScore, speechMetrics, typedMetrics, wordCount } from "./speech-metrics";

describe("speech metrics", () => {
  it("counts words, fillers and wpm from a transcript + duration", () => {
    const t = "So um enterprise value is, like, equity value plus net debt you know, um, and you subtract cash.";
    expect(wordCount(t)).toBe(18);
    expect(countFillers(t)).toEqual({ count: 4, fillers: ["um", "like", "you know"] });
    const m = speechMetrics(t, 6);
    expect(m).toMatchObject({ words: 18, wpm: 180, filler_count: 4, duration_s: 6 });
    expect(speechMetrics("", 10).wpm).toBeNull();
    expect(speechMetrics("two words", 1).wpm).toBeNull(); // under 3 s → no pace
    expect(typedMetrics("Enterprise value equals equity value plus net debt.", 30).wpm).toBe(16);
  });
  it("delivery /100 rewards pace in band, few fillers and enough words", () => {
    const good = deliveryScore({ words: 120, wpm: 140, filler_count: 1 });
    expect(good.pace).toBe("good");
    expect(good.score).toBeGreaterThanOrEqual(95);
    const fast = deliveryScore({ words: 120, wpm: 200, filler_count: 12 });
    expect(fast.pace).toBe("fast");
    expect(fast.score).toBeLessThan(good.score);
    expect(fast.notes.join(" ")).toMatch(/quick/);
    const short = deliveryScore({ words: 8, wpm: null, filler_count: 0 });
    expect(short.pace).toBe("unknown");
    expect(short.score).toBe(70);
    expect(short.notes.join(" ")).toMatch(/Short answer/);
    expect(deliveryScore({ words: 50, wpm: 30, filler_count: 30 }).score).toBe(10);
  });
});
