"use client";

// Unlever, take the median, relever (Loop 16). You cannot average comps' raw betas, because each
// one is measured at that company's own debt level. Strip the leverage out of each, take the
// median of what is left — the underlying business risk — then put your company's capital
// structure back in. Maths in `@/lib/finance/wacc`.
import { useMemo, useState } from "react";
import { costOfEquityCapm, medianBeta, releverBeta, unleverBeta } from "@/lib/finance/wacc";
import { Slider } from "./kit/slider";
import { WidgetFrame } from "./kit/widget-frame";
import { AnimatedNumber } from "./kit/animated-number";
import { pct } from "./kit/fmt";

export type BetaComp = { name: string; leveredBeta: number; debtToEquity: number };

export type BetaReleverProps = {
  comps?: BetaComp[];
  taxRate?: number;
  targetDebtToEquity?: number;
  riskFree?: number;
  erp?: number;
};

const DEFAULTS = {
  comps: [
    { name: "Calder Freight", leveredBeta: 1.2, debtToEquity: 0.6 },
    { name: "Penrose Logistics", leveredBeta: 0.9, debtToEquity: 0.3 },
    { name: "Thornbury Haulage", leveredBeta: 1.1, debtToEquity: 0.5 },
  ] as BetaComp[],
  taxRate: 0.25,
  targetDebtToEquity: 590 / 1050,
  riskFree: 0.04,
  erp: 0.06,
};

export function BetaRelever(props: BetaReleverProps) {
  const base = useMemo(
    () => ({ ...DEFAULTS, ...Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined)) }) as Required<BetaReleverProps>,
    [props],
  );
  const [targetDe, setTargetDe] = useState(base.targetDebtToEquity);
  const [taxRate, setTaxRate] = useState(base.taxRate);

  const view = useMemo(() => {
    const rows = base.comps.map((c) => ({
      ...c,
      unlevered: unleverBeta({ leveredBeta: c.leveredBeta, debtToEquity: c.debtToEquity, taxRate }),
    }));
    const median = medianBeta(rows.map((r) => r.unlevered));
    const relevered = releverBeta({ unleveredBeta: median, debtToEquity: targetDe, taxRate });
    return { rows, median, relevered, ke: costOfEquityCapm({ riskFree: base.riskFree, beta: relevered, equityRiskPremium: base.erp }) };
  }, [base.comps, base.riskFree, base.erp, taxRate, targetDe]);

  return (
    <WidgetFrame
      title="Unlever the comps, take the median, relever at your capital structure"
      testId="widget-beta_relever"
      onReset={() => {
        setTargetDe(base.targetDebtToEquity);
        setTaxRate(base.taxRate);
      }}
      notice={[
        "Each comp's raw beta is measured at its own debt level, so averaging them straight off mixes business risk with financing risk.",
        "Drag the target debt-to-equity: the unlevered median never moves, only what you relever it to.",
        "Set tax to zero — the shield disappears and both steps get slightly larger.",
      ]}
    >
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Slider label="Your target debt / equity" value={targetDe} min={0} max={2} step={0.01} unit="" onChange={setTargetDe} testId="beta-target-de" display={(v) => v.toFixed(2)} />
        <Slider label="Tax rate" value={taxRate} min={0} max={0.4} step={0.01} unit="%" onChange={setTaxRate} testId="beta-tax" />
      </div>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
            <th scope="col" className="py-1.5 pr-2 font-medium">Comparable</th>
            <th scope="col" className="py-1.5 pr-2 text-right font-medium">Levered β</th>
            <th scope="col" className="py-1.5 pr-2 text-right font-medium">D / E</th>
            <th scope="col" className="py-1.5 text-right font-medium">Unlevered β</th>
          </tr>
        </thead>
        <tbody>
          {view.rows.map((r) => (
            <tr key={r.name} className="border-b border-border/60" data-testid="beta-comp-row">
              <td className="py-1.5 pr-2">{r.name}</td>
              <td className="py-1.5 pr-2 text-right font-mono">{r.leveredBeta.toFixed(2)}</td>
              <td className="py-1.5 pr-2 text-right font-mono text-muted">{r.debtToEquity.toFixed(2)}</td>
              <td className="py-1.5 text-right font-mono font-medium">{r.unlevered.toFixed(3)}</td>
            </tr>
          ))}
          <tr>
            <td className="py-2 pr-2 text-xs uppercase tracking-wide text-muted" colSpan={3}>
              Median unlevered beta — the business risk, with financing stripped out
            </td>
            <td className="py-2 text-right font-mono font-semibold" data-testid="beta-median-unlevered">
              {view.median.toFixed(3)}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="mt-3 rounded-lg border border-accent/40 bg-accent/5 p-3 text-sm">
        <p>
          <span className="text-muted">Relevered at {targetDe.toFixed(2)} debt/equity: </span>
          <AnimatedNumber value={view.relevered} format={(n) => n.toFixed(3)} className="font-mono text-lg font-semibold" testId="beta-relevered" />
        </p>
        <p className="mt-1 text-xs text-muted">
          {view.median.toFixed(3)} × (1 + {(1 - taxRate).toFixed(2)} × {targetDe.toFixed(2)}) — then cost of equity ={" "}
          {pct(base.riskFree)} + {view.relevered.toFixed(2)} × {pct(base.erp)} = <span className="font-mono text-fg">{pct(view.ke)}</span>
        </p>
      </div>
    </WidgetFrame>
  );
}
