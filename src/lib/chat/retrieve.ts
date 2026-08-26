// Step 2–3: hybrid retrieval over the fallback ladder (docs/research/rag-design.md § Retrieval).
//   Ladder by intent (Loop 06): technical → corpus ∪ curriculum (content_chunks); fit/application/
//   firm → corpus only; offtopic → nothing (rung "prior").
//   Per query and source: vector top-20 ∪ FTS top-20 → RRF (k=60; vector weight 0.25 under the
//   local hashed embeddings) → +CORPUS_BIAS on corpus ids (the mentor's take wins a tie) → relevance
//   floor → top-24 union → rerank to top-6.
// Runs with the service-role client after the session is verified.
import type { SupabaseClient } from "@supabase/supabase-js";
import { embed, embeddingModel, embeddingProvider } from "@/lib/ai/embeddings";
import { rerank } from "@/lib/ai/rerank";
import type { ChunkKind } from "@/lib/corpus/types";
import { rrf, type RankedList } from "./rrf";
import type { ChatMode, ChunkOrigin, ContentRef, Intent, RetrievalRecord, RetrievedChunk, Rewrite } from "./types";

export const PER_LIST = 20;
/** Loop 02 cap per source; Loop 06 caps the union before rerank. */
export const CANDIDATES = 12;
export const UNION_CAP = 24;
export const TOP_N = 6;
/**
 * Bonus added to the fused score of corpus chunks after per-source normalisation (best corpus
 * chunk = 1.0, best curriculum chunk = 1.0), so the mentor's note wins a near-tie against a
 * curriculum block while the strongest lesson blocks still sit next to the strongest notes.
 * Raw RRF scores are ~1/61 per list, so an un-normalised +0.05 would be an override, not a bias.
 */
export const CORPUS_BIAS = 0.05;
/** Local hashed embeddings are noisy → vector list weighs 0.25; Voyage weighs 1.0. */
export const VECTOR_WEIGHT = { local: 0.25, voyage: 1 } as const;
/** Floor: keep a candidate only if FTS matched it or its cosine similarity clears this. */
export const SIMILARITY_FLOOR = { local: 0.3, voyage: 0.55 } as const;

type CorpusRow = {
  id: string; source_id: string; mentor_id: string | null; kind: ChunkKind; ordinal: number; text: string;
  question: string | null; answer: string | null; page_ref: number | null; topic_tags: string[];
  entities: { firms?: string[]; programmes?: string[] } | null; similarity?: number; rank?: number;
};
type ContentRow = {
  id: string; kind: ContentRef["kind"]; lesson_id: string | null; question_id: string | null; block_index: number | null; block_type: string | null;
  topic_id: string | null; subtopic_id: string | null; title: string; slug: string; topic_slug: string; text: string; similarity?: number; rank?: number;
};

/** Intent → chunk kinds worth searching in the corpus. Off-topic skips retrieval entirely. */
export function kindsForIntent(intent: Intent): ChunkKind[] | null {
  switch (intent) {
    case "technical": return null;
    case "fit":
    case "application":
    case "firm": return ["qa", "note", "paragraph", "slide"];
    case "offtopic": return [];
  }
}

/** The ladder: which sources an intent searches, in priority order. */
export function sourcesForIntent(intent: Intent): ChunkOrigin[] {
  switch (intent) {
    case "technical": return ["corpus", "content"];
    case "fit":
    case "application":
    case "firm": return ["corpus"];
    case "offtopic": return [];
  }
}

export type Fused = { id: string; score: number; origin: ChunkOrigin };

/**
 * RRF over every list → scores normalised per source (best of each = 1.0) → +bias for corpus ids
 * → cap. Pure — unit-tested. `origins` says which source each id came from (ids are uuids, so
 * they never collide across tables).
 */
export function fuseUnion(lists: RankedList[], origins: Map<string, ChunkOrigin>, opts: { bias?: number; cap?: number } = {}): Fused[] {
  const bias = opts.bias ?? CORPUS_BIAS;
  const cap = opts.cap ?? UNION_CAP;
  const fused = rrf(lists).map(({ id, score }) => ({ id, score, origin: origins.get(id) ?? ("corpus" as ChunkOrigin) }));
  const top: Record<ChunkOrigin, number> = { corpus: 0, content: 0 };
  for (const f of fused) top[f.origin] = Math.max(top[f.origin], f.score);
  return fused
    .map(({ id, score, origin }) => {
      const norm = score / (top[origin] || 1);
      return { id, origin, score: origin === "corpus" ? norm + bias : norm };
    })
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, cap);
}

export type RetrieveResult = { chunks: RetrievedChunk[]; record: RetrievalRecord };

