"use client";

// IFRS 16 leases and the EV bridge (Loop 14). One toggle, and *both* sides of the multiple move:
// capitalising takes the rent out of operating costs (EBITDA up) and puts a lease liability into
// the bridge (EV up). The multiple barely shifts — so the only real error is treating the company
// one way and its comparables the other. Maths in @/lib/finance/bridge.
import { useMemo, useState } from "react";
import { leaseView, type LeaseInputs } from "@/lib/finance/bridge";
import { cn } from "@/lib/cn";
import { WidgetFrame } from "./kit/widget-frame";
import { AnimatedNumber } from "./kit/animated-number";
import { useReducedMotion } from "./kit/use-reduced-motion";
import { money, mult } from "./kit/fmt";

export type LeaseToggleProps = {
  ebitda?: number;
  ebit?: number;
  debt?: number;
  cash?: number;
  leaseAsset?: number;
  leaseLiability?: number;
  annualRent?: number;
  /** Additive defaults so the bridge can reach an enterprise value; Harbourline's figures. */
  equityValue?: number;
  preferred?: number;
  nci?: number;
};

export function LeaseToggle(props: LeaseToggleProps) {
  const inputs: LeaseInputs = useMemo(
    () => ({
      ebitda: props.ebitda ?? 170,
      ebit: props.ebit ?? 120,
      equityValue: props.equityValue ?? 1050,
      debt: props.debt ?? 500,
      cash: props.cash ?? 120,
      preferred: props.preferred ?? 30,
      nci: props.nci ?? 25,
      leaseLiability: props.leaseLiability ?? 45,
      annualRent: props.annualRent ?? 12,
    }),
    [props.ebitda, props.ebit, props.equityValue, props.debt, props.cash, props.preferred, props.nci, props.leaseLiability, props.annualRent],
  );

  const [capitalised, setCapitalised] = useState(true);
  const reduced = useReducedMotion();

  const on = useMemo(() => leaseView(inputs, true), [inputs]);
  const off = useMemo(() => leaseView(inputs, false), [inputs]);
  const view = capitalised ? on : off;
  const leaseAsset = props.leaseAsset ?? inputs.leaseLiability;

  const rows: { label: string; on: string; off: string; highlight?: boolean }[] = [
    { label: "EBITDA", on: money(on.ebitda), off: money(off.ebitda), highlight: true },
    { label: "EBIT", on: money(on.ebit), off: money(off.ebit) },
    { label: "Lease liability in the bridge", on: money(inputs.leaseLiability), off: money(0), highlight: true },
    { label: "Enterprise value", on: money(on.ev), off: money(off.ev), highlight: true },
    { label: "EV / EBITDA", on: mult(on.evEbitda), off: mult(off.evEbitda), highlight: true },
  ];

  return (
    <WidgetFrame
      title="IFRS 16: capitalising leases moves both sides"
      testId="widget-lease_toggle"
      onReset={() => setCapitalised(true)}
      notice={[
        `Toggle it off: EBITDA falls by ${money(inputs.annualRent)} and EV falls by ${money(inputs.leaseLiability)} — does the multiple rise or fall?`,
        "EBIT barely moves: the rent is simply replaced by depreciation of the right-of-use asset.",
        "The multiple shifts far less than either input, because the numerator and denominator move together.",
      ]}
    >
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={capitalised}
          onChange={(e) => setCapitalised(e.target.checked)}
          data-testid="lease-capitalise"
          aria-label="Capitalise leases under IFRS 16"
          className="accent-[var(--accent)]"
        />
        <span>
          Capitalise leases (IFRS 16)
          <span className="ml-2 text-xs text-muted">
            {capitalised ? `${money(leaseAsset)} right-of-use asset on the balance sheet` : `rent of ${money(inputs.annualRent)} a year sits in operating costs`}
          </span>
        </span>
      </label>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-xs text-muted">
            <th className="pb-1 text-left font-normal">&nbsp;</th>
            <th className={cn("pb-1 text-right font-normal", capitalised && "text-accent")}>Capitalised</th>
            <th className={cn("pb-1 text-right font-normal", !capitalised && "text-accent")}>Not capitalised</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-border">
              <td className="py-1.5 pr-3 text-muted">{r.label}</td>
              <td className={cn("py-1.5 text-right font-mono", capitalised && r.highlight && "font-semibold text-fg", !capitalised && "text-muted")}>{r.on}</td>
              <td className={cn("py-1.5 text-right font-mono", !capitalised && r.highlight && "font-semibold text-fg", capitalised && "text-muted")}>{r.off}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <p className="text-sm" data-testid="lease-ebitda">
          <span className="text-muted">EBITDA </span>
          <span className="font-mono font-semibold">{reduced ? money(view.ebitda) : <AnimatedNumber value={view.ebitda} format={(v) => money(v)} />}</span>
        </p>
        <p className="text-sm" data-testid="lease-ev">
          <span className="text-muted">Enterprise value </span>
          <span className="font-mono font-semibold">{reduced ? money(view.ev) : <AnimatedNumber value={view.ev} format={(v) => money(v)} />}</span>
        </p>
        <p className="text-sm" data-testid="lease-multiple">
          <span className="text-muted">EV / EBITDA </span>
          <span className="font-mono font-semibold text-accent">{reduced ? mult(view.evEbitda) : <AnimatedNumber value={view.evEbitda} format={(v) => mult(v)} />}</span>
        </p>
      </div>

      <p className="mt-2 text-xs text-muted">
        The multiple moves from {mult(on.evEbitda)} to {mult(off.evEbitda)} — a few per cent, against a {money(inputs.leaseLiability)} swing in enterprise value. What you must never do is put one company on
        one basis and its comparables on the other.
      </p>

      <p className="sr-only" aria-live="polite">
        {`Leases ${capitalised ? "capitalised" : "not capitalised"}. EBITDA ${view.ebitda} million pounds, enterprise value ${view.ev} million pounds, EV to EBITDA ${view.evEbitda.toFixed(1)} times.`}
      </p>
    </WidgetFrame>
  );
}
