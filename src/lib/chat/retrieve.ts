// Step 2–3: hybrid retrieval. Per query: match_corpus_chunks top-20 ∪ search_corpus_fts top-20 →
// RRF (k=60; vector weight 0.25 under the local hashed embeddings) → top-12 candidates → rerank to
// top-6 with a relevance floor. Runs with the service-role client after the session is verified.
import type { SupabaseClient } from "@supabase/supabase-js";
import { embed, embeddingModel, embeddingProvider } from "@/lib/ai/embeddings";
import { rerank } from "@/lib/ai/rerank";
import type { ChunkKind } from "@/lib/corpus/types";
import { rrf } from "./rrf";
import type { ChatMode, Intent, RetrievalRecord, RetrievedChunk, Rewrite } from "./types";

export const PER_LIST = 20;
export const CANDIDATES = 12;
export const TOP_N = 6;
/** Local hashed embeddings are noisy → vector list weighs 0.25; Voyage weighs 1.0. */
export const VECTOR_WEIGHT = { local: 0.25, voyage: 1 } as const;
/** Floor: keep a candidate only if FTS matched it or its cosine similarity clears this. */
export const SIMILARITY_FLOOR = { local: 0.3, voyage: 0.55 } as const;

type Row = {
  id: string; source_id: string; mentor_id: string | null; kind: ChunkKind; ordinal: number; text: string;
  question: string | null; answer: string | null; page_ref: number | null; topic_tags: string[];
  entities: { firms?: string[]; programmes?: string[] } | null; similarity?: number; rank?: number;
};

/** Intent → chunk kinds worth searching. Off-topic skips retrieval entirely. */
export function kindsForIntent(intent: Intent): ChunkKind[] | null {
  switch (intent) {
    case "technical": return null;
    case "fit":
    case "application":
    case "firm": return ["qa", "note", "paragraph", "slide"];
    case "offtopic": return [];
  }
}

export type RetrieveResult = { chunks: RetrievedChunk[]; record: RetrievalRecord };

export async function retrieve(
  db: SupabaseClient,
  rewrite: Rewrite,
  opts: { mode: ChatMode; mentorNames?: Map<string, string>; topN?: number },
): Promise<RetrieveResult> {
  const provider = embeddingProvider();
  const kinds = kindsForIntent(rewrite.intent);
  const record: RetrievalRecord = {
    queries: rewrite.queries,
    intent: rewrite.intent,
    candidates: [],
    reranked: [],
    provider: { embeddings: embeddingModel(), rerank: "identity", mode: opts.mode },
  };
  if (kinds && kinds.length === 0) return { chunks: [], record };

  const rows = new Map<string, Row>();
  const lists: { ids: string[]; weight: number }[] = [];
  const vectors = await embed(rewrite.queries, { inputType: "query" });
  for (let i = 0; i < rewrite.queries.length; i++) {
    const q = rewrite.queries[i];
    const [vec, fts] = await Promise.all([
      db.rpc("match_corpus_chunks", { query_embedding: JSON.stringify(vectors[i]), n: PER_LIST, p_status: "approved", kinds }),
      db.rpc("search_corpus_fts", { q, n: PER_LIST, p_status: "approved" }),
    ]);
    if (vec.error) throw new Error(`match_corpus_chunks: ${vec.error.message}`);
    if (fts.error) throw new Error(`search_corpus_fts: ${fts.error.message}`);
    const vecRows = (vec.data ?? []) as Row[];
    const ftsRows = ((fts.data ?? []) as Row[]).filter((r) => !kinds || kinds.includes(r.kind));
    for (const r of vecRows) rows.set(r.id, { ...(rows.get(r.id) ?? r), similarity: Math.max(r.similarity ?? 0, rows.get(r.id)?.similarity ?? 0) });
    for (const r of ftsRows) rows.set(r.id, { ...(rows.get(r.id) ?? r), rank: Math.max(r.rank ?? 0, rows.get(r.id)?.rank ?? 0) });
    lists.push({ ids: vecRows.map((r) => r.id), weight: VECTOR_WEIGHT[provider] });
    lists.push({ ids: ftsRows.map((r) => r.id), weight: 1 });
  }

  const floor = SIMILARITY_FLOOR[provider];
  const fused = rrf(lists)
    .filter(({ id }) => {
      const r = rows.get(id)!;
      return (r.rank ?? 0) > 0 || (r.similarity ?? 0) >= floor;
    })
    .slice(0, CANDIDATES);
  const candidates: RetrievedChunk[] = fused.map(({ id, score }) => {
    const r = rows.get(id)!;
    return {
      id: r.id, source_id: r.source_id, mentor_id: r.mentor_id, kind: r.kind, ordinal: r.ordinal, text: r.text,
      question: r.question, answer: r.answer, page_ref: r.page_ref, topic_tags: r.topic_tags ?? [], entities: r.entities ?? {},
      score,
      signals: { fts_rank: r.rank, similarity: r.similarity },
      label: chunkLabel(r, opts.mentorNames),
    };
  });
  record.candidates = candidates.map((c) => ({ id: c.id, label: c.label, score: c.score, signals: c.signals }));

  const topN = opts.topN ?? TOP_N;
  const rr = await rerank(rewrite.standalone_question, candidates.map((c) => ({ id: c.id, text: c.text })), topN, { allowModel: opts.mode === "live" });
  record.provider.rerank = rr.provider;
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const chunks = rr.order.map((id) => byId.get(id)!).filter(Boolean).slice(0, topN);
  record.reranked = chunks.map((c) => ({ id: c.id, label: c.label }));
  return { chunks, record };
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
