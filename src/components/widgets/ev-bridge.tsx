"use client";

// EV bridge widget (Loop 03 reference widget, rebuilt on the Loop 11 kit). Sliders for each
// balance-sheet input drive an animated waterfall from equity value to enterprise value. The maths
// now lives in `@/lib/finance/bridge` so the same numbers grade `fill_numbers` answers.
// Pure client state; no persistence. Rendered output and test ids are unchanged from Loop 03.
import { useMemo, useState } from "react";
import { computeBridge, type BridgeInputs } from "@/lib/finance/bridge";
import { Slider } from "./kit/slider";
import { WidgetFrame } from "./kit/widget-frame";
import { Waterfall, type WaterfallRow } from "./kit/waterfall";
import { money } from "./kit/fmt";

export type EvBridgeProps = {
  company?: string;
  share_price?: number;
  diluted_shares?: number; // millions
  debt?: number; // £m
  cash?: number;
  preferred?: number;
  nci?: number;
  leases?: number;
};

type Inputs = BridgeInputs;

const DEFAULTS: Inputs = { share_price: 4.2, diluted_shares: 250, debt: 500, cash: 120, preferred: 30, nci: 25, leases: 45 };

const SLIDERS: { key: keyof Inputs; label: string; min: number; max: number; step: number; unit: "£" | "m" | "£m" }[] = [
  { key: "share_price", label: "Share price", min: 0.5, max: 20, step: 0.1, unit: "£" },
  { key: "diluted_shares", label: "Diluted shares", min: 10, max: 1000, step: 5, unit: "m" },
  { key: "debt", label: "Debt", min: 0, max: 2000, step: 10, unit: "£m" },
  { key: "cash", label: "Cash", min: 0, max: 2000, step: 10, unit: "£m" },
  { key: "preferred", label: "Preferred shares", min: 0, max: 300, step: 5, unit: "£m" },
  { key: "nci", label: "Non-controlling interest", min: 0, max: 300, step: 5, unit: "£m" },
  { key: "leases", label: "Lease liabilities", min: 0, max: 300, step: 5, unit: "£m" },
];

export { computeBridge };

export function EvBridge(props: EvBridgeProps) {
  const initial = useMemo<Inputs>(() => ({ ...DEFAULTS, ...Object.fromEntries(Object.entries(props).filter(([k, v]) => k !== "company" && typeof v === "number")) }), [props]);
  const [inputs, setInputs] = useState<Inputs>(initial);
  const { eqv, netDebt, ev } = computeBridge(inputs);

  // Every step is shown even at zero, so the shape of the bridge stays constant as sliders move.
  const steps: { label: string; delta: number }[] = [
    { label: "+ Debt", delta: inputs.debt },
    { label: "− Cash", delta: -inputs.cash },
    { label: "+ Preferred", delta: inputs.preferred },
    { label: "+ NCI", delta: inputs.nci },
    { label: "+ Leases", delta: inputs.leases },
  ];
  let running = eqv;
  const rows: WaterfallRow[] = [
    { label: "Equity value", value: eqv, kind: "start", running: eqv },
    ...steps.map((s) => {
      running += s.delta;
      return { label: s.label, value: s.delta, kind: s.delta >= 0 ? ("add" as const) : ("subtract" as const), running };
    }),
    { label: "Enterprise value", value: ev, kind: "end", running: ev },
  ];

  return (
    <WidgetFrame title={`${props.company ?? "Your company"} — equity value to enterprise value`} testId="widget-ev-bridge" onReset={() => setInputs(initial)}>
      <Waterfall rows={rows} ariaLabel={`Bridge from equity value ${money(eqv)} to enterprise value ${money(ev)}`} />
      <div className="mt-2 grid gap-1 text-sm sm:grid-cols-3">
        <p>
          Equity value{" "}
          <span className="font-mono font-semibold" data-testid="ev-bridge-eqv">
            {money(eqv)}
          </span>
        </p>
        <p>
          Net debt{" "}
          <span className="font-mono font-semibold" data-testid="ev-bridge-net-debt">
            {money(netDebt)}
          </span>
        </p>
        <p>
          Enterprise value{" "}
          <span className="font-mono font-semibold" data-testid="ev-bridge-ev">
            {money(ev)}
          </span>
        </p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {SLIDERS.map((s) => (
          <Slider
            key={s.key}
            label={s.label}
            value={inputs[s.key]}
            min={s.min}
            max={s.max}
            step={s.step}
            unit={s.unit}
            onChange={(v) => setInputs((prev) => ({ ...prev, [s.key]: v }))}
            testId={`ev-bridge-${s.key}`}
          />
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">
        {ev < eqv ? "Net cash: enterprise value is below equity value." : ev > eqv ? "Net debt and other claims lift enterprise value above equity value." : "No net claims — EV equals equity value."}
      </p>
    </WidgetFrame>
  );
}
