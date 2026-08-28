// Human labels for lesson block types. Shared by the lesson Section chrome (src/components/lesson/
// section.tsx) and the content indexer (citation titles "Technicals › Topic › Lesson › The trap").
// Keep this file free of React so scripts can import it.
import type { LessonBlockType } from "./lesson-schema";

export const BLOCK_LABELS: Record<LessonBlockType, string> = {
  why_here: "Why interviewers open here",
  concept: "The concept",
  mechanics: "How it works",
  worked_calc: "Worked example",
  trap: "The trap",
  canonical_answer: "The canonical answer",
  scenario: "Scenario",
  your_turn: "Your turn",
  quick_fire: "Quick-fire questions",
  one_liner: "The one-liner to memorise",
  now_you_can: "What you can now do",
  widget: "Interactive",
  key_metrics: "Key metrics",
  predict: "Predict first",
  fill_numbers: "Fill in the numbers",
  order_steps: "Put these in order",
  lens: "In your industry",
  template: "Take this away",
};

export function blockLabel(type: LessonBlockType): string {
  return BLOCK_LABELS[type];
}

/** DOM id of the n-th block on a lesson page; citation chips deep-link to `#block-<n>`. */
export function blockAnchor(index: number): string {
  return `block-${index}`;
}