export async function retrieve(
  db: SupabaseClient,
  rewrite: Rewrite,
  opts: { mode: ChatMode; mentorNames?: Map<string, string>; topN?: number; sources?: ChunkOrigin[] },
): Promise<RetrieveResult> {
  const provider = embeddingProvider();
  const kinds = kindsForIntent(rewrite.intent);
  const sources = opts.sources ?? sourcesForIntent(rewrite.intent);
  const record: RetrievalRecord = {
    queries: rewrite.queries,
    intent: rewrite.intent,
    candidates: [],
    reranked: [],
    provider: { embeddings: embeddingModel(), rerank: "identity", mode: opts.mode },
    sources,
  };
  if (sources.length === 0 || (kinds && kinds.length === 0)) return { chunks: [], record };

  const corpusRows = new Map<string, CorpusRow>();
  const contentRows = new Map<string, ContentRow>();
  const origins = new Map<string, ChunkOrigin>();
  const lists: RankedList[] = [];
  const vectors = await embed(rewrite.queries, { inputType: "query" });
  const merge = <R extends { id: string; similarity?: number; rank?: number }>(map: Map<string, R>, r: R) => {
    const prev = map.get(r.id);
    map.set(r.id, { ...(prev ?? r), similarity: Math.max(r.similarity ?? 0, prev?.similarity ?? 0), rank: Math.max(r.rank ?? 0, prev?.rank ?? 0) });
  };
  for (let i = 0; i < rewrite.queries.length; i++) {
    const q = rewrite.queries[i];
    const embedding = JSON.stringify(vectors[i]);
    if (sources.includes("corpus")) {
      const [vec, fts] = await Promise.all([
        db.rpc("match_corpus_chunks", { query_embedding: embedding, n: PER_LIST, p_status: "approved", kinds }),
        db.rpc("search_corpus_fts", { q: ftsQuery(q), n: PER_LIST, p_status: "approved" }),
      ]);
      if (vec.error) throw new Error(`match_corpus_chunks: ${vec.error.message}`);
      if (fts.error) throw new Error(`search_corpus_fts: ${fts.error.message}`);
      const vecRows = (vec.data ?? []) as CorpusRow[];
      const ftsRows = ((fts.data ?? []) as CorpusRow[]).filter((r) => !kinds || kinds.includes(r.kind));
      for (const r of vecRows) { merge(corpusRows, r); origins.set(r.id, "corpus"); }
      for (const r of ftsRows) { merge(corpusRows, r); origins.set(r.id, "corpus"); }
      lists.push({ ids: vecRows.map((r) => r.id), weight: VECTOR_WEIGHT[provider] });
      lists.push({ ids: ftsRows.map((r) => r.id), weight: 1 });
    }
    if (sources.includes("content")) {
      const [vec, fts] = await Promise.all([
        db.rpc("match_content_chunks", { query_embedding: embedding, n: PER_LIST, p_status: "approved", kinds: null }),
        db.rpc("search_content_fts", { q: ftsQuery(q), n: PER_LIST, p_status: "approved" }),
      ]);
      if (vec.error) throw new Error(`match_content_chunks: ${vec.error.message}`);
      if (fts.error) throw new Error(`search_content_fts: ${fts.error.message}`);
      const vecRows = (vec.data ?? []) as ContentRow[];
      const ftsRows = (fts.data ?? []) as ContentRow[];
      for (const r of vecRows) { merge(contentRows, r); origins.set(r.id, "content"); }
      for (const r of ftsRows) { merge(contentRows, r); origins.set(r.id, "content"); }
      lists.push({ ids: vecRows.map((r) => r.id), weight: VECTOR_WEIGHT[provider] });
      lists.push({ ids: ftsRows.map((r) => r.id), weight: 1 });
    }
  }

  const floor = SIMILARITY_FLOOR[provider];
  const signalsOf = (id: string) => corpusRows.get(id) ?? contentRows.get(id);
  const fused = fuseUnion(lists, origins, { cap: UNION_CAP }).filter(({ id }) => {
    const r = signalsOf(id)!;
    return (r.rank ?? 0) > 0 || (r.similarity ?? 0) >= floor;
  });
  const candidates: RetrievedChunk[] = fused.map(({ id, score, origin }) => {
    if (origin === "corpus") {
      const r = corpusRows.get(id)!;
      return {
        id: r.id, source_id: r.source_id, mentor_id: r.mentor_id, kind: r.kind, origin, ordinal: r.ordinal, text: r.text,
        question: r.question, answer: r.answer, page_ref: r.page_ref, topic_tags: r.topic_tags ?? [], entities: r.entities ?? {},
        score, signals: { fts_rank: r.rank, similarity: r.similarity }, label: chunkLabel(r, opts.mentorNames),
      };
    }
    const r = contentRows.get(id)!;
    return {
      id: r.id, source_id: (r.kind === "lesson_block" ? r.lesson_id : r.question_id) ?? r.id, mentor_id: null, kind: r.kind, origin,
      content: { kind: r.kind, lesson_id: r.lesson_id, question_id: r.question_id, block_index: r.block_index, block_type: r.block_type, slug: r.slug, topic_slug: r.topic_slug },
      ordinal: r.block_index ?? 0, text: r.text, question: null, answer: null, page_ref: null, topic_tags: [r.topic_slug], entities: {},
      score, signals: { fts_rank: r.rank, similarity: r.similarity }, label: r.title,
    };
  });
  record.candidates = candidates.map((c) => ({ id: c.id, label: c.label, score: c.score, signals: c.signals, origin: c.origin }));

  const topN = opts.topN ?? TOP_N;
  const rr = await rerank(rewrite.standalone_question, candidates.map((c) => ({ id: c.id, text: c.text })), topN, { allowModel: opts.mode === "live" });
  record.provider.rerank = rr.provider;
  const byId = new Map(candidates.map((c) => [c.id, c]));
  let chunks = rr.order.map((id) => byId.get(id)!).filter(Boolean).slice(0, topN);
  // Offline ladder guarantee: with the identity reranker the top-N is just fused order, and a
  // dense corpus can fill it with near-duplicate note windows. Keep the best lesson block and the
  // best bank question (when retrieved) in the window so the answer can always reach the next
  // rung and cite the lesson. A real reranker's order stands.
  if (rr.provider === "identity" && sources.includes("content")) {
    for (const kind of ["lesson_block", "question"] as const) {
      if (chunks.some((c) => c.content?.kind === kind)) continue;
      const best = candidates.find((c) => c.content?.kind === kind);
      if (!best) continue;
      if (chunks.length >= topN) {
        // drop the lowest-ranked chunk that is not the sole representative of the other content kind
        const other = chunks.filter((c) => c.origin === "content").length === 1 ? chunks.findIndex((c) => c.origin === "content") : -1;
        const drop = chunks.length - 1 === other ? chunks.length - 2 : chunks.length - 1;
        chunks.splice(drop, 1);
      }
      chunks = [...chunks, best];
    }
  }
  record.reranked = chunks.map((c) => ({ id: c.id, label: c.label, origin: c.origin }));
  return { chunks, record };
}

