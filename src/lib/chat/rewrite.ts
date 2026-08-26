// Step 1 of the pipeline: rewrite + route. Haiku structured output in live mode; a deterministic
// heuristic in fixture mode (and as the fallback when Haiku fails) so retrieval always has queries.
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { MODEL_FAST, getClient } from "@/lib/ai/client";
import { chatRewritePrompt } from "@/lib/ai/prompts/chat-rewrite.v1";
import { heuristicTags } from "@/lib/corpus/tags";
import type { ChatMode, HistoryTurn, Intent, Rewrite } from "./types";

export const RewriteSchema = z.object({
  standalone_question: z.string(),
  queries: z.array(z.string()).min(1).max(3),
  intent: z.enum(["technical", "fit", "application", "firm", "offtopic"]),
  entities: z.object({ firms: z.array(z.string()), programmes: z.array(z.string()) }),
});

export const HISTORY_TURNS = 6;

export async function rewriteQuery(message: string, history: HistoryTurn[], mode: ChatMode): Promise<Rewrite> {
  const fallback = heuristicRewrite(message, history);
  if (mode === "fixture") return fallback;
  try {
    const recent = history.slice(-HISTORY_TURNS);
    const transcript = recent.map((t) => `${t.role === "user" ? "Student" : "Mentor"}: ${t.text.slice(0, 600)}`).join("\n");
    const res = await getClient().beta.messages.parse({
      model: MODEL_FAST,
      max_tokens: 512,
      system: [{ type: "text", text: chatRewritePrompt.system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: `${transcript ? `<history>\n${transcript}\n</history>\n\n` : ""}<latest>\n${message}\n</latest>` }],
      output_config: { format: betaZodOutputFormat(RewriteSchema) },
    });
    const out = res.parsed_output;
    if (!out) return fallback;
    const queries = uniq([...out.queries.map((q) => q.trim()).filter(Boolean)]).slice(0, 3);
    return { ...out, queries: queries.length ? queries : fallback.queries };
  } catch (e) {
    console.warn("chat: rewrite failed, using heuristic:", e instanceof Error ? e.message : e);
    return fallback;
  }
}

const TECHNICAL = /\b(enterprise value|equity value|\bev\b|ebitda|dcf|wacc|terminal value|free cash flow|balance sheet|income statement|cash flow|depreciation|working capital|net debt|multiple|comps|comparable|precedent|accretion|dilution|synerg|lbo|leveraged|moic|irr|npv|valuation|goodwill|deferred tax|amortis|capex|leverage ratio|interest|debt|equity|merger|acquisition|(?:three|3|financial) statements?|inventory|payables?|receivables?|accounts payable|retained earnings|net income|operating profit|revenue|tax rate|diluted shares|market cap|non-controlling|minority interest|preferred shares|lease liabilit|assets?|liabilit(?:y|ies)|shareholders?|one-liner)\b/i;
const FIT = /\b(why (banking|this firm|us|ib|investment banking)|strength|weakness|tell me about yourself|behavio|competenc|walk me through your cv|motivat|team ?work|leadership|failure|conflict)\b/i;
const APPLICATION = /\b(spring week|spring insight|insight week|summer (analyst|intern)|internship|off-cycle|\bcv\b|cover letter|application|apply|applying|deadline|assessment centre|hirevue|numerical test|psychometric|network|coffee chat|linkedin|timeline|when should i|how many|non-target|target school)\b/i;
const OFFTOPIC = /^(hi|hello|hey|thanks|thank you|ok|okay|cheers)\b[!. ]*$/i;
const STOP = new Set("the a an of to in on for and or is are was were be been what how why when which who do does did i you it this that these those my me we our us can could should would will with about from at by as into than then there here please tell explain me".split(" "));

/** Deterministic rewrite: keyword query + concept query, intent by regex, entities via the corpus tagger heuristic. */
export function heuristicRewrite(message: string, history: HistoryTurn[] = []): Rewrite {
  const text = message.trim();
  const words = text.toLowerCase().replace(/[^\p{L}\p{N}\s-]+/gu, " ").split(/\s+/).filter((w) => w && !STOP.has(w));
  const keywordQuery = words.join(" ").trim();
  // Very short follow-ups ("and for EV?") borrow the previous user turn's keywords.
  const prevUser = [...history].reverse().find((t) => t.role === "user")?.text ?? "";
  const prevWords = prevUser.toLowerCase().replace(/[^\p{L}\p{N}\s-]+/gu, " ").split(/\s+/).filter((w) => w && !STOP.has(w));
  const queries: string[] = [];
  if (keywordQuery) queries.push(keywordQuery);
  if (words.length <= 3 && prevWords.length) queries.push(uniq([...words, ...prevWords]).slice(0, 8).join(" "));
  if (!queries.length) queries.push(text || "help");
  const conceptTerms = text.match(TECHNICAL)?.[0];
  if (conceptTerms && conceptTerms.toLowerCase() !== keywordQuery) queries.push(conceptTerms.toLowerCase());
  const intent: Intent = OFFTOPIC.test(text) || !words.length
    ? "offtopic"
    : TECHNICAL.test(text) ? "technical"
    : FIT.test(text) ? "fit"
    : APPLICATION.test(text) ? "application"
    : heuristicTags(text).entities.firms.length ? "firm"
    : words.length < 2 ? "offtopic" : "application";
  const { entities } = heuristicTags(text);
  return {
    standalone_question: words.length <= 3 && prevUser ? `${text} (re: ${prevUser.slice(0, 120)})` : text,
    queries: uniq(queries).slice(0, 3),
    intent,
    entities,
  };
}

function uniq<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}
