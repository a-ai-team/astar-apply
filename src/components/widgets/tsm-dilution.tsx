"use client";

// Treasury-stock method (Loop 14). Drag the share price and watch the dilution appear: below the
// strike the options are worthless and add nothing; above it they add shares, but only the *net*
// of what the exercise proceeds buy back. The optional convertible shows the other case — debt
// leaving the bridge and shares arriving. Maths in @/lib/finance/shares.
import { useMemo, useState } from "react";
import { ifConverted, treasuryStockMethod, type OptionGrant } from "@/lib/finance/shares";
import { cn } from "@/lib/cn";
import { Slider } from "./kit/slider";
import { WidgetFrame } from "./kit/widget-frame";
import { AnimatedNumber } from "./kit/animated-number";
import { useReducedMotion } from "./kit/use-reduced-motion";
import { money, price } from "./kit/fmt";

export type TsmDilutionProps = {
  basicShares?: number;
  options?: OptionGrant[];
  sharePrice?: number;
  convertible?: { principal: number; conversionPrice: number };
};

const shares = (n: number) => `${n.toFixed(1)}m`;

export function TsmDilution(props: TsmDilutionProps) {
  const initial = useMemo(
    () => ({
      basicShares: props.basicShares ?? 240,
      options: props.options ?? [{ count: 20, strike: 2.1 }],
      sharePrice: props.sharePrice ?? 4.2,
    }),
    [props.basicShares, props.options, props.sharePrice],
  );

  const [sharePrice, setSharePrice] = useState(initial.sharePrice);
  const [converted, setConverted] = useState(false);
  const reduced = useReducedMotion();

  const tsm = useMemo(
    () => treasuryStockMethod({ basicShares: initial.basicShares, options: initial.options, sharePrice }),
    [initial.basicShares, initial.options, sharePrice],
  );

  const conv = useMemo(
    () => (props.convertible ? ifConverted({ basicShares: 0, convertible: props.convertible, sharePrice }) : null),
    [props.convertible, sharePrice],
  );

  const convShares = converted && conv?.converts ? conv.newShares : 0;
  const diluted = tsm.dilutedShares + convShares;
  const grossNew = tsm.inTheMoney.reduce((s, o) => s + o.count, 0);
  const anyInTheMoney = tsm.inTheMoney.length > 0;
  const dilutionPct = initial.basicShares === 0 ? 0 : (diluted - initial.basicShares) / initial.basicShares;

  // The bar scale is fixed to the widest case so the columns do not rescale as the price moves.
  const maxShares = initial.basicShares + initial.options.reduce((s, o) => s + o.count, 0) + (conv?.newShares ?? 0);
  const widthOf = (n: number) => `${(n / maxShares) * 100}%`;

  const reset = () => {
    setSharePrice(initial.sharePrice);
    setConverted(false);
  };

  return (
    <WidgetFrame
      title="Diluted shares: the treasury-stock method"
      testId="widget-tsm_dilution"
      onReset={reset}
      notice={[
        `Slide the price below ${price(initial.options[0]?.strike ?? 0)} — the dilution vanishes. Out-of-the-money options add nothing.`,
        "Above the strike, the proceeds are fixed but buy back fewer shares as the price rises — so dilution grows.",
        "Find the price at which the options dilute the count by exactly 5 %.",
      ]}
    >
      <div className="mt-3">
        <Slider
          label="Share price"
          value={sharePrice}
          min={0.5}
          max={12}
          step={0.05}
          unit="£"
          onChange={setSharePrice}
          testId="tsm-price"
          valueText={(v) => `Share price ${v.toFixed(2)} pounds`}
        />
      </div>

      <div className="mt-4 grid gap-1.5">
        <div className="flex items-center gap-2">
          <span className="w-32 shrink-0 text-right text-[11px] text-muted">Basic shares</span>
          <div className="h-4 flex-1 rounded-sm bg-bg">
            <div className="h-full rounded-sm border border-border bg-accent/30" style={{ width: widthOf(initial.basicShares) }} />
          </div>
          <span className="w-16 shrink-0 font-mono text-[11px]">{shares(initial.basicShares)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-32 shrink-0 text-right text-[11px] text-muted">+ Options exercised</span>
          <div className="h-4 flex-1 rounded-sm bg-bg">
            <div
              className="h-full rounded-sm border border-border bg-accent/60"
              style={{ width: widthOf(grossNew), transition: reduced ? undefined : "width 200ms ease" }}
            />
          </div>
          <span className="w-16 shrink-0 font-mono text-[11px]">{shares(grossNew)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-32 shrink-0 text-right text-[11px] text-muted">− Bought back</span>
          <div className="h-4 flex-1 rounded-sm bg-bg">
            <div
              className="h-full rounded-sm border border-dashed border-muted bg-muted/25"
              style={{ width: widthOf(tsm.sharesRepurchased), transition: reduced ? undefined : "width 200ms ease" }}
            />
          </div>
          <span className="w-16 shrink-0 font-mono text-[11px]">{shares(tsm.sharesRepurchased)}</span>
        </div>
        {convShares > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-32 shrink-0 text-right text-[11px] text-muted">+ Convertible</span>
            <div className="h-4 flex-1 rounded-sm bg-bg">
              <div className="h-full rounded-sm border border-border bg-accent/45" style={{ width: widthOf(convShares), transition: reduced ? undefined : "width 200ms ease" }} />
            </div>
            <span className="w-16 shrink-0 font-mono text-[11px]">{shares(convShares)}</span>
          </div>
        )}
        <div className="mt-1 flex items-center gap-2 border-t border-border pt-2">
          <span className="w-32 shrink-0 text-right text-[11px] font-medium">Diluted shares</span>
          <div className="h-4 flex-1 rounded-sm bg-bg">
            <div className="h-full rounded-sm border border-accent bg-accent/70" style={{ width: widthOf(diluted), transition: reduced ? undefined : "width 200ms ease" }} />
          </div>
          <span className="w-16 shrink-0 font-mono text-[11px] font-semibold">{shares(diluted)}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <p className="text-sm" data-testid="tsm-diluted">
          <span className="text-muted">Diluted count </span>
          <span className="font-mono font-semibold">{reduced ? shares(diluted) : <AnimatedNumber value={diluted} format={shares} />}</span>
        </p>
        <p className="text-sm" data-testid="tsm-net-new">
          <span className="text-muted">Net new shares </span>
          <span className={cn("font-mono font-semibold", tsm.netNewShares > 0 ? "text-fg" : "text-muted")}>
            {reduced ? shares(tsm.netNewShares + convShares) : <AnimatedNumber value={tsm.netNewShares + convShares} format={shares} />}
          </span>
        </p>
        <p className="text-sm" data-testid="tsm-in-the-money">
          <span className="text-muted">Options </span>
          <span className={cn("font-semibold", anyInTheMoney ? "text-accent" : "text-muted")}>{anyInTheMoney ? "in the money" : "out of the money"}</span>
        </p>
      </div>

      <p className="mt-2 text-xs text-muted">
        {anyInTheMoney ? (
          <>
            Exercise brings in {money(tsm.proceeds, 1)}, which buys back {shares(tsm.sharesRepurchased)} at {price(sharePrice)}. Dilution {(dilutionPct * 100).toFixed(1)} % of the basic count.
          </>
        ) : (
          <>Nobody exercises an option to buy at {price(initial.options[0]?.strike ?? 0)} when the share costs {price(sharePrice)} — so the diluted count is just the basic count.</>
        )}
      </p>

      {props.convertible && (
        <label className="mt-3 flex items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={converted} onChange={(e) => setConverted(e.target.checked)} data-testid="tsm-convertible" className="accent-[var(--accent)]" />
          <span>
            Include the {money(props.convertible.principal)} convertible at {price(props.convertible.conversionPrice)}
            {conv?.converts ? " — in the money, so it converts: the debt leaves the bridge and the shares arrive." : " — below the conversion price, so it stays debt."}
          </span>
        </label>
      )}

      <p className="sr-only" aria-live="polite">
        {`Share price ${sharePrice.toFixed(2)} pounds. Diluted shares ${diluted.toFixed(1)} million, ${tsm.netNewShares + convShares > 0 ? `${(tsm.netNewShares + convShares).toFixed(1)} million net new` : "no dilution"}.`}
      </p>
    </WidgetFrame>
  );
}
