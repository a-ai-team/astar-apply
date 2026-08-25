// Step 4–6: the answer. Live mode streams Opus 5 with server-side refusal fallbacks, adaptive
// thinking (default), medium effort, cached system prompt and citation-enabled documents.
// Fixture mode composes a deterministic answer from the same chunks with real Citation objects,
// so UI, persistence, feedback, caps and e2e are exercised without API spend.
import type Anthropic from "@anthropic-ai/sdk";
import { MODEL_CHAT, OPUS_BETAS, OPUS_FALLBACKS, getClient } from "@/lib/ai/client";
import { chatMentorPrompt } from "@/lib/ai/prompts/chat-mentor.v1";
import { buildDocuments, dedupeCitations, documentText, mapCitation } from "./cite";
import type { ChatEvent, Citation, HistoryTurn, MessageContent, RetrievedChunk, Rung, Usage } from "./types";

export const REFUSAL_TEXT = "Sorry — I can't help with that one. Ask me anything about applications, interviews or technicals and I'll do my best.";
export const PRIOR_PREFIX = "Tesleem hasn't covered this — here's the standard answer.";
export const MAX_TOKENS = 4096;

export function chatModel(): string {
  return process.env.CHAT_MODEL || MODEL_CHAT;
}

export type AnswerInput = { question: string; history: HistoryTurn[]; chunks: RetrievedChunk[]; rung: Rung };
export type AnswerEvent = Extract<ChatEvent, { type: "delta" | "citation" }>;
export type AnswerResult = { content: MessageContent; refused: boolean };

/** Yields delta/citation events; returns the final content. */
export async function* answerLive(input: AnswerInput): AsyncGenerator<AnswerEvent, AnswerResult> {
  const client = getClient();
  const documents = buildDocuments(input.chunks);
  const userContent: Anthropic.Beta.BetaContentBlockParam[] = [
    ...documents,
    {
      type: "text",
      text:
        (input.chunks.length === 0
          ? "No mentor documents were retrieved for this question. Say so in your first sentence, then give the standard answer.\n\n"
          : "") + `Student: ${input.question}`,
    },
  ];
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...input.history.map((t) => ({ role: t.role, content: t.text })),
    { role: "user", content: userContent },
  ];
  const stream = client.beta.messages.stream({
    model: chatModel(),
    max_tokens: MAX_TOKENS,
    betas: [...OPUS_BETAS],
    fallbacks: OPUS_FALLBACKS,
    output_config: { effort: "medium" },
    system: [{ type: "text", text: chatMentorPrompt.system, cache_control: { type: "ephemeral" } }],
    messages,
  });
  let text = "";
  const citations: Citation[] = [];
  for await (const ev of stream) {
    if (ev.type !== "content_block_delta") continue;
    if (ev.delta.type === "text_delta") {
      text += ev.delta.text;
      yield { type: "delta", text: ev.delta.text };
    } else if (ev.delta.type === "citations_delta") {
      const c = mapCitation(ev.delta.citation, input.chunks);
      if (c && !citations.some((x) => x.chunk_id === c.chunk_id)) {
        citations.push(c);
        yield { type: "citation", citation: c, index: citations.length };
      }
    }
  }
  const final = await stream.finalMessage();
  const usage: Usage = {
    input_tokens: final.usage.input_tokens,
    output_tokens: final.usage.output_tokens,
    cache_read_input_tokens: final.usage.cache_read_input_tokens ?? null,
  };
  if (final.stop_reason === "refusal") {
    console.warn("chat: refusal after fallback", final.stop_details);
    yield { type: "delta", text: REFUSAL_TEXT };
    return { content: { text: REFUSAL_TEXT, citations: [], rung: "prior", model: final.model, usage }, refused: true };
  }
  // Text from finalMessage is authoritative (fallback turns may re-emit content).
  const fullText = final.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text").map((b) => b.text).join("");
  return { content: { text: fullText || text, citations: dedupeCitations(citations), rung: input.rung, model: final.model, usage }, refused: false };
}

const FIXTURE_MODEL = "fixture-v1";

/** Deterministic answer from the top chunks. Same event shape as live, real citations (quote/start/end). */
export async function* answerFixture(input: AnswerInput): AsyncGenerator<AnswerEvent, AnswerResult> {
  const citations: Citation[] = [];
  let text = "";
  const emit = async function* (s: string) {
    text += s;
    // Stream in word-ish pieces so the UI's incremental rendering is exercised.
    for (const piece of s.match(/\S+\s*|\s+/g) ?? []) yield { type: "delta", text: piece } as AnswerEvent;
  };
  if (input.chunks.length === 0) {
    yield* emit(`${PRIOR_PREFIX} I don't have a mentor note on "${input.question.trim()}" yet, so treat this as the textbook version rather than a mentor's take. `);
    yield* emit("Start from first principles, keep the definition in one sentence, and attach one worked number. (Fixture mode: the live model would write the full standard answer here.)");
    return { content: { text, citations: [], rung: "prior", model: FIXTURE_MODEL, usage: null }, refused: false };
  }
  yield* emit(`Here's what the mentor notes say about "${input.question.trim()}".\n\n`);
  const top = input.chunks.slice(0, 3);
  for (let i = 0; i < top.length; i++) {
    const chunk = top[i];
    const full = documentText(chunk);
    const quote = bestSentence(chunk.answer ?? chunk.text, input.question);
    const start = Math.max(0, full.indexOf(quote));
    const c: Citation = { chunk_id: chunk.id, source_id: chunk.source_id, kind: "corpus", label: chunk.label, quote, start, end: start + quote.length };
    citations.push(c);
    yield* emit(`${i + 1}. ${quote}`);
    yield { type: "citation", citation: c, index: citations.length };
    yield* emit("\n\n");
  }
  yield* emit("(Fixture mode — the live model would weave these into a mentor-voice answer with a worked number.)");
  return { content: { text, citations, rung: input.rung, model: FIXTURE_MODEL, usage: null }, refused: false };
}

/** First sentence that shares a keyword with the question, else the first sentence. */
export function bestSentence(s: string, question: string): string {
  const words = question.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 3);
  const clean = s.replace(/^#{1,6}\s+.*$/gm, "").replace(/\s+/g, " ").trim();
  const sentences = clean.match(/[^.!?]+[.!?](?=\s|$)/g) ?? [clean];
  const hit = sentences.find((sent) => words.some((w) => sent.toLowerCase().includes(w)));
  return firstSentence(hit ?? clean);
}

export function firstSentence(s: string): string {
  const clean = s.replace(/^#{1,6}\s+.*$/m, "").replace(/\s+/g, " ").trim();
  const m = clean.match(/^.*?[.!?](?=\s|$)/);
  const out = (m?.[0] ?? clean).trim();
  return out.length > 240 ? out.slice(0, 237).trimEnd() + "…" : out;
}
