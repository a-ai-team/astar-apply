import { describe, expect, it } from "vitest";
import {
  dcfValue,
  equityValuePerShare,
  impliedExitMultiple,
  impliedGrowth,
  nopat,
  project,
  sensitivityGrid,
  terminalValueExitMultiple,
  terminalValueGordon,
  unleveredFreeCashFlow,
  extendProjection,
} from "./dcf";

describe("unleveredFreeCashFlow", () => {
  it("builds from EBIT: 100 EBIT, 25 % tax, +20 D&A, −30 capex, −5 ΔNWC", () => {
    expect(unleveredFreeCashFlow({ ebit: 100, taxRate: 0.25, da: 20, capex: 30, changeInNwc: 5 })).toBeCloseTo(60, 2);
  });

  it("a working-capital build is a use of cash", () => {
    const tighter = unleveredFreeCashFlow({ ebit: 100, taxRate: 0.25, da: 20, capex: 30, changeInNwc: 25 });
    expect(tighter).toBeCloseTo(40, 2);
  });

  it("nopat is EBIT after tax", () => {
    expect(nopat(100, 0.25)).toBeCloseTo(75, 2);
  });
});

describe("terminal value", () => {
  it("Gordon growth", () => {
    expect(terminalValueGordon({ finalFcf: 100, growth: 0.02, wacc: 0.09 })).toBeCloseTo(1457.14, 2);
  });

  it("throws when growth meets or beats WACC", () => {
    expect(() => terminalValueGordon({ finalFcf: 100, growth: 0.09, wacc: 0.09 })).toThrow(/below WACC/);
  });

  it("exit multiple", () => {
    expect(terminalValueExitMultiple({ finalEbitda: 200, multiple: 8 })).toBeCloseTo(1600, 2);
  });

  it("Gordon ⇄ exit cross-check round-trips", () => {
    const tv = terminalValueGordon({ finalFcf: 100, growth: 0.02, wacc: 0.09 });
    expect(impliedGrowth({ tv, finalFcf: 100, wacc: 0.09 })).toBeCloseTo(0.02, 6);
    expect(impliedExitMultiple({ tv, finalEbitda: 200 })).toBeCloseTo(7.29, 2);
  });

  it("an exit-multiple TV implies a growth rate you can sanity-check", () => {
    const tv = terminalValueExitMultiple({ finalEbitda: 200, multiple: 8 });
    const g = impliedGrowth({ tv, finalFcf: 100, wacc: 0.09 });
    expect(g).toBeCloseTo(0.0259, 3);
    expect(terminalValueGordon({ finalFcf: 100, growth: g, wacc: 0.09 })).toBeCloseTo(tv, 2);
  });
});

describe("dcfValue", () => {
  const cashFlows = [100, 105, 110, 115, 120];
  const tv = terminalValueGordon({ finalFcf: 120, growth: 0.02, wacc: 0.09 });

  it("splits the value between explicit years and the terminal value", () => {
    const r = dcfValue({ cashFlows, wacc: 0.09, terminalValue: tv });
    expect(r.pvExplicit).toBeCloseTo(424.52, 1);
    expect(r.enterpriseValue).toBeCloseTo(r.pvExplicit + r.pvTerminal, 6);
  });

  it("shows the terminal value dominating — the lesson of the chapter", () => {
    const r = dcfValue({ cashFlows, wacc: 0.09, terminalValue: tv });
    expect(r.terminalShare).toBeGreaterThan(0.6);
    expect(r.terminalShare).toBeLessThan(0.8);
  });

  it("mid-year convention raises the value", () => {
    const endYear = dcfValue({ cashFlows, wacc: 0.09, terminalValue: tv });
    const midYear = dcfValue({ cashFlows, wacc: 0.09, terminalValue: tv, midYear: true });
    expect(midYear.enterpriseValue).toBeGreaterThan(endYear.enterpriseValue);
  });

  it("returns a PV for every explicit year", () => {
    expect(dcfValue({ cashFlows, wacc: 0.09, terminalValue: tv }).pvByYear).toHaveLength(5);
  });
});

