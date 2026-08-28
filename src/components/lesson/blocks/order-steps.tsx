"use client";

import { useState } from "react";
import type { z } from "zod";
import type { OrderStepsBlock } from "@/lib/content/lesson-schema";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { Section } from "../section";

/** Deterministic shuffle so the initial order never accidentally equals the answer. */
function shuffled(n: number): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  // Rotate then swap the first pair: stable across renders, never the identity for n >= 3.
  const rotated = [...order.slice(1), order[0]];
  [rotated[0], rotated[1]] = [rotated[1], rotated[0]];
  return rotated;
}

/**
 * Order-the-steps drill (Loop 11). Move up / move down buttons rather than drag: keyboard- and
 * touch-accessible by construction (01-interactive-teaching.md § 5). The authored array order is
 * the correct order.
 */
export function OrderSteps({ block }: { block: z.infer<typeof OrderStepsBlock> }) {
  const [order, setOrder] = useState<number[]>(() => shuffled(block.steps.length));
  const [checked, setChecked] = useState(false);
  const correct = order.every((v, i) => v === i);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    setOrder((o) => {
      const next = [...o];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
    setChecked(false);
  };

  return (
    <Section type="order_steps">
      <p className="font-medium">{block.prompt}</p>
      <ol className="mt-3 grid gap-2" data-testid="order-steps-list">
        {order.map((stepIndex, position) => (
          <li
            key={stepIndex}
            data-testid="order-steps-item"
            data-step={stepIndex}
            className={cn(
              "flex items-center gap-3 rounded-lg border bg-surface px-3 py-2 text-sm",
              checked && (stepIndex === position ? "border-accent/60 bg-accent/5" : "border-danger/50"),
              !checked && "border-border",
            )}
          >
            <span className="w-5 shrink-0 text-center text-xs text-muted">{position + 1}</span>
            <span className="flex-1">{block.steps[stepIndex]}</span>
            <span className="flex shrink-0 gap-1">
              <button type="button" onClick={() => move(position, position - 1)} disabled={position === 0} aria-label={`Move "${block.steps[stepIndex]}" up`} className="rounded border border-border px-2 py-0.5 text-xs text-muted disabled:opacity-40 hover:text-fg">
                ↑
              </button>
              <button type="button" onClick={() => move(position, position + 1)} disabled={position === order.length - 1} aria-label={`Move "${block.steps[stepIndex]}" down`} className="rounded border border-border px-2 py-0.5 text-xs text-muted disabled:opacity-40 hover:text-fg">
                ↓
              </button>
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-3 flex items-center gap-3">
        <Button type="button" variant="secondary" size="sm" onClick={() => setChecked(true)} data-testid="order-steps-check">
          Check order
        </Button>
        {checked && (
          <p className="text-sm" aria-live="polite" data-testid="order-steps-result">
            {correct ? <span className="font-medium text-accent">That is the order.</span> : <span className="text-muted">Not yet — the highlighted rows are out of place.</span>}
          </p>
        )}
      </div>
    </Section>
  );
}
