"use client";

// Faded walk (Loop 13). The Statement Ripple with the answers taken away: the student types the
// blanked cells and gets per-cell feedback. This is the guidance-fading effect — a fully worked
// example, then the same example with the load-bearing steps removed
// (docs/research/technicals-v2/01-interactive-teaching.md § 2.1).
//
// The truth comes from `walk()` in @/lib/finance/statements — the same engine the worked example and
// the lesson's `fill_numbers` block use, so a student can never be marked wrong by a second opinion.
import { useMemo, useState } from "react";
import { walk, WALK_KINDS, WALK_LABELS, type StatementDelta, type WalkInput, type WalkKind } from "@/lib/finance/statements";
import { cn } from "@/lib/cn";
import { Slider } from "./kit/slider";
import { WidgetFrame } from "./kit/widget-frame";
import { signed } from "./kit/fmt";

export type FadedWalkProps = {
  kind?: WalkKind;
  amount?: number;
  taxRate?: number;
  /** How much is hidden: 0 nothing, 1 the tax and net-income lines, 2 most of it, 3 nearly all. */
  fadeLevel?: 0 | 1 | 2 | 3;
};

const FADE_LABELS = ["Show everything", "Hide the tax line", "Hide most lines", "Hide nearly all"] as const;

/** Mirror of `three-statement.tsx` — build the engine's tagged union from three controls. */
function toInput(kind: WalkKind, amount: number, taxRate: number): WalkInput {
  switch (kind) {
    case "depreciation":
    case "pik_interest":
    case "write_down":
      return { kind, amount, taxRate };
    case "inventory_on_credit":
    case "pay_dividend":
      return { kind, amount };
    case "raise_debt":
      return { kind, amount, interestRate: 0.05, taxRate };
    case "buy_ppe_with_debt":
      return { kind, amount, usefulLife: 5, taxRate };
    case "asset_sale":
      return { kind, bookValue: amount, salePrice: amount * 1.5, taxRate };
    case "deferred_revenue":
      return { kind, cashReceived: amount, revenueRecognised: amount / 2, taxRate };
  }
}

type Cell = { id: string; section: "is" | "cfs" | "bs"; row: StatementDelta; hidden: boolean };

/**
 * Which cells are blanked at each level. Fading is deliberate rather than random: level 1 removes
 * the lines candidates actually drop marks on (tax, and the net income that follows from it), and
 * higher levels widen out from there. A random blank would sometimes hide "no impact" rows, which
 * teaches nothing.
 */
function isHidden(section: Cell["section"], row: StatementDelta, index: number, level: number): boolean {
  if (level <= 0) return false;
  const insight = /tax|net income|add back|retained earnings/i.test(row.line);
  if (level === 1) return insight && section !== "bs";
  if (level === 2) return insight || section === "bs";
  return Math.abs(row.delta) > 1e-9;
}

/** Correct when within 0.5 % (or a penny) of the engine's number — the `fill_numbers` tolerance. */
function isCorrect(typed: string, value: number): boolean {
  const n = Number(typed.replace(/[£,\s+]/g, "").replace(/−/g, "-"));
  if (!Number.isFinite(n)) return false;
  return Math.abs(n - value) <= Math.max(0.01, Math.abs(value) * 0.005);
}

const SECTIONS = [
  { key: "is" as const, title: "Income statement" },
  { key: "cfs" as const, title: "Cash flow statement" },
  { key: "bs" as const, title: "Balance sheet" },
];

