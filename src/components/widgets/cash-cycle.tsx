"use client";

// Cash conversion cycle (Loop 13). Three sliders — days to sell stock, days to collect from
// customers, days before you pay suppliers — over a timeline ribbon showing the gap the company has
// to fund itself. Drag DPO past DIO + DSO and the cycle goes negative: the suppliers are funding it.
// Maths in @/lib/finance/working-capital.
import { useMemo, useState } from "react";
import { workingCapitalTiedUp } from "@/lib/finance/working-capital";
import { cn } from "@/lib/cn";
import { Slider } from "./kit/slider";
import { WidgetFrame } from "./kit/widget-frame";
import { AnimatedNumber } from "./kit/animated-number";
import { useReducedMotion } from "./kit/use-reduced-motion";
import { money } from "./kit/fmt";

export type CashCycleProps = {
  dso?: number;
  dio?: number;
  dpo?: number;
  revenue?: number;
  cogs?: number;
};

const days = (n: number) => `${n.toFixed(1)} days`;

export function CashCycle(props: CashCycleProps) {
  const initial = useMemo(
    () => ({
      dso: props.dso ?? 36.5,
      dio: props.dio ?? 48.7,
      dpo: props.dpo ?? 36.5,
      revenue: props.revenue ?? 500,
      cogs: props.cogs ?? 300,
    }),
    [props.dso, props.dio, props.dpo, props.revenue, props.cogs],
  );

  const [dso, setDso] = useState(initial.dso);
  const [dio, setDio] = useState(initial.dio);
  const [dpo, setDpo] = useState(initial.dpo);
  const reduced = useReducedMotion();

  const w = useMemo(
    () => workingCapitalTiedUp({ dso, dio, dpo, revenue: initial.revenue, cogs: initial.cogs }),
    [dso, dio, dpo, initial.revenue, initial.cogs],
  );

  // The ribbon spans from buying stock to collecting cash; the scale grows with the longest run so
  // the bars never overflow when a slider is pushed to its limit.
  const span = Math.max(dio + dso, dpo, 60);
  const pctOf = (d: number) => `${(d / span) * 100}%`;
  const negative = w.ccc < 0;

  const reset = () => {
    setDso(initial.dso);
    setDio(initial.dio);
    setDpo(initial.dpo);
  };

  return (
    <WidgetFrame
      title="The cash conversion cycle"
      testId="widget-cash_cycle"
      onReset={reset}
      notice={[
        "Drag DPO past DIO + DSO — the cycle goes negative. Who is funding the business then?",
        "Working capital is money tied up: every extra day of stock or unpaid invoices is cash you cannot use.",
        "Same days, twice the revenue, twice the cash tied up — which is why growth consumes cash.",
      ]}
    >
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Slider label="Days to sell stock (DIO)" value={dio} min={0} max={120} step={0.1} onChange={setDio} testId="cycle-dio" display={days} valueText={(v) => `Days inventory outstanding ${v.toFixed(0)} days`} />
        <Slider label="Days to be paid (DSO)" value={dso} min={0} max={120} step={0.1} onChange={setDso} testId="cycle-dso" display={days} valueText={(v) => `Days sales outstanding ${v.toFixed(0)} days`} />
        <Slider label="Days before you pay (DPO)" value={dpo} min={0} max={180} step={0.1} onChange={setDpo} testId="cycle-dpo" display={days} valueText={(v) => `Days payables outstanding ${v.toFixed(0)} days`} />
      </div>

      <div className="mt-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="w-28 shrink-0 text-right text-[11px] text-muted">Stock held</span>
            <div className="h-4 flex-1 rounded-sm bg-bg">
              <div className="h-full rounded-sm border border-border bg-accent/25" style={{ width: pctOf(dio), transition: reduced ? undefined : "width 200ms ease" }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-28 shrink-0 text-right text-[11px] text-muted">Awaiting payment</span>
            <div className="h-4 flex-1 rounded-sm bg-bg">
              <div
                className="h-full rounded-sm border border-border bg-accent/50"
                style={{ width: pctOf(dso), marginLeft: pctOf(dio), transition: reduced ? undefined : "width 200ms ease, margin-left 200ms ease" }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-28 shrink-0 text-right text-[11px] text-muted">Supplier unpaid</span>
            <div className="h-4 flex-1 rounded-sm bg-bg">
              <div className="h-full rounded-sm border border-dashed border-muted bg-muted/20" style={{ width: pctOf(dpo), transition: reduced ? undefined : "width 200ms ease" }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-28 shrink-0 text-right text-[11px] font-medium">{negative ? "Suppliers fund" : "You fund"}</span>
            <div className="h-4 flex-1 rounded-sm bg-bg">
              <div
                className={cn("h-full rounded-sm", negative ? "bg-accent/70" : "bg-danger/60")}
                style={{
                  width: pctOf(Math.abs(w.ccc)),
                  marginLeft: pctOf(negative ? dio + dso : dpo),
                  transition: reduced ? undefined : "width 200ms ease, margin-left 200ms ease",
                }}
              />
            </div>
          </div>
        </div>
        <p className="mt-1 pl-30 text-[11px] text-muted">Buy stock → sell it → get paid. The supplier bar is how long you can wait before paying for it.</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <p className="text-sm" data-testid="cycle-ccc">
          <span className="text-muted">Cash conversion cycle </span>
          <span className={cn("font-mono font-semibold", negative ? "text-accent" : "text-fg")}>
            {reduced ? `${w.ccc.toFixed(1)} days` : <AnimatedNumber value={w.ccc} format={(v) => `${v.toFixed(1)} days`} />}
          </span>
        </p>
        <p className="text-sm" data-testid="cycle-tied-up">
          <span className="text-muted">Cash tied up in working capital </span>
          <span className={cn("font-mono font-semibold", w.netWorkingCapital < 0 ? "text-accent" : "text-fg")}>
            {reduced ? money(w.netWorkingCapital, 1) : <AnimatedNumber value={w.netWorkingCapital} format={(v) => money(v, 1)} />}
          </span>
        </p>
      </div>

      <p className="mt-2 text-xs text-muted">
        Receivables {money(w.receivables, 1)} + inventory {money(w.inventory, 1)} − payables {money(w.payables, 1)}, on revenue {money(initial.revenue)} and COGS {money(initial.cogs)}.
      </p>

      <p className="sr-only" aria-live="polite">
        {`Cycle ${w.ccc.toFixed(0)} days, ${negative ? "funded by suppliers" : "funded by the company"}. Working capital ${w.netWorkingCapital.toFixed(0)} million pounds.`}
      </p>
    </WidgetFrame>
  );
}
