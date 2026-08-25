import { describe, expect, it } from "vitest";
import { EMBEDDING_DIM, cosine, embed, embedLocal, embeddingProvider } from "./embeddings";

describe("local embeddings", () => {
  it("are 1024-d, unit length and deterministic", () => {
    const a = embedLocal("How do I prepare for a spring week assessment centre?");
    const b = embedLocal("How do I prepare for a spring week assessment centre?");
    expect(a).toHaveLength(EMBEDDING_DIM);
    expect(Math.abs(cosine(a, a) - 1)).toBeLessThan(1e-9);
    expect(a).toEqual(b);
  });
  it("rank similar text above unrelated text", () => {
    const q = embedLocal("spring week networking coffee chat");
    const near = embedLocal("Networking before a spring week: ask for a coffee chat.");
    const far = embedLocal("Depreciation reduces pre-tax income on the income statement.");
    expect(cosine(q, near)).toBeGreaterThan(cosine(q, far));
  });
  it("embed() uses the local provider when no Voyage key is set", async () => {
    process.env.EMBEDDINGS_PROVIDER = "local";
    expect(embeddingProvider()).toBe("local");
    const out = await embed(["a b", "c d"], { inputType: "document" });
    expect(out).toHaveLength(2);
    expect(out[0]).toHaveLength(EMBEDDING_DIM);
  });
});
