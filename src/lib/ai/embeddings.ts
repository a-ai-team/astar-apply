// Embeddings (docs/loops/CONTRACTS.md § AI module). Columns are always vector(1024).
// Provider chosen by EMBEDDINGS_PROVIDER: "voyage" (voyage-3-large, needs VOYAGE_API_KEY) or "local"
// (deterministic hashed word+bigram features, L2-normalised — good enough for tests and dev, and
// retrieval evals are labelled "FTS-only" while it is active). Switching provider = `npm run reembed`.

export const EMBEDDING_DIM = 1024;
export type EmbeddingProvider = "voyage" | "local";
export type InputType = "document" | "query";

export function embeddingProvider(): EmbeddingProvider {
  const explicit = process.env.EMBEDDINGS_PROVIDER;
  if (explicit === "voyage" || explicit === "local") return explicit;
  return process.env.VOYAGE_API_KEY ? "voyage" : "local";
}

/** Model label stored on each chunk so `reembed` can find stale rows. */
export function embeddingModel(): string {
  return embeddingProvider() === "voyage" ? "voyage-3-large" : "local-hash-v1";
}

export async function embed(texts: string[], opts: { inputType: InputType }): Promise<number[][]> {
  if (texts.length === 0) return [];
  return embeddingProvider() === "voyage" ? embedVoyage(texts, opts.inputType) : texts.map(embedLocal);
}

// ---- local provider -------------------------------------------------------------------------

/** FNV-1a 32-bit hash — stable across platforms and Node versions. */
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/** Deterministic 1024-d hashed embedding: unigrams (weight 1) + bigrams (weight 0.5), signed hashing, L2-normalised. */
export function embedLocal(text: string): number[] {
  const v = new Array<number>(EMBEDDING_DIM).fill(0);
  const toks = tokenize(text);
  const add = (feat: string, w: number) => {
    const h = fnv1a(feat);
    const idx = h % EMBEDDING_DIM;
    const sign = (h >>> 31) & 1 ? -1 : 1;
    v[idx] += sign * w;
  };
  for (let i = 0; i < toks.length; i++) {
    add(toks[i], 1);
    if (i + 1 < toks.length) add(`${toks[i]}_${toks[i + 1]}`, 0.5);
  }
  let norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  if (norm === 0) {
    v[0] = 1;
    norm = 1;
  }
  return v.map((x) => x / norm);
}

// ---- voyage provider ------------------------------------------------------------------------

async function embedVoyage(texts: string[], inputType: InputType): Promise<number[][]> {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) throw new Error("VOYAGE_API_KEY is not set but EMBEDDINGS_PROVIDER=voyage");
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += 64) {
    const batch = texts.slice(i, i + 64);
    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ input: batch, model: "voyage-3-large", input_type: inputType, output_dimension: EMBEDDING_DIM }),
    });
    if (!res.ok) throw new Error(`voyage embeddings failed: ${res.status} ${await res.text()}`);
    const json = (await res.json()) as { data: { index: number; embedding: number[] }[] };
    const sorted = [...json.data].sort((a, b) => a.index - b.index);
    for (const d of sorted) out.push(d.embedding);
  }
  return out;
}

export function cosine(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}
