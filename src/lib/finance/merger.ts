// M&A maths (Loop 11): accretion/dilution, goodwill and the NPV of synergies against the premium.
// Backs `accretion_rule`, `ppa_goodwill` and `synergy_npv`. Money in £m, rates as decimals.
import { npv } from "./discount";

export type AccretionInput = {
  acquirerNetIncome: number;
  acquirerShares: number;
  /** The acquirer's P/E — used to price the stock issued. */
  acquirerPe: number;
  targetNetIncome: number;
  /** Equity value paid for the target. */
  offerValue: number;
  /** Funding mix; the three should sum to 1. */
  cashPct: number;
  stockPct: number;
  debtPct: number;
  /** Pre-tax rate on the new acquisition debt. */
  costOfDebt: number;
  taxRate: number;
  /** Rate the acquirer was earning on the cash it spends. */
  foregoneInterestRate: number;
  /** Pre-tax annual synergies; tax-affected inside. */
  synergies?: number;
  /**
   * Annual amortisation of intangibles written up at the deal (Loop 17, the widget's "full mode").
   * A book charge: it reduces pre-tax income, so pro-forma EPS loses it after tax — whether or not
   * the cash tax man allows the deduction is a deferred-tax matter EPS never sees.
   */
  newAmortisation?: number;
  /** One-off deal fees, expensed pre-tax in the pro-forma year (Loop 17). */
  fees?: number;
};

export type AccretionResult = {
  standaloneEps: number;
  proFormaEps: number;
  accretionPct: number;
  newShares: number;
  isAccretive: boolean;
  proFormaNetIncome: number;
  proFormaShares: number;
  /** After-tax cost of each funding leg, for the widget's "cost of the currency" readout. */
  afterTaxInterestCost: number;
  afterTaxForegoneInterest: number;
};

/**
 * Pro-forma EPS after an acquisition funded with any mix of cash, stock and debt.
 *
 * Combined net income = acquirer + target + synergies − after-tax new interest − after-tax
 * forgone interest on the cash spent. New shares = stock consideration ÷ the acquirer's share
 * price, where the share price is implied by its P/E.
 */
export function accretionDilution(i: AccretionInput): AccretionResult {
  const standaloneEps = i.acquirerShares === 0 ? 0 : i.acquirerNetIncome / i.acquirerShares;
  const acquirerSharePrice = standaloneEps * i.acquirerPe;

  const stockConsideration = i.offerValue * i.stockPct;
  const cashConsideration = i.offerValue * i.cashPct;
  const debtConsideration = i.offerValue * i.debtPct;

  const newShares = acquirerSharePrice === 0 ? 0 : stockConsideration / acquirerSharePrice;
  const afterTaxInterestCost = debtConsideration * i.costOfDebt * (1 - i.taxRate);
  const afterTaxForegoneInterest = cashConsideration * i.foregoneInterestRate * (1 - i.taxRate);

  const proFormaNetIncome =
    i.acquirerNetIncome +
    i.targetNetIncome +
    ((i.synergies ?? 0) - (i.newAmortisation ?? 0) - (i.fees ?? 0)) * (1 - i.taxRate) -
    afterTaxInterestCost -
    afterTaxForegoneInterest;
  const proFormaShares = i.acquirerShares + newShares;
  const proFormaEps = proFormaShares === 0 ? 0 : proFormaNetIncome / proFormaShares;

  return {
    standaloneEps,
    proFormaEps,
    accretionPct: standaloneEps === 0 ? 0 : proFormaEps / standaloneEps - 1,
    newShares,
    isAccretive: proFormaEps > standaloneEps,
    proFormaNetIncome,
    proFormaShares,
    afterTaxInterestCost,
    afterTaxForegoneInterest,
  };
}

/**
 * The all-stock shortcut: a deal is accretive when the target's earnings yield at the price paid
 * beats the acquirer's earnings yield (equivalently, when the acquirer's P/E exceeds the P/E paid).
 */
