// Builds Messages API params for each target. Batches omit `betas`/`fallbacks` (CONTRACTS.md);
// the sync path (regenerate-one, --sync, critic) adds them in sync.ts. `output_config.format` is
// the shared zod schema; effort high for writers, medium for the critic.
import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { MODEL_CHAT } from "@/lib/ai/client";
import { lessonWritePrompt, lessonWriteUser } from "@/lib/ai/prompts/lesson-write.v1";
import { questionWritePrompt, questionWriteUser } from "@/lib/ai/prompts/question-write.v1";
import { contentCriticPrompt, contentCriticUser } from "@/lib/ai/prompts/content-critic.v1";
import { LessonCriticSchema, LessonWriteSchema, QuestionCriticSchema, QuestionWriteSchema } from "./schemas";
import type { Target } from "./targets";

export const LESSON_MAX_TOKENS = 12000;
export const QUESTIONS_MAX_TOKENS = 16000;
export const CRITIC_MAX_TOKENS = 16000;

export function contentModel(): string {
  return process.env.CONTENT_MODEL || MODEL_CHAT;
}

export function promptVersionFor(kind: "lesson" | "questions"): string {
  return kind === "lesson" ? `${lessonWritePrompt.id}.v${lessonWritePrompt.version}` : `${questionWritePrompt.id}.v${questionWritePrompt.version}`;
}

export type BatchRequest = { custom_id: string; params: Anthropic.Messages.MessageCreateParamsNonStreaming };

export function systemFor(target: Target): string {
  return target.kind === "lesson" ? lessonWritePrompt.system : questionWritePrompt.system;
}
export function userFor(target: Target, note?: string | null): string {
  return target.kind === "lesson" ? lessonWriteUser({ ...target.input, note }) : questionWriteUser({ ...target.input, note });
}

export function buildRequest(target: Target, opts: { model?: string; note?: string | null } = {}): BatchRequest {
  const model = opts.model ?? contentModel();
  const isLesson = target.kind === "lesson";
  return {
    custom_id: target.custom_id,
    params: {
      model,
      max_tokens: isLesson ? LESSON_MAX_TOKENS : QUESTIONS_MAX_TOKENS,
      system: [{ type: "text", text: systemFor(target), cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userFor(target, opts.note) }],
      output_config: { effort: "high", format: zodOutputFormat(isLesson ? LessonWriteSchema : QuestionWriteSchema) },
    },
  };
}

export function buildCriticRequest(input: { kind: "lesson" | "questions"; draft: unknown; problems: string[]; context: string; model?: string }): Anthropic.Messages.MessageCreateParamsNonStreaming {
  return {
    model: input.model ?? contentModel(),
    max_tokens: CRITIC_MAX_TOKENS,
    system: [{ type: "text", text: contentCriticPrompt.system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: contentCriticUser(input) }],
    output_config: { effort: "medium", format: zodOutputFormat(input.kind === "lesson" ? LessonCriticSchema : QuestionCriticSchema) },
  };
}
