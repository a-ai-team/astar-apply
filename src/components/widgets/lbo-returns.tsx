"use client";

// The LBO returns machine (Loop 18). One deal — Pennard Logistics unless the lesson says otherwise —
// with the sources & uses on one tab and the three-lever return decomposition on the other. The
// point the widget makes: leverage shrinks the cheque and magnifies the outcome, but the value
// itself comes from EBITDA growth, deleveraging and (if lucky) the exit multiple. Maths in
// `@/lib/finance/lbo`; the schedule sweeps all free cash flow against debt.
import { useMemo, useState } from "react";
import { paperLbo } from "@/lib/finance/lbo";
import { Slider } from "./kit/slider";
import { WidgetFrame } from "./kit/widget-frame";
import { AnimatedNumber } from "./kit/animated-number";
import { StackedBar } from "./kit/stacked-bar";
import { cn } from "@/lib/cn";
import { money, mult, pct } from "./kit/fmt";

export type LboReturnsProps = {
  entryEbitda?: number;
  entryMultiple?: number;
  exitMultiple?: number;
  /** Debt at entry, in turns of EBITDA. */
  leverage?: number;
  growth?: number;
  years?: number;
  fees?: number;
  /** Blended cash interest rate on the single modelled tranche. */
  blendedRate?: number;
  taxRate?: number;
  /** Flat annual D&A and capex — Pennard's are equal, so FCF is net income. */
  daAmount?: number;
  capexAmount?: number;
};

const DEFAULTS = {
  entryEbitda: 50,
  entryMultiple: 8,
  exitMultiple: 8,
  leverage: 5,
  growth: 0.05,
  years: 5,
  fees: 10,
  blendedRate: 0.06,
  taxRate: 0.25,
  daAmount: 10,
  capexAmount: 10,
};

/** The lens presets a lesson can point at: same £50m of EBITDA, different lender appetite. */
const PRESETS = {
  pennard: { label: "Pennard (logistics)" },
  tmt: { label: "SaaS take-private", leverage: 6.5, daAmount: 2, capexAmount: 2 },
  healthcare: { label: "Care roll-up", leverage: 4.5, growth: 0.07 },
} as const;

type PresetKey = keyof typeof PRESETS;