describe("equityValuePerShare", () => {
  it("bridges EV to a per-share number", () => {
    const r = equityValuePerShare({ enterpriseValue: 1530, netDebt: 380, otherClaims: 100, dilutedShares: 250 });
    expect(r.equityValue).toBeCloseTo(1050, 2);
    expect(r.perShare).toBeCloseTo(4.2, 2);
  });
});

describe("sensitivityGrid", () => {
  const grid = sensitivityGrid({
    waccs: [0.08, 0.09, 0.1],
    growths: [0.01, 0.02, 0.03],
    cashFlows: [100, 105, 110, 115, 120],
    finalFcf: 120,
  });

  it("is rows × columns", () => {
    expect(grid).toHaveLength(3);
    expect(grid[0]).toHaveLength(3);
  });

  it("value rises as growth rises and falls as WACC rises", () => {
    expect(grid[0][2]!).toBeGreaterThan(grid[0][0]!);
    expect(grid[2][0]!).toBeLessThan(grid[0][0]!);
  });

  it("returns null where growth meets or exceeds WACC", () => {
    const clash = sensitivityGrid({ waccs: [0.03], growths: [0.03, 0.05], cashFlows: [100], finalFcf: 100 });
    expect(clash[0][0]).toBeNull();
    expect(clash[0][1]).toBeNull();
  });

  it("can return per-share values instead of EV", () => {
    const perShare = sensitivityGrid({
      waccs: [0.09],
      growths: [0.02],
      cashFlows: [100, 105, 110, 115, 120],
      finalFcf: 120,
      netDebt: 380,
      dilutedShares: 250,
    });
    expect(perShare[0][0]!).toBeLessThan(grid[1][1]!);
  });
});

describe("project", () => {
  it("grows a starting figure at a constant rate", () => {
    expect(project(100, 0.1, 3).map((v) => Math.round(v * 100) / 100)).toEqual([110, 121, 133.1]);
  });
});

describe("extendProjection (Loop 16 — tv_share)", () => {
  const HARBOURLINE = [81.8, 86.7, 92.4, 96.9, 102.3];

  it("truncates when asked for fewer years than it has", () => {
    expect(extendProjection(HARBOURLINE, 3, 0.02)).toEqual([81.8, 86.7, 92.4]);
  });

  it("returns the input unchanged at its own length", () => {
    expect(extendProjection(HARBOURLINE, 5, 0.02)).toEqual(HARBOURLINE);
  });

  it("fades the last growth rate down to the terminal rate", () => {
    const ten = extendProjection(HARBOURLINE, 10, 0.02);
    expect(ten).toHaveLength(10);
    // Final observed growth is 102.3 / 96.9 − 1 ≈ 5.57 %, fading to 2 % over five extra years.
    const firstExtraGrowth = ten[5] / ten[4] - 1;
    const lastExtraGrowth = ten[9] / ten[8] - 1;
    expect(firstExtraGrowth).toBeLessThan(0.0557);
    expect(lastExtraGrowth).toBeCloseTo(0.02, 3);
    expect(firstExtraGrowth).toBeGreaterThan(lastExtraGrowth);
  });

  it("the terminal share falls as the projection lengthens, but never below half", () => {
    const share = (years: number) => {
      const flows = extendProjection(HARBOURLINE, years, 0.02);
      const tv = terminalValueGordon({ finalFcf: flows[flows.length - 1], growth: 0.02, wacc: 0.08 });
      return dcfValue({ cashFlows: flows, wacc: 0.08, terminalValue: tv }).terminalShare;
    };
    expect(share(5)).toBeCloseTo(0.765, 2);
    expect(share(10)).toBeCloseTo(0.585, 2);
    expect(share(10)).toBeLessThan(share(5));
    expect(share(10)).toBeGreaterThan(0.5);
  });

  it("handles degenerate inputs", () => {
    expect(extendProjection([], 5, 0.02)).toEqual([]);
    expect(extendProjection(HARBOURLINE, 0, 0.02)).toEqual([]);
    expect(extendProjection([100], 3, 0.02)).toEqual([100, 102, 104.04]);
  });
});

