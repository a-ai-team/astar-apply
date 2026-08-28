"use client";

// Statement Ripple (Loop 11 reference widget). Pick a transaction, set the amount, and watch it
// propagate income statement → cash flow → balance sheet, with the balance check at the end. The
// maths lives in `@/lib/finance/statements`; this file is only the view.
import { useMemo, useState } from "react";
import { walk, walkSummary, WALK_KINDS, WALK_LABELS, type StatementDelta, type WalkInput, type WalkKind } from "@/lib/finance/statements";
import { cn } from "@/lib/cn";
import { Slider } from "./kit/slider";
import { WidgetFrame } from "./kit/widget-frame";
import { useReducedMotion } from "./kit/use-reduced-motion";
import { signed } from "./kit/fmt";

export type ThreeStatementProps = {
  /** Starting transaction; defaults to the classic depreciation walk. */
  kind?: WalkKind;
  amount?: number;
  taxRate?: number;
  /** Lock the picker to the authored transaction (a lesson that teaches exactly one walk). */
  lockKind?: boolean;
};

/** Build the tagged union the engine wants from the three controls the reader has. */
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
      // Sold at a 50 % gain over book value — the version that makes the tax line interesting.
      return { kind, bookValue: amount, salePrice: amount * 1.5, taxRate };
    case "deferred_revenue":
      // Cash up front, half of it earned so far.
      return { kind, cashReceived: amount, revenueRecognised: amount / 2, taxRate };
  }
}

/** The extra assumption each derived transaction makes, so the reader is never guessing. */
const ASSUMPTION: Partial<Record<WalkKind, (amount: number) => string>> = {
  raise_debt: () => "Interest at 5 %.",
  buy_ppe_with_debt: () => "Depreciated straight-line over 5 years.",
  asset_sale: (a) => `Sold for ${signed(a * 1.5).replace("+", "")} — a 50 % gain over book value.`,
  deferred_revenue: (a) => `Half of the ${signed(a).replace("+", "")} has been earned so far.`,
};

const GROUPS = [
  { key: "is" as const, title: "Income statement" },
  { key: "cfs" as const, title: "Cash flow statement" },
  { key: "bs" as const, title: "Balance sheet" },
];

function StatementColumn({ title, rows, visible, delayMs, animate }: { title: string; rows: StatementDelta[]; visible: boolean; delayMs: number; animate: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-bg p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <ul className="mt-2 grid gap-1.5">
        {rows.length === 0 && <li className="text-xs text-muted">No change.</li>}
        {rows.map((r, i) => (
          <li
            key={`${r.line}-${i}`}
            data-testid="ripple-cell"
            data-line={r.line}
            className={cn("flex items-baseline justify-between gap-3 text-sm", !visible && "opacity-0")}
            style={animate ? { transition: `opacity 260ms ease ${delayMs + i * 45}ms` } : undefined}
          >
            <span className="text-muted">
              {r.line}
              {r.note && <span className="ml-1 text-xs opacity-70">({r.note})</span>}
            </span>
            <span className={cn("shrink-0 font-mono font-semibold tabular-nums", r.delta >= 0 ? "text-fg" : "text-danger")}>{signed(r.delta)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ThreeStatement(props: ThreeStatementProps) {
  const initial = useMemo(
    () => ({ kind: props.kind ?? "depreciation", amount: props.amount ?? 10, taxRate: props.taxRate ?? 0.25 }),
    [props.kind, props.amount, props.taxRate],
  );
  const [kind, setKind] = useState<WalkKind>(initial.kind);
  const [amount, setAmount] = useState(initial.amount);
  const [taxRate, setTaxRate] = useState(initial.taxRate);
  const reduced = useReducedMotion();
  // Reduced motion: reveal the three statements one click at a time instead of animating.
  const [step, setStep] = useState(3);

  const result = useMemo(() => walk(toInput(kind, amount, taxRate)), [kind, amount, taxRate]);
  const shownGroups = reduced ? step : 3;
  const assumption = ASSUMPTION[kind]?.(amount);

  const reset = () => {
    setKind(initial.kind);
    setAmount(initial.amount);
    setTaxRate(initial.taxRate);
    setStep(3);
  };

  return (
    <WidgetFrame
      title={`${WALK_LABELS[kind]} — walk it through`}
      testId="widget-three_statement"
      onReset={reset}
      notice={["Follow the order an interviewer expects: income statement, then cash flow, then balance sheet.", "Watch the tax line — it is where most candidates drop marks.", "The balance check must close every time."]}
    >
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs text-muted">
          <span>Transaction</span>
          <select
            value={kind}
            disabled={props.lockKind}
            onChange={(e) => {
              setKind(e.target.value as WalkKind);
              setStep(reduced ? 0 : 3);
            }}
            data-testid="ripple-kind"
            className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg disabled:opacity-60"
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
            onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 0))}
            data-testid="ripple-amount"
            className="rounded-md border border-border bg-surface px-2 py-1 font-mono text-xs text-fg"
          />
        </label>
        <Slider label="Tax rate" value={taxRate} min={0} max={0.5} step={0.01} unit="%" onChange={setTaxRate} testId="ripple-tax" />
      </div>

      {assumption && <p className="mt-2 text-xs text-muted">{assumption}</p>}

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {GROUPS.map((g, i) => (
          <StatementColumn key={g.key} title={g.title} rows={result[g.key]} visible={i < shownGroups} delayMs={i * 260} animate={!reduced} />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm" aria-live="polite" data-testid="ripple-balance">
          {result.balances ? (
            <span className="font-medium text-accent">Balances ✓</span>
          ) : (
            <span className="text-danger">Out by {signed(result.check)} — assets − liabilities − equity</span>
          )}
          <span className="ml-2 text-muted">
            Net income {signed(result.netIncomeDelta)}, cash {signed(result.cashDelta)}.
          </span>
        </p>
        {reduced && (
          <button
            type="button"
            onClick={() => setStep((s) => (s >= 3 ? 0 : s + 1))}
            data-testid="ripple-step"
            className="rounded-md border border-border px-3 py-1 text-xs text-muted hover:text-fg"
          >
            {step >= 3 ? "Start again" : `Show ${GROUPS[step].title.toLowerCase()}`}
          </button>
        )}
      </div>

      {reduced && (
        <p className="mt-2 text-xs text-muted" data-testid="ripple-diff">
          {walkSummary(result)}
        </p>
      )}
    </WidgetFrame>
  );
}
