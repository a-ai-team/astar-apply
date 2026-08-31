"use client";

// The two terminal-value methods, side by side, with both cross-checks (Loop 16). Each method
// implies the other: a growth rate implies an exit multiple and a multiple implies a growth rate.
// Running both is how you catch a terminal assumption that looks reasonable on one measure and
// absurd on the other. Maths in `@/lib/finance/dcf`.
import { useMemo, useState } from "react";
import { impliedExitMultiple, impliedGrowth, terminalValueExitMultiple, terminalValueGordon } from "@/lib/finance/dcf";
import { Slider } from "./kit/slider";
import { WidgetFrame } from "./kit/widget-frame";
import { AnimatedNumber } from "./kit/animated-number";
import { cn } from "@/lib/cn";
import { money, mult, pct } from "./kit/fmt";

export type GordonVsExitProps = {
  /** Final explicit-year unlevered free cash flow — the perpetuity grows from this. */
  finalFcf?: number;
  finalEbitda?: number;
  wacc?: number;
  growth?: number;
  exitMultiple?: number;
};

const DEFAULTS = {
  finalFcf: 102.3,
  finalEbitda: 231.9,
  wacc: 0.08,
  growth: 0.02,
  exitMultiple: 8.5,
};

/** Within 2 % is "the same answer" for a terminal value — closer than the inputs deserve. */
const AGREEMENT = 0.02;

export function GordonVsExit(props: GordonVsExitProps) {
  const base = useMemo(
    () => ({ ...DEFAULTS, ...Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined)) }) as Required<GordonVsExitProps>,
    [props],
  );
  const [growth, setGrowth] = useState(base.growth);
  const [multiple, setMultiple] = useState(base.exitMultiple);

  const view = useMemo(() => {
    const broken = growth >= base.wacc;
    const tvGordon = broken ? null : terminalValueGordon({ finalFcf: base.finalFcf, growth, wacc: base.wacc });
    const tvExit = terminalValueExitMultiple({ finalEbitda: base.finalEbitda, multiple });
    return {
      broken,
      tvGordon,
      tvExit,
      // Each method's cross-check: what would the *other* method have to assume to agree?
      impliedMultiple: tvGordon === null ? null : impliedExitMultiple({ tv: tvGordon, finalEbitda: base.finalEbitda }),
      impliedG: impliedGrowth({ tv: tvExit, finalFcf: base.finalFcf, wacc: base.wacc }),
      agree: tvGordon !== null && Math.abs(tvGordon - tvExit) / tvExit < AGREEMENT,
    };
  }, [base.finalFcf, base.finalEbitda, base.wacc, growth, multiple]);

  return (
    <WidgetFrame
      title="Two ways to a terminal value — and what each one implies"
      testId="widget-gordon_vs_exit"
      onReset={() => {
        setGrowth(base.growth);
        setMultiple(base.exitMultiple);
      }}
      notice={[
        "Find the growth rate at which the two methods agree. That is the rate your exit multiple is really assuming.",
        "Push the exit multiple to 12×. Read the implied growth rate and ask whether you would defend it out loud.",
        "Terminal growth cannot exceed long-run GDP — much above 3 % and the company eventually outgrows the economy.",
      ]}
    >
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Slider label="Terminal growth (Gordon)" value={growth} min={0} max={0.05} step={0.001} unit="%" onChange={setGrowth} testId="gve-growth" />
        <Slider label="Exit multiple (EV/EBITDA)" value={multiple} min={4} max={16} step={0.1} unit="×" onChange={setMultiple} testId="gve-multiple" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className={cn("rounded-lg border p-3", view.agree ? "border-accent bg-accent/5" : "border-border")}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Perpetuity growth</p>
          {view.tvGordon === null ? (
            <p className="mt-1 text-sm text-danger" data-testid="gve-tv-gordon">
              g ≥ WACC — the formula breaks
            </p>
          ) : (
            <>
              <AnimatedNumber value={view.tvGordon} format={(n) => money(n)} className="mt-1 block font-mono text-lg font-semibold" testId="gve-tv-gordon" />
              <p className="mt-1 text-xs text-muted">
                {money(base.finalFcf, 1)} × {(1 + growth).toFixed(3)} ÷ ({pct(base.wacc)} − {pct(growth)})
              </p>
              <p className="mt-2 text-xs">
                <span className="text-muted">Implies an exit multiple of </span>
                <span className="font-mono font-medium" data-testid="gve-implied-multiple">
                  {mult(view.impliedMultiple ?? 0)}
                </span>
              </p>
            </>
          )}
        </div>

        <div className={cn("rounded-lg border p-3", view.agree ? "border-accent bg-accent/5" : "border-border")}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Exit multiple</p>
          <AnimatedNumber value={view.tvExit} format={(n) => money(n)} className="mt-1 block font-mono text-lg font-semibold" testId="gve-tv-exit" />
          <p className="mt-1 text-xs text-muted">
            {mult(multiple)} × {money(base.finalEbitda, 1)} of final-year EBITDA
          </p>
          <p className="mt-2 text-xs">
            <span className="text-muted">Implies perpetual growth of </span>
            <span className={cn("font-mono font-medium", view.impliedG > 0.035 && "text-danger")} data-testid="gve-implied-g">
              {pct(view.impliedG)}
            </span>
          </p>
        </div>
      </div>

      <p className="mt-3 text-sm" aria-live="polite" data-testid="gve-verdict">
        {view.agree ? (
          <span className="font-medium text-accent">The two methods agree — that is the cross-check passing.</span>
        ) : view.impliedG > 0.035 ? (
          <span className="text-muted">
            That multiple assumes <span className="text-danger">{pct(view.impliedG)}</span> growth forever — above long-run GDP, so expect to be challenged on it.
          </span>
        ) : (
          <span className="text-muted">The methods disagree. Neither is wrong; you would quote both and explain the gap.</span>
        )}
      </p>
    </WidgetFrame>
  );
}
