// Retrieval suite: recall@5 over fixtures/eval/retrieval.jsonl against the seeded fixture corpus.
// Runs the real hybrid retrieval (heuristic rewrite, no model calls) with the service-role client.
// Threshold 0.80, or 0.70 while EMBEDDINGS_PROVIDER=local (labelled "FTS-only").
import { adminClient } from "../../seed/env";
import { embeddingProvider } from "../../../src/lib/ai/embeddings";
import { retrieve } from "../../../src/lib/chat/retrieve";
import { heuristicRewrite } from "../../../src/lib/chat/rewrite";
import { readJsonl, type SuiteResult } from "../index";
import { THRESHOLDS } from "../thresholds";

type Pair = { id: string; question: string; expected: { source: string; match?: string } };

export async function run({ limit }: { limit: number | null }): Promise<SuiteResult> {
  const db = adminClient();
  const pairs = readJsonl<Pair>("fixtures/eval/retrieval.jsonl").slice(0, limit ?? undefined);
  const { data: sources, error } = await db.from("corpus_sources").select("id, title");
  if (error) throw error;
  const titles = new Map((sources ?? []).map((s) => [s.id as string, (s.title as string).toLowerCase()]));
  const provider = embeddingProvider();
  const threshold = provider === "local" ? THRESHOLDS.retrieval.recall_at_5_local : THRESHOLDS.retrieval.recall_at_5;

  let hits5 = 0;
  let hits1 = 0;
  const items: unknown[] = [];
  for (const p of pairs) {
    const rewrite = heuristicRewrite(p.question);
    // Corpus recall only: the Loop 06 union adds curriculum chunks, measured by the chat suite's lesson_citation_rate.
    const { chunks } = await retrieve(db, rewrite, { mode: "fixture", topN: 5, sources: ["corpus"] });
    const want = p.expected.source.toLowerCase();
    const matchAt = chunks.findIndex((c) => {
      const title = titles.get(c.source_id) ?? "";
      const titleOk = title.startsWith(want) || want.startsWith(title);
      const textOk = !p.expected.match || `${c.question ?? ""} ${c.text}`.toLowerCase().includes(p.expected.match.toLowerCase());
      return titleOk && textOk;
    });
    if (matchAt >= 0) hits5++;
    if (matchAt === 0) hits1++;
    items.push({ id: p.id, question: p.question, hit: matchAt >= 0, rank: matchAt >= 0 ? matchAt + 1 : null, queries: rewrite.queries, top: chunks.map((c) => c.label) });
    if (matchAt < 0) console.log(`  miss ${p.id}: "${p.question}" → ${chunks.slice(0, 3).map((c) => c.label).join(" | ")}`);
  }
  const recall5 = pairs.length ? hits5 / pairs.length : 0;
  const recall1 = pairs.length ? hits1 / pairs.length : 0;
  return {
    suite: "retrieval",
    passed: recall5 >= threshold,
    metrics: { n: pairs.length, "recall@5": recall5, "recall@1": recall1, provider, label: provider === "local" ? "FTS-only (local hashed embeddings)" : "hybrid (voyage)" },
    thresholds: { "recall@5": threshold },
    items,
    notes: [`embeddings provider: ${provider} → threshold ${threshold}`],
  };
}
