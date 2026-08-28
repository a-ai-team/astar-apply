"use client";

import { useState } from "react";
import type { z } from "zod";
import type { FillNumbersBlock } from "@/lib/content/lesson-schema";
import { cn } from "@/lib/cn";
import { Markdown } from "../markdown";
import { Section } from "../section";
import { formatValue } from "./worked-calc";

/** A step is right when the typed number is within 0.5 % (or 0.01) of the authored value. */
export function isCorrect(typed: string, value: number): boolean {
  const n = Number(typed.replace(/[£,\s]/g, ""));
  if (!Number.isFinite(n)) return false;
  return Math.abs(n - value) <= Math.max(0.01, Math.abs(value) * 0.005);
}

/**
 * Faded worked example (Loop 11): the guidance-fading effect — a fully worked example with some
 * steps blanked, which the student completes (01-interactive-teaching.md § 2.1). Feedback is
 * per-cell and immediate; the answer is only shown after a wrong attempt is acknowledged.
 */
export function FillNumbers({ block }: { block: z.infer<typeof FillNumbersBlock> }) {
  const [typed, setTyped] = useState<Record<number, string>>({});
  const [shown, setShown] = useState<Record<number, boolean>>({});
  const blanks = block.steps.filter((s) => s.blank).length;
  const right = block.steps.filter((s, i) => s.blank && typed[i] !== undefined && isCorrect(typed[i], s.value)).length;

  return (
    <Section type="fill_numbers">
      <Markdown md={block.md} />
      <table className="mt-4 w-full text-sm" data-testid="fill-numbers-steps">
        <tbody>
          {block.steps.map((s, i) => {
            const value = typed[i] ?? "";
            const done = s.blank && value !== "" && isCorrect(value, s.value);
            const wrong = s.blank && value !== "" && !done;
            return (
              <tr key={i} className="border-t border-border">
                <td className="py-2 pr-3 text-muted">{i + 1}</td>
                <td className="py-2 pr-3">{s.label}</td>
                <td className="py-2 pr-3 font-mono text-muted">{s.blank && !shown[i] && !done ? "—" : s.expr}</td>
                <td className="py-2 text-right">
                  {s.blank ? (
                    <span className="inline-flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={value}
                        onChange={(e) => setTyped((t) => ({ ...t, [i]: e.target.value }))}
                        aria-label={`${s.label}${s.unit ? ` in ${s.unit}` : ""}`}
                        data-testid="fill-numbers-input"
                        data-state={done ? "correct" : wrong ? "wrong" : "empty"}
                        className={cn(
                          "w-28 rounded-md border bg-surface px-2 py-1 text-right font-mono",
                          done && "border-accent bg-accent/10",
                          wrong && "border-danger/60",
                          !done && !wrong && "border-border",
                        )}
                      />
                      {done && <span className="text-xs font-semibold uppercase text-accent">✓</span>}
                      {wrong &&
                        (shown[i] ? (
                          <span className="font-mono text-xs text-muted">{formatValue(s.value, s.unit)}</span>
                        ) : (
                          <button type="button" onClick={() => setShown((v) => ({ ...v, [i]: true }))} className="text-xs text-muted underline hover:text-fg" data-testid="fill-numbers-show">
                            Show
                          </button>
                        ))}
                    </span>
                  ) : (
                    <span className="font-mono font-semibold">{formatValue(s.value, s.unit)}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-muted" aria-live="polite" data-testid="fill-numbers-score">
        {right} of {blanks} filled in correctly.
      </p>
    </Section>
  );
}
