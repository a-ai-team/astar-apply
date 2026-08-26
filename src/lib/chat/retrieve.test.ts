import { describe, expect, it } from "vitest";
import { CORPUS_BIAS, contentHref, fuseUnion, kindsForIntent, rungFor, sourcesForIntent, UNION_CAP } from "./retrieve";
import type { ChunkOrigin } from "./types";

describe("ladder (sourcesForIntent)", () => {
  it("technical → corpus then curriculum; fit/application/firm → corpus only; offtopic → nothing", () => {
    expect(sourcesForIntent("technical")).toEqual(["corpus", "content"]);
    expect(sourcesForIntent("fit")).toEqual(["corpus"]);
    expect(sourcesForIntent("application")).toEqual(["corpus"]);
    expect(sourcesForIntent("firm")).toEqual(["corpus"]);
    expect(sourcesForIntent("offtopic")).toEqual([]);
    expect(kindsForIntent("offtopic")).toEqual([]);
  });
});

describe("fuseUnion (RRF + corpus bias + cap)", () => {
  const origins = (m: Record<string, ChunkOrigin>) => new Map(Object.entries(m));
  it("adds CORPUS_BIAS to corpus ids so a tied corpus chunk outranks a curriculum chunk", () => {
    const out = fuseUnion(
      [{ ids: ["c1"], weight: 1 }, { ids: ["l1"], weight: 1 }],
      origins({ c1: "corpus", l1: "content" }),
    );
    expect(out.map((x) => x.id)).toEqual(["c1", "l1"]);
    expect(out[0].score).toBeCloseTo(1 + CORPUS_BIAS, 6);
    expect(out[1].score).toBeCloseTo(1, 6);
    expect(out[0].origin).toBe("corpus");
  });
  it("bias is 0.05 on per-source normalised scores — corpus wins the near-tie, the best lesson block sits right behind it", () => {
    expect(CORPUS_BIAS).toBe(0.05);
    const tie = fuseUnion([{ ids: ["l", "c"], weight: 1 }], origins({ l: "content", c: "corpus" }));
    expect(tie[0].id).toBe("c");
    // many corpus chunks ahead of the lessons in the raw RRF order: the top lesson block is still #2,
    // not buried behind every corpus chunk (per-source normalisation)
    const corpus = Array.from({ length: 10 }, (_, i) => `c${i}`);
    const out = fuseUnion([{ ids: [...corpus, "l0", "l1"], weight: 1 }], origins({ ...Object.fromEntries(corpus.map((c) => [c, "corpus" as const])), l0: "content", l1: "content" }));
    expect(out[0].id).toBe("c0");
    expect(out.findIndex((x) => x.id === "l0")).toBeLessThan(6);
    expect(out.findIndex((x) => x.id === "l0")).toBeLessThan(out.findIndex((x) => x.id === "c9"));
    expect(out.find((x) => x.id === "l0")!.score).toBeCloseTo(1, 6);
  });
  it("caps the union at 24 before rerank", () => {
    const ids = Array.from({ length: 40 }, (_, i) => `x${i}`);
    const out = fuseUnion([{ ids, weight: 1 }], origins(Object.fromEntries(ids.map((id) => [id, "content" as const]))));
    expect(out).toHaveLength(UNION_CAP);
    expect(UNION_CAP).toBe(24);
    expect(out[0].id).toBe("x0");
  });
  it("bias 0 and no origins → plain RRF order", () => {
    const out = fuseUnion([{ ids: ["a", "b"], weight: 1 }, { ids: ["b"], weight: 1 }], new Map(), { bias: 0 });
    expect(out.map((x) => x.id)).toEqual(["b", "a"]);
  });
});

describe("rungFor", () => {
  it("corpus > lesson > prior", () => {
    expect(rungFor([{ origin: "content" }, { origin: "corpus" }])).toBe("corpus");
    expect(rungFor([{ origin: "content" }])).toBe("lesson");
    expect(rungFor([])).toBe("prior");
  });
});

describe("contentHref", () => {
  it("lesson blocks deep-link to #block-n, questions to the practice page", () => {
    expect(contentHref({ kind: "lesson_block", lesson_id: "x", question_id: null, block_index: 4, block_type: "trap", slug: "ev-bridge-basics", topic_slug: "eqv-ev" })).toBe("/home/technicals/eqv-ev/ev-bridge-basics#block-4");
    expect(contentHref({ kind: "question", lesson_id: null, question_id: "y", block_index: null, block_type: null, slug: "what-is-enterprise-value", topic_slug: "eqv-ev" })).toBe("/home/practice/what-is-enterprise-value");
  });
});
