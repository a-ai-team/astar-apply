"use client";

// Football field + comps picker (Loop 15). One widget, two faces:
//   mode "field" — a horizontal bar per methodology, low → high with a median marker, against the
//                  market price. The point is that valuation is a *zone*, not a number.
//   mode "comps" — the peer table, tick and untick names and watch median and mean pull apart.
// Both faces are always reachable; `mode` only chooses which opens first. Maths in
// `@/lib/finance/comps` — this file renders, it never computes a valuation itself.
import { useMemo, useState } from "react";
import { impliedFromMultiple, mean, median, spread } from "@/lib/finance/comps";
import { cn } from "@/lib/cn";
import { Slider } from "./kit/slider";
import { WidgetFrame } from "./kit/widget-frame";
import { AnimatedNumber } from "./kit/animated-number";
import { useReducedMotion } from "./kit/use-reduced-motion";
import { money, mult, price } from "./kit/fmt";

export type FootballFieldSubject = { name: string; ebitda: number; netDebt: number; shares: number };
export type FootballFieldPeer = { name: string; evEbitda: number; growth?: number; margin?: number };
export type FootballFieldMethod = { label: string; low: number; high: number; mid?: number };

export type FootballFieldProps = {
  subject?: FootballFieldSubject;
  peers?: FootballFieldPeer[];
  /** Ranges in enterprise value (£m). Per-share is derived through the subject's bridge. */
  methods?: FootballFieldMethod[];
  currentPrice?: number;
  mode?: "field" | "comps";
  /** Whether the bars read in £m of EV or £ per share. Both are reachable in the widget. */
  display?: "ev" | "share";
};

// Marlow Instruments plc — docs/research/technicals-v2/15-valuation.md § Chapter numbers.
// Net debt is the whole bridge netted: debt 240 + IFRS 16 leases 30 − cash 60 = 210.
const DEFAULTS: Required<Omit<FootballFieldProps, "mode" | "display">> = {
  subject: { name: "Marlow Instruments plc", ebitda: 150, netDebt: 210, shares: 120 },
  peers: [
    { name: "Brantwood Sensors", evEbitda: 11.0, growth: 0.08, margin: 0.16 },
    { name: "Thornbury Optics", evEbitda: 9.0, growth: 0.04, margin: 0.157 },
    { name: "Larkfield Controls", evEbitda: 12.0, growth: 0.12, margin: 0.167 },
    { name: "Penrose Metrology", evEbitda: 8.0, growth: 0.03, margin: 0.16 },
    { name: "Halden Labs", evEbitda: 12.0, growth: 0.1, margin: 0.167 },
  ],
  methods: [
    { label: "Trading comps", low: 1200, high: 1800, mid: 1650 },
    { label: "Precedent transactions", low: 1650, high: 2100, mid: 1875 },
    { label: "DCF", low: 1250, high: 1450, mid: 1350 },
  ],
  currentPrice: 9.0,
};

/** EV ⇄ per share through the subject's bridge. */
function toShare(ev: number, s: FootballFieldSubject): number {
  return (ev - s.netDebt) / s.shares;
}
function toEv(perShare: number, s: FootballFieldSubject): number {
  return perShare * s.shares + s.netDebt;
}

const BAR_TONES = ["var(--accent)", "#6fbf8a", "#c9a227", "#8a8fbf"];