export function LboReturns(props: LboReturnsProps) {
  const base = useMemo(
    () => ({ ...DEFAULTS, ...Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined)) }) as Required<LboReturnsProps>,
    [props],
  );

  const [tab, setTab] = useState<"sources" | "returns">("returns");
  const [preset, setPreset] = useState<PresetKey>("pennard");
  const [entryMultiple, setEntryMultiple] = useState(base.entryMultiple);
  const [exitMultiple, setExitMultiple] = useState(base.exitMultiple);
  const [leverage, setLeverage] = useState(base.leverage);
  const [growth, setGrowth] = useState(base.growth);
  const [years, setYears] = useState(base.years);
  const [daAmount, setDaAmount] = useState(base.daAmount);
  const [capexAmount, setCapexAmount] = useState(base.capexAmount);

  const applyPreset = (key: PresetKey) => {
    setPreset(key);
    setEntryMultiple(base.entryMultiple);
    setExitMultiple(base.exitMultiple);
    setYears(base.years);
    const p = PRESETS[key];
    setLeverage("leverage" in p ? p.leverage : base.leverage);
    setGrowth("growth" in p ? p.growth : base.growth);
    setDaAmount("daAmount" in p ? p.daAmount : base.daAmount);
    setCapexAmount("capexAmount" in p ? p.capexAmount : base.capexAmount);
  };

  const view = useMemo(() => {
    const r = paperLbo({
      entryEbitda: base.entryEbitda,
      entryMultiple,
      exitMultiple,
      years,
      ebitdaGrowth: growth,
      taxRate: base.taxRate,
      fees: base.fees,
      daAmount,
      capexAmount,
      nwcAmount: 0,
      debtTranches: [{ name: "Debt", amount: leverage * base.entryEbitda, rate: base.blendedRate }],
    });
    const d = r.decomposition;
    const dominant =
      Math.abs(d.multipleExpansion) >= Math.max(d.ebitdaGrowth, d.deleveraging)
        ? "the exit multiple"
        : d.ebitdaGrowth >= d.deleveraging
          ? "EBITDA growth"
          : "deleveraging";
    return { r, d, dominant };
  }, [base, entryMultiple, exitMultiple, leverage, growth, years, daAmount, capexAmount]);

  const su = view.r.sourcesUses;

  return (
    <WidgetFrame
      title="Where an LBO's return actually comes from"
      testId="widget-lbo_returns"
      onReset={() => applyPreset("pennard")}
      notice={[
        "Drag leverage from 5× to 0× — MoM falls towards 1.25× while the value-created bars barely move. Leverage concentrates the return; it does not create it.",
        "Set the exit multiple to 9× and watch the multiple-expansion bar appear — about £64m of equity sponsors would call luck, not planning.",
        "Set EBITDA growth to 0 % — the deal lands nearer 1.6× than 2×, because less cash flow also means less deleveraging.",
      ]}
    >
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Deal presets">
        {(Object.keys(PRESETS) as PresetKey[]).map((key) => (
          <button
            key={key}
            type="button"
            data-testid={`lr-preset-${key}`}
            onClick={() => applyPreset(key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              preset === key ? "border-accent bg-accent/10 text-fg" : "border-border text-muted hover:text-fg",
            )}
          >
            {PRESETS[key].label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Slider label="Entry multiple" value={entryMultiple} min={5} max={12} step={0.5} unit="×" onChange={setEntryMultiple} testId="lr-entry-multiple" />
        <Slider label="Exit multiple" value={exitMultiple} min={5} max={12} step={0.5} unit="×" onChange={setExitMultiple} testId="lr-exit-multiple" />
        <Slider label="Leverage (turns of EBITDA)" value={leverage} min={0} max={7} step={0.5} unit="×" onChange={setLeverage} testId="lr-leverage-slider" />
        <Slider label="EBITDA growth" value={growth} min={0} max={0.12} step={0.005} unit="%" onChange={setGrowth} testId="lr-growth" />
        <Slider label="Hold period" value={years} min={3} max={8} step={1} unit="y" onChange={setYears} testId="lr-years" />
      </div>

      <div className="mt-4 flex gap-2" role="tablist" aria-label="View">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "sources"}
          data-testid="lr-tab-sources"
          onClick={() => setTab("sources")}
          className={cn("rounded-md border px-3 py-1 text-xs", tab === "sources" ? "border-accent text-fg" : "border-border text-muted hover:text-fg")}
        >
          Sources &amp; uses
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "returns"}
          data-testid="lr-tab-returns"
          onClick={() => setTab("returns")}
          className={cn("rounded-md border px-3 py-1 text-xs", tab === "returns" ? "border-accent text-fg" : "border-border text-muted hover:text-fg")}
        >
          Returns
        </button>
      </div>

      {tab === "sources" ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Uses — what the money buys</p>
            <ul className="mt-2 grid gap-1 text-xs">
              {su.uses.map((u) => (
                <li key={u.label} className="flex justify-between gap-2">
                  <span className="text-muted">{u.label}</span>
                  <span className="font-mono">{money(u.amount)}</span>
                </li>
              ))}
              <li className="flex justify-between gap-2 border-t border-border pt-1 font-medium">
                <span>Total uses</span>
                <span className="font-mono" data-testid="lr-total-uses">
                  {money(su.totalUses)}
                </span>
              </li>
            </ul>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Sources — where it comes from</p>
            <ul className="mt-2 grid gap-1 text-xs">
              {su.sources.map((s) => (
                <li key={s.label} className="flex justify-between gap-2">
                  <span className="text-muted">{s.label}</span>
                  <span className="font-mono" data-testid={s.label === "Sponsor equity" ? "lr-equity" : undefined}>
                    {money(s.amount)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">
              Leverage{" "}
              <span className="font-mono text-fg" data-testid="lr-leverage">
                {mult(su.leverageTurns)}
              </span>{" "}
              EBITDA · equity is the plug that makes the two sides balance.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Money multiple</p>
              <AnimatedNumber value={view.r.returns.moM} format={(n) => mult(n, 2)} className="mt-1 block font-mono text-lg font-semibold" testId="lr-mom" />
              <p className="mt-1 text-xs text-muted">
                {money(su.sponsorEquity)} in → <span className="font-mono text-fg">{money(view.r.exitEquity)}</span> out
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">IRR over {years} years</p>
              <AnimatedNumber value={view.r.returns.irr} format={(n) => pct(n)} className="mt-1 block font-mono text-lg font-semibold" testId="lr-irr" />
              <p className="mt-1 text-xs text-muted">MoM annualised — the same profit over a longer hold is a lower IRR.</p>
            </div>
          </div>

          <StackedBar
            ariaLabel="Value created by lever"
            segments={[
              { label: "EBITDA growth", value: view.d.ebitdaGrowth },
              { label: "Deleveraging", value: view.d.deleveraging },
              { label: "Multiple expansion", value: view.d.multipleExpansion },
              { label: "Fees", value: -base.fees },
            ]}
          />

          <p className="mt-3 text-sm text-muted" aria-live="polite" data-testid="lr-verdict">
            {view.d.multipleExpansion < 0 ? (
              <>
                <span className="font-medium text-danger">Multiple compression</span> is working against the deal — the other levers have to earn back{" "}
                {money(Math.abs(view.d.multipleExpansion))} before the sponsor makes anything.
              </>
            ) : (
              <>
                The biggest lever here is <span className="font-medium text-fg">{view.dominant}</span> — {money(view.d.total - base.fees)} of sponsor gain on a{" "}
                {money(su.sponsorEquity)} cheque.
              </>
            )}
          </p>
        </div>
      )}
    </WidgetFrame>
  );
}
