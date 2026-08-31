"use client";

// Build a WACC from its parts, then sweep the capital structure (Loop 16). The sweep is the point:
// hold beta fixed and WACC falls in a straight line as debt rises, which is exactly the naive
// answer to "why not fund everything with debt?". Turn relevering on and the equity gets riskier
// as the debt grows, lenders re-price, and the line bends into a U with a real minimum.
// Maths in `@/lib/finance/wacc`.
import { useMemo, useState } from "react";
import { leverageSweep, minimumWaccPoint, wacc as waccOf } from "@/lib/finance/wacc";
import { Slider } from "./kit/slider";
import { WidgetFrame } from "./kit/widget-frame";
import { AnimatedNumber } from "./kit/animated-number";
import { linearScale } from "./kit/scale";
import { useReducedMotion } from "./kit/use-reduced-motion";
import { pct } from "./kit/fmt";

export type WaccBuilderProps = {
  riskFree?: number;
  beta?: number;
  erp?: number;
  costOfDebt?: number;
  taxRate?: number;
  equityValue?: number;
  debtValue?: number;
};

const DEFAULTS = {
  riskFree: 0.04,
  beta: 1.0,
  erp: 0.06,
  costOfDebt: 0.06,
  taxRate: 0.25,
  equityValue: 1050,
  debtValue: 590,
};

const W = 520;
const H = 150;
const PAD = { l: 44, r: 12, t: 10, b: 26 };

