// Tagging: Haiku structured output over the taxonomy (20 chunks/call); keyword heuristic when
// offline (no key / fixture mode) so seeds and CI stay deterministic.
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { MODEL_FAST, getClient } from "@/lib/ai/client";
import { corpusTagPrompt } from "@/lib/ai/prompts/corpus-tag.v1";
import { TOPIC_SLUGS, isTopicSlug } from "@/lib/content/taxonomy";
import { extractionMode } from "./extract";

export type Entities = { firms: string[]; programmes: string[] };
export type ChunkTags = { topic_tags: string[]; entities: Entities };

const TagItem = z.object({
  id: z.string(),
  topic_tags: z.array(z.string()),
  entities: z.object({ firms: z.array(z.string()), programmes: z.array(z.string()) }),
});
export const TagBatchSchema = z.object({ items: z.array(TagItem) });

const BATCH = 20;

export async function tagChunks(chunks: { id: string; text: string }[]): Promise<Map<string, ChunkTags>> {
  const out = new Map<string, ChunkTags>();
  if (chunks.length === 0) return out;
  if (extractionMode() === "fixture") {
    for (const c of chunks) out.set(c.id, heuristicTags(c.text));
    return out;
  }
  const client = getClient();
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH);
    const passages = batch.map((c) => `<passage id="${c.id}">\n${c.text.slice(0, 2000)}\n</passage>`).join("\n\n");
    const res = await client.beta.messages.parse({
      model: MODEL_FAST,
      max_tokens: 4096,
      system: [{ type: "text", text: corpusTagPrompt.system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: passages }],
      output_config: { format: betaZodOutputFormat(TagBatchSchema) },
    });
    const items = res.parsed_output?.items ?? [];
    for (const item of items) {
      out.set(item.id, {
        topic_tags: uniq(item.topic_tags.filter(isTopicSlug)),
        entities: { firms: uniq(item.entities.firms), programmes: uniq(item.entities.programmes) },
      });
    }
    for (const c of batch) if (!out.has(c.id)) out.set(c.id, heuristicTags(c.text));
  }
  return out;
}

const KEYWORDS: Record<string, RegExp> = {
  "spring-weeks": /spring week|spring insight|insight week/i,
  "summer-internships": /summer (analyst|intern)|internship|off-cycle/i,
  "applications-cv": /\bcv\b|cover letter|application form|resume/i,
  networking: /network|coffee chat|linkedin|reach out|alumni/i,
  "assessment-centres": /assessment centre|hirevue|situational|numerical test|psychometric/i,
  "fit-behavioural": /behavio|strength|weakness|tell me about|competenc/i,
  "why-banking": /why (banking|this firm|us|investment banking)/i,
  "market-awareness": /recent deal|market news|deal you|headline/i,
  "finance-foundations": /time value|npv|irr\b|discount rate|present value/i,
  accounting: /income statement|balance sheet|cash flow|depreciation|net income|working capital/i,
  "eqv-ev": /enterprise value|equity value|\bev\b|net debt|minority interest/i,
  valuation: /multiple|comparable|comps|precedent|ebitda multiple|valuation/i,
  dcf: /\bdcf\b|wacc|terminal value|free cash flow|discounted cash/i,
  ma: /merger|accretion|dilution|synerg|acquisition|m&a/i,
  lbo: /\blbo\b|leveraged buyout|sponsor|moic|debt paydown|private equity/i,
};
const FIRM_RE = /\b(Goldman Sachs|Morgan Stanley|J\.?P\.? ?Morgan|Barclays|HSBC|Evercore|Lazard|Rothschild|Citi(?:group)?|UBS|Deutsche Bank|Jefferies|Moelis|PJT|Centerview|Nomura|BNP Paribas|RBC|Bank of America|BofA)\b/g;
const PROG_RE = /\b(spring week|summer analyst|summer internship|off-cycle|insight week|industrial placement|graduate scheme)\b/gi;

export function heuristicTags(text: string): ChunkTags {
  const topic_tags = TOPIC_SLUGS.filter((slug) => KEYWORDS[slug]?.test(text)).slice(0, 3);
  const firms = uniq((text.match(FIRM_RE) ?? []).map((s) => s.trim()));
  const programmes = uniq((text.match(PROG_RE) ?? []).map((s) => s.toLowerCase()));
  return { topic_tags, entities: { firms, programmes } };
}

function uniq<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}