export function FootballField(props: FootballFieldProps) {
  const base = useMemo(
    () => ({ ...DEFAULTS, ...Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined)) }) as Required<Omit<FootballFieldProps, "mode" | "display">>,
    [props],
  );
  const reduced = useReducedMotion();

  const [face, setFace] = useState<"field" | "comps">(props.mode ?? "field");
  const [display, setDisplay] = useState<"ev" | "share">(props.display ?? "ev");
  const [methods, setMethods] = useState<FootballFieldMethod[]>(base.methods);
  const [shown, setShown] = useState<boolean[]>(() => base.methods.map(() => true));
  const [selected, setSelected] = useState(0);
  const [kept, setKept] = useState<boolean[]>(() => base.peers.map(() => true));
  const [noEbitda, setNoEbitda] = useState(false);

  const reset = () => {
    setMethods(base.methods);
    setShown(base.methods.map(() => true));
    setKept(base.peers.map(() => true));
    setSelected(0);
    setNoEbitda(false);
    setDisplay(props.display ?? "ev");
  };

  // --- comps face -----------------------------------------------------------------------------
  const keptMultiples = base.peers.filter((_, i) => kept[i]).map((p) => p.evEbitda);
  const med = median(keptMultiples);
  const avg = mean(keptMultiples);
  const band = spread(keptMultiples);
  const impliedMedian = med === null ? null : impliedFromMultiple({ multiple: med, metric: base.subject.ebitda, netDebt: base.subject.netDebt, shares: base.subject.shares });
  const impliedMean = avg === null ? null : impliedFromMultiple({ multiple: avg, metric: base.subject.ebitda, netDebt: base.subject.netDebt, shares: base.subject.shares });

  // --- field face -----------------------------------------------------------------------------
  // EBITDA-based methods are struck out in "negative EBITDA" mode — the lesson-5 prompt.
  const ebitdaBased = (label: string) => /comp|precedent/i.test(label);
  const visible = methods.map((m, i) => ({ ...m, i, on: shown[i] && !(noEbitda && ebitdaBased(m.label)) }));
  const live = visible.filter((m) => m.on);

  const asDisplay = (ev: number) => (display === "share" ? toShare(ev, base.subject) : ev);
  const fmtDisplay = (v: number) => (display === "share" ? price(v) : money(v));

  // `live` is rebuilt on every render, so memoising this would recompute every time anyway.
  const domain = (() => {
    const values = live.flatMap((m) => [asDisplay(m.low), asDisplay(m.high)]);
    values.push(display === "share" ? base.currentPrice : toEv(base.currentPrice, base.subject));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min || Math.abs(max) || 1) * 0.12;
    return { min: min - pad, max: max + pad };
  })();

  const x = (v: number) => ((v - domain.min) / (domain.max - domain.min)) * 100;
  const marketDisplay = display === "share" ? base.currentPrice : toEv(base.currentPrice, base.subject);

  const overlapLow = live.length ? Math.max(...live.map((m) => asDisplay(m.low))) : null;
  const overlapHigh = live.length ? Math.min(...live.map((m) => asDisplay(m.high))) : null;
  const hasOverlap = overlapLow !== null && overlapHigh !== null && overlapLow <= overlapHigh;

  const sel = methods[selected];

  return (
    <WidgetFrame
      title={face === "comps" ? `Spreading the peers: what is ${base.subject.name} worth?` : `${base.subject.name}: the valuation zone`}
      testId="widget-football_field"
      onReset={reset}
      notice={
        face === "comps"
          ? ["Untick one peer and watch the mean move further than the median — that is why bankers quote the median.", "A faster-growing peer imports a multiple the subject has not earned.", "The peer set is the argument. Everything after it is arithmetic."]
          : ["Turn a method off and the zone widens or shifts — each one is evidence, not an answer.", "Where the bars overlap is the range you can actually defend.", "The market price sitting outside every bar is a question you must be able to answer."]
      }
    >
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <div className="inline-flex rounded-md border border-border" role="group" aria-label="Widget view">
          {(["field", "comps"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFace(f)}
              aria-pressed={face === f}
              data-testid={`field-face-${f}`}
              className={cn("px-2.5 py-1 first:rounded-l-md last:rounded-r-md", face === f ? "bg-accent/15 font-medium text-fg" : "text-muted hover:text-fg")}
            >
              {f === "field" ? "Football field" : "Comps picker"}
            </button>
          ))}
        </div>
        {face === "field" && (
          <>
            <div className="inline-flex rounded-md border border-border" role="group" aria-label="Units">
              {(["ev", "share"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDisplay(d)}
                  aria-pressed={display === d}
                  data-testid={`field-display-${d}`}
                  className={cn("px-2.5 py-1 first:rounded-l-md last:rounded-r-md", display === d ? "bg-accent/15 font-medium text-fg" : "text-muted hover:text-fg")}
                >
                  {d === "ev" ? "EV (£m)" : "Per share"}
                </button>
              ))}
            </div>
            <label className="ml-auto inline-flex items-center gap-1.5 text-muted">
              <input type="checkbox" checked={noEbitda} onChange={(e) => setNoEbitda(e.target.checked)} data-testid="field-no-ebitda" className="accent-[var(--accent)]" />
              Negative EBITDA
            </label>
          </>
        )}
      </div>

      {face === "field" ? (
        <>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {methods.map((m, i) => (
              <label key={m.label} className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-1", shown[i] ? "border-border text-fg" : "border-border/60 text-muted")}>
                <input
                  type="checkbox"
                  checked={shown[i]}
                  onChange={(e) => setShown((s) => s.map((v, j) => (j === i ? e.target.checked : v)))}
                  data-testid="field-method"
                  aria-label={`Show ${m.label}`}
                  className="accent-[var(--accent)]"
                />
                {m.label}
                {noEbitda && ebitdaBased(m.label) && <span className="text-[10px] uppercase text-danger">unusable</span>}
              </label>
            ))}
          </div>

          {noEbitda && (
            <p className="mt-2 text-xs text-muted">
              With no EBITDA the multiple-based methods have nothing to multiply. Comps move to EV/Revenue or EV/ARR and the DCF carries the weight — which is exactly the TMT case.
            </p>
          )}

          <div className="mt-4 grid gap-2" data-testid="field-chart">
            {visible.map((m) => {
              const lo = asDisplay(m.low);
              const hi = asDisplay(m.high);
              const mid = m.mid === undefined ? null : asDisplay(m.mid);
              return (
                <div key={m.label} className="grid grid-cols-[8.5rem_1fr] items-center gap-2">
                  <span className={cn("truncate text-xs", m.on ? "text-fg" : "text-muted line-through")}>{m.label}</span>
                  <div className="relative h-7 rounded bg-[var(--bg)]" aria-hidden={!m.on}>
                    {m.on && (
                      <>
                        <div
                          data-testid="field-bar"
                          data-method={m.label}
                          className="absolute top-1 h-5 rounded"
                          style={{
                            left: `${x(lo)}%`,
                            width: `${Math.max(0.8, x(hi) - x(lo))}%`,
                            background: BAR_TONES[m.i % BAR_TONES.length],
                            opacity: 0.55,
                            transition: reduced ? undefined : "left 300ms ease, width 300ms ease",
                          }}
                        />
                        {mid !== null && <div className="absolute top-0.5 h-6 w-0.5 bg-[var(--fg)]" style={{ left: `${x(mid)}%`, transition: reduced ? undefined : "left 300ms ease" }} />}
                        <span className="absolute -top-0.5 text-[10px] text-muted" style={{ left: `calc(${x(hi)}% + 6px)` }}>
                          {fmtDisplay(lo)}–{fmtDisplay(hi)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* The market's own view, as a line across every bar. */}
            <div className="grid grid-cols-[8.5rem_1fr] items-center gap-2">
              <span className="truncate text-xs text-muted">Market today</span>
              <div className="relative h-5">
                <div data-testid="field-price" className="absolute inset-y-0 w-0.5 bg-danger" style={{ left: `${x(marketDisplay)}%` }} />
                <span className="absolute top-0 text-[10px] text-danger" style={{ left: `calc(${x(marketDisplay)}% + 6px)` }}>
                  {fmtDisplay(marketDisplay)}
                </span>
              </div>
            </div>
          </div>

          {/* Adjust one method's range — lesson 1 asks the reader to drag the DCF low end down. */}
          <div className="mt-4 border-t border-border pt-3">
            <label className="flex items-center gap-2 text-xs text-muted">
              Adjust
              <select
                value={selected}
                onChange={(e) => setSelected(Number(e.target.value))}
                data-testid="field-select-method"
                className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg"
              >
                {methods.map((m, i) => (
                  <option key={m.label} value={i}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <Slider
                label="Low end"
                value={sel.low}
                min={Math.round(Math.min(600, sel.low))}
                max={Math.round(sel.high)}
                step={25}
                unit="£m"
                testId="field-low"
                onChange={(v) => setMethods((ms) => ms.map((m, i) => (i === selected ? { ...m, low: Math.min(v, m.high) } : m)))}
              />
              <Slider
                label="High end"
                value={sel.high}
                min={Math.round(sel.low)}
                max={Math.round(Math.max(2600, sel.high))}
                step={25}
                unit="£m"
                testId="field-high"
                onChange={(v) => setMethods((ms) => ms.map((m, i) => (i === selected ? { ...m, high: Math.max(v, m.low) } : m)))}
              />
            </div>
          </div>

          <dl className="mt-4 grid gap-2 border-t border-border pt-3 text-sm sm:grid-cols-3" aria-live="polite">
            <div>
              <dt className="text-xs text-muted">Defensible overlap</dt>
              <dd className="font-medium" data-testid="field-overlap">
                {hasOverlap ? `${fmtDisplay(overlapLow!)} – ${fmtDisplay(overlapHigh!)}` : "None — the methods disagree"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Methods shown</dt>
              <dd className="font-medium">{live.length} of {methods.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Market vs the zone</dt>
              <dd className="font-medium">
                {hasOverlap ? (marketDisplay < overlapLow! ? "Below every method" : marketDisplay > overlapHigh! ? "Above every method" : "Inside the range") : "—"}
              </dd>
            </div>
          </dl>
        </>
      ) : (
        <>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="py-1 font-medium">Peer</th>
                <th className="py-1 text-right font-medium">EV/EBITDA</th>
                <th className="py-1 text-right font-medium">Growth</th>
                <th className="py-1 text-right font-medium">In set</th>
              </tr>
            </thead>
            <tbody>
              {base.peers.map((p, i) => (
                <tr key={p.name} data-testid="comps-peer" data-kept={kept[i]} className={cn("border-t border-border", !kept[i] && "text-muted")}>
                  <td className="py-1.5">{p.name}</td>
                  <td className="py-1.5 text-right font-mono">{mult(p.evEbitda)}</td>
                  <td className="py-1.5 text-right font-mono">{p.growth === undefined ? "—" : `${(p.growth * 100).toFixed(0)}%`}</td>
                  <td className="py-1.5 text-right">
                    <input
                      type="checkbox"
                      checked={kept[i]}
                      onChange={(e) => setKept((k) => k.map((v, j) => (j === i ? e.target.checked : v)))}
                      aria-label={`Keep ${p.name} in the peer set`}
                      className="accent-[var(--accent)]"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm sm:grid-cols-4" aria-live="polite">
            <div>
              <dt className="text-xs text-muted">Median</dt>
              <dd className="font-medium" data-testid="comps-median">
                {med === null ? "—" : <AnimatedNumber value={med} format={(n) => mult(n)} />}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Mean</dt>
              <dd className="font-medium" data-testid="comps-mean">
                {avg === null ? "—" : <AnimatedNumber value={avg} format={(n) => mult(n)} />}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Implied EV (median)</dt>
              <dd className="font-medium" data-testid="field-implied-ev">
                {impliedMedian === null ? "—" : <AnimatedNumber value={impliedMedian.enterpriseValue} format={(n) => money(n)} />}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Implied per share</dt>
              <dd className="font-medium" data-testid="field-implied-share">
                {impliedMedian?.perShare == null ? "—" : <AnimatedNumber value={impliedMedian.perShare} format={(n) => price(n)} />}
              </dd>
            </div>
          </dl>

          <p className="mt-3 text-xs text-muted">
            {med === null || avg === null || band === null || impliedMean === null || impliedMedian === null ? (
              "Keep at least one peer in the set."
            ) : (
              <>
                Range {mult(band.low)}–{mult(band.high)}, interquartile {mult(band.q1)}–{mult(band.q3)}. On the mean the implied enterprise value is{" "}
                {money(impliedMean.enterpriseValue)} — {Math.abs(impliedMedian.enterpriseValue - impliedMean.enterpriseValue) < 1 ? "the same as" : "different from"} the median.
              </>
            )}
          </p>
        </>
      )}
    </WidgetFrame>
  );
}