export function allStockAccretive({ acquirerPe, pePaid }: { acquirerPe: number; pePaid: number }): boolean {
  return acquirerPe > pePaid;
}

/** Earnings yield = 1 / P/E — the "cost of the currency" framing. */
export function earningsYield(pe: number): number {
  return pe === 0 ? 0 : 1 / pe;
}

export type GoodwillInput = {
  purchasePrice: number;
  bookEquity: number;
  /** Fair-value write-ups of identifiable assets (PP&E, intangibles). */
  writeUps: number;
  /** Deferred-tax liability created on the write-ups, as a rate. */
  dtlRate?: number;
};

export type GoodwillResult = { goodwill: number; dtl: number; identifiableNetAssets: number };

/** Goodwill is the residual: price − (book equity + write-ups − the DTL those write-ups create). */
export function goodwill(i: GoodwillInput): GoodwillResult {
  const dtl = i.writeUps * (i.dtlRate ?? 0);
  const identifiableNetAssets = i.bookEquity + i.writeUps - dtl;
  return { goodwill: i.purchasePrice - identifiableNetAssets, dtl, identifiableNetAssets };
}

export type SynergyInput = {
  /** Run-rate annual synergies once fully phased in. */
  annualSynergies: number;
  /** Years over which they ramp linearly to the run rate. */
  phaseInYears: number;
  /** One-off cost to achieve, taken in year 1. */
  integrationCost: number;
  discountRate: number;
  years: number;
  taxRate?: number;
};

export type SynergyResult = { npv: number; byYear: number[] };

/** PV of the synergy stream net of the cost to achieve — the number to set against the premium. */
export function synergyNpv(i: SynergyInput): SynergyResult {
  const taxRate = i.taxRate ?? 0;
  const byYear: number[] = [];
  for (let year = 1; year <= i.years; year++) {
    const ramp = i.phaseInYears <= 0 ? 1 : Math.min(1, year / i.phaseInYears);
    const gross = i.annualSynergies * ramp;
    const cost = year === 1 ? i.integrationCost : 0;
    byYear.push((gross - cost) * (1 - taxRate));
  }
  return { npv: npv(byYear, i.discountRate), byYear };
}

/**
 * Perpetuity version of the synergy NPV (Loop 17): ramp years explicitly, then capitalise the
 * run rate forever. Same conventions as `synergyNpv` — the integration cost lands in year 1 and
 * everything is tax-affected, so a spec that leaves the one-off cost untaxed will come out lower
 * than this (Tamar / Wychwood: ≈ £167m here vs the hand-walk's £160m).
 */
export function synergyPerpetuityNpv(i: Omit<SynergyInput, "years">): SynergyResult {
  const taxRate = i.taxRate ?? 0;
  const rampYears = Math.max(1, Math.ceil(i.phaseInYears));
  const byYear: number[] = [];
  for (let year = 1; year <= rampYears; year++) {
    const ramp = i.phaseInYears <= 0 ? 1 : Math.min(1, year / i.phaseInYears);
    const cost = year === 1 ? i.integrationCost : 0;
    byYear.push((i.annualSynergies * ramp - cost) * (1 - taxRate));
  }
  const explicit = npv(byYear, i.discountRate);
  // Level run rate from the year after the ramp, valued as at the end of the ramp.
  const perpetuity =
    i.discountRate <= 0 ? 0 : (i.annualSynergies * (1 - taxRate)) / i.discountRate / Math.pow(1 + i.discountRate, rampYears);
  return { npv: explicit + perpetuity, byYear };
}

/** Premium paid over the target's undisturbed equity value, as a percentage. */
export function premiumPct({ offerValue, undisturbedValue }: { offerValue: number; undisturbedValue: number }): number {
  return undisturbedValue === 0 ? 0 : offerValue / undisturbedValue - 1;
}
