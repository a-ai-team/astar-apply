// LLM judge: Opus 5, structured output {correctness, faithfulness, voice: 0–5, notes}, medium
// effort, cached rubric. Never combined with citations (structured output + citations is a 400).
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { MODEL_JUDGE, OPUS_BETAS, OPUS_FALLBACKS, getClient } from "../../src/lib/ai/client";

export const JudgeSchema = z.object({
  correctness: z.number().min(0).max(5),
  faithfulness: z.number().min(0).max(5),
  voice: z.number().min(0).max(5),
  notes: z.string(),
});
export type JudgeScore = z.infer<typeof JudgeSchema>;

export const judgePrompt = {
  id: "eval-judge",
  version: 1,
  system: `You grade answers from "Mentor", a chatbot for UK students breaking into investment banking. You receive the student's question, a short reference answer written by a human, the passages the bot retrieved from the mentor corpus (possibly none), and the bot's answer with the passages it cited.

Score three things from 0 to 5 (decimals allowed):
- "correctness": is the answer factually right and does it cover what the reference covers? 5 = fully correct and complete; 3 = right in outline with a gap or a minor error; 1 = mostly wrong or unhelpful; 0 = refuses or answers a different question. Extra correct material never lowers the score.
- "faithfulness": does every claim attributed to the mentor or supported by a citation actually appear in the retrieved passages? 5 = every cited claim is supported and nothing is put in the mentor's mouth; 3 = one unsupported attribution or a stretched quote; 0 = fabricated mentor opinions. If nothing was retrieved and the answer says so plainly and gives a standard answer, faithfulness is 5. If nothing was retrieved and the answer pretends the mentor said something, faithfulness is 0.
- "voice": direct, warm, concrete, written for a second-year undergraduate, British spelling, one worked number where a formula appears, no corporate filler, leads with the answer. 5 = reads like a sharp senior student; 2 = generic textbook; 0 = incoherent.
- "notes": one or two sentences on the biggest problem, or "fine".

Be strict about faithfulness and generous about style. Answer only with the structured object.`,
} as const;

export function judgeModel(): string {
  return process.env.EVAL_JUDGE_MODEL || MODEL_JUDGE;
}

export async function judge(input: { question: string; reference: string; passages: { label: string; text: string }[]; answer: string; citations: { label: string; quote: string }[] }): Promise<JudgeScore> {
  const passages = input.passages.length
    ? input.passages.map((p, i) => `<passage i="${i + 1}" label="${p.label}">\n${p.text}\n</passage>`).join("\n")
    : "(no passages retrieved)";
  const cites = input.citations.length ? input.citations.map((c, i) => `[${i + 1}] ${c.label}: “${c.quote}”`).join("\n") : "(no citations)";
  const res = await getClient().beta.messages.parse({
    model: judgeModel(),
    max_tokens: 2048,
    betas: [...OPUS_BETAS],
    fallbacks: OPUS_FALLBACKS,
    output_config: { effort: "medium", format: betaZodOutputFormat(JudgeSchema) },
    system: [{ type: "text", text: judgePrompt.system, cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: `<question>\n${input.question}\n</question>\n\n<reference>\n${input.reference}\n</reference>\n\n<retrieved>\n${passages}\n</retrieved>\n\n<answer>\n${input.answer}\n</answer>\n\n<citations>\n${cites}\n</citations>`,
      },
    ],
  });
  if (res.stop_reason === "refusal" || !res.parsed_output) throw new Error(`judge returned no score (stop_reason=${res.stop_reason})`);
  return res.parsed_output;
}
