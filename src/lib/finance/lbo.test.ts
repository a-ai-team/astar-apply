import { describe, expect, it } from "vitest";
import { decomposeReturns, irrAnchor, lboReturns, paperLbo, sourcesAndUses } from "./lbo";

// Pennard Logistics Ltd — the LBO chapter's running deal: EBITDA £50m at 8×, 5× leverage, 5 years.
const PENNARD = {
  entryEbitda: 50,
  entryMultiple: 8,
  debtTranches: [
    { name: "Senior term loan", amount: 200, rate: 0.07 },
    { name: "Subordinated notes", amount: 50, rate: 0.1 },
  ],
};

describe("sourcesAndUses", () => {
  const r = sourcesAndUses(PENNARD);

  it("prices the business off EBITDA × the entry multiple", () => {
    expect(r.purchasePrice).toBeCloseTo(400, 2);
  });

  it("makes sponsor equity the balancing plug", () => {
    expect(r.totalDebt).toBeCloseTo(250, 2);
    expect(r.sponsorEquity).toBeCloseTo(150, 2);
    expect(r.totalUses).toBeCloseTo(r.sources.reduce((s, x) => s + x.amount, 0), 6);
  });

  it("reports leverage in turns of EBITDA", () => {
    expect(r.leverageTurns).toBeCloseTo(5, 2);
  });

  it("fees and refinanced debt increase the equity cheque", () => {
    const withFees = sourcesAndUses({ ...PENNARD, fees: 20, netDebtRepaid: 30 });
    expect(withFees.totalUses).toBeCloseTo(450, 2);
    expect(withFees.sponsorEquity).toBeCloseTo(200, 2);
  });
});

describe("lboReturns", () => {
  it("a 2× over five years is roughly a 15 % IRR", () => {
    const r = lboReturns({ sponsorEquity: 150, exitEquity: 300, years: 5 });
    expect(r.moM).toBeCloseTo(2, 4);
    expect(r.irr).toBeCloseTo(0.1487, 3);
  });

  it("a 3× over five years is roughly 25 %", () => {
    expect(lboReturns({ sponsorEquity: 100, exitEquity: 300, years: 5 }).irr).toBeCloseTo(0.2459, 3);
  });

  it("a shorter hold at the same multiple returns more", () => {
    const fast = lboReturns({ sponsorEquity: 150, exitEquity: 300, years: 3 });
    const slow = lboReturns({ sponsorEquity: 150, exitEquity: 300, years: 7 });
    expect(fast.irr).toBeGreaterThan(slow.irr);
  });
});

describe("decomposeReturns — the three levers", () => {
  const r = decomposeReturns({
    entryEbitda: 50,
    exitEbitda: 65,
    entryMultiple: 8,
    exitMultiple: 8,
    entryNetDebt: 250,
    exitNetDebt: 120,
  });

  it("the levers sum exactly to the equity gain", () => {
    expect(r.deleveraging + r.ebitdaGrowth + r.multipleExpansion).toBeCloseTo(r.total, 6);
  });

  it("attributes growth and deleveraging separately", () => {
    expect(r.ebitdaGrowth).toBeCloseTo(120, 2); // 15 × 8×
    expect(r.deleveraging).toBeCloseTo(130, 2); // 250 → 120
    expect(r.multipleExpansion).toBeCloseTo(0, 6);
  });

  it("exiting at a higher multiple adds the third lever", () => {
    const up = decomposeReturns({ entryEbitda: 50, exitEbitda: 65, entryMultiple: 8, exitMultiple: 9, entryNetDebt: 250, exitNetDebt: 120 });
    expect(up.multipleExpansion).toBeCloseTo(65, 2);
    expect(up.deleveraging + up.ebitdaGrowth + up.multipleExpansion).toBeCloseTo(up.total, 6);
  });

  it("multiple compression destroys equity and still reconciles", () => {
    const down = decomposeReturns({ entryEbitda: 50, exitEbitda: 65, entryMultiple: 8, exitMultiple: 7, entryNetDebt: 250, exitNetDebt: 120 });
    expect(down.multipleExpansion).toBeCloseTo(-65, 2);
    expect(down.deleveraging + down.ebitdaGrowth + down.multipleExpansion).toBeCloseTo(down.total, 6);
  });
});

