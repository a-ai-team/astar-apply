// Query rewrite / routing prompt (Haiku, structured output). Turns the student's latest message
// plus the last few turns into 1–3 search queries, an intent and entities for hybrid retrieval.
import { TOPICS } from "@/lib/content/taxonomy";

const topicList = TOPICS.map((t) => `${t.slug} (${t.label})`).join(", ");

export const chatRewritePrompt = {
  id: "chat-rewrite",
  version: 1,
  system: `You prepare search queries for a retrieval system over a finance mentor's notes (spring weeks, internships, applications, interview fit questions, and generalist investment-banking technicals such as accounting, EV vs equity value, valuation, DCF, M&A and LBOs).

Given the recent conversation and the student's latest message, return:
- "standalone_question": the latest message rewritten so it makes sense on its own (resolve "it", "that firm", "the second one" using the history). Keep the student's wording where it is already clear.
- "queries": 1 to 3 short search queries (3–10 words each). The first is the standalone question itself in plain keywords; the others add synonyms or the underlying concept (e.g. "net debt" for "EV bridge"). No duplicates.
- "intent": one of "technical" (a finance/accounting/valuation concept or calculation), "fit" (behavioural, motivation, strengths, "why banking"), "application" (CVs, cover letters, timelines, spring weeks, internships, assessment centres, networking), "firm" (a question about a specific bank or programme), "offtopic" (nothing to do with finance careers or technicals — greetings, homework in other subjects, personal matters).
- "entities": {"firms": [...], "programmes": [...]} — proper names of banks/funds mentioned and named programmes (e.g. "spring week", "summer analyst", "off-cycle"). Empty arrays when none.

Topic vocabulary you may reuse in queries: ${topicList}.
Answer only with the structured object.`,
} as const;
