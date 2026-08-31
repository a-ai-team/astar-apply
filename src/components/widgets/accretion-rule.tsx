"use client";

// Accretion / dilution and the cost of the currency (Loop 17). One rule drives everything on
// screen: a deal is accretive when the target's earnings yield at the price paid beats the
// after-tax cost of whatever the acquirer pays with. Simple mode teaches the rule with two P/Es
// and a stock/debt split; full mode adds the three-way split, synergies and fees for the merger
// maths lesson. Maths in `@/lib/finance/merger`.
import { useMemo, useState } from "react";
import { accretionDilution, earningsYield } from "@/lib/finance/merger";
import { Slider } from "./kit/slider";
import { WidgetFrame } from "./kit/widget-frame";
import { AnimatedNumber } from "./kit/animated-number";
import { cn } from "@/lib/cn";
import { pct, price } from "./kit/fmt";

export type AccretionRuleProps = {
  acquirerNetIncome?: number;
  acquirerShares?: number;
  acquirerPe?: number;
  targetNetIncome?: number;
  /** P/E paid on the target's earnings — the offer value is this × target net income. */
  offerPe?: number;
  stockPct?: number;
  debtPct?: number;
  cashPct?: number;
  /** Pre-tax rate on new acquisition debt. */
  costOfDebt?: number;
  /** Pre-tax rate the acquirer's cash was earning. */
  cashRate?: number;
  taxRate?: number;
  /** Pre-tax annual synergies (full mode). */
  synergies?: number;
  /** One-off deal fees, expensed pre-tax (full mode). */
  fees?: number;
  /** "simple" teaches the rule; "full" exposes the whole pro-forma bridge. */
  mode?: "simple" | "full";
};

const DEFAULTS = {
  acquirerNetIncome: 120,
  acquirerShares: 100,
  acquirerPe: 15,
  targetNetIncome: 40,
  offerPe: 12.5,
  stockPct: 1,
  debtPct: 0,
  cashPct: 0,
  costOfDebt: 0.06,
  cashRate: 0.04,
  taxRate: 0.25,
  synergies: 0,
  fees: 0,
  mode: "simple" as const,
};

/** One "cost of the currency" row: a bar scaled against the target yield benchmark. */
function CurrencyRow({ label, value, benchmark, testId }: { label: string; value: number; benchmark: number; testId?: string }) {
  const cheap = value < benchmark;
  return (
    <li className="flex items-center gap-2 text-xs">
      <span className="w-28 shrink-0 text-muted">{label}</span>
      <span className="h-2.5 flex-1 overflow-hidden rounded-sm bg-border/40">
        <span
          aria-hidden
          className={cn("block h-full rounded-sm transition-all duration-300", cheap ? "bg-[var(--accent)]" : "bg-[var(--danger)]")}
          style={{ width: `${Math.min(100, (value / (benchmark * 1.6)) * 100)}%` }}
        />
      </span>
      <span className={cn("w-12 text-right font-mono", cheap ? "text-accent" : "text-danger")} data-testid={testId}>
        {pct(value)}
      </span>
    </li>
  );
}