export function FadedWalk(props: FadedWalkProps) {
  const initial = useMemo(
    () => ({
      kind: props.kind ?? ("depreciation" as WalkKind),
      amount: props.amount ?? 10,
      taxRate: props.taxRate ?? 0.25,
      fadeLevel: props.fadeLevel ?? 1,
    }),
    [props.kind, props.amount, props.taxRate, props.fadeLevel],
  );

  const [kind, setKind] = useState<WalkKind>(initial.kind);
  const [amount, setAmount] = useState(initial.amount);
  const [taxRate, setTaxRate] = useState(initial.taxRate);
  const [level, setLevel] = useState<number>(initial.fadeLevel);
  const [typed, setTyped] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const result = useMemo(() => walk(toInput(kind, amount, taxRate)), [kind, amount, taxRate]);

  const cells: Cell[] = useMemo(
    () =>
      SECTIONS.flatMap((s) =>
        result[s.key].map((row, i) => ({ id: `${s.key}-${i}`, section: s.key, row, hidden: isHidden(s.key, row, i, level) })),
      ),
    [result, level],
  );

  const blanks = cells.filter((c) => c.hidden);
  const right = blanks.filter((c) => typed[c.id] !== undefined && isCorrect(typed[c.id], c.row.delta)).length;

  // Changing the transaction or the numbers invalidates every answer — start clean.
  const restart = (fn: () => void) => {
    fn();
    setTyped({});
    setRevealed({});
  };

  const reset = () =>
    restart(() => {
      setKind(initial.kind);
      setAmount(initial.amount);
      setTaxRate(initial.taxRate);
      setLevel(initial.fadeLevel);
    });

  return (
    <WidgetFrame
      title={`${WALK_LABELS[kind]} — fill it in yourself`}
      testId="widget-faded_walk"
      onReset={reset}
      notice={[
        "Do it from memory before you reveal anything — recall is what makes it stick.",
        "The tax line is where marks are lost: a charge costs you profit and saves you tax.",
        "Raise the fade once you can do it, until nothing is given to you.",
      ]}
    >
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs text-muted">
          <span>Transaction</span>
          <select
            value={kind}
            onChange={(e) => restart(() => setKind(e.target.value as WalkKind))}
            data-testid="faded-walk-kind"
            className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg"
          >
            {WALK_KINDS.map((k) => (
              <option key={k} value={k}>
                {WALK_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          <span>Amount (£m)</span>
          <input
            type="number"
            min={1}
            max={1000}
            step={1}
            value={amount}
            onChange={(e) => restart(() => setAmount(Math.max(1, Number(e.target.value) || 0)))}
            data-testid="faded-walk-amount"
            className="rounded-md border border-border bg-surface px-2 py-1 font-mono text-xs text-fg"
          />
        </label>
        <Slider label="Tax rate" value={taxRate} min={0} max={0.5} step={0.01} unit="%" onChange={(v) => restart(() => setTaxRate(v))} testId="faded-walk-tax" />
        <label className="flex flex-col gap-1 text-xs text-muted">
          <span>How much is hidden</span>
          <select
            value={level}
            onChange={(e) => restart(() => setLevel(Number(e.target.value)))}
            data-testid="faded-walk-level"
            className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg"
          >
            {FADE_LABELS.map((l, i) => (
              <option key={l} value={i}>
                {i}. {l}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {SECTIONS.map((s) => (
          <div key={s.key} className="rounded-lg border border-border bg-bg p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{s.title}</p>
            <ul className="mt-2 grid gap-1.5">
              {cells.filter((c) => c.section === s.key).length === 0 && <li className="text-xs text-muted">No change.</li>}
              {cells
                .filter((c) => c.section === s.key)
                .map((c) => {
                  const value = typed[c.id] ?? "";
                  const done = c.hidden && value !== "" && isCorrect(value, c.row.delta);
                  const wrong = c.hidden && value !== "" && !done;
                  return (
                    <li key={c.id} className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="text-muted">{c.row.line}</span>
                      {c.hidden && !revealed[c.id] ? (
                        <span className="flex shrink-0 items-center gap-1">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={value}
                            onChange={(e) => setTyped((t) => ({ ...t, [c.id]: e.target.value }))}
                            aria-label={`${c.row.line}, ${s.title}, in £m`}
                            data-testid="faded-walk-input"
                            data-state={done ? "correct" : wrong ? "wrong" : "empty"}
                            className={cn(
                              "w-20 rounded-md border bg-surface px-1.5 py-0.5 text-right font-mono text-xs tabular-nums",
                              done && "border-accent bg-accent/10 text-fg",
                              wrong && "border-danger/60 text-fg",
                              !done && !wrong && "border-border text-fg",
                            )}
                          />
                          {done ? (
                            <span className="text-xs text-accent" aria-hidden>
                              ✓
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setRevealed((r) => ({ ...r, [c.id]: true }))}
                              data-testid="faded-walk-reveal"
                              className="text-[10px] uppercase tracking-wide text-muted underline hover:text-fg"
                            >
                              Show
                            </button>
                          )}
                        </span>
                      ) : (
                        <span className={cn("shrink-0 font-mono font-semibold tabular-nums", c.row.delta >= 0 ? "text-fg" : "text-danger")}>{signed(c.row.delta)}</span>
                      )}
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-3 text-sm" aria-live="polite" data-testid="faded-walk-score">
        {blanks.length === 0 ? (
          <span className="text-muted">Nothing hidden — raise the fade to test yourself.</span>
        ) : (
          <>
            <span className={cn("font-medium", right === blanks.length ? "text-accent" : "text-fg")}>
              {right} of {blanks.length} correct
            </span>
            <span className="ml-2 text-muted">{result.balances ? "The walk balances." : `Out by ${signed(result.check)}.`}</span>
          </>
        )}
      </p>
    </WidgetFrame>
  );
}
