import { describe, expect, it } from "vitest";
import { costOfEquityCapm, medianBeta, releverBeta, releveredBetaFromComps, unleverBeta, wacc } from "./wacc";

describe("costOfEquityCapm", () => {
  it("Rf 4 % + β 1.2 × ERP 5.5 % = 10.6 %", () => {
    expect(costOfEquityCapm({ riskFree: 0.04, beta: 1.2, equityRiskPremium: 0.055 })).toBeCloseTo(0.106, 4);
  });

  it("adds a size premium when one is used", () => {
    expect(costOfEquityCapm({ riskFree: 0.04, beta: 1.2, equityRiskPremium: 0.055, sizePremium: 0.02 })).toBeCloseTo(0.126, 4);
  });

  it("a riskier company has a higher cost of equity", () => {
    const safe = costOfEquityCapm({ riskFree: 0.04, beta: 0.7, equityRiskPremium: 0.055 });
    const risky = costOfEquityCapm({ riskFree: 0.04, beta: 1.6, equityRiskPremium: 0.055 });
    expect(risky).toBeGreaterThan(safe);
  });
});

describe("wacc", () => {
  it("weights the two costs by market values", () => {
    const r = wacc({ equityValue: 800, debtValue: 200, costOfEquity: 0.11, costOfDebt: 0.06, taxRate: 0.25 });
    expect(r.equityWeight).toBeCloseTo(0.8, 4);
    expect(r.debtWeight).toBeCloseTo(0.2, 4);
    expect(r.afterTaxCostOfDebt).toBeCloseTo(0.045, 4);
    expect(r.wacc).toBeCloseTo(0.097, 4);
  });

  it("the tax shield makes debt cheaper than its coupon", () => {
    const r = wacc({ equityValue: 500, debtValue: 500, costOfEquity: 0.11, costOfDebt: 0.08, taxRate: 0.25 });
    expect(r.afterTaxCostOfDebt).toBeLessThan(0.08);
  });

  it("handles preferred stock as a third weight", () => {
    const r = wacc({ equityValue: 700, debtValue: 200, costOfEquity: 0.11, costOfDebt: 0.06, taxRate: 0.25, preferredValue: 100, costOfPreferred: 0.08 });
    expect(r.preferredWeight).toBeCloseTo(0.1, 4);
    expect(r.equityWeight + r.debtWeight + r.preferredWeight).toBeCloseTo(1, 6);
  });

  it("is zero when there is no capital", () => {
    expect(wacc({ equityValue: 0, debtValue: 0, costOfEquity: 0.1, costOfDebt: 0.05, taxRate: 0.25 }).wacc).toBe(0);
  });

  it("falls as cheap debt is added, then rises once equity is relevered", () => {
    // Leverage alone lowers WACC while Ke is held flat…
    const noDebt = wacc({ equityValue: 1000, debtValue: 0, costOfEquity: 0.11, costOfDebt: 0.06, taxRate: 0.25 }).wacc;
    const someDebt = wacc({ equityValue: 800, debtValue: 200, costOfEquity: 0.11, costOfDebt: 0.06, taxRate: 0.25 }).wacc;
    expect(someDebt).toBeLessThan(noDebt);

    // …but relevering beta raises Ke, which pushes WACC back up at high leverage.
    const unlevered = unleverBeta({ leveredBeta: 1.1, debtToEquity: 0, taxRate: 0.25 });
    const heavyBeta = releverBeta({ unleveredBeta: unlevered, debtToEquity: 3, taxRate: 0.25 });
    const heavyKe = costOfEquityCapm({ riskFree: 0.04, beta: heavyBeta, equityRiskPremium: 0.055 });
    const heavy = wacc({ equityValue: 250, debtValue: 750, costOfEquity: heavyKe, costOfDebt: 0.1, taxRate: 0.25 }).wacc;
    expect(heavy).toBeGreaterThan(someDebt);
  });
});

describe("un/relevering beta", () => {
  it("unlevering strips out the capital structure", () => {
    expect(unleverBeta({ leveredBeta: 1.3, debtToEquity: 0.5, taxRate: 0.25 })).toBeCloseTo(0.9455, 4);
  });

  it("relevering puts it back — the round trip is lossless", () => {
    const bu = unleverBeta({ leveredBeta: 1.3, debtToEquity: 0.5, taxRate: 0.25 });
    expect(releverBeta({ unleveredBeta: bu, debtToEquity: 0.5, taxRate: 0.25 })).toBeCloseTo(1.3, 6);
  });

  it("more leverage means a higher levered beta", () => {
    const bu = 0.9;
    expect(releverBeta({ unleveredBeta: bu, debtToEquity: 1, taxRate: 0.25 })).toBeGreaterThan(
      releverBeta({ unleveredBeta: bu, debtToEquity: 0.25, taxRate: 0.25 }),
    );
  });
});

describe("medianBeta", () => {
  it("takes the middle of an odd set", () => {
    expect(medianBeta([0.8, 1.2, 1.0])).toBeCloseTo(1.0, 4);
  });

  it("averages the middle two of an even set", () => {
    expect(medianBeta([0.8, 1.0, 1.2, 1.4])).toBeCloseTo(1.1, 4);
  });

  it("is 0 for an empty set", () => {
    expect(medianBeta([])).toBe(0);
  });
});

describe("releveredBetaFromComps", () => {
  it("unlevers each comp, takes the median, relevers at the target structure", () => {
    const r = releveredBetaFromComps({
      comps: [
        { name: "A", leveredBeta: 1.3, debtToEquity: 0.5, taxRate: 0.25 },
        { name: "B", leveredBeta: 1.1, debtToEquity: 0.3, taxRate: 0.25 },
        { name: "C", leveredBeta: 1.5, debtToEquity: 0.8, taxRate: 0.25 },
      ],
      targetDebtToEquity: 0.4,
      targetTaxRate: 0.25,
    });
    expect(r.unlevered).toHaveLength(3);
    // Unlevered: A 0.9455, B 0.8980, C 0.9375 → median 0.9375, relevered at D/E 0.4 → ×1.3.
    expect(r.medianUnlevered).toBeCloseTo(0.9375, 3);
    expect(r.relevered).toBeCloseTo(1.2188, 3);
  });
});