export function AccretionRule(props: AccretionRuleProps) {
  const base = useMemo(
    () => ({ ...DEFAULTS, ...Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined)) }) as Required<AccretionRuleProps>,
    [props],
  );
  const full = base.mode === "full";

  const [acquirerPe, setAcquirerPe] = useState(base.acquirerPe);
  const [offerPe, setOfferPe] = useState(base.offerPe);
  const [stockPct, setStockPct] = useState(base.stockPct);
  const [debtPct, setDebtPct] = useState(base.debtPct);
  const [costOfDebt, setCostOfDebt] = useState(base.costOfDebt);
  const [taxRate, setTaxRate] = useState(base.taxRate);
  const [synergies, setSynergies] = useState(base.synergies);
  const [fees, setFees] = useState(base.fees);

  const reset = () => {
    setAcquirerPe(base.acquirerPe);
    setOfferPe(base.offerPe);
    setStockPct(base.stockPct);
    setDebtPct(base.debtPct);
    setCostOfDebt(base.costOfDebt);
    setTaxRate(base.taxRate);
    setSynergies(base.synergies);
    setFees(base.fees);
  };

  const view = useMemo(() => {
    // Simple mode funds whatever is not stock with debt; full mode's remainder after stock and
    // debt is cash, so the three always sum to one.
    const stock = stockPct;
    const debt = full ? Math.min(debtPct, 1 - stock) : 1 - stock;
    const cash = full ? Math.max(0, 1 - stock - debt) : 0;
    const r = accretionDilution({
      acquirerNetIncome: base.acquirerNetIncome,
      acquirerShares: base.acquirerShares,
      acquirerPe,
      targetNetIncome: base.targetNetIncome,
      offerValue: offerPe * base.targetNetIncome,
      cashPct: cash,
      stockPct: stock,
      debtPct: debt,
      costOfDebt,
      taxRate,
      foregoneInterestRate: base.cashRate,
      synergies,
      fees,
    });
    return {
      r,
      cash,
      debt,
      stock,
      targetYield: earningsYield(offerPe),
      stockCost: earningsYield(acquirerPe),
      debtCost: costOfDebt * (1 - taxRate),
      cashCost: base.cashRate * (1 - taxRate),
    };
  }, [base, full, acquirerPe, offerPe, stockPct, debtPct, costOfDebt, taxRate, synergies, fees]);

  return (
    <WidgetFrame
      title={full ? "The whole pro-forma bridge, one slider at a time" : "Accretive or dilutive — the rule at work"}
      testId="widget-accretion_rule"
      onReset={reset}
      notice={
        full
          ? [
              "Move the split to 100 % debt — EPS rises, because debt is the cheapest currency, but every point of it sits on the balance sheet as risk.",
              "Add £20m of synergies and watch accretion jump by about 11 points — which is why management teams announce them so loudly.",
              "Raise the offer P/E to 16× all-stock and find the synergies that get EPS back to breakeven — about £3.5m does it.",
            ]
          : [
              "Slide the offer P/E until the all-stock deal turns dilutive — it flips at the acquirer's own 15×.",
              "Fund it all with debt instead and raise the rate — the deal only turns dilutive past about 10.7 % pre-tax, because 8 % is what the target earns on the price.",
              "Change the acquirer's P/E and watch the debt and cash lines sit still — only the cost of stock depends on who is buying.",
            ]
      }
    >
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Slider label="Acquirer P/E" value={acquirerPe} min={8} max={40} step={0.5} unit="×" onChange={setAcquirerPe} testId="ar-acquirer-pe" />
        <Slider label="Offer P/E (price paid)" value={offerPe} min={6} max={25} step={0.5} unit="×" onChange={setOfferPe} testId="ar-offer-pe" />
        <Slider
          label={full ? "Paid in stock" : "Paid in stock (rest is debt)"}
          value={stockPct}
          min={0}
          max={1}
          step={0.05}
          unit="%"
          onChange={(v) => {
            setStockPct(v);
            if (full) setDebtPct((d) => Math.min(d, 1 - v));
          }}
          testId="ar-stock-pct"
        />
        {full && (
          <Slider
            label="Paid with new debt (rest is cash)"
            value={debtPct}
            min={0}
            max={1}
            step={0.05}
            unit="%"
            onChange={(v) => setDebtPct(Math.min(v, 1 - stockPct))}
            testId="ar-debt-pct"
          />
        )}
        <Slider label="Cost of new debt (pre-tax)" value={costOfDebt} min={0} max={0.12} step={0.0025} unit="%" onChange={setCostOfDebt} testId="ar-cost-of-debt" />
        <Slider label="Tax rate" value={taxRate} min={0} max={0.4} step={0.01} unit="%" onChange={setTaxRate} testId="ar-tax" />
        {full && <Slider label="Synergies (pre-tax, run rate)" value={synergies} min={0} max={40} step={1} unit="£m" onChange={setSynergies} testId="ar-synergies" />}
        {full && <Slider label="One-off fees" value={fees} min={0} max={30} step={1} unit="£m" onChange={setFees} testId="ar-fees" />}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Earnings per share</p>
          <p className="mt-1 text-xs text-muted">
            Standalone <span className="font-mono text-fg">{price(view.r.standaloneEps)}</span> → pro-forma{" "}
            <AnimatedNumber value={view.r.proFormaEps} format={(n) => price(n)} className="font-mono text-fg" testId="ar-proforma-eps" />
          </p>
          <AnimatedNumber
            value={view.r.accretionPct}
            format={(n) => `${n >= 0 ? "+" : ""}${pct(n)}`}
            className={cn("mt-1 block font-mono text-lg font-semibold", view.r.isAccretive ? "text-accent" : "text-danger")}
            testId="ar-accretion"
          />
          {full && (
            <p className="mt-1 text-xs text-muted">
              Funding mix: {pct(view.stock, 0)} stock · {pct(view.debt, 0)} debt · {pct(view.cash, 0)} cash
            </p>
          )}
        </div>

        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Cost of the currency</p>
          <p className="mt-1 text-xs text-muted">
            The target earns{" "}
            <span className="font-mono text-fg" data-testid="ar-target-yield">
              {pct(view.targetYield)}
            </span>{" "}
            on the price paid. Each currency costs:
          </p>
          <ul className="mt-2 grid gap-1.5">
            <CurrencyRow label="Stock (1 ÷ P/E)" value={view.stockCost} benchmark={view.targetYield} testId="ar-cost-stock" />
            <CurrencyRow label="Debt (after tax)" value={view.debtCost} benchmark={view.targetYield} testId="ar-cost-debt" />
            <CurrencyRow label="Cash (after tax)" value={view.cashCost} benchmark={view.targetYield} testId="ar-cost-cash" />
          </ul>
        </div>
      </div>

      <p className="mt-3 text-sm" aria-live="polite" data-testid="ar-verdict">
        {view.r.isAccretive ? (
          <span className="text-muted">
            <span className="font-medium text-accent">Accretive</span> — the {pct(view.targetYield)} the target earns on the price beats the blended after-tax cost of the
            funding.
          </span>
        ) : (
          <span className="text-muted">
            <span className="font-medium text-danger">Dilutive</span> — the funding costs more after tax than the {pct(view.targetYield)} the target earns on the price paid.
          </span>
        )}
      </p>
    </WidgetFrame>
  );
}
