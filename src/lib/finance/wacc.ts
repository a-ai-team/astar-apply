// Cost of capital (Loop 11): CAPM, WACC, and un/relevering beta. Backs `wacc_builder` and
// `beta_relever`. Rates are decimals (0.045 = 4.5 %); values in £m.

export type CapmInput = {
  riskFree: number;
  beta: number;
  equityRiskPremium: number;
  sizePremium?: number;
};

/** Ke = Rf + β × ERP (+ size premium where a bank uses one). */
export function costOfEquityCapm(i: CapmInput): number {
  return i.riskFree + i.beta * i.equityRiskPremium + (i.sizePremium ?? 0);
}

export type WaccInput = {
  /** Market values, not book. */
  equityValue: number;
  debtValue: number;
  costOfEquity: number;
  costOfDebt: number;
  taxRate: number;
  preferredValue?: number;
  costOfPreferred?: number;
};

export type WaccResult = {
  wacc: number;
  equityWeight: number;
  debtWeight: number;
  preferredWeight: number;
  afterTaxCostOfDebt: number;
};

/** WACC = We·Ke + Wd·Kd·(1 − t) (+ Wp·Kp). Weights are market-value weights. */
export function wacc(i: WaccInput): WaccResult {
  const preferredValue = i.preferredValue ?? 0;
  const total = i.equityValue + i.debtValue + preferredValue;
  if (total === 0) return { wacc: 0, equityWeight: 0, debtWeight: 0, preferredWeight: 0, afterTaxCostOfDebt: 0 };
  const equityWeight = i.equityValue / total;
  const debtWeight = i.debtValue / total;
  const preferredWeight = preferredValue / total;
  const afterTaxCostOfDebt = i.costOfDebt * (1 - i.taxRate);
  return {
    wacc: equityWeight * i.costOfEquity + debtWeight * afterTaxCostOfDebt + preferredWeight * (i.costOfPreferred ?? 0),
    equityWeight,
    debtWeight,
    preferredWeight,
    afterTaxCostOfDebt,
  };
}

/** βu = βl / (1 + (1 − t) × D/E) — strip a comp's capital structure out of its beta. */
export function unleverBeta({ leveredBeta, debtToEquity, taxRate }: { leveredBeta: number; debtToEquity: number; taxRate: number }): number {
  return leveredBeta / (1 + (1 - taxRate) * debtToEquity);
}

/** βl = βu × (1 + (1 − t) × D/E) — put the target's capital structure back in. */
export function releverBeta({ unleveredBeta, debtToEquity, taxRate }: { unleveredBeta: number; debtToEquity: number; taxRate: number }): number {
  return unleveredBeta * (1 + (1 - taxRate) * debtToEquity);
}

/** Median of a beta set — why you never simply average raw betas is the lesson; this is step 2. */
export function medianBeta(betas: number[]): number {
  if (betas.length === 0) return 0;
  const sorted = [...betas].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export type Comp = { name: string; leveredBeta: number; debtToEquity: number; taxRate: number };

/**
 * The full un/relever round trip: unlever every comp, take the median, relever at the target's
 * capital structure. Returns the intermediate numbers so the widget can show its working.
 */
export function releveredBetaFromComps({ comps, targetDebtToEquity, targetTaxRate }: { comps: Comp[]; targetDebtToEquity: number; targetTaxRate: number }): {
  unlevered: { name: string; beta: number }[];
  medianUnlevered: number;
  relevered: number;
} {
  const unlevered = comps.map((c) => ({ name: c.name, beta: unleverBeta({ leveredBeta: c.leveredBeta, debtToEquity: c.debtToEquity, taxRate: c.taxRate }) }));
  const medianUnlevered = medianBeta(unlevered.map((u) => u.beta));
  return {
    unlevered,
    medianUnlevered,
    relevered: releverBeta({ unleveredBeta: medianUnlevered, debtToEquity: targetDebtToEquity, taxRate: targetTaxRate }),
  };
}

export type LeverageSweepInput = {
  /** The company's observed (levered) beta at `baseDebtToEquity`. */
  beta: number;
  baseDebtToEquity: number;
  riskFree: number;
  equityRiskPremium: number;
  costOfDebt: number;
  taxRate: number;
  /** Relever beta as leverage rises — the honest version. False holds beta fixed. */
  relever?: boolean;
  /**
   * Lenders re-price above this leverage. Beyond it the cost of debt rises quadratically at
   * `spreadSlope`, which is what turns the curve back up and produces the U (Loop 16).
   */
  spreadFrom?: number;
  spreadSlope?: number;
  /** Debt-to-value points to evaluate, 0–0.95. */
  points?: number[];
};

export type LeveragePoint = { debtWeight: number; beta: number; costOfEquity: number; costOfDebt: number; wacc: number };

/**
 * WACC across a range of capital structures — the picture behind "why not fund everything with
 * debt?". With `relever: false` and a flat cost of debt the curve is a straight line down, which is
 * exactly the naive answer; relevering beta and letting lenders re-price bends it into a U.
 */
export function leverageSweep(i: LeverageSweepInput): LeveragePoint[] {
  const unlevered = unleverBeta({ leveredBeta: i.beta, debtToEquity: i.baseDebtToEquity, taxRate: i.taxRate });
  const spreadFrom = i.spreadFrom ?? 0.4;
  const spreadSlope = i.spreadSlope ?? 0.35;
  const points = i.points ?? Array.from({ length: 17 }, (_, n) => n * 0.05);
  return points.map((debtWeight) => {
    const dv = Math.min(0.95, Math.max(0, debtWeight));
    const debtToEquity = dv >= 1 ? Number.POSITIVE_INFINITY : dv / (1 - dv);
    const beta = i.relever ? releverBeta({ unleveredBeta: unlevered, debtToEquity, taxRate: i.taxRate }) : i.beta;
    const costOfEquity = costOfEquityCapm({ riskFree: i.riskFree, beta, equityRiskPremium: i.equityRiskPremium });
    const excess = Math.max(0, dv - spreadFrom);
    const costOfDebt = i.relever ? i.costOfDebt + spreadSlope * excess ** 2 : i.costOfDebt;
    return { debtWeight: dv, beta, costOfEquity, costOfDebt, wacc: (1 - dv) * costOfEquity + dv * costOfDebt * (1 - i.taxRate) };
  });
}

/** The capital structure with the lowest WACC in a sweep — the bottom of the U. */
export function minimumWaccPoint(points: LeveragePoint[]): LeveragePoint | null {
  return points.reduce<LeveragePoint | null>((best, p) => (best === null || p.wacc < best.wacc ? p : best), null);
}