/** Rung for an answer: the mentor corpus if any corpus chunk survived, else the curriculum, else the model's prior. */
export function rungFor(chunks: Pick<RetrievedChunk, "origin">[]): "corpus" | "lesson" | "prior" {
  if (chunks.some((c) => c.origin === "corpus")) return "corpus";
  if (chunks.some((c) => c.origin === "content")) return "lesson";
  return "prior";
}

/** Deep link for a curriculum chunk: lesson block anchor or the question page. */
export function contentHref(ref: ContentRef): string {
  return ref.kind === "lesson_block"
    ? `/home/technicals/${ref.topic_slug}/${ref.slug}#block-${ref.block_index ?? 0}`
    : `/home/practice/${ref.slug}`;
}

const FTS_STOP = new Set("the a an of to in on for and or is are was were be been what how why when which who do does did i you it this that these those my me we our us can could should would will with about from at by as into than then there here please tell explain".split(" "));

/**
 * websearch_to_tsquery ANDs every term, which returns nothing for paraphrases ("best way to
 * practise numerical tests"). OR the content words instead; ts_rank_cd still ranks chunks that
 * match more of them higher, and RRF + the relevance floor keep single-word noise down.
 */
export function ftsQuery(q: string): string {
  const words = q.toLowerCase().replace(/[^\p{L}\p{N}\s-]+/gu, " ").split(/\s+/).filter((w) => w.length > 1 && !FTS_STOP.has(w));
  return words.length ? [...new Set(words)].join(" or ") : q;
}

/** "<Mentor> – <question | first heading | first words>" — the citation chip text and document title. */
export function chunkLabel(r: { mentor_id: string | null; question: string | null; text: string; kind: string; page_ref: number | null }, names?: Map<string, string>): string {
  const mentor = (r.mentor_id && names?.get(r.mentor_id)) || "Mentor";
  let topic = r.question?.trim();
  if (!topic) {
    const heading = r.text.match(/^#{1,6}\s+(.+)$/m)?.[1];
    topic = heading ?? r.text.replace(/\s+/g, " ").trim();
  }
  topic = topic.replace(/^#+\s*/, "");
  if (topic.length > 70) topic = topic.slice(0, 67).trimEnd() + "…";
  const page = r.page_ref ? ` (p. ${r.page_ref})` : "";
  return `${mentor} – ${topic}${page}`;
}
