import { describe, expect, it } from "vitest";
import { accretionDilution, allStockAccretive, earningsYield, goodwill, premiumPct, synergyNpv } from "./merger";

// Tamar Group plc (P/E 15) buying Wychwood Ltd (P/E 10) — the M&A chapter's running deal.
const TAMAR = { acquirerNetIncome: 100, acquirerShares: 100, acquirerPe: 15 };

describe("accretionDilution — all stock", () => {
  it("a higher-P/E acquirer buying a lower-P/E target is accretive", () => {
    const r = accretionDilution({
      ...TAMAR,
      targetNetIncome: 50,
      offerValue: 500, // P/E 10 on the target's £50m
      cashPct: 0,
      stockPct: 1,
      debtPct: 0,
      costOfDebt: 0.06,
      taxRate: 0.25,
      foregoneInterestRate: 0.02,
    });
    expect(r.standaloneEps).toBeCloseTo(1, 4);
    expect(r.newShares).toBeCloseTo(33.33, 2); // £500m ÷ £15 share price
    expect(r.proFormaEps).toBeCloseTo(1.125, 3);
    expect(r.isAccretive).toBe(true);
    expect(r.accretionPct).toBeCloseTo(0.125, 3);
  });

  it("the reverse — a lower-P/E acquirer buying a higher-P/E target — is dilutive", () => {
    const r = accretionDilution({
      acquirerNetIncome: 100,
      acquirerShares: 100,
      acquirerPe: 10,
      targetNetIncome: 50,
      offerValue: 750, // P/E 15 on the target
      cashPct: 0,
      stockPct: 1,
      debtPct: 0,
      costOfDebt: 0.06,
      taxRate: 0.25,
      foregoneInterestRate: 0.02,
    });
    expect(r.isAccretive).toBe(false);
    expect(r.proFormaEps).toBeLessThan(r.standaloneEps);
  });
});

describe("accretionDilution — funding mix", () => {
  it("cheap debt makes a deal more accretive than stock", () => {
    const base = {
      ...TAMAR,
      targetNetIncome: 50,
      offerValue: 500,
      costOfDebt: 0.06,
      taxRate: 0.25,
      foregoneInterestRate: 0.02,
    };
    const allStock = accretionDilution({ ...base, cashPct: 0, stockPct: 1, debtPct: 0 });
    const allDebt = accretionDilution({ ...base, cashPct: 0, stockPct: 0, debtPct: 1 });
    expect(allDebt.proFormaEps).toBeGreaterThan(allStock.proFormaEps);
    expect(allDebt.newShares).toBeCloseTo(0, 6);
  });

  it("charges the after-tax cost of new debt", () => {
    const r = accretionDilution({
      ...TAMAR,
      targetNetIncome: 50,
      offerValue: 500,
      cashPct: 0,
      stockPct: 0,
      debtPct: 1,
      costOfDebt: 0.06,
      taxRate: 0.25,
      foregoneInterestRate: 0.02,
    });
    expect(r.afterTaxInterestCost).toBeCloseTo(22.5, 2); // 500 × 6 % × 75 %
    expect(r.proFormaEps).toBeCloseTo(1.275, 3);
  });

  it("charges forgone interest on cash consideration", () => {
    const r = accretionDilution({
      ...TAMAR,
      targetNetIncome: 50,
      offerValue: 500,
      cashPct: 1,
      stockPct: 0,
      debtPct: 0,
      costOfDebt: 0.06,
      taxRate: 0.25,
      foregoneInterestRate: 0.02,
    });
    expect(r.afterTaxForegoneInterest).toBeCloseTo(7.5, 2); // 500 × 2 % × 75 %
  });

  it("synergies lift pro-forma EPS", () => {
    const base = {
      ...TAMAR,
      targetNetIncome: 50,
      offerValue: 500,
      cashPct: 0,
      stockPct: 1,
      debtPct: 0,
      costOfDebt: 0.06,
      taxRate: 0.25,
      foregoneInterestRate: 0.02,
    };
    const without = accretionDilution(base);
    const withSyn = accretionDilution({ ...base, synergies: 20 });
    expect(withSyn.proFormaEps).toBeGreaterThan(without.proFormaEps);
  });
});

describe("the all-stock shortcut", () => {
  it("matches the full calculation's verdict", () => {
    expect(allStockAccretive({ acquirerPe: 15, pePaid: 10 })).toBe(true);
    expect(allStockAccretive({ acquirerPe: 10, pePaid: 15 })).toBe(false);
  });

  it("earningsYield is the reciprocal", () => {
    expect(earningsYield(10)).toBeCloseTo(0.1, 4);
    expect(earningsYield(0)).toBe(0);
  });
});

describe("goodwill", () => {
  it("is the residual after write-ups", () => {
    const r = goodwill({ purchasePrice: 500, bookEquity: 200, writeUps: 100 });
    expect(r.identifiableNetAssets).toBeCloseTo(300, 2);
    expect(r.goodwill).toBeCloseTo(200, 2);
  });

  it("a DTL on the write-ups raises goodwill", () => {
    const r = goodwill({ purchasePrice: 500, bookEquity: 200, writeUps: 100, dtlRate: 0.25 });
    expect(r.dtl).toBeCloseTo(25, 2);
    expect(r.goodwill).toBeCloseTo(225, 2);
  });
});

describe("synergyNpv", () => {
  it("phases synergies in and charges the integration cost in year 1", () => {
    const r = synergyNpv({ annualSynergies: 20, phaseInYears: 2, integrationCost: 15, discountRate: 0.1, years: 5 });
    expect(r.byYear[0]).toBeCloseTo(-5, 2); // half of 20, less the 15 cost
    expect(r.byYear[1]).toBeCloseTo(20, 2);
    expect(r.byYear[4]).toBeCloseTo(20, 2);
    expect(r.npv).toBeCloseTo(53.09, 1);
  });

  it("is worth less when integration costs more", () => {
    const cheap = synergyNpv({ annualSynergies: 20, phaseInYears: 2, integrationCost: 5, discountRate: 0.1, years: 5 });
    const dear = synergyNpv({ annualSynergies: 20, phaseInYears: 2, integrationCost: 40, discountRate: 0.1, years: 5 });
    expect(dear.npv).toBeLessThan(cheap.npv);
  });
});

describe("premiumPct", () => {
  it("is the offer over the undisturbed price", () => {
    expect(premiumPct({ offerValue: 500, undisturbedValue: 400 })).toBeCloseTo(0.25, 4);
  });
});
