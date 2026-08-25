"use client";

// EV bridge widget (Loop 03 reference widget). Sliders for each balance-sheet input drive an
// animated waterfall from equity value to enterprise value. Pure client state; no persistence.
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";

export type EvBridgeProps = {
  company?: string;
  share_price?: number;
  diluted_shares?: number; // millions
  debt?: number;           // £m
  cash?: number;
  preferred?: number;
  nci?: number;
  leases?: number;
};

type Inputs = Required<Omit<EvBridgeProps, "company">>;

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

export function computeBridge(i: Inputs) {
  const eqv = i.share_price * i.diluted_shares;
  const netDebt = i.debt - i.cash;
  const ev = eqv + netDebt + i.preferred + i.nci + i.leases;
  return { eqv, netDebt, ev };
}

const fmt = (n: number) => `${n < 0 ? "−" : ""}£${Math.abs(Math.round(n)).toLocaleString("en-GB")}m`;

export function EvBridge(props: EvBridgeProps) {
  const initial = useMemo<Inputs>(() => ({ ...DEFAULTS, ...Object.fromEntries(Object.entries(props).filter(([k, v]) => k !== "company" && typeof v === "number")) }), [props]);
  const [inputs, setInputs] = useState<Inputs>(initial);
  const { eqv, netDebt, ev } = computeBridge(inputs);

  // Waterfall: bars are [label, delta, running total after]. Net debt can be negative.
  const bars: { label: string; delta: number; total: boolean }[] = [
    { label: "Equity value", delta: eqv, total: true },
    { label: "+ Debt", delta: inputs.debt, total: false },
    { label: "− Cash", delta: -inputs.cash, total: false },
    { label: "+ Preferred", delta: inputs.preferred, total: false },
    { label: "+ NCI", delta: inputs.nci, total: false },
    { label: "+ Leases", delta: inputs.leases, total: false },
    { label: "Enterprise value", delta: ev, total: true },
  ];
  let running = 0;
  const segments = bars.map((b) => {
    const start = b.total ? 0 : running;
    const end = b.total ? b.delta : running + b.delta;
    running = b.total ? b.delta : end;
    return { ...b, lo: Math.min(start, end), hi: Math.max(start, end) };
  });
  const maxY = Math.max(1, ...segments.map((s) => s.hi));
  const minY = Math.min(0, ...segments.map((s) => s.lo));
  const W = 640, H = 240, padL = 10, padB = 34, padT = 20;
  const plotH = H - padB - padT;
  const y = (v: number) => padT + plotH - ((v - minY) / (maxY - minY)) * plotH;
  const colW = (W - padL * 2) / segments.length;

  return (
    <div className="rounded-lg border border-border bg-surface p-4" data-testid="widget-ev-bridge">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium">{props.company ?? "Your company"} — equity value to enterprise value</p>
        <button type="button" className="text-xs text-muted hover:text-fg" onClick={() => setInputs(initial)}>Reset</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 h-auto w-full" role="img" aria-label={`Bridge from equity value ${fmt(eqv)} to enterprise value ${fmt(ev)}`}>
        <line x1={padL} x2={W - padL} y1={y(0)} y2={y(0)} stroke="var(--border)" />
        {segments.map((s, i) => {
          const x = padL + i * colW + colW * 0.15;
          const w = colW * 0.7;
          const top = y(s.hi), bottom = y(s.lo);
          const fill = s.total ? "var(--accent)" : s.delta >= 0 ? "#6fbf8a" : "var(--danger)";
          return (
            <g key={s.label}>
              <rect x={x} y={top} width={w} height={Math.max(1, bottom - top)} fill={fill} rx={3} style={{ transition: "y 300ms ease, height 300ms ease" }} />
              <text x={x + w / 2} y={top - 5} textAnchor="middle" fontSize="11" fill="var(--fg)" style={{ transition: "y 300ms ease" }}>{fmt(s.delta)}</text>
              <text x={x + w / 2} y={H - padB + 16} textAnchor="middle" fontSize="10" fill="var(--muted)">{s.label}</text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 grid gap-1 text-sm sm:grid-cols-3">
        <p>Equity value <span className="font-mono font-semibold" data-testid="ev-bridge-eqv">{fmt(eqv)}</span></p>
        <p>Net debt <span className="font-mono font-semibold" data-testid="ev-bridge-net-debt">{fmt(netDebt)}</span></p>
        <p>Enterprise value <span className="font-mono font-semibold" data-testid="ev-bridge-ev">{fmt(ev)}</span></p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {SLIDERS.map((s) => (
          <label key={s.key} className="flex flex-col gap-1 text-xs text-muted">
            <span className="flex justify-between">
              <span>{s.label}</span>
              <span className={cn("font-mono text-fg")}>
                {s.unit === "£" ? `£${inputs[s.key].toFixed(2)}` : s.unit === "m" ? `${inputs[s.key]}m` : fmt(inputs[s.key])}
              </span>
            </span>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={inputs[s.key]}
              onChange={(e) => setInputs((prev) => ({ ...prev, [s.key]: Number(e.target.value) }))}
              data-testid={`ev-bridge-${s.key}`}
              className="accent-[var(--accent)]"
            />
          </label>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">
        {ev < eqv ? "Net cash: enterprise value is below equity value." : ev > eqv ? "Net debt and other claims lift enterprise value above equity value." : "No net claims — EV equals equity value."}
      </p>
    </div>
  );
}
