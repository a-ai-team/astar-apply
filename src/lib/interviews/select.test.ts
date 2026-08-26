import { describe, expect, it } from "vitest";
import { MOCK_TOPICS, seededRng, selectDrill, selectMock, type PoolQuestion } from "./select";

function pool(spec: Record<string, number[]>): PoolQuestion[] {
  const out: PoolQuestion[] = [];
  for (const [topic, diffs] of Object.entries(spec)) diffs.forEach((d, i) => out.push({ id: `${topic}-${i}`, topic_slug: topic, subtopic_slug: null, difficulty: d }));
  return out;
}

describe("selectDrill", () => {
  it("takes up to 5 from one topic without replacement, difficulties 1–3 preferred", () => {
    const p = pool({ accounting: [1, 1, 2, 2, 3, 3, 4, 4], "eqv-ev": [1, 2] });
    const s = selectDrill(p, "accounting", { rng: seededRng(1) });
    expect(s.ids).toHaveLength(5);
    expect(new Set(s.ids).size).toBe(5);
    expect(s.shortfall).toBe(0);
    for (const id of s.ids) expect(p.find((q) => q.id === id)!.difficulty).toBeLessThanOrEqual(3);
    expect(s.ids.every((id) => id.startsWith("accounting-"))).toBe(true);
  });
  it("falls back to difficulty 4 when 1–3 cannot fill the drill, and reports the shortfall on a tiny pool", () => {
    const p = pool({ accounting: [1, 2, 4, 4, 4] });
    const s = selectDrill(p, "accounting", { rng: seededRng(2) });
    expect(s.ids).toHaveLength(5);
    const tiny = selectDrill(pool({ accounting: [1, 2, 3] }), "accounting", { rng: seededRng(3) });
    expect(tiny.ids).toHaveLength(3);
    expect(tiny.shortfall).toBe(2);
    expect(selectDrill(p, "dcf").ids).toEqual([]);
  });
  it("is deterministic for a seed and varies across seeds", () => {
    const p = pool({ accounting: [1, 1, 2, 2, 3, 3, 3, 2, 1, 2] });
    expect(selectDrill(p, "accounting", { rng: seededRng(7) }).ids).toEqual(selectDrill(p, "accounting", { rng: seededRng(7) }).ids);
    const a = selectDrill(p, "accounting", { rng: seededRng(7) }).ids.join();
    const b = selectDrill(p, "accounting", { rng: seededRng(8) }).ids.join();
    expect(a).not.toEqual(b);
  });
});

describe("selectMock", () => {
  it("stratifies 15 across the 7 technical topics (≤ 3 per topic when every topic has ≥ 3) and ramps easy → hard", () => {
    const spec: Record<string, number[]> = {};
    for (const t of MOCK_TOPICS) spec[t] = [1, 2, 3, 4, 2, 3, 1, 4];
    const p = pool(spec);
    const s = selectMock(p, { rng: seededRng(11) });
    expect(s.ids).toHaveLength(15);
    expect(new Set(s.ids).size).toBe(15);
    const counts = new Map<string, number>();
    for (const id of s.ids) counts.set(id.split("-").slice(0, -1).join("-"), (counts.get(id.split("-").slice(0, -1).join("-")) ?? 0) + 1);
    expect(counts.size).toBe(7);
    for (const c of counts.values()) expect(c).toBeGreaterThanOrEqual(2);
    for (const c of counts.values()) expect(c).toBeLessThanOrEqual(3);
    const diffs = s.ids.map((id) => p.find((q) => q.id === id)!.difficulty);
    expect([...diffs].sort((a, b) => a - b)).toEqual(diffs);
    expect(s.topics).toHaveLength(7);
  });
  it("uses the whole pool and says how short it is when only 6 questions exist", () => {
    const p = pool({ accounting: [1, 2, 3], "eqv-ev": [1, 2, 4] });
    const s = selectMock(p, { rng: seededRng(5) });
    expect(s.ids).toHaveLength(6);
    expect(s.shortfall).toBe(9);
    expect(s.topics.sort()).toEqual(["accounting", "eqv-ev"]);
  });
  it("draws more from rich topics only after every topic has contributed", () => {
    const p = pool({ accounting: Array(20).fill(2), "eqv-ev": [1], dcf: [3, 3] });
    const s = selectMock(p, { rng: seededRng(9) });
    expect(s.ids).toHaveLength(15);
    expect(s.ids.filter((id) => id.startsWith("eqv-ev")).length).toBe(1);
    expect(s.ids.filter((id) => id.startsWith("dcf")).length).toBe(2);
    expect(s.ids.filter((id) => id.startsWith("accounting")).length).toBe(12);
  });
  it("ignores non-technical topics", () => {
    const p = pool({ "fit-behavioural": [1, 2], accounting: [1] });
    expect(selectMock(p).ids).toEqual(["accounting-0"]);
  });
});
