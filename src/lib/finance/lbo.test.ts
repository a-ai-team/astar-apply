import { describe, expect, it } from "vitest";
import { decomposeReturns, lboReturns, paperLbo, sourcesAndUses } from "./lbo";

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
