"use client";

import { useState } from "react";
import type { z } from "zod";
import type { PredictBlock } from "@/lib/content/lesson-schema";
import { cn } from "@/lib/cn";
import { Markdown } from "../markdown";
import { Section } from "../section";

/**
 * Predict-then-reveal gate (Loop 11). The student commits to an answer before the explanation —
 * prediction raises attention and encoding, especially when the answer surprises them
 * (docs/research/technicals-v2/01-interactive-teaching.md § 2.4). Choosing is the only gate:
 * a wrong guess still reveals, because the surprise is the point.
 */
export function Predict({ block }: { block: z.infer<typeof PredictBlock> }) {
  const [chosen, setChosen] = useState<number | null>(null);
  const answered = chosen !== null;
  return (
    <Section type="predict" tone="accent">
      <p className="font-medium">{block.prompt}</p>
      <ul className="mt-3 grid gap-2" data-testid="predict-options">
        {block.options.map((o, i) => {
          const isChosen = chosen === i;
          const show = answered && (o.correct || isChosen);
          return (
            <li key={i}>
              <button
                type="button"
                disabled={answered}
                onClick={() => setChosen(i)}
                data-testid="predict-option"
                aria-pressed={isChosen}
                className={cn(
                  "w-full rounded-lg border px-4 py-2.5 text-left text-sm transition",
                  !answered && "border-border bg-surface hover:border-accent/50",
                  answered && !show && "border-border/60 bg-surface text-muted",
                  show && o.correct && "border-accent bg-accent/10 font-medium",
                  show && !o.correct && isChosen && "border-danger/50 bg-danger/5",
                )}
              >
                <span>{o.label}</span>
                {show && o.correct && <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-accent">Correct</span>}
                {show && !o.correct && isChosen && <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-danger">Not quite</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {answered ? (
        <div className="mt-4 border-t border-border pt-4" data-testid="predict-explain">
          <Markdown md={block.explain_md} />
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted">Commit to an answer before you read on — you will remember it better.</p>
      )}
    </Section>
  );
}
