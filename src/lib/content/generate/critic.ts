// Critic pass (Opus 5, effort medium, sync): only for items that failed the automatic checks.
// Sends the draft + the problem list, gets a corrected draft back, re-runs the checks. Uses
// `client.beta.messages.parse` with the refusal fallbacks (CONTRACTS.md § AI module).
import type Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { OPUS_BETAS, OPUS_FALLBACKS } from "@/lib/ai/client";
import { contentCriticPrompt, contentCriticUser } from "@/lib/ai/prompts/content-critic.v1";
import { CRITIC_MAX_TOKENS, contentModel } from "./requests";
import { LessonCriticSchema, QuestionCriticSchema } from "./schemas";
import type { Usage } from "./cost";

export type CriticResult = { output: unknown; notes: string; usage: Usage };

export async function runCritic(client: Anthropic, input: { kind: "lesson" | "questions"; draft: unknown; problems: string[]; context: string; model?: string }): Promise<CriticResult> {
  const res = await client.beta.messages.parse({
    model: input.model ?? contentModel(),
    max_tokens: CRITIC_MAX_TOKENS,
    betas: [...OPUS_BETAS],
    fallbacks: OPUS_FALLBACKS,
    system: [{ type: "text", text: contentCriticPrompt.system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: contentCriticUser(input) }],
    output_config: { effort: "medium", format: betaZodOutputFormat(input.kind === "lesson" ? LessonCriticSchema : QuestionCriticSchema) },
  });
  if (res.stop_reason === "refusal" || !res.parsed_output) throw new Error(`critic returned nothing (stop_reason=${res.stop_reason})`);
  const usage = res.usage as unknown as Usage;
  return { output: res.parsed_output.draft, notes: res.parsed_output.notes, usage };
}
