// Reciprocal rank fusion (k = 60) over ranked id lists, each with a weight. Pure; unit-tested.
export const RRF_K = 60;

export type RankedList = { ids: string[]; weight: number };

/** Returns ids sorted by fused score (descending), with the score. */
export function rrf(lists: RankedList[], k = RRF_K): { id: string; score: number }[] {
  const scores = new Map<string, number>();
  for (const { ids, weight } of lists) {
    ids.forEach((id, rank) => {
      scores.set(id, (scores.get(id) ?? 0) + weight / (k + rank + 1));
    });
  }
  return [...scores.entries()].map(([id, score]) => ({ id, score })).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}
