// Readability judge for the lessons suite: Opus 5, structured {readability 0–5, notes}, medium
// effort, cached rubric. Scores whether a UK second-year with one finance module could follow it.
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { MODEL_JUDGE, OPUS_BETAS, OPUS_FALLBACKS, getClient } from "../../src/lib/ai/client";

export const ReadabilitySchema = z.object({ readability: z.number().min(0).max(5), notes: z.string() });
export type ReadabilityScore = z.infer<typeof ReadabilitySchema>;

export const readabilityPrompt = {
  id: "eval-readability",
  version: 1,
  system: `You judge lessons from "A* Apply", a site teaching investment-banking interview technicals. The reader is a UK second-year undergraduate with exactly one introductory finance or accounting module behind them.

Score "readability" from 0 to 5 (decimals allowed):
5 — every term is explained the first time it appears, each formula is followed by a worked number in £m, paragraphs are short, the order is why → concept → mechanics → worked example → trap → answer, British spelling, no filler; a bright second-year could follow it in one sitting.
4 — clear and complete with one rough patch (an unexplained term, a formula without a number, a long paragraph).
3 — understandable but assumes knowledge the reader lacks in two or three places, or the worked numbers are inconsistent.
2 — reads like a textbook or a bank's training deck; jargon-heavy.
1 — confusing or wrong in ways that would mislead the reader.
0 — incoherent.

"notes": one sentence naming the biggest readability problem, or "fine". Answer only with the structured object.`,
} as const;

export async function judgeReadability(input: { title: string; text: string }): Promise<ReadabilityScore> {
  const res = await getClient().beta.messages.parse({
    model: process.env.EVAL_JUDGE_MODEL || MODEL_JUDGE,
    max_tokens: 1024,
    betas: [...OPUS_BETAS],
    fallbacks: OPUS_FALLBACKS,
    output_config: { effort: "medium", format: betaZodOutputFormat(ReadabilitySchema) },
    system: [{ type: "text", text: readabilityPrompt.system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: `<lesson title="${input.title.replace(/"/g, "'")}">\n${input.text}\n</lesson>` }],
  });
  if (res.stop_reason === "refusal" || !res.parsed_output) throw new Error(`readability judge returned no score (stop_reason=${res.stop_reason})`);
  return res.parsed_output;
}
