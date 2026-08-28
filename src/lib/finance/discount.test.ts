import { describe, expect, it } from "vitest";
import { discountFactor, impliedRateFromMultiple, irr, moneyMultiple, multipleFromRate, npv, npvFromZero, pv, ruleOf72 } from "./discount";

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
