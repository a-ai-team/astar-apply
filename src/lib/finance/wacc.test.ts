import { describe, expect, it } from "vitest";
import { costOfEquityCapm, leverageSweep, medianBeta, minimumWaccPoint, releverBeta, releveredBetaFromComps, unleverBeta, wacc } from "./wacc";

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

describe("leverageSweep (Loop 16 — wacc_builder)", () => {
  const HARBOURLINE = { beta: 1.0, baseDebtToEquity: 590 / 1050, riskFree: 0.04, equityRiskPremium: 0.06, costOfDebt: 0.06, taxRate: 0.25 };

  it("reproduces Harbourline's 8.0 % WACC at its actual 36 % debt weight", () => {
    const [p] = leverageSweep({ ...HARBOURLINE, points: [590 / 1640] });
    expect(p.costOfEquity).toBeCloseTo(0.1, 4);
    expect(p.wacc).toBeCloseTo(0.0802, 3);
  });

  it("with beta fixed, WACC falls in a straight line as debt rises", () => {
    const points = leverageSweep({ ...HARBOURLINE, relever: false, points: [0, 0.2, 0.4, 0.6] });
    const waccs = points.map((p) => p.wacc);
    expect(waccs[0]).toBeCloseTo(0.1, 4);
    for (let i = 1; i < waccs.length; i++) expect(waccs[i]).toBeLessThan(waccs[i - 1]);
    // Equal steps in leverage give equal steps in WACC — that is what "straight line" means.
    expect(waccs[0] - waccs[1]).toBeCloseTo(waccs[1] - waccs[2], 4);
    expect(points.every((p) => p.beta === 1)).toBe(true);
  });

  it("relevering bends the line into a U with a real minimum", () => {
    const points = leverageSweep({ ...HARBOURLINE, relever: true });
    const min = minimumWaccPoint(points);
    expect(min).not.toBeNull();
    expect(min!.debtWeight).toBeGreaterThan(0.2);
    expect(min!.debtWeight).toBeLessThan(0.85);
    // It genuinely turns back up rather than just flattening.
    expect(points[points.length - 1].wacc).toBeGreaterThan(min!.wacc);
    // Beta rises with leverage; the cost of debt only re-prices past the spread threshold.
    expect(points[points.length - 1].beta).toBeGreaterThan(points[0].beta);
    expect(points[0].costOfDebt).toBeCloseTo(0.06, 4);
    expect(points[points.length - 1].costOfDebt).toBeGreaterThan(0.06);
  });

  it("removing the tax shield removes most of the debt advantage", () => {
    const withTax = leverageSweep({ ...HARBOURLINE, relever: false, points: [0, 0.5] });
    const noTax = leverageSweep({ ...HARBOURLINE, taxRate: 0, relever: false, points: [0, 0.5] });
    const drop = (ps: typeof withTax) => ps[0].wacc - ps[1].wacc;
    expect(drop(withTax)).toBeGreaterThan(drop(noTax));
  });

  it("minimumWaccPoint returns null for an empty sweep", () => {
    expect(minimumWaccPoint([])).toBeNull();
  });
});

describe("Harbourline's relevered beta (Loop 16 — beta_relever)", () => {
  const comps = [
    { name: "Calder Freight", leveredBeta: 1.2, debtToEquity: 0.6, taxRate: 0.25 },
    { name: "Penrose Logistics", leveredBeta: 0.9, debtToEquity: 0.3, taxRate: 0.25 },
    { name: "Thornbury Haulage", leveredBeta: 1.1, debtToEquity: 0.5, taxRate: 0.25 },
  ];

  it("unlevers to 0.83 / 0.73 / 0.80, medians at 0.80 and relevers to 1.14", () => {
    const r = releveredBetaFromComps({ comps, targetDebtToEquity: 590 / 1050, targetTaxRate: 0.25 });
    expect(r.unlevered.map((u) => Number(u.beta.toFixed(2)))).toEqual([0.83, 0.73, 0.8]);
    expect(r.medianUnlevered).toBeCloseTo(0.8, 2);
    expect(r.relevered).toBeCloseTo(1.137, 2);
    expect(costOfEquityCapm({ riskFree: 0.04, beta: r.relevered, equityRiskPremium: 0.06 })).toBeCloseTo(0.1082, 3);
  });

  it("the unlevered median is unchanged by the target's capital structure", () => {
    const a = releveredBetaFromComps({ comps, targetDebtToEquity: 0.1, targetTaxRate: 0.25 });
    const b = releveredBetaFromComps({ comps, targetDebtToEquity: 2.0, targetTaxRate: 0.25 });
    expect(a.medianUnlevered).toBeCloseTo(b.medianUnlevered, 6);
    expect(b.relevered).toBeGreaterThan(a.relevered);
  });
});
