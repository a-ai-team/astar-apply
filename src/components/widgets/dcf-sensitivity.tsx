"use client";

// DCF sensitivity grid (Loop 11 reference widget). Two sliders, a 5 × 5 grid of value per share
// around them. The lesson is in the corner cells: as growth approaches WACC the value runs away,
// which is why a DCF is presented as a range. Maths in `@/lib/finance/dcf`.
import { useMemo, useState } from "react";
import { dcfValue, sensitivityGrid, terminalValueGordon } from "@/lib/finance/dcf";
import { Slider } from "./kit/slider";
import { WidgetFrame } from "./kit/widget-frame";
import { AnimatedNumber } from "./kit/animated-number";
import { Heatmap } from "./kit/heatmap";
import { pct, price } from "./kit/fmt";

export type DcfSensitivityProps = {
  /** Explicit-period unlevered free cash flows, year 1 first. */
  cashFlows?: number[];
  /** Final-year FCF that the Gordon terminal value grows from. */
  finalFcf?: number;
  netDebt?: number;
  shares?: number;
  wacc?: number;
  growth?: number;
};

const DEFAULTS = {
  cashFlows: [42, 47, 52, 57, 62],
  finalFcf: 62,
  netDebt: 380,
  shares: 250,
  wacc: 0.09,
  growth: 0.02,
};

/** Five steps centred on the reader's value, 0.5 pp apart, never below 0.5 %. */
function band(centre: number, stepPp = 0.005): number[] {
  return [-2, -1, 0, 1, 2].map((i) => Math.max(0.005, Number((centre + i * stepPp).toFixed(4))));
}

export function DcfSensitivity(props: DcfSensitivityProps) {
  const base = useMemo(() => ({ ...DEFAULTS, ...Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined)) }) as Required<DcfSensitivityProps>, [props]);
  const [wacc, setWacc] = useState(base.wacc);
  const [growth, setGrowth] = useState(base.growth);

  const waccs = band(wacc);
  const growths = band(growth);

  const cells = useMemo(
    () => sensitivityGrid({ waccs, growths, cashFlows: base.cashFlows, finalFcf: base.finalFcf, netDebt: base.netDebt, dilutedShares: base.shares }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wacc, growth, base.cashFlows, base.finalFcf, base.netDebt, base.shares],
  );

  const current = useMemo(() => {
    if (growth >= wacc) return null;
    const tv = terminalValueGordon({ finalFcf: base.finalFcf, growth, wacc });
    const { enterpriseValue, terminalShare } = dcfValue({ cashFlows: base.cashFlows, wacc, terminalValue: tv });
    return { perShare: (enterpriseValue - base.netDebt) / base.shares, terminalShare };
  }, [wacc, growth, base.cashFlows, base.finalFcf, base.netDebt, base.shares]);

  return (
    <WidgetFrame
      title="What is this DCF actually sensitive to?"
      testId="widget-dcf_sensitivity"
      onReset={() => {
        setWacc(base.wacc);
        setGrowth(base.growth);
      }}
      notice={["Move growth up towards WACC and watch the top-right corner run away.", "Half a percentage point on either input moves the value more than a year of forecasting does.", "This is why bankers show a range, not a number."]}
    >
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Slider label="WACC" value={wacc} min={0.05} max={0.15} step={0.005} unit="%" onChange={setWacc} testId="dcf-sens-wacc" />
        <Slider label="Terminal growth" value={growth} min={0} max={0.05} step={0.005} unit="%" onChange={setGrowth} testId="dcf-sens-growth" />
      </div>

      <p className="mt-3 text-sm" data-testid="dcf-sens-current">
        At {pct(wacc)} WACC and {pct(growth)} growth:{" "}
        {current ? (
          <>
            <AnimatedNumber value={current.perShare} format={price} className="font-mono font-semibold" testId="dcf-sens-value" />
            <span className="text-muted"> per share · terminal value is {pct(current.terminalShare, 0)} of it.</span>
          </>
        ) : (
          <span className="text-danger">growth is at or above WACC, so the formula breaks.</span>
        )}
      </p>

      <Heatmap
        cells={cells}
        rowLabels={waccs.map((w) => pct(w))}
        colLabels={growths.map((g) => pct(g))}
        rowTitle="WACC"
        colTitle="g"
        format={price}
        highlight={{ row: 2, col: 2 }}
        ariaLabel="Value per share by WACC and terminal growth rate"
      />
    </WidgetFrame>
  );
}
