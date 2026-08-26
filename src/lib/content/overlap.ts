// Pure n-gram helpers for the 8-gram originality check (docs/loops/CONTRACTS.md, .claude/rules/content.md).
// The CLI + hidden-set loader live in scripts/eval/overlap.ts; this file has no I/O so the
// generation checkers (src/lib/content/generate/checks.ts) and the admin regenerate path can use it.

export const N = 8;

/** Very common English + finance-formula words: an 8-gram made only of these is not evidence of copying. */
const STOPWORDS = new Set(
  "a an and are as at be by for from has have in is it its of on or that the this to was were will with what which who how why when where do does did not no yes if then than so we you your our their they them he she his her i me my can could should would may might must into over under up down out about after before between each per vs versus plus minus times divided equals equal value values cash debt net total sum less more add subtract multiply divide x ev equity enterprise number numbers".split(
    " ",
  ),
);

export function tokens(text: string): string[] {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu, " ").split(/\s+/).filter(Boolean);
}

export function ngrams(text: string, n = N): Set<string> {
  const t = tokens(text);
  const out = new Set<string>();
  for (let i = 0; i + n <= t.length; i++) out.add(t.slice(i, i + n).join(" "));
  return out;
}

/** True when every token is a stopword/number (formula- or stopword-only gram → ignored). */
export function isTrivialGram(gram: string): boolean {
  return gram.split(" ").every((w) => STOPWORDS.has(w) || /^\d+$/.test(w));
}

/** Number of n-grams in `candidate` that also occur in `reference` (trivial grams ignored). */
export function overlapCount(candidate: string, reference: Set<string>, n = N): number {
  let hits = 0;
  for (const g of ngrams(candidate, n)) if (reference.has(g) && !isTrivialGram(g)) hits++;
  return hits;
}

/** Flattens every string in a JSON value into one text blob (for lesson bodies / question objects). */
export function jsonText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(jsonText).join("\n");
  if (value && typeof value === "object") return Object.values(value as Record<string, unknown>).map(jsonText).join("\n");
  return "";
}
