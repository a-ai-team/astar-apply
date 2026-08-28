"use client";

// Discount Dial (Loop 12, Foundations). Drag the rate and watch each year's cash shrink to its
// present value: the far bars collapse fastest, which is the whole intuition behind discounting.
// In NPV mode it subtracts an outlay and marks the rate where the total crosses zero — the IRR.
// The maths lives in `@/lib/finance/discount` (+ `wacc` for the preset); this file is only the view.
import { useMemo, useState } from "react";
import { annuityFactor, discountFactor, irr, pv, ruleOf72 } from "@/lib/finance/discount";
import { wacc as computeWacc } from "@/lib/finance/wacc";
import { cn } from "@/lib/cn";
import { Slider } from "./kit/slider";
import { WidgetFrame } from "./kit/widget-frame";
import { AnimatedNumber } from "./kit/animated-number";
import { useReducedMotion } from "./kit/use-reduced-motion";
import { money, pct } from "./kit/fmt";

/** The WACC preset: funding mix and costs that compute the dial's rate (spec § Widget). */
export type WaccPreset = { E: number; D: number; ke: number; kd: number; t: number };

export type DiscountDialProps = {
  /** One entry per year, £m. Default: Ashdown's £0.6m a year for five years. */
  cashflows?: number[];
  /** Starting discount rate (decimal). Ignored when `wacc` is given — the preset computes it. */
  rate?: number;
  midYear?: boolean;
  /** `pv` shows what each year is worth today; `npv` subtracts `outlay` and finds the IRR. */
  mode?: "pv" | "npv";
  /** Period-0 investment, £m (NPV mode). */
  outlay?: number;
  /** When present, sliders for the funding mix replace the rate slider and compute it. */
  wacc?: WaccPreset;
};

const DEFAULTS = {
  cashflows: [0.6, 0.6, 0.6, 0.6, 0.6],
  rate: 0.08,
  midYear: false,
  mode: "pv" as const,
  outlay: 2,
};

