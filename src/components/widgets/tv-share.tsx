"use client";

// How much of a DCF is the terminal value? (Loop 16). One stacked bar splitting enterprise value
// into the explicit forecast and the bit after it, with sliders for the projection length, WACC and
// terminal growth. The lesson is that the terminal value is 70–80 % of the answer and stays the
// dominant share even when you forecast for ten years — so the assumption you argue about is not
// next year's margin. Maths in `@/lib/finance/dcf`.
import { useMemo, useState } from "react";
import { dcfValue, extendProjection, terminalValueGordon } from "@/lib/finance/dcf";
import { Slider } from "./kit/slider";
import { WidgetFrame } from "./kit/widget-frame";
import { AnimatedNumber } from "./kit/animated-number";
import { StackedBar } from "./kit/stacked-bar";
import { money, mult, pct } from "./kit/fmt";

export type TvShareProps = {
  /** Explicit-period unlevered free cash flows, year 1 first. */
  cashFlows?: number[];
  wacc?: number;
  growth?: number;
  /** Final-year EBITDA, so the implied exit multiple can be shown alongside. */
  finalEbitda?: number;
  years?: number;
};

const DEFAULTS = {
  cashFlows: [81.8, 86.7, 92.4, 96.9, 102.3],
  wacc: 0.08,
  growth: 0.02,
  finalEbitda: 231.9,
  years: 5,
};

export function TvShare(props: TvShareProps) {
  const base = useMemo(
    () => ({ ...DEFAULTS, ...Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined)) }) as Required<TvShareProps>,
    [props],
  );
  const [years, setYears] = useState(base.years);
  const [wacc, setWacc] = useState(base.wacc);
  const [growth, setGrowth] = useState(base.growth);

  const result = useMemo(() => {
    if (growth >= wacc) return null;
    const flows = extendProjection(base.cashFlows, years, growth);
    const finalFcf = flows[flows.length - 1];
    const terminalValue = terminalValueGordon({ finalFcf, growth, wacc });
    const value = dcfValue({ cashFlows: flows, wacc, terminalValue });
    return { ...value, terminalValue, finalFcf, flows };
  }, [base.cashFlows, years, wacc, growth]);

  return (
    <WidgetFrame
      title="How much of this DCF is the terminal value?"
      testId="widget-tv_share"
      onReset={() => {
        setYears(base.years);
        setWacc(base.wacc);
        setGrowth(base.growth);
      }}
      notice={[
        "Drag the projection from five years to ten. Does the terminal share ever fall below half?",
        "Set growth to 3 % before touching anything else — one point moves the whole valuation.",
        "Whatever you do, most of the value sits after the forecast. That is the assumption to defend.",
      ]}
    >
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Slider label="Projection length" value={years} min={3} max={10} step={1} unit="y" onChange={setYears} testId="tv-years" />
        <Slider label="WACC" value={wacc} min={0.05} max={0.15} step={0.005} unit="%" onChange={setWacc} testId="tv-wacc" />
        <Slider label="Terminal growth" value={growth} min={0} max={0.05} step={0.005} unit="%" onChange={setGrowth} testId="tv-growth" />
      </div>

      {result ? (
        <>
          <StackedBar
            segments={[
              { label: `PV of the ${years} forecast years`, value: result.pvExplicit },
              { label: "PV of the terminal value", value: result.pvTerminal },
            ]}
            ariaLabel={`Enterprise value split: ${money(result.pvExplicit)} from the forecast, ${money(result.pvTerminal)} from the terminal value`}
          />

          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted">Enterprise value </span>
              <AnimatedNumber value={result.enterpriseValue} format={(n) => money(n)} className="font-mono font-semibold" testId="tv-ev" />
            </p>
            <p>
              <span className="text-muted">Terminal value is </span>
              <AnimatedNumber value={result.terminalShare * 100} format={(n) => `${n.toFixed(0)}%`} className="font-mono font-semibold" testId="tv-share-pct" />
              <span className="text-muted"> of it</span>
            </p>
          </div>

          <p className="mt-2 text-xs text-muted">
            Final forecast year cash flow {money(result.finalFcf, 1)} · terminal value {money(result.terminalValue)} · that is{" "}
            {mult(result.terminalValue / base.finalEbitda)} the final year&apos;s EBITDA, which is the number to sanity-check against what peers trade at.
          </p>
        </>
      ) : (
        <p className="mt-4 text-sm text-danger" data-testid="tv-broken">
          Growth of {pct(growth)} is at or above the {pct(wacc)} discount rate, so the perpetuity formula breaks — a company cannot grow faster than its cost of
          capital forever.
        </p>
      )}
    </WidgetFrame>
  );
}
