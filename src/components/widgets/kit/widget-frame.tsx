"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Shared chrome for every Technicals widget (Loop 11): a bordered card, a title, an optional
 * "what to notice" prompt list — the guided-exploration nudge that stops a widget being a toy —
 * and a Reset that puts the reader back at the authored numbers.
 */
export function WidgetFrame({
  title,
  notice,
  onReset,
  testId,
  className,
  children,
}: {
  title: string;
  notice?: string[];
  onReset?: () => void;
  testId?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface p-4", className)} data-testid={testId}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium">{title}</p>
        {onReset && (
          <button type="button" className="text-xs text-muted hover:text-fg" onClick={onReset}>
            Reset
          </button>
        )}
      </div>
      {children}
      {notice && notice.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">What to notice</p>
          <ul className="mt-1.5 grid gap-1 text-xs text-muted">
            {notice.map((n) => (
              <li key={n} className="flex gap-2">
                <span aria-hidden className="text-accent">
                  →
                </span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
