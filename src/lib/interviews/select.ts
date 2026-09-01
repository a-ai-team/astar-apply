// Question selection for drills and mocks (Loop 07). Pure functions over an in-memory pool so the
// stratification is unit-testable; `loadPool` is the only DB touch. Works with today's tiny bank
// (6 approved questions) and with ≈ 350 later: a drill takes up to DRILL_SIZE without replacement,
// a mock takes up to MOCK_SIZE round-robin across the technical topics (so a 6-question pool gives
// a 6-question mock and the UI says so).
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LensSlug } from "@/lib/content/lesson-schema";
import { CURRICULUM } from "@/lib/content/taxonomy";
import { DRILL_SIZE, MOCK_SIZE } from "./types";

export type PoolQuestion = { id: string; topic_slug: string; subtopic_slug: string | null; difficulty: number; tags?: string[] };

/**
 * Lens gate (Loop 18): a generalist run never sees `lens:`-tagged questions; choosing a lens adds
 * that lens's questions and still hides the other lens's. Filtered before any shuffle, so the
 * seeded order of a lens-free pool is untouched.
 */
function lensAllows(q: PoolQuestion, lens?: LensSlug): boolean {
  const lensTags = (q.tags ?? []).filter((t) => t.startsWith("lens:"));
  return lensTags.length === 0 || (!!lens && lensTags.includes(`lens:${lens}`));
}

/** The technical topics a full mock draws from, in the order the curriculum teaches them. */
export const MOCK_TOPICS: readonly string[] = CURRICULUM.filter((t) => t.kind === "core" || t.kind === "foundation").map((t) => t.slug);

export const DRILL_DIFFICULTIES = [1, 2, 3] as const;
export const MOCK_DIFFICULTIES = [1, 2, 3, 4] as const;

export type Rng = () => number;

/** Deterministic PRNG (mulberry32) so tests and the demo seed are reproducible. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(xs: readonly T[], rng: Rng): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export type Selection = { ids: string[]; requested: number; shortfall: number; topics: string[] };

/** Drill: up to DRILL_SIZE random approved questions from one topic, difficulties 1–3 (falls back to any difficulty when that leaves fewer than DRILL_SIZE). */
export function selectDrill(pool: readonly PoolQuestion[], topicSlug: string, opts: { n?: number; rng?: Rng; lens?: LensSlug } = {}): Selection {
  const n = opts.n ?? DRILL_SIZE;
  const rng = opts.rng ?? Math.random;
  const inTopic = pool.filter((q) => q.topic_slug === topicSlug && lensAllows(q, opts.lens));
  const preferred = inTopic.filter((q) => (DRILL_DIFFICULTIES as readonly number[]).includes(q.difficulty));
  const candidates = preferred.length >= n ? preferred : inTopic;
  const picked = shuffle(candidates, rng).slice(0, n);
  return { ids: picked.map((q) => q.id), requested: n, shortfall: Math.max(0, n - picked.length), topics: picked.length ? [topicSlug] : [] };
}

/**
 * Mock: up to MOCK_SIZE questions stratified across MOCK_TOPICS (round-robin over the topics that
 * have approved questions, each topic's candidates shuffled, no repeats), then ordered easy → hard
 * with topics interleaved so the candidate never gets five accounting questions in a row.
 */
export function selectMock(pool: readonly PoolQuestion[], opts: { n?: number; rng?: Rng; topics?: readonly string[]; lens?: LensSlug } = {}): Selection {
  const n = opts.n ?? MOCK_SIZE;
  const rng = opts.rng ?? Math.random;
  const topics = opts.topics ?? MOCK_TOPICS;
  const byTopic = new Map<string, PoolQuestion[]>();
  for (const t of topics) {
    const qs = pool.filter((q) => q.topic_slug === t && (MOCK_DIFFICULTIES as readonly number[]).includes(q.difficulty) && lensAllows(q, opts.lens));
    if (qs.length) byTopic.set(t, shuffle(qs, rng));
  }
  const picked: PoolQuestion[] = [];
  let progressed = true;
  while (picked.length < n && progressed) {
    progressed = false;
    for (const qs of byTopic.values()) {
      if (picked.length >= n) break;
      const q = qs.shift();
      if (q) {
        picked.push(q);
        progressed = true;
      }
    }
  }
  // Ramp: sort by difficulty, keeping the round-robin (topic-interleaved) order within a difficulty.
  const ordered = [...picked].sort((a, b) => a.difficulty - b.difficulty);
  return { ids: ordered.map((q) => q.id), requested: n, shortfall: Math.max(0, n - ordered.length), topics: [...new Set(ordered.map((q) => q.topic_slug))] };
}

/** Approved questions with their topic/subtopic slugs (RLS on the cookie client already hides drafts; the filter is belt and braces). */
export async function loadPool(db: SupabaseClient, topicSlug?: string): Promise<PoolQuestion[]> {
  let q = db.from("questions").select("id, difficulty, status, tags, topic:topics!inner(slug), subtopic:subtopics(slug)").eq("status", "approved");
  if (topicSlug) q = q.eq("topic.slug", topicSlug);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    difficulty: r.difficulty as number,
    topic_slug: (r.topic as unknown as { slug: string }).slug,
    subtopic_slug: (r.subtopic as unknown as { slug: string } | null)?.slug ?? null,
    tags: (r.tags as string[] | null) ?? [],
  }));
}
