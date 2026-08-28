// Pure: approved lessons/questions → content_chunks rows (docs/loops/06-chat-technicals.md).
//   lesson  → one chunk per block (blocks under MIN_BLOCK_TOKENS merge into the previous chunk;
//             widgets carry no prose and are skipped), anchored by the first block's index
//   question → exactly one chunk (question + model answer + key points + follow-ups)
// Titles follow the citation format "Technicals › <Topic> › <Lesson> › <Block label>" so the chip
// text and the document title the model sees are the same string. No I/O — unit-tested.
import { blockLabel } from "./block-labels";
import type { LessonBlock, LessonBody } from "./lesson-schema";
import type { QuestionBody } from "./question-schema";
import { estimateTokens } from "@/lib/corpus/chunk";

export const MIN_BLOCK_TOKENS = 30;

export type ContentChunkDraft = {
  kind: "lesson_block" | "question";
  block_index: number | null;
  block_type: string | null;
  title: string;
  text: string;
  token_count: number;
};

export type LessonForIndex = { slug: string; title: string; body: LessonBody; topic_title: string };
export type QuestionForIndex = { slug: string; question: string; body: QuestionBody; topic_title: string };

export function contentTitle(parts: string[]): string {
  return ["Technicals", ...parts.map((p) => p.trim()).filter(Boolean)].join(" › ");
}

/** Plain-text rendering of one block (markdown kept — the model reads it fine and quotes match the page). */
export function blockText(block: LessonBlock): string {
  switch (block.type) {
    case "why_here":
    case "mechanics":
    case "trap":
    case "one_liner":
      return block.md;
    case "concept":
      return `${block.heading}\n\n${block.md}`;
    case "worked_calc":
      return `${block.md}\n\n${block.steps.map((s) => `${s.label}: ${s.expr} = ${s.value}${s.unit ? ` ${s.unit}` : ""}`).join("\n")}`;
    case "canonical_answer":
      return block.md;
    case "scenario": {
      const lines = (name: string, rows: { line: string; delta: number; note?: string }[]) =>
        rows.length ? `${name}: ${rows.map((r) => `${r.line} ${r.delta > 0 ? "+" : ""}${r.delta}${r.note ? ` (${r.note})` : ""}`).join("; ")}` : "";
      return [block.prompt, lines("Income statement", block.statements.is), lines("Cash flow statement", block.statements.cfs), lines("Balance sheet", block.statements.bs), `Check: ${block.check}`].filter(Boolean).join("\n\n");
    }
    case "your_turn":
      return `${block.prompt}\n\nModel answer: ${block.model_answer_md}\n\nRubric: ${block.rubric.join("; ")}`;
    case "quick_fire":
      return block.pairs.map((p) => `Q: ${p.q}\nA: ${p.a}`).join("\n\n");
    case "now_you_can":
      return block.items.map((i) => `- ${i}`).join("\n");
    case "key_metrics":
      return block.rows.map((r) => `${r.metric}: ${r.definition} — ${r.why_it_matters}`).join("\n");
    case "widget":
      return "";
    // --- Technicals v2 (Loop 11) ---
    case "predict":
      return `${block.prompt}\n\nOptions: ${block.options.map((o) => o.label).join(" / ")}\n\n${block.explain_md}`;
    case "fill_numbers":
      return `${block.md}\n\n${block.steps.map((s) => `${s.label}: ${s.expr} = ${s.value}${s.unit ? ` ${s.unit}` : ""}`).join("\n")}`;
    case "order_steps":
      return `${block.prompt}\n\n${block.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
    case "lens":
      // Each variant is indexed with its lens name so the chatbot can cite "the TMT lens says…".
      return Object.entries(block.variants)
        .map(([slug, v]) =>
          v ? [`[${slug.toUpperCase()} lens] ${v.heading}`, v.md, v.example_q ? `Q: ${v.example_q}` : "", v.answer_md ?? ""].filter(Boolean).join("\n\n") : "",
        )
        .filter(Boolean)
        .join("\n\n");
    case "template":
      return "";
  }
}

export function lessonChunks(l: LessonForIndex): ContentChunkDraft[] {
  const out: ContentChunkDraft[] = [];
  l.body.blocks.forEach((block, i) => {
    const text = blockText(block).trim();
    if (!text) return;
    const tokens = estimateTokens(text);
    const prev = out[out.length - 1];
    if (prev && tokens < MIN_BLOCK_TOKENS) {
      prev.text = `${prev.text}\n\n${blockLabel(block.type)}: ${text}`;
      prev.token_count = estimateTokens(prev.text);
      return;
    }
    out.push({
      kind: "lesson_block",
      block_index: i,
      block_type: block.type,
      title: contentTitle([l.topic_title, l.title, block.type === "concept" ? block.heading : blockLabel(block.type)]),
      text,
      token_count: tokens,
    });
  });
  return out;
}

export function questionChunk(q: QuestionForIndex): ContentChunkDraft {
  const parts = [`Q: ${q.question}`, `A: ${q.body.model_answer_md}`];
  if (q.body.key_points?.length) parts.push(`Key points: ${q.body.key_points.join("; ")}`);
  if (q.body.follow_ups?.length) parts.push(q.body.follow_ups.map((f) => `Follow-up: ${f.question}\n${f.answer_md}`).join("\n\n"));
  const text = parts.join("\n\n");
  const short = q.question.length > 80 ? q.question.slice(0, 77).trimEnd() + "…" : q.question;
  return { kind: "question", block_index: null, block_type: null, title: contentTitle([q.topic_title, `Q: ${short}`]), text, token_count: estimateTokens(text) };
}
