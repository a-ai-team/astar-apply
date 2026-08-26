// Synchronous single-target generation (regenerate-one from the review UI, `--sync`, the
// one-lesson smoke test). Same prompts and schema as the batch path but through
// `client.beta.messages.stream` with the refusal fallbacks (max_tokens > 8000 → stream).
// Returns a ParsedRow so the collector treats it exactly like a batch result.
import type Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { OPUS_BETAS, OPUS_FALLBACKS } from "@/lib/ai/client";
import type { ParsedRow } from "./batch";
import type { Usage } from "./cost";
import { LESSON_MAX_TOKENS, QUESTIONS_MAX_TOKENS, contentModel, systemFor, userFor } from "./requests";
import { LessonWriteSchema, QuestionWriteSchema } from "./schemas";
import type { Target } from "./targets";

export async function generateSync(client: Anthropic, target: Target, opts: { note?: string | null; model?: string } = {}): Promise<ParsedRow> {
  const isLesson = target.kind === "lesson";
  const stream = client.beta.messages.stream({
    model: opts.model ?? contentModel(),
    max_tokens: isLesson ? LESSON_MAX_TOKENS : QUESTIONS_MAX_TOKENS,
    betas: [...OPUS_BETAS],
    fallbacks: OPUS_FALLBACKS,
    system: [{ type: "text", text: systemFor(target), cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: userFor(target, opts.note) }],
    output_config: { effort: "high", format: betaZodOutputFormat(isLesson ? LessonWriteSchema : QuestionWriteSchema) },
  });
  const msg = await stream.finalMessage();
  const usage = msg.usage as unknown as Usage;
  if (msg.stop_reason === "refusal") return { custom_id: target.custom_id, ok: false, error: "refusal", retryable: false, usage };
  if (msg.stop_reason === "max_tokens") return { custom_id: target.custom_id, ok: false, error: "max_tokens: output truncated", retryable: true, usage };
  const text = msg.content.filter((c) => c.type === "text").map((c) => (c.type === "text" ? c.text : "")).join("");
  try {
    return { custom_id: target.custom_id, ok: true, output: JSON.parse(text), usage, model: msg.model, stop_reason: msg.stop_reason };
  } catch (e) {
    return { custom_id: target.custom_id, ok: false, error: `invalid JSON in output: ${(e as Error).message}`, retryable: true, usage };
  }
}