describe("Harbourline plc — the Loop 16 chapter DCF", () => {
  const CF = [81.8, 86.7, 92.4, 96.9, 102.3];
  const FINAL_EBITDA = 231.9;
  const WACC = 0.08;

  it("Gordon growth at 2 % gives EV £1,548m with a 76 % terminal share", () => {
    const tv = terminalValueGordon({ finalFcf: 102.3, growth: 0.02, wacc: WACC });
    expect(tv).toBeCloseTo(1739.1, 0);
    const v = dcfValue({ cashFlows: CF, wacc: WACC, terminalValue: tv });
    expect(v.pvExplicit).toBeCloseTo(364.3, 0);
    expect(v.pvTerminal).toBeCloseTo(1183.6, 0);
    expect(v.enterpriseValue).toBeCloseTo(1547.9, 0);
    expect(v.terminalShare).toBeCloseTo(0.765, 2);
    expect(impliedExitMultiple({ tv, finalEbitda: FINAL_EBITDA })).toBeCloseTo(7.5, 1);
  });

  it("an 8.5× exit multiple gives EV £1,706m and implies 2.7 % growth", () => {
    const tv = terminalValueExitMultiple({ finalEbitda: FINAL_EBITDA, multiple: 8.5 });
    expect(tv).toBeCloseTo(1971.2, 0);
    const v = dcfValue({ cashFlows: CF, wacc: WACC, terminalValue: tv });
    expect(v.enterpriseValue).toBeCloseTo(1705.8, 0);
    expect(impliedGrowth({ tv, finalFcf: 102.3, wacc: WACC })).toBeCloseTo(0.0267, 3);
  });

  it("bridges to £4.27 a share against a £4.20 market price", () => {
    const tv = terminalValueGordon({ finalFcf: 102.3, growth: 0.02, wacc: WACC });
    const { enterpriseValue } = dcfValue({ cashFlows: CF, wacc: WACC, terminalValue: tv });
    const { equityValue, perShare } = equityValuePerShare({ enterpriseValue, netDebt: 380, otherClaims: 30 + 25 + 45, dilutedShares: 250 });
    expect(equityValue).toBeCloseTo(1067.9, 0);
    expect(perShare).toBeCloseTo(4.27, 2);
  });

  it("one point either way on WACC and g moves EV from about £1.2bn to £2.3bn", () => {
    const ev = (wacc: number, growth: number) =>
      dcfValue({ cashFlows: CF, wacc, terminalValue: terminalValueGordon({ finalFcf: 102.3, growth, wacc }) }).enterpriseValue;
    expect(ev(0.09, 0.01)).toBeCloseTo(1193.9, 0);
    expect(ev(0.08, 0.02)).toBeCloseTo(1547.9, 0);
    expect(ev(0.07, 0.03)).toBeCloseTo(2252.6, 0);
    expect(ev(0.07, 0.03) / ev(0.09, 0.01)).toBeGreaterThan(1.8);
  });

  it("mid-year lifts the explicit PV to £378m; the TV still sits at year-end", () => {
    const tv = terminalValueGordon({ finalFcf: 102.3, growth: 0.02, wacc: WACC });
    const mid = dcfValue({ cashFlows: CF, wacc: WACC, terminalValue: tv, midYear: true });
    expect(mid.pvExplicit).toBeCloseTo(378.6, 0);
    // The TV is discounted at the full final-year factor either way, so EV rises ~1 %, not 3–4 %.
    // See the Loop 16 retro: the chapter spec assumed a mid-year TV too.
    expect(mid.pvTerminal).toBeCloseTo(1183.6, 0);
    expect(mid.enterpriseValue).toBeCloseTo(1562.2, 0);
  });
});
