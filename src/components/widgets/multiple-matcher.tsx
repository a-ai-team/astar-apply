"use client";

// Pairing metrics with the right value (Loop 14). The student sends each metric to enterprise value
// or equity value; the rule underneath is one line — before interest it belongs to everyone, after
// interest it belongs to shareholders. Buttons rather than drag, so it works from the keyboard.
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { WidgetFrame } from "./kit/widget-frame";

export type MatcherMetric = { label: string; kind: "ev" | "equity"; reason?: string };

export type MultipleMatcherProps = {
  metrics?: MatcherMetric[];
};

const DEFAULT_METRICS: MatcherMetric[] = [
  { label: "EBITDA", kind: "ev", reason: "Before interest, so it belongs to lenders and shareholders alike." },
  { label: "EBIT", kind: "ev", reason: "Also before interest — operating profit, whoever financed it." },
  { label: "Revenue", kind: "ev", reason: "The top line is earned before anyone is paid." },
  { label: "Unlevered free cash flow", kind: "ev", reason: "Unlevered means before debt service — it is everybody's cash." },
  { label: "Net income", kind: "equity", reason: "After interest and tax, so only shareholders have a claim on it." },
  { label: "EPS", kind: "equity", reason: "Net income per share — the same post-interest profit, sliced up." },
  { label: "Levered free cash flow", kind: "equity", reason: "Levered means after debt service, so what is left is the shareholders'." },
  { label: "Book value of equity", kind: "equity", reason: "It is the equity line itself — pair it with equity value (P/B)." },
];

const BUCKETS = [
  { kind: "ev" as const, title: "Enterprise value", blurb: "Belongs to everyone who financed the business" },
  { kind: "equity" as const, title: "Equity value", blurb: "Belongs to shareholders only" },
];

export function MultipleMatcher(props: MultipleMatcherProps) {
  const metrics = useMemo(() => props.metrics ?? DEFAULT_METRICS, [props.metrics]);
  const [placed, setPlaced] = useState<Record<string, "ev" | "equity">>({});

  const unplaced = metrics.filter((m) => !placed[m.label]);
  const correct = metrics.filter((m) => placed[m.label] === m.kind).length;
  const answered = metrics.length - unplaced.length;

  return (
    <WidgetFrame
      title="Which value does each metric pair with?"
      testId="widget-multiple_matcher"
      onReset={() => setPlaced({})}
      notice={[
        "Ask one question of every metric: is it earned before interest, or after it?",
        "Mixing them up makes a leveraged company look cheap or expensive for no operating reason.",
        "Equity value ÷ EBITDA is the classic wrong pairing — it has no meaning.",
      ]}
    >
      {unplaced.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs text-muted">Send each metric to the value it belongs with.</p>
          <ul className="mt-2 grid gap-2">
            {unplaced.map((m) => (
              <li key={m.label} className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2" data-testid="matcher-metric">
                <span className="flex-1 text-sm font-medium">{m.label}</span>
                {BUCKETS.map((b) => (
                  <button
                    key={b.kind}
                    type="button"
                    onClick={() => setPlaced((p) => ({ ...p, [m.label]: b.kind }))}
                    className="rounded-md border border-border px-2.5 py-1 text-xs text-muted transition hover:border-accent hover:text-fg"
                  >
                    {b.title}
                  </button>
                ))}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">
          All placed. {correct === metrics.length ? "Every one correct — that rule is now yours." : "Check the ones marked in red and re-read the reason."}
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {BUCKETS.map((b) => {
          const inBucket = metrics.filter((m) => placed[m.label] === b.kind);
          return (
            <div key={b.kind} className="rounded-lg border border-border p-3" data-testid={`matcher-bucket-${b.kind}`}>
              <p className="text-sm font-medium">{b.title}</p>
              <p className="text-[11px] text-muted">{b.blurb}</p>
              <ul className="mt-2 grid gap-1.5">
                {inBucket.length === 0 && <li className="text-xs text-muted">Nothing here yet.</li>}
                {inBucket.map((m) => {
                  const right = m.kind === b.kind;
                  return (
                    <li
                      key={m.label}
                      data-correct={right}
                      className={cn("rounded-md border px-2.5 py-1.5 text-xs", right ? "border-accent/50 bg-accent/10" : "border-danger/50 bg-danger/5")}
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="font-medium">{m.label}</span>
                        <span className={cn("shrink-0 text-[10px] font-semibold uppercase tracking-wide", right ? "text-accent" : "text-danger")}>{right ? "Correct" : "Wrong side"}</span>
                      </span>
                      <span className="mt-0.5 block text-muted">{right ? m.reason : `This one belongs with ${m.kind === "ev" ? "enterprise value" : "equity value"}. ${m.reason ?? ""}`}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-sm" data-testid="matcher-score" aria-live="polite">
        <span className="text-muted">Correct </span>
        <span className="font-mono font-semibold">
          {correct} of {metrics.length}
        </span>
        {answered < metrics.length && <span className="ml-2 text-xs text-muted">({metrics.length - answered} still to place)</span>}
      </p>
    </WidgetFrame>
  );
}