export function WaccBuilder(props: WaccBuilderProps) {
  const base = useMemo(
    () => ({ ...DEFAULTS, ...Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined)) }) as Required<WaccBuilderProps>,
    [props],
  );
  const reduced = useReducedMotion();

  const [riskFree, setRiskFree] = useState(base.riskFree);
  const [beta, setBeta] = useState(base.beta);
  const [erp, setErp] = useState(base.erp);
  const [costOfDebt, setCostOfDebt] = useState(base.costOfDebt);
  const [taxRate, setTaxRate] = useState(base.taxRate);
  const [debtWeight, setDebtWeight] = useState(base.debtValue / (base.equityValue + base.debtValue));
  const [relever, setRelever] = useState(false);

  const baseDebtToEquity = base.debtValue / base.equityValue;

  const current = useMemo(() => {
    const total = 100;
    const d = total * debtWeight;
    const e = total - d;
    // Beta is quoted at the company's actual leverage; only relever when the reader asks for it.
    const sweepPoint = leverageSweep({
      beta,
      baseDebtToEquity,
      riskFree,
      equityRiskPremium: erp,
      costOfDebt,
      taxRate,
      relever,
      points: [debtWeight],
    })[0];
    const ke = sweepPoint.costOfEquity;
    const r = waccOf({ equityValue: e, debtValue: d, costOfEquity: ke, costOfDebt: sweepPoint.costOfDebt, taxRate });
    return { ...r, costOfEquity: ke, beta: sweepPoint.beta, kd: sweepPoint.costOfDebt };
  }, [beta, baseDebtToEquity, riskFree, erp, costOfDebt, taxRate, debtWeight, relever]);

  const sweep = useMemo(
    () => leverageSweep({ beta, baseDebtToEquity, riskFree, equityRiskPremium: erp, costOfDebt, taxRate, relever }),
    [beta, baseDebtToEquity, riskFree, erp, costOfDebt, taxRate, relever],
  );
  const minPoint = minimumWaccPoint(sweep);

  const values = sweep.map((p) => p.wacc);
  const lo = Math.min(...values) * 0.96;
  const hi = Math.max(...values) * 1.04;
  const x = linearScale({ domain: [0, 0.8], range: [PAD.l, W - PAD.r] });
  const y = linearScale({ domain: [lo, hi], range: [H - PAD.b, PAD.t] });
  const path = sweep.filter((p) => p.debtWeight <= 0.8).map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.debtWeight).toFixed(1)} ${y(p.wacc).toFixed(1)}`).join(" ");

  return (
    <WidgetFrame
      title="Build the discount rate, then change the capital structure"
      testId="widget-wacc_builder"
      onReset={() => {
        setRiskFree(base.riskFree);
        setBeta(base.beta);
        setErp(base.erp);
        setCostOfDebt(base.costOfDebt);
        setTaxRate(base.taxRate);
        setDebtWeight(base.debtValue / (base.equityValue + base.debtValue));
        setRelever(false);
      }}
      notice={[
        "Move beta by 0.1 and watch the cost of equity move by exactly the equity risk premium ÷ 10.",
        "Drag debt from 0 to 80 % with relevering off: WACC falls in a straight line. That is the naive answer.",
        "Now switch relevering on. The equity gets riskier as the debt grows and the line bends into a U.",
        "Set tax to 0 and most of the debt advantage disappears — the tax shield was doing the work.",
      ]}
    >
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Slider label="Risk-free rate" value={riskFree} min={0} max={0.08} step={0.0025} unit="%" onChange={setRiskFree} testId="wacc-rf" />
        <Slider label="Beta" value={beta} min={0.2} max={2.5} step={0.05} unit="" onChange={setBeta} testId="wacc-beta" display={(v) => v.toFixed(2)} />
        <Slider label="Equity risk premium" value={erp} min={0.03} max={0.09} step={0.0025} unit="%" onChange={setErp} testId="wacc-erp" />
        <Slider label="Cost of debt (pre-tax)" value={costOfDebt} min={0.02} max={0.14} step={0.0025} unit="%" onChange={setCostOfDebt} testId="wacc-kd" />
        <Slider label="Tax rate" value={taxRate} min={0} max={0.4} step={0.01} unit="%" onChange={setTaxRate} testId="wacc-tax" />
        <Slider label="Debt share of capital" value={debtWeight} min={0} max={0.8} step={0.01} unit="%" onChange={setDebtWeight} testId="wacc-dv" />
      </div>

      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
        <p>
          <span className="text-muted">Cost of equity </span>
          <AnimatedNumber value={current.costOfEquity * 100} format={(n) => `${n.toFixed(1)}%`} className="font-mono font-semibold" testId="wacc-ke" />
          <span className="block text-xs text-muted">
            {pct(riskFree)} + {current.beta.toFixed(2)} × {pct(erp)}
          </span>
        </p>
        <p>
          <span className="text-muted">Cost of debt after tax </span>
          <span className="font-mono font-semibold">{pct(current.kd * (1 - taxRate))}</span>
          <span className="block text-xs text-muted">
            {pct(current.kd)} × (1 − {pct(taxRate, 0)})
          </span>
        </p>
        <p>
          <span className="text-muted">WACC </span>
          <AnimatedNumber value={current.wacc * 100} format={(n) => `${n.toFixed(2)}%`} className="font-mono text-lg font-semibold" testId="wacc-result" />
          <span className="block text-xs text-muted">
            {pct(current.equityWeight, 0)} equity · {pct(current.debtWeight, 0)} debt
          </span>
        </p>
      </div>

      <label className="mt-4 flex items-center gap-2 text-xs">
        <input type="checkbox" checked={relever} onChange={(e) => setRelever(e.target.checked)} data-testid="wacc-relever" className="accent-[var(--accent)]" />
        <span>
          Relever beta as leverage rises <span className="text-muted">(and let lenders re-price above 40 % debt) — the honest version</span>
        </span>
      </label>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label={`WACC against debt share of capital, ${relever ? "with beta relevered" : "with beta held fixed"}`}>
        <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="var(--border)" />
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} stroke="var(--border)" />
        {[0, 0.2, 0.4, 0.6, 0.8].map((d) => (
          <text key={d} x={x(d)} y={H - PAD.b + 14} textAnchor="middle" fontSize="9" fill="var(--muted)">
            {(d * 100).toFixed(0)}%
          </text>
        ))}
        {[lo, (lo + hi) / 2, hi].map((v) => (
          <text key={v} x={PAD.l - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill="var(--muted)">
            {(v * 100).toFixed(1)}%
          </text>
        ))}
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" style={reduced ? undefined : { transition: "d 300ms ease" }} />
        {relever && minPoint && minPoint.debtWeight <= 0.8 && (
          <>
            <circle cx={x(minPoint.debtWeight)} cy={y(minPoint.wacc)} r="4" fill="var(--accent)" />
            <text x={x(minPoint.debtWeight)} y={y(minPoint.wacc) - 8} textAnchor="middle" fontSize="9" fill="var(--fg)">
              lowest at {(minPoint.debtWeight * 100).toFixed(0)}%
            </text>
          </>
        )}
        <line x1={x(Math.min(0.8, debtWeight))} y1={PAD.t} x2={x(Math.min(0.8, debtWeight))} y2={H - PAD.b} stroke="var(--fg)" strokeDasharray="3 3" opacity="0.5" />
      </svg>

      <p className="text-xs text-muted" aria-live="polite" data-testid="wacc-sweep-note">
        {relever
          ? minPoint
            ? `With beta relevering, WACC bottoms out around ${(minPoint.debtWeight * 100).toFixed(0)} % debt at ${pct(minPoint.wacc)} — past that, riskier equity and dearer debt push it back up.`
            : ""
          : "Beta is held fixed, so WACC falls in a straight line. That is the answer interviewers are waiting to challenge."}
      </p>
    </WidgetFrame>
  );
}
