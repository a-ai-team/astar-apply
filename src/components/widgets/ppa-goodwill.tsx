"use client";

// Purchase price allocation in one screen (Loop 17, stretch). Goodwill is a residual: price less
// the fair value of what you can actually name. Rendered behind a "Going deeper" reveal inside
// lesson 4 — PPA beyond this is deferred to the cheat sheet. Maths in `@/lib/finance/merger`.
import { useMemo, useState } from "react";
import { goodwill } from "@/lib/finance/merger";
import { Slider } from "./kit/slider";
import { WidgetFrame } from "./kit/widget-frame";
import { AnimatedNumber } from "./kit/animated-number";
import { money, pct } from "./kit/fmt";

export type PpaGoodwillProps = {
  purchasePrice?: number;
  /** The target's book net assets before any fair-value work. */
  bookEquity?: number;
  /** Fair-value uplift on identifiable assets (brands, customer lists, PP&E). */
  writeUps?: number;
  /** Rate for the deferred-tax liability the write-ups create when the toggle is on. */
  taxRate?: number;
};

const DEFAULTS = {
  purchasePrice: 500,
  bookEquity: 220,
  writeUps: 60,
  taxRate: 0.25,
};

export function PpaGoodwill(props: PpaGoodwillProps) {
  const base = useMemo(
    () => ({ ...DEFAULTS, ...Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined)) }) as Required<PpaGoodwillProps>,
    [props],
  );
  const [purchasePrice, setPurchasePrice] = useState(base.purchasePrice);
  const [writeUps, setWriteUps] = useState(base.writeUps);
  const [withDtl, setWithDtl] = useState(false);

  const view = useMemo(
    () => goodwill({ purchasePrice, bookEquity: base.bookEquity, writeUps, dtlRate: withDtl ? base.taxRate : 0 }),
    [purchasePrice, base.bookEquity, base.taxRate, writeUps, withDtl],
  );

  return (
    <details data-testid="pg-reveal" className="group">
      <summary className="cursor-pointer list-none rounded-lg border border-border px-4 py-3 text-sm text-muted transition-colors hover:text-fg group-open:mb-3">
        <span aria-hidden className="mr-2 inline-block transition-transform group-open:rotate-90">
          ▸
        </span>
        Going deeper: purchase price allocation
      </summary>
      <WidgetFrame
        title="Where the purchase price lands on the balance sheet"
        testId="widget-ppa_goodwill"
        onReset={() => {
          setPurchasePrice(base.purchasePrice);
          setWriteUps(base.writeUps);
          setWithDtl(false);
        }}
        notice={[
          "Write the assets up further and goodwill falls pound for pound — it is the residual after everything you can name.",
          "Turn the DTL on: taxing the write-ups shrinks identifiable net assets, so the goodwill plug grows to fill the gap.",
          "Push the price up £100m with nothing else changed. All of it lands in goodwill — that is what overpaying looks like on a balance sheet.",
        ]}
      >
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Slider label="Purchase price (equity)" value={purchasePrice} min={300} max={800} step={5} unit="£m" onChange={setPurchasePrice} testId="pg-price" />
          <Slider label="Fair-value write-ups" value={writeUps} min={0} max={150} step={5} unit="£m" onChange={setWriteUps} testId="pg-write-ups" />
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={withDtl} onChange={(e) => setWithDtl(e.target.checked)} data-testid="pg-dtl" className="accent-[var(--accent)]" />
          Recognise a deferred-tax liability on the write-ups ({pct(base.taxRate, 0)})
        </label>

        <div className="mt-4 rounded-lg border border-border p-3">
          <dl className="grid gap-1.5 text-xs">
            <div className="flex justify-between">
              <dt className="text-muted">Book net assets</dt>
              <dd className="font-mono">{money(base.bookEquity)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">+ Fair-value write-ups</dt>
              <dd className="font-mono">{money(writeUps)}</dd>
            </div>
            {withDtl && (
              <div className="flex justify-between">
                <dt className="text-muted">− Deferred-tax liability created</dt>
                <dd className="font-mono" data-testid="pg-dtl-value">
                  {money(view.dtl)}
                </dd>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-1.5">
              <dt className="text-muted">Identifiable net assets, fair value</dt>
              <dd className="font-mono" data-testid="pg-identifiable">
                {money(view.identifiableNetAssets)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-fg">Goodwill — the plug to {money(purchasePrice)}</dt>
              <dd>
                <AnimatedNumber value={view.goodwill} format={(n) => money(n)} className="font-mono text-base font-semibold text-accent" testId="pg-goodwill" />
              </dd>
            </div>
          </dl>
        </div>

        <p className="mt-3 text-xs text-muted" aria-live="polite">
          The write-ups are not free: they depreciate and amortise through future income statements, and the DTL unwinds as those charges are booked — goodwill itself is never
          amortised under IFRS, only tested for impairment.
        </p>
      </WidgetFrame>
    </details>
  );
}
