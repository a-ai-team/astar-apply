// Rerank (docs/loops/CONTRACTS.md § AI module): Voyage rerank-2 when VOYAGE_API_KEY is set, else
// Haiku listwise (`{order:number[]}`) when the API is usable, else identity (keeps the RRF order).
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { MODEL_FAST, getClient } from "./client";

export type RerankProvider = "voyage" | "haiku" | "identity";
export type RerankDoc = { id: string; text: string };
export type RerankResult = { provider: RerankProvider; order: string[]; scores: Map<string, number> | null };

export function rerankProvider(opts: { allowModel: boolean }): RerankProvider {
  if (process.env.VOYAGE_API_KEY) return "voyage";
  if (opts.allowModel && process.env.ANTHROPIC_API_KEY) return "haiku";
  return "identity";
}

const OrderSchema = z.object({ order: z.array(z.number().int()) });

export async function rerank(query: string, docs: RerankDoc[], topN: number, opts: { allowModel: boolean }): Promise<RerankResult> {
  if (docs.length === 0) return { provider: "identity", order: [], scores: null };
  const provider = rerankProvider(opts);
  try {
    if (provider === "voyage") return await rerankVoyage(query, docs, topN);
    if (provider === "haiku") return await rerankHaiku(query, docs, topN);
  } catch (e) {
    console.warn(`rerank: ${provider} failed, falling back to identity:`, e instanceof Error ? e.message : e);
  }
  return { provider: "identity", order: docs.slice(0, topN).map((d) => d.id), scores: null };
}

async function rerankVoyage(query: string, docs: RerankDoc[], topN: number): Promise<RerankResult> {
  const res = await fetch("https://api.voyageai.com/v1/rerank", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.VOYAGE_API_KEY}` },
    body: JSON.stringify({ query, documents: docs.map((d) => d.text), model: "rerank-2", top_k: topN }),
  });
  if (!res.ok) throw new Error(`voyage rerank failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { data: { index: number; relevance_score: number }[] };
  const scores = new Map<string, number>();
  const order: string[] = [];
  for (const d of [...json.data].sort((a, b) => b.relevance_score - a.relevance_score)) {
    const id = docs[d.index]?.id;
    if (!id) continue;
    order.push(id);
    scores.set(id, d.relevance_score);
  }
  return { provider: "voyage", order, scores };
}

async function rerankHaiku(query: string, docs: RerankDoc[], topN: number): Promise<RerankResult> {
  const listing = docs.map((d, i) => `<doc i="${i}">\n${d.text.slice(0, 1200)}\n</doc>`).join("\n");
  const res = await getClient().beta.messages.parse({
    model: MODEL_FAST,
    max_tokens: 256,
    system: "You rank passages from a finance mentor's notes by how directly they answer a student's question. Return the indexes of the passages in order of relevance, most relevant first, omitting passages that are not relevant at all. Answer only with the structured object.",
    messages: [{ role: "user", content: `<question>${query}</question>\n\n${listing}` }],
    output_config: { format: betaZodOutputFormat(OrderSchema) },
  });
  const order = (res.parsed_output?.order ?? []).map((i) => docs[i]?.id).filter((x): x is string => Boolean(x));
  const uniq = [...new Set(order)].slice(0, topN);
  if (!uniq.length) throw new Error("haiku rerank returned no usable order");
  return { provider: "haiku", order: uniq, scores: null };
}