export function DiscountDial(props: DiscountDialProps) {
  const initial = useMemo(
    () => ({
      cashflows: props.cashflows ?? DEFAULTS.cashflows,
      rate: props.rate ?? DEFAULTS.rate,
      midYear: props.midYear ?? DEFAULTS.midYear,
      mode: props.mode ?? DEFAULTS.mode,
      outlay: props.outlay ?? DEFAULTS.outlay,
      wacc: props.wacc,
    }),
    [props.cashflows, props.rate, props.midYear, props.mode, props.outlay, props.wacc],
  );

  const [rate, setRate] = useState(initial.rate);
  const [midYear, setMidYear] = useState(initial.midYear);
  const [preset, setPreset] = useState<WaccPreset | undefined>(initial.wacc);
  const reduced = useReducedMotion();
  // Reduced motion: reveal one year at a time with its arithmetic instead of animating bars.
  const [step, setStep] = useState(initial.cashflows.length);

  const cashflows = initial.cashflows;
  const years = cashflows.length;

  // The preset drives the rate when it is in play, so the reader sees funding mix → discount rate.
  const waccResult = useMemo(
    () => (preset ? computeWacc({ equityValue: preset.E, debtValue: preset.D, costOfEquity: preset.ke, costOfDebt: preset.kd, taxRate: preset.t }) : null),
    [preset],
  );
  const effectiveRate = waccResult ? waccResult.wacc : rate;

  const rows = useMemo(
    () =>
      cashflows.map((cf, i) => {
        const n = i + 1;
        return { year: n, face: cf, present: pv(cf, effectiveRate, n, { midYear }), factor: discountFactor(effectiveRate, n, { midYear }) };
      }),
    [cashflows, effectiveRate, midYear],
  );

  const totalPv = rows.reduce((s, r) => s + r.present, 0);
  const netPv = initial.mode === "npv" ? totalPv - initial.outlay : totalPv;
  const irrValue = useMemo(() => (initial.mode === "npv" ? irr([-initial.outlay, ...cashflows]) : null), [initial.mode, initial.outlay, cashflows]);
  const doublingYears = ruleOf72(effectiveRate);

  // Bars are scaled against the largest face value so the shrinkage is the visible change.
  const maxFace = Math.max(...cashflows.map(Math.abs), 0.0001);
  const shown = reduced ? step : years;

  const reset = () => {
    setRate(initial.rate);
    setMidYear(initial.midYear);
    setPreset(initial.wacc);
    setStep(years);
  };

  const setPresetField = (key: keyof WaccPreset, value: number) => setPreset((p) => (p ? { ...p, [key]: value } : p));

  return (
    <WidgetFrame
      title={initial.mode === "npv" ? "Is it worth doing? — discount the cash, subtract the cost" : "What is future cash worth today?"}
      testId="widget-discount_dial"
      onReset={reset}
      notice={
        initial.mode === "npv"
          ? ["Slide the rate until the total touches zero — that rate is the IRR.", "A positive NPV means the return beats the rate you demanded.", "Halving the cash flow does not halve the IRR: the relationship is not linear."]
          : ["Raise the rate and watch the far bars shrink fastest — each extra year divides by (1 + r) again.", "Mid-year moves every bar up by the same proportion, because every one loses the same half-year of waiting.", "Face values are never comparable across years; only present values are."]
      }
    >
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {preset && waccResult ? (
          <>
            <Slider label="Equity (£m)" value={preset.E} min={0} max={10} step={0.5} unit="£m" onChange={(v) => setPresetField("E", v)} testId="dial-equity" />
            <Slider label="Debt (£m)" value={preset.D} min={0} max={10} step={0.5} unit="£m" onChange={(v) => setPresetField("D", v)} testId="dial-debt" />
            <Slider label="Cost of equity" value={preset.ke} min={0} max={0.3} step={0.005} unit="%" onChange={(v) => setPresetField("ke", v)} testId="dial-ke" />
            <Slider label="Cost of debt" value={preset.kd} min={0} max={0.2} step={0.005} unit="%" onChange={(v) => setPresetField("kd", v)} testId="dial-kd" />
            <Slider label="Tax rate" value={preset.t} min={0} max={0.5} step={0.01} unit="%" onChange={(v) => setPresetField("t", v)} testId="dial-tax" />
          </>
        ) : (
          <Slider label="Discount rate" value={rate} min={0} max={0.2} step={0.005} unit="%" onChange={setRate} testId="dial-rate" />
        )}
        <label className="flex items-center gap-2 self-end text-xs text-muted">
          <input type="checkbox" checked={midYear} onChange={(e) => setMidYear(e.target.checked)} data-testid="dial-midyear" className="accent-[var(--accent)]" />
          <span>Mid-year convention (cash arrives through the year)</span>
        </label>
      </div>

      {preset && waccResult && (
        <p className="mt-2 text-xs text-muted" data-testid="dial-wacc-line">
          {pct(waccResult.equityWeight)} equity at {pct(preset.ke)} + {pct(waccResult.debtWeight)} debt at {pct(waccResult.afterTaxCostOfDebt)} after tax ={" "}
          <span className="font-mono text-fg">{pct(waccResult.wacc)}</span> — the rate the bars below use.
        </p>
      )}

      <ul className="mt-4 grid gap-2" data-testid="dial-bars">
        {rows.map((r, i) => (
          <li key={r.year} className={cn("grid grid-cols-[3.2rem_1fr_5.5rem] items-center gap-3 text-xs", i >= shown && "opacity-0")} data-testid="dial-bar" data-year={r.year}>
            <span className="text-muted">Year {r.year}</span>
            <span className="relative block h-5 rounded bg-border/40" aria-hidden>
              {/* Faint bar = face value; solid bar = what it is actually worth today. */}
              <span className="absolute inset-y-0 left-0 rounded bg-muted/25" style={{ width: `${(Math.abs(r.face) / maxFace) * 100}%` }} />
              <span
                className="absolute inset-y-0 left-0 rounded bg-accent"
                style={{ width: `${(Math.abs(r.present) / maxFace) * 100}%`, transition: reduced ? undefined : "width 280ms ease" }}
              />
            </span>
            <span className="text-right font-mono tabular-nums text-fg">{money(r.present, 2)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <p className="text-sm" data-testid="dial-total">
          <span className="text-muted">{initial.mode === "npv" ? "NPV" : "Total present value"}: </span>
          <AnimatedNumber
            value={netPv}
            format={(n) => money(n, 2)}
            className={cn("font-mono font-semibold tabular-nums", initial.mode === "npv" && netPv < 0 ? "text-danger" : "text-fg")}
          />
          <span className="ml-2 text-xs text-muted">
            {initial.mode === "npv" ? `against ${money(initial.outlay, 2)} invested` : `from ${money(cashflows.reduce((s, c) => s + c, 0), 2)} of face value`}
          </span>
        </p>
        {reduced && (
          <button type="button" onClick={() => setStep((s) => (s >= years ? 0 : s + 1))} data-testid="dial-step" className="rounded-md border border-border px-3 py-1 text-xs text-muted hover:text-fg">
            {step >= years ? "Start again" : `Show year ${step + 1}`}
          </button>
        )}
      </div>

      <p className="mt-2 text-xs text-muted" data-testid="dial-readout">
        {initial.mode === "npv" && irrValue !== null && (
          <>
            IRR is <span className="font-mono text-fg">{pct(irrValue)}</span> — the rate where this line hits zero.{" "}
          </>
        )}
        {initial.mode === "npv" && irrValue === null && <>No IRR: the cash flows never change sign. </>}
        Rule of 72: at {pct(effectiveRate)}, money doubles in about{" "}
        <span className="font-mono text-fg">{Number.isFinite(doublingYears) ? doublingYears.toFixed(1) : "∞"}</span> years.{" "}
        {!midYear && <>A pound a year for {years} years is worth {annuityFactor(effectiveRate, years).toFixed(4)} today.</>}
      </p>

      {reduced && (
        <p className="mt-2 text-xs text-muted" data-testid="dial-diff">
          {rows
            .slice(0, shown)
            .map((r) => `Year ${r.year}: ${money(r.face, 2)} ÷ (1 + ${pct(effectiveRate)})^${midYear ? r.year - 0.5 : r.year} = ${money(r.present, 2)}`)
            .join(" · ") || "Step through to see each year discounted."}
          {initial.mode === "npv" && shown >= years && ` · Less ${money(initial.outlay, 2)} invested = ${money(netPv, 2)}.`}
        </p>
      )}

      <p className="sr-only" aria-live="polite" data-testid="dial-live">
        {initial.mode === "npv" ? "Net present value" : "Total present value"} {money(netPv, 2)} at a rate of {pct(effectiveRate)}.
      </p>
    </WidgetFrame>
  );
}
