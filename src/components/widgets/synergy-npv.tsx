"use client";

// Synergies against the premium (Loop 17). The deal test in one picture: the premium is what the
// buyer hands the seller's shareholders on day one; the synergy NPV is what it hopes to get back.
// Ramp years are modelled explicitly, then the run rate is capitalised as a perpetuity — maths in
// `@/lib/finance/merger`, integration cost taxed like every other line.
import { useMemo, useState } from "react";
import { synergyPerpetuityNpv } from "@/lib/finance/merger";
import { Slider } from "./kit/slider";
import { WidgetFrame } from "./kit/widget-frame";
import { AnimatedNumber } from "./kit/animated-number";
import { cn } from "@/lib/cn";
import { money } from "./kit/fmt";

export type SynergyNpvProps = {
  /** Pre-tax annual synergies once fully phased in. */
  runRate?: number;
  phaseInYears?: number;
  /** One-off cost to achieve, taken in year 1. */
  integrationCost?: number;
  discountRate?: number;
  taxRate?: number;
  /** The premium paid over the target's undisturbed value — the bar to clear. */
  premium?: number;
};

const DEFAULTS = {
  runRate: 20,
  phaseInYears: 2,
  integrationCost: 20,
  discountRate: 0.08,
  taxRate: 0.25,
  premium: 100,
};

export function SynergyNpv(props: SynergyNpvProps) {
  const base = useMemo(
    () => ({ ...DEFAULTS, ...Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined)) }) as Required<SynergyNpvProps>,
    [props],
  );
  const [runRate, setRunRate] = useState(base.runRate);
  const [phaseInYears, setPhaseInYears] = useState(base.phaseInYears);
  const [integrationCost, setIntegrationCost] = useState(base.integrationCost);
  const [discountRate, setDiscountRate] = useState(base.discountRate);

  const view = useMemo(() => {
    const { npv } = synergyPerpetuityNpv({ annualSynergies: runRate, phaseInYears, integrationCost, discountRate, taxRate: base.taxRate });
    const scale = Math.max(npv, base.premium, 1);
    return { npv, covered: npv >= base.premium, npvWidth: Math.max(0, (npv / scale) * 100), premiumWidth: (base.premium / scale) * 100 };
  }, [runRate, phaseInYears, integrationCost, discountRate, base.taxRate, base.premium]);

  return (
    <WidgetFrame
      title="Do the synergies cover the premium?"
      testId="widget-synergy_npv"
      onReset={() => {
        setRunRate(base.runRate);
        setPhaseInYears(base.phaseInYears);
        setIntegrationCost(base.integrationCost);
        setDiscountRate(base.discountRate);
      }}
      notice={[
        "Lower the run rate until the synergy bar just covers the premium — it happens at about £12–13m pre-tax, well under the £20m claimed.",
        "Double the phase-in to four years and watch the NPV fall — delay is expensive when the value sits in a perpetuity.",
        "Push the discount rate to 12 %. If the deal only works at 8 %, the synergy case is riskier than the announcement admits.",
      ]}
    >
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Slider label="Run-rate synergies (pre-tax)" value={runRate} min={0} max={40} step={0.5} unit="£m" onChange={setRunRate} testId="sn-run-rate" />
        <Slider label="Years to phase in" value={phaseInYears} min={1} max={6} step={1} unit="y" onChange={setPhaseInYears} testId="sn-phase-in" />
        <Slider label="One-off integration cost" value={integrationCost} min={0} max={60} step={1} unit="£m" onChange={setIntegrationCost} testId="sn-cost" />
        <Slider label="Discount rate" value={discountRate} min={0.04} max={0.15} step={0.0025} unit="%" onChange={setDiscountRate} testId="sn-discount" />
      </div>

      <div className="mt-4 grid gap-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-32 shrink-0 text-muted">Synergy NPV (after tax)</span>
          <span className="h-5 flex-1 overflow-hidden rounded-md bg-border/40">
            <span
              aria-hidden
              className={cn("block h-full rounded-md transition-all duration-300", view.covered ? "bg-[var(--accent)]" : "bg-[var(--danger)]")}
              style={{ width: `${view.npvWidth}%` }}
            />
          </span>
          <AnimatedNumber value={view.npv} format={(n) => money(n)} className={cn("w-16 text-right font-mono", view.covered ? "text-accent" : "text-danger")} testId="sn-npv" />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-32 shrink-0 text-muted">Premium paid</span>
          <span className="h-5 flex-1 overflow-hidden rounded-md bg-border/40">
            <span aria-hidden className="block h-full rounded-md bg-[var(--muted)] transition-all duration-300" style={{ width: `${view.premiumWidth}%` }} />
          </span>
          <span className="w-16 text-right font-mono text-fg">{money(base.premium)}</span>
        </div>
      </div>

      <p className="mt-3 text-sm" aria-live="polite" data-testid="sn-verdict">
        {view.covered ? (
          <span className="text-muted">
            <span className="font-medium text-accent">The maths works</span> — the synergies are worth {money(view.npv)} against a {money(base.premium)} premium, so the buyer
            keeps the difference.
          </span>
        ) : (
          <span className="text-muted">
            <span className="font-medium text-danger">The premium is not covered</span> — the buyer has handed the seller more than the synergies are worth, and the gap is the
            value destroyed.
          </span>
        )}
      </p>
    </WidgetFrame>
  );
}
