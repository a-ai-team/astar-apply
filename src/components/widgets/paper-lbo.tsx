"use client";

// The paper LBO stepper (Loop 18). The student narrates Pennard the way an interviewer wants to
// hear it — sources & uses, cash flow, paydown, exit, returns — typing each number and unlocking
// the next step only when the current one holds together. Tolerances are deliberately generous
// (±£2m a value, ±0.1× on MoM): a paper LBO is rounded and narrated, not modelled. All worked
// values come from `@/lib/finance/lbo`; nothing is re-derived here.
import { useMemo, useState } from "react";
import { irrAnchor, paperLbo } from "@/lib/finance/lbo";
import { WidgetFrame } from "./kit/widget-frame";
import { cn } from "@/lib/cn";
import { money, mult, pct } from "./kit/fmt";

export type PaperLboWidgetProps = {
  entryEbitda?: number;
  entryMultiple?: number;
  exitMultiple?: number;
  leverage?: number;
  growth?: number;
  years?: number;
  fees?: number;
  blendedRate?: number;
  taxRate?: number;
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

const MONEY_TOLERANCE = 2;
const MOM_TOLERANCE = 0.1;

type Field = { id: string; label: string; target: number; tolerance: number; format: (n: number) => string };

function fieldOk(field: Field, raw: string): boolean {
  const n = Number(raw);
  return raw.trim() !== "" && Number.isFinite(n) && Math.abs(n - field.target) <= field.tolerance;
}

export function PaperLbo(props: PaperLboWidgetProps) {
  const base = useMemo(
    () => ({ ...DEFAULTS, ...Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined)) }) as Required<PaperLboWidgetProps>,
    [props],
  );

  const deal = useMemo(() => {
    const r = paperLbo({
      entryEbitda: base.entryEbitda,
      entryMultiple: base.entryMultiple,
      exitMultiple: base.exitMultiple,
      years: base.years,
      ebitdaGrowth: base.growth,
      taxRate: base.taxRate,
      fees: base.fees,
      daAmount: base.daAmount,
      capexAmount: base.capexAmount,
      nwcAmount: 0,
      debtTranches: [{ name: "Debt", amount: base.leverage * base.entryEbitda, rate: base.blendedRate }],
    });
    const paydown = r.sourcesUses.totalDebt - r.exitNetDebt;
    return { r, paydown, anchor: irrAnchor(r.returns.moM, base.years) };
  }, [base]);

  const steps: { title: string; blurb: string; fields: Field[] }[] = useMemo(() => {
    const { r, paydown } = deal;
    const m = (n: number) => money(n, 0);
    return [
      {
        title: "Sources & uses",
        blurb: `${base.entryMultiple}× on ${m(base.entryEbitda)} of EBITDA, ${m(base.fees)} of fees, ${base.leverage}× leverage. The step unlocks when the equity plug balances.`,
        fields: [
          { id: "ev", label: "Enterprise value (£m)", target: r.sourcesUses.purchasePrice, tolerance: MONEY_TOLERANCE, format: m },
          { id: "uses", label: "Total uses incl. fees (£m)", target: r.sourcesUses.totalUses, tolerance: MONEY_TOLERANCE, format: m },
          { id: "debt", label: "Debt raised (£m)", target: r.sourcesUses.totalDebt, tolerance: MONEY_TOLERANCE, format: m },
          { id: "equity", label: "Sponsor equity — the plug (£m)", target: r.sourcesUses.sponsorEquity, tolerance: MONEY_TOLERANCE, format: m },
        ],
      },
      {
        title: "Assumptions",
        blurb: `Growth ${pct(base.growth, 0)} a year · ${pct(base.blendedRate, 0)} cash interest on the opening balance · tax ${pct(base.taxRate, 0)} · capex equals D&A, so free cash flow is just net income. Say these out loud before any arithmetic.`,
        fields: [],
      },
      {
        title: "Five years of free cash flow",
        blurb: "EBITDA less interest, tax and capex. Round hard — call it 20, 24, 27, 30, 34 — the tolerance is ±£2m.",
        fields: deal.r.schedule.map((y) => ({
          id: `fcf${y.year}`,
          label: `Year ${y.year} FCF (£m)`,
          target: y.freeCashFlow,
          tolerance: MONEY_TOLERANCE,
          format: (n: number) => money(n, 1),
        })),
      },
      {
        title: "The debt roll",
        blurb: "Every pound of that cash repays debt.",
        fields: [
          { id: "paydown", label: "Cumulative paydown (£m)", target: paydown, tolerance: MONEY_TOLERANCE, format: m },
          { id: "remaining", label: "Debt remaining at exit (£m)", target: r.exitNetDebt, tolerance: MONEY_TOLERANCE, format: m },
        ],
      },
      {
        title: "Exit",
        blurb: `${base.exitMultiple}× on the final year's EBITDA (${money(r.exitEbitda, 1)}), less what is still owed.`,
        fields: [
          { id: "exitEv", label: "Exit enterprise value (£m)", target: r.exitEnterpriseValue, tolerance: MONEY_TOLERANCE, format: m },
          { id: "exitEquity", label: "Exit equity (£m)", target: r.exitEquity, tolerance: MONEY_TOLERANCE, format: m },
        ],
      },
      {
        title: "Returns",
        blurb: "Exit equity over the cheque, then anchor the IRR without a calculator.",
        fields: [{ id: "mom", label: "Money multiple (×)", target: r.returns.moM, tolerance: MOM_TOLERANCE, format: (n: number) => mult(n, 2) }],
      },
    ];
  }, [deal, base]);

  const [step, setStep] = useState(1);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [anchorPick, setAnchorPick] = useState<number | null>(null);

  const reset = () => {
    setStep(1);
    setInputs({});
    setChecked({});
    setRevealed({});
    setAnchorPick(null);
  };

  const TOTAL = 7;
  const current = step <= steps.length ? steps[step - 1] : null;
  const momOk = fieldOk(steps[5].fields[0], inputs.mom ?? "");
  const anchorRight = anchorPick !== null && Math.abs(anchorPick - deal.anchor.approxIrr) < 1e-9;

  const checkStep = (n: number) => {
    setChecked((c) => ({ ...c, [n]: true }));
    const s = steps[n - 1];
    const allOk = s.fields.every((f) => fieldOk(f, inputs[f.id] ?? ""));
    // Step 6 additionally needs the IRR anchor picked; it advances from the anchor buttons instead.
    if (allOk && n < 6) setStep(n + 1);
  };

  return (
    <WidgetFrame
      title="The paper LBO, narrated step by step"
      testId="widget-paper_lbo"
      onReset={reset}
      notice={[
        "Narrate as you type — the interviewer is marking the order of the walk, not the decimals.",
        "If a step will not unlock, open the worked value and find which number drifted.",
        "End on the anchor: 2.5× over five years is about 20 %, and the rule of 72 confirms it — money doubling in ~3.6 years.",
      ]}
    >
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted" data-testid="pl-step">
        Step {step} of {TOTAL}
      </p>

      {step > 1 && (
        <ul className="mt-2 grid gap-1 text-xs text-muted">
          {steps.slice(0, step - 1).map((s, i) => (
            <li key={s.title} className="flex gap-2">
              <span aria-hidden className="text-accent">✓</span>
              <span>
                {i + 1}. {s.title}
                {s.fields.length > 0 && <> — {s.fields.map((f) => f.format(f.target)).join(" · ")}</>}
              </span>
            </li>
          ))}
        </ul>
      )}

      {current && (
        <div className="mt-3 rounded-lg border border-border p-3">
          <p className="text-sm font-medium">
            {step}. {current.title}
          </p>
          <p className="mt-1 text-xs text-muted">{current.blurb}</p>

          {current.fields.length > 0 && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {current.fields.map((f) => {
                const ok = fieldOk(f, inputs[f.id] ?? "");
                const wrong = checked[step] && !ok;
                return (
                  <label key={f.id} className="flex flex-col gap-1 text-xs text-muted">
                    <span>
                      {f.label}
                      {checked[step] && (
                        <span className={cn("ml-1 font-medium", ok ? "text-accent" : "text-danger")}>{ok ? "✓" : "✗"}</span>
                      )}
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      value={inputs[f.id] ?? ""}
                      onChange={(e) => setInputs((v) => ({ ...v, [f.id]: e.target.value }))}
                      data-testid={`pl-input-${f.id}`}
                      aria-invalid={wrong || undefined}
                      className={cn(
                        "rounded-md border bg-surface px-2 py-1 text-right font-mono text-sm text-fg",
                        wrong ? "border-danger" : ok && checked[step] ? "border-accent" : "border-border",
                      )}
                    />
                  </label>
                );
              })}
            </div>
          )}

          {step === 6 && momOk && (
            <div className="mt-3">
              <p className="text-xs text-muted">
                That multiple over {base.years} years — which anchor is it nearest?
              </p>
              <div className="mt-1.5 flex gap-2" role="group" aria-label="IRR anchor">
                {[0.15, 0.2, 0.25].map((a) => (
                  <button
                    key={a}
                    type="button"
                    data-testid={`pl-anchor-${Math.round(a * 100)}`}
                    onClick={() => {
                      setAnchorPick(a);
                      if (Math.abs(a - deal.anchor.approxIrr) < 1e-9) setStep(7);
                    }}
                    className={cn(
                      "rounded-md border px-3 py-1 text-xs font-mono",
                      anchorPick === a
                        ? Math.abs(a - deal.anchor.approxIrr) < 1e-9
                          ? "border-accent text-accent"
                          : "border-danger text-danger"
                        : "border-border text-muted hover:text-fg",
                    )}
                  >
                    {pct(a, 0)}
                  </button>
                ))}
              </div>
              {anchorPick !== null && !anchorRight && (
                <p className="mt-1 text-xs text-danger" role="status">
                  Not that one — {mult(deal.r.returns.moM, 1)} over {base.years} years sits nearer another anchor.
                </p>
              )}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(current.fields.length > 0 || step === 2) && step !== 6 && (
              <button
                type="button"
                data-testid={`pl-check-${step}`}
                onClick={() => (step === 2 ? setStep(3) : checkStep(step))}
                className="rounded-md border border-accent px-3 py-1 text-xs font-medium text-accent hover:bg-accent/10"
              >
                {step === 2 ? "Continue" : "Check"}
              </button>
            )}
            {step === 6 && (
              <button
                type="button"
                data-testid="pl-check-6"
                onClick={() => checkStep(6)}
                className="rounded-md border border-accent px-3 py-1 text-xs font-medium text-accent hover:bg-accent/10"
              >
                Check
              </button>
            )}
            {current.fields.length > 0 && (
              <button
                type="button"
                data-testid={`pl-reveal-${step}`}
                onClick={() => setRevealed((r) => ({ ...r, [step]: true }))}
                className="text-xs text-muted hover:text-fg"
              >
                Show the worked value
              </button>
            )}
          </div>

          {checked[step] && current.fields.length > 0 && !current.fields.every((f) => fieldOk(f, inputs[f.id] ?? "")) && (
            <p className="mt-2 text-xs text-danger" role="status" data-testid={`pl-feedback-${step}`}>
              {step === 1
                ? "Not balancing yet — equity must equal uses minus debt, within £2m."
                : "One or more values are off by more than the tolerance. Round again and re-check."}
            </p>
          )}

          {revealed[step] && current.fields.length > 0 && (
            <p className="mt-2 text-xs text-muted" data-testid={`pl-worked-${step}`}>
              Worked: {current.fields.map((f) => `${f.label.replace(/ \(.*\)$/, "")} ${f.format(f.target)}`).join(" · ")}
            </p>
          )}
        </div>
      )}

      {step === 7 && (
        <div className="mt-3 rounded-lg border border-accent bg-accent/5 p-3" data-testid="pl-done">
          <p className="text-sm font-medium text-accent">7. Done — that is the whole narration.</p>
          <p className="mt-1 text-xs text-muted">
            {money(deal.r.sourcesUses.sponsorEquity)} became {money(deal.r.exitEquity)}: {mult(deal.r.returns.moM, 2)}, roughly {pct(deal.anchor.approxIrr, 0)} a year
            (exactly {pct(deal.r.returns.irr)}). Sensitivity to keep in your pocket: ±1× on the exit multiple is about {money(deal.r.exitEbitda)} of equity — call it ±0.4×
            on the money multiple.
          </p>
        </div>
      )}
    </WidgetFrame>
  );
}
