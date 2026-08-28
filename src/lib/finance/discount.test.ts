import { describe, expect, it } from "vitest";
import { annuityFactor, discountFactor, impliedRateFromMultiple, irr, midYearExponent, moneyMultiple, multipleFromRate, npv, npvFromZero, periodExponent, pv, ruleOf72 } from "./discount";
import { wacc } from "./wacc";

describe("pv", () => {
  it("discounts one year at 10 %", () => {
    expect(pv(110, 0.1, 1)).toBeCloseTo(100, 2);
  });

  it("collapses distant cash flows", () => {
    expect(pv(100, 0.1, 10)).toBeCloseTo(38.55, 2);
    expect(pv(100, 0.2, 10)).toBeCloseTo(16.15, 2);
  });

  it("mid-year convention lifts the value", () => {
    const endYear = pv(100, 0.1, 1);
    const midYear = pv(100, 0.1, 1, { midYear: true });
    expect(midYear).toBeGreaterThan(endYear);
    expect(midYear).toBeCloseTo(95.35, 2);
  });
});

describe("discountFactor", () => {
  it("is 1/(1+r)^n", () => {
    expect(discountFactor(0.08, 3)).toBeCloseTo(0.7938, 4);
  });

  it("shifts back half a year under mid-year", () => {
    expect(discountFactor(0.08, 1, { midYear: true })).toBeCloseTo(0.9623, 4);
  });
});

describe("npv", () => {
  it("sums the discounted year-1-onwards flows", () => {
    expect(npv([100, 100, 100], 0.1)).toBeCloseTo(248.69, 2);
  });

  it("npvFromZero leaves the period-0 flow undiscounted", () => {
    expect(npvFromZero([-100, 110], 0.1)).toBeCloseTo(0, 6);
  });
});

describe("irr", () => {
  it("finds the rate that zeroes NPV", () => {
    expect(irr([-100, 110])).toBeCloseTo(0.1, 4);
  });

  it("gives ≈14.87 % for a 2× over five years", () => {
    const rate = irr([-100, 0, 0, 0, 0, 200]);
    expect(rate).not.toBeNull();
    expect(rate!).toBeCloseTo(0.1487, 3);
  });

  it("gives ≈24.6 % for a 3× over five years", () => {
    expect(irr([-100, 0, 0, 0, 0, 300])!).toBeCloseTo(0.2459, 3);
  });

  it("returns null when the series never changes sign", () => {
    expect(irr([100, 100, 100])).toBeNull();
    expect(irr([-100, -50])).toBeNull();
  });

  it("handles an interim-cash-flow series", () => {
    expect(irr([-100, 30, 30, 30, 30, 30])!).toBeCloseTo(0.1524, 3);
  });
});

describe("mental-maths shortcuts", () => {
  it("moneyMultiple", () => {
    expect(moneyMultiple(250, 100)).toBeCloseTo(2.5, 2);
    expect(moneyMultiple(250, 0)).toBe(0);
  });

  it("ruleOf72 approximates the doubling time", () => {
    expect(ruleOf72(0.15)).toBeCloseTo(4.8, 2);
    expect(ruleOf72(0)).toBe(Infinity);
  });

  it("impliedRateFromMultiple matches the interview anchors", () => {
    expect(impliedRateFromMultiple(2, 5)).toBeCloseTo(0.1487, 3); // "2× in 5 years ≈ 15 %"
    expect(impliedRateFromMultiple(3, 5)).toBeCloseTo(0.2459, 3); // "3× in 5 years ≈ 25 %"
    expect(impliedRateFromMultiple(2, 3)).toBeCloseTo(0.2599, 3);
  });

  it("multipleFromRate is the inverse", () => {
    expect(multipleFromRate(impliedRateFromMultiple(2.5, 5), 5)).toBeCloseTo(2.5, 4);
  });
});

// --- Loop 12 (Foundations / `discount_dial`) ---------------------------------------------------
describe("annuityFactor", () => {
  it("matches the spec pin: 8 % over 5 years = 3.9927", () => {
    expect(annuityFactor(0.08, 5)).toBeCloseTo(3.9927, 4);
  });

  it("prices Ashdown's £0.6m-a-year saving at £2.396m", () => {
    expect(0.6 * annuityFactor(0.08, 5)).toBeCloseTo(2.3956, 3);
  });

  it("equals the sum of the individual discount factors", () => {
    const summed = [1, 2, 3, 4].reduce((s, n) => s + discountFactor(0.1, n), 0);
    expect(annuityFactor(0.1, 4)).toBeCloseTo(summed, 10);
  });

  it("is just the year count at a zero rate, and zero for no years", () => {
    expect(annuityFactor(0, 5)).toBe(5);
    expect(annuityFactor(0.08, 0)).toBe(0);
  });

  it("is higher under the mid-year convention (cash arrives sooner)", () => {
    expect(annuityFactor(0.08, 5, { midYear: true })).toBeGreaterThan(annuityFactor(0.08, 5));
  });
});

describe("midYearExponent", () => {
  it("pulls each period back half a year", () => {
    expect(midYearExponent(1)).toBe(0.5);
    expect(midYearExponent(3)).toBe(2.5);
  });

  it("agrees with periodExponent under the midYear option", () => {
    expect(midYearExponent(4)).toBe(periodExponent(4, { midYear: true }));
  });
});

describe("discount_dial pins", () => {
  it("£1m in 3 years at 8 % is worth £0.7938m", () => {
    expect(pv(1, 0.08, 3)).toBeCloseTo(0.7938, 4);
  });

  it("IRR of −£2.0m then £0.6m × 5 is about 15.24 %", () => {
    expect(irr([-2, 0.6, 0.6, 0.6, 0.6, 0.6])).toBeCloseTo(0.1524, 4);
  });

  it("NPV is zero at the IRR — the crossing the dial marks", () => {
    const flows = [-2, 0.6, 0.6, 0.6, 0.6, 0.6];
    const r = irr(flows);
    expect(r).not.toBeNull();
    expect(npvFromZero(flows, r as number)).toBeCloseTo(0, 6);
  });

  it("the WACC preset feeds the dial: 50/50 funding at 14 % and 6 % pre-tax, no tax, is 10 %", () => {
    expect(wacc({ equityValue: 3, debtValue: 3, costOfEquity: 0.14, costOfDebt: 0.06, taxRate: 0 }).wacc).toBeCloseTo(0.1, 10);
  });

  it("the WACC preset with tax: Hollins Pies is 9.0 %", () => {
    expect(wacc({ equityValue: 6, debtValue: 4, costOfEquity: 0.12, costOfDebt: 0.06, taxRate: 0.25 }).wacc).toBeCloseTo(0.09, 10);
  });

  it("rule of 72: doubling in 5 years is roughly 14 %", () => {
    expect(ruleOf72(0.144)).toBeCloseTo(5, 1);
  });
});
