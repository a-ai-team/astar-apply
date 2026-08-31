import { describe, expect, it } from "vitest";
import { accretionDilution, allStockAccretive, earningsYield, goodwill, premiumPct, synergyNpv, synergyPerpetuityNpv } from "./merger";

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

// ---------------------------------------------------------------------------------------------
// Loop 17 — the chapter's actual deal, pinned to the spec (docs/research/technicals-v2/17-ma.md).
// Tamar Group plc: NI £120m, 100m shares, P/E 15 (price £18). Wychwood Ltd: NI £40m, offer £500m
// (a 25 % premium over its £400m market cap; 12.5× the offer P/E). Tax 25 %; cash earns 4 %
// pre-tax; new debt costs 6 % pre-tax.
// ---------------------------------------------------------------------------------------------
const TAMAR_DEAL = {
  acquirerNetIncome: 120,
  acquirerShares: 100,
  acquirerPe: 15,
  targetNetIncome: 40,
  offerValue: 500,
  costOfDebt: 0.06,
  taxRate: 0.25,
  foregoneInterestRate: 0.04,
};

describe("Tamar / Wychwood — every worked number in the chapter", () => {
  it("all-stock: 27.78m new shares, EPS £1.252, +4.4 %", () => {
    const r = accretionDilution({ ...TAMAR_DEAL, cashPct: 0, stockPct: 1, debtPct: 0 });
    expect(r.newShares).toBeCloseTo(27.78, 2);
    expect(r.proFormaEps).toBeCloseTo(1.252, 3);
    expect(r.accretionPct).toBeCloseTo(0.0434, 3);
  });

  it("all-cash: £15m after-tax interest forgone, EPS £1.45, +20.8 %", () => {
    const r = accretionDilution({ ...TAMAR_DEAL, cashPct: 1, stockPct: 0, debtPct: 0 });
    expect(r.afterTaxForegoneInterest).toBeCloseTo(15, 2);
    expect(r.proFormaNetIncome).toBeCloseTo(145, 2);
    expect(r.proFormaEps).toBeCloseTo(1.45, 3);
    expect(r.accretionPct).toBeCloseTo(0.208, 3);
  });

  it("all-debt: £22.5m after-tax interest, EPS £1.375, +14.6 %", () => {
    const r = accretionDilution({ ...TAMAR_DEAL, cashPct: 0, stockPct: 0, debtPct: 1 });
    expect(r.afterTaxInterestCost).toBeCloseTo(22.5, 2);
    expect(r.proFormaEps).toBeCloseTo(1.375, 3);
    expect(r.accretionPct).toBeCloseTo(0.146, 3);
  });

  it("50/50 debt + stock: EPS £1.306, +8.8 %; with £20m synergies £1.438, +19.8 %", () => {
    const base = { ...TAMAR_DEAL, cashPct: 0, stockPct: 0.5, debtPct: 0.5 };
    const r = accretionDilution(base);
    expect(r.afterTaxInterestCost).toBeCloseTo(11.25, 2);
    expect(r.newShares).toBeCloseTo(13.89, 2);
    expect(r.proFormaNetIncome).toBeCloseTo(148.75, 2);
    expect(r.proFormaEps).toBeCloseTo(1.306, 3);
    expect(r.accretionPct).toBeCloseTo(0.088, 3);

    const withSyn = accretionDilution({ ...base, synergies: 20 });
    expect(withSyn.proFormaNetIncome).toBeCloseTo(163.75, 2);
    expect(withSyn.proFormaEps).toBeCloseTo(1.438, 3);
    expect(withSyn.accretionPct).toBeCloseTo(0.198, 3);
  });

  it("new amortisation and fees come off pro-forma income after tax", () => {
    const base = { ...TAMAR_DEAL, cashPct: 0, stockPct: 0.5, debtPct: 0.5 };
    const r = accretionDilution({ ...base, newAmortisation: 6, fees: 10 });
    // £16m of extra pre-tax charges → £12m after tax off the £148.75m base.
    expect(r.proFormaNetIncome).toBeCloseTo(136.75, 2);
  });

  it("lesson 2 your-turn: a 12× buyer paying 14× in stock dilutes ~4 %", () => {
    const r = accretionDilution({
      acquirerNetIncome: 60,
      acquirerShares: 50,
      acquirerPe: 12,
      targetNetIncome: 20,
      offerValue: 280,
      cashPct: 0,
      stockPct: 1,
      debtPct: 0,
      costOfDebt: 0.06,
      taxRate: 0.25,
      foregoneInterestRate: 0.04,
    });
    expect(r.newShares).toBeCloseTo(19.44, 2);
    expect(r.proFormaEps).toBeCloseTo(1.152, 3);
    expect(r.accretionPct).toBeCloseTo(-0.04, 2);
  });

  it("lesson 3 your-turn: 40 % debt at 5 % / 60 % stock → EPS £1.54, +2.7 %", () => {
    const r = accretionDilution({
      acquirerNetIncome: 90,
      acquirerShares: 60,
      acquirerPe: 10, // price £15 on EPS £1.50
      targetNetIncome: 30,
      offerValue: 360,
      cashPct: 0,
      stockPct: 0.6,
      debtPct: 0.4,
      costOfDebt: 0.05,
      taxRate: 0.25,
      foregoneInterestRate: 0.04,
    });
    expect(r.afterTaxInterestCost).toBeCloseTo(5.4, 2);
    expect(r.newShares).toBeCloseTo(14.4, 2);
    expect(r.proFormaNetIncome).toBeCloseTo(114.6, 2);
    expect(r.proFormaEps).toBeCloseTo(1.54, 2);
    expect(r.accretionPct).toBeCloseTo(0.027, 3);
  });

  it("goodwill on Wychwood: 500 − (220 + 60) = £220m; the DTL raises it to £235m", () => {
    const plain = goodwill({ purchasePrice: 500, bookEquity: 220, writeUps: 60 });
    expect(plain.identifiableNetAssets).toBeCloseTo(280, 2);
    expect(plain.goodwill).toBeCloseTo(220, 2);

    const withDtl = goodwill({ purchasePrice: 500, bookEquity: 220, writeUps: 60, dtlRate: 0.25 });
    expect(withDtl.dtl).toBeCloseTo(15, 2);
    expect(withDtl.goodwill).toBeCloseTo(235, 2);
  });

  it("synergies as a perpetuity: ≈ £167m net against the £100m premium", () => {
    // £20m pre-tax run rate, half in year 1, £20m one-off cost, 8 % — the spec's untaxed-cost
    // hand-walk says £160m; taxing the cost like every other line gives £166.7m. Library wins.
    const r = synergyPerpetuityNpv({ annualSynergies: 20, phaseInYears: 2, integrationCost: 20, discountRate: 0.08, taxRate: 0.25 });
    expect(r.byYear[0]).toBeCloseTo(-7.5, 2); // (10 − 20) × 0.75
    expect(r.byYear[1]).toBeCloseTo(15, 2);
    expect(r.npv).toBeCloseTo(166.7, 1);
  });

  it("breakeven run rate against the £100m premium is ≈ £12.6m pre-tax", () => {
    const at = (s: number) => synergyPerpetuityNpv({ annualSynergies: s, phaseInYears: 2, integrationCost: 20, discountRate: 0.08, taxRate: 0.25 }).npv;
    expect(at(12.6)).toBeCloseTo(100, 0);
    expect(at(9.5)).toBeLessThan(75); // the spec's "9–10" claim does not cover the premium
  });

  it("a longer phase-in destroys value; the perpetuity agrees with the finite sum in the limit", () => {
    const fast = synergyPerpetuityNpv({ annualSynergies: 20, phaseInYears: 2, integrationCost: 20, discountRate: 0.08, taxRate: 0.25 });
    const slow = synergyPerpetuityNpv({ annualSynergies: 20, phaseInYears: 4, integrationCost: 20, discountRate: 0.08, taxRate: 0.25 });
    expect(slow.npv).toBeLessThan(fast.npv);

    const finite = synergyNpv({ annualSynergies: 20, phaseInYears: 2, integrationCost: 20, discountRate: 0.08, taxRate: 0.25, years: 200 });
    expect(finite.npv).toBeCloseTo(fast.npv, 1);
  });

  it("the offer is a 25 % premium and 12.5× the target's earnings", () => {
    expect(premiumPct({ offerValue: 500, undisturbedValue: 400 })).toBeCloseTo(0.25, 4);
    expect(500 / 40).toBeCloseTo(12.5, 4);
    // Earnings-yield framing: Wychwood yields 8 % at the price paid; Tamar's own yield is 6.67 %.
    expect(earningsYield(12.5)).toBeCloseTo(0.08, 4);
    expect(earningsYield(15)).toBeCloseTo(0.0667, 4);
  });
});