describe("paperLbo", () => {
  const r = paperLbo({
    ...PENNARD,
    years: 5,
    ebitdaGrowth: 0.05,
    taxRate: 0.25,
    daPctOfEbitda: 0.2,
    capexPctOfEbitda: 0.15,
    nwcPctOfEbitda: 0.02,
  });

  it("produces a year per hold year", () => {
    expect(r.schedule).toHaveLength(5);
    expect(r.schedule[0].year).toBe(1);
  });

  it("grows EBITDA and pays debt down each year", () => {
    expect(r.schedule[0].ebitda).toBeCloseTo(52.5, 2);
    expect(r.schedule[4].closingDebt).toBeLessThan(r.schedule[0].openingDebt);
    for (const y of r.schedule) expect(y.closingDebt).toBeLessThanOrEqual(y.openingDebt);
  });

  it("carries the closing balance into the next opening balance", () => {
    for (let i = 1; i < r.schedule.length; i++) {
      expect(r.schedule[i].openingDebt).toBeCloseTo(r.schedule[i - 1].closingDebt, 6);
    }
  });

  it("charges interest on the opening balance, which falls as debt amortises", () => {
    expect(r.schedule[0].interest).toBeCloseTo(19, 2); // 250 at the 7.6 % blended rate
    expect(r.schedule[4].interest).toBeLessThan(r.schedule[0].interest);
  });

  it("returns a sensible MoM and IRR", () => {
    expect(r.returns.moM).toBeGreaterThan(1);
    expect(r.exitEquity).toBeCloseTo(r.exitEnterpriseValue - r.exitNetDebt, 6);
  });

  it("its decomposition reconciles to the equity movement", () => {
    const d = r.decomposition;
    expect(d.deleveraging + d.ebitdaGrowth + d.multipleExpansion).toBeCloseTo(d.total, 6);
  });

  it("a higher exit multiple improves returns", () => {
    const better = paperLbo({ ...PENNARD, years: 5, ebitdaGrowth: 0.05, taxRate: 0.25, exitMultiple: 9 });
    const base = paperLbo({ ...PENNARD, years: 5, ebitdaGrowth: 0.05, taxRate: 0.25, exitMultiple: 8 });
    expect(better.returns.moM).toBeGreaterThan(base.returns.moM);
  });

  it("never pays down more debt than is outstanding", () => {
    const rich = paperLbo({ ...PENNARD, years: 5, ebitdaGrowth: 0.5, taxRate: 0.25 });
    for (const y of rich.schedule) expect(y.closingDebt).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------------------------
// Loop 18 — the chapter's actual deal, pinned to the spec (docs/research/technicals-v2/18-lbo.md).
// Pennard Logistics: EBITDA £50m at 8× (EV £400m), £10m fees, 5× leverage blending to exactly 6 %
// (senior £200m at 5.5 % + second lien £50m at 8 %), 5 % growth, flat £10m D&A = capex, ΔNWC 0,
// tax 25 %, exit at 8× after five years. The spec's table rounds each year to 0.1, so its exit
// equity reads £394.7m; the unrounded schedule gives £395.0m — same MoM and IRR either way.
// ---------------------------------------------------------------------------------------------
const PENNARD_DEAL = {
  entryEbitda: 50,
  entryMultiple: 8,
  fees: 10,
  years: 5,
  ebitdaGrowth: 0.05,
  taxRate: 0.25,
  daAmount: 10,
  capexAmount: 10,
  nwcAmount: 0,
  debtTranches: [
    { name: "Senior term loan", amount: 200, rate: 0.055 },
    { name: "Second lien", amount: 50, rate: 0.08 },
  ],
};

describe("Pennard Logistics — every worked number in the chapter", () => {
  const r = paperLbo(PENNARD_DEAL);

  it("sources and uses: £410m of uses, £160m equity plug, 5.0× leverage", () => {
    expect(r.sourcesUses.totalUses).toBeCloseTo(410, 2);
    expect(r.sourcesUses.totalDebt).toBeCloseTo(250, 2);
    expect(r.sourcesUses.sponsorEquity).toBeCloseTo(160, 2);
    expect(r.sourcesUses.leverageTurns).toBeCloseTo(5, 4);
  });

  it("year 1: £15m interest at the 6 % blend, FCF £20.6m, debt £229.4m", () => {
    const y1 = r.schedule[0];
    expect(y1.interest).toBeCloseTo(15, 2);
    expect(y1.ebitda).toBeCloseTo(52.5, 2);
    expect(y1.tax).toBeCloseTo(6.9, 1);
    expect(y1.freeCashFlow).toBeCloseTo(20.6, 1);
    expect(y1.closingDebt).toBeCloseTo(229.4, 1);
  });

  it("flat D&A and capex keep FCF equal to net income all the way down", () => {
    for (const y of r.schedule) {
      const netIncome = y.pretaxIncome - y.tax;
      expect(y.freeCashFlow).toBeCloseTo(netIncome, 6);
    }
  });

  it("five years of sweep leave £115.5m of debt", () => {
    expect(r.schedule[4].closingDebt).toBeCloseTo(115.54, 1);
    expect(r.schedule[4].interest).toBeCloseTo(8.95, 1);
  });

  it("exit: EV £510.5m, equity ≈ £395m, MoM 2.47×, IRR ≈ 19.8 %", () => {
    expect(r.exitEbitda).toBeCloseTo(63.81, 1);
    expect(r.exitEnterpriseValue).toBeCloseTo(510.5, 1);
    expect(r.exitEquity).toBeCloseTo(394.97, 1);
    expect(r.returns.moM).toBeCloseTo(2.47, 2);
    expect(r.returns.irr).toBeCloseTo(0.198, 3);
  });

  it("the levers: growth £110.5m + deleveraging £134.5m + multiple £0, less £10m fees = the sponsor's gain", () => {
    const d = r.decomposition;
    expect(d.ebitdaGrowth).toBeCloseTo(110.5, 1);
    expect(d.deleveraging).toBeCloseTo(134.5, 1);
    expect(d.multipleExpansion).toBeCloseTo(0, 6);
    // The three levers reconcile to the EV-based equity move; fees bridge that to the cheque.
    expect(d.total - (PENNARD_DEAL.fees ?? 0)).toBeCloseTo(r.exitEquity - r.sourcesUses.sponsorEquity, 1);
  });

  it("exit at 7× instead: MoM 2.07×, IRR ≈ 15.7 %", () => {
    const down = paperLbo({ ...PENNARD_DEAL, exitMultiple: 7 });
    expect(down.exitEquity).toBeCloseTo(331.2, 1);
    expect(down.returns.moM).toBeCloseTo(2.07, 2);
    expect(down.returns.irr).toBeCloseTo(0.157, 2);
  });

  it("the TMT lens redo — 6.5× at 6 % with tiny capex — gets to ≈ 3.9× on an £85m cheque", () => {
    // The spec's outline claimed ~£200m of paydown and 4.5×; the library says £149m and 3.93×.
    const saas = paperLbo({
      ...PENNARD_DEAL,
      daAmount: 2,
      capexAmount: 2,
      debtTranches: [{ name: "Unitranche", amount: 325, rate: 0.06 }],
    });
    expect(saas.sourcesUses.sponsorEquity).toBeCloseTo(85, 2);
    expect(saas.exitNetDebt).toBeCloseTo(176.2, 1);
    expect(saas.exitEquity).toBeCloseTo(334.3, 1);
    expect(saas.returns.moM).toBeCloseTo(3.93, 2);
    expect(saas.returns.irr).toBeCloseTo(0.315, 2);
  });

  it("lesson 1 your-turn (Kite Bakeries): 2.25× is ≈ 17.6 %", () => {
    const kite = lboReturns({ sponsorEquity: 120, exitEquity: 270, years: 5 });
    expect(kite.moM).toBeCloseTo(2.25, 4);
    expect(kite.irr).toBeCloseTo(0.176, 3);
  });

  it("lesson 4 your-turn: 7× / 4× leverage / flat £10m FCF gives 1.9× ≈ 14 %", () => {
    const su = sourcesAndUses({ entryEbitda: 30, entryMultiple: 7, fees: 5, debtTranches: [{ name: "Term loan", amount: 120, rate: 0.06 }] });
    expect(su.totalUses).toBeCloseTo(215, 2);
    expect(su.sponsorEquity).toBeCloseTo(95, 2);
    const exitEquity = 7 * 36 - (120 - 50);
    expect(exitEquity).toBeCloseTo(182, 2);
    const ret = lboReturns({ sponsorEquity: 95, exitEquity, years: 5 });
    expect(ret.moM).toBeCloseTo(1.92, 2);
    expect(ret.irr).toBeCloseTo(0.139, 3);
  });

  it("the anchors: 2× ≈ 15 %, 2.5× ≈ 20 %, 3× ≈ 25 %; 3× over 7 years ≈ 17 %", () => {
    expect(irrAnchor(2).exactIrr).toBeCloseTo(0.149, 3);
    expect(irrAnchor(2.5).exactIrr).toBeCloseTo(0.201, 3);
    expect(irrAnchor(3).exactIrr).toBeCloseTo(0.246, 3);
    expect(irrAnchor(2.47).anchorMoM).toBe(2.5);
    expect(irrAnchor(2.47).approxIrr).toBeCloseTo(0.2, 4);
    expect(irrAnchor(3, 7).exactIrr).toBeCloseTo(0.17, 2);
  });
});
