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
