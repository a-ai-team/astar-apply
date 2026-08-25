import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { LessonBlockType } from "@/lib/content/lesson-schema";

const LABELS: Record<LessonBlockType, string> = {
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
};

export function blockLabel(type: LessonBlockType) {
  return LABELS[type];
}

/** Fixed lesson-template section chrome; every block renders inside one, tagged by type. */
export function Section({ type, title, tone = "plain", children }: { type: LessonBlockType; title?: string; tone?: "plain" | "callout" | "accent"; children: ReactNode }) {
  return (
    <section
      data-testid={`block-${type}`}
      data-block={type}
      className={cn(
        "scroll-mt-20",
        tone === "callout" && "rounded-lg border border-danger/40 bg-danger/5 p-5",
        tone === "accent" && "rounded-lg border border-accent/40 bg-accent/5 p-5",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{LABELS[type]}</p>
      {title && <h2 className="mt-1 text-xl font-semibold">{title}</h2>}
      <div className="mt-3">{children}</div>
    </section>
  );
}
