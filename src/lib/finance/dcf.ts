// DCF maths (Loop 11): unlevered free cash flow, both terminal-value methods with their
// cross-checks, the value build and the WACC × g sensitivity grid. Backs `dcf_sensitivity`,
// `tv_share`, `gordon_vs_exit` and the `dcf_sheet` template. Money in £m, rates as decimals.
import { discountFactor, type DiscountOpts } from "./discount";

export type UfcfInput = {
  ebit: number;
  taxRate: number;
  da: number;
  capex: number;
  /** Increase in net working capital — a positive number is a use of cash. */
  changeInNwc: number;
};

/** UFCF = EBIT × (1 − tax) + D&A − capex − ΔNWC. The one formula every DCF answer needs. */
export function unleveredFreeCashFlow(i: UfcfInput): number {
  return i.ebit * (1 - i.taxRate) + i.da - i.capex - i.changeInNwc;
}

/** NOPAT — the after-tax operating profit the UFCF build starts from. */
export function nopat(ebit: number, taxRate: number): number {
  return ebit * (1 - taxRate);
}

/** Gordon growth: TV = final-year FCF × (1 + g) / (WACC − g). Throws when g ≥ WACC. */
export function terminalValueGordon({ finalFcf, growth, wacc }: { finalFcf: number; growth: number; wacc: number }): number {
  if (growth >= wacc) throw new Error(`terminal growth ${growth} must be below WACC ${wacc}`);
  return (finalFcf * (1 + growth)) / (wacc - growth);
}

/** Exit multiple: TV = final-year EBITDA × the multiple. */
export function terminalValueExitMultiple({ finalEbitda, multiple }: { finalEbitda: number; multiple: number }): number {
  return finalEbitda * multiple;
}

/** The growth rate a given TV implies — the sanity check on an exit-multiple TV. */
export function impliedGrowth({ tv, finalFcf, wacc }: { tv: number; finalFcf: number; wacc: number }): number {
  if (tv === 0) return 0;
  // tv = finalFcf (1+g) / (wacc − g)  ⟹  g = (tv·wacc − finalFcf) / (tv + finalFcf)
  return (tv * wacc - finalFcf) / (tv + finalFcf);
}

/** The exit multiple a given TV implies — the sanity check on a Gordon-growth TV. */
export function impliedExitMultiple({ tv, finalEbitda }: { tv: number; finalEbitda: number }): number {
  if (finalEbitda === 0) return 0;
  return tv / finalEbitda;
}

export type DcfValueInput = {
  /** Explicit-period unlevered free cash flows, year 1 first. */
  cashFlows: number[];
  wacc: number;
  terminalValue: number;
  midYear?: boolean;
};

export type DcfValueResult = {
  pvExplicit: number;
  pvTerminal: number;
  enterpriseValue: number;
  /** PV(TV) ÷ EV — the number that shows how much of a DCF is the terminal assumption. */
  terminalShare: number;
  /** Per-year PV of each explicit cash flow, for the build sheet. */
  pvByYear: number[];
};

/**
 * Discount the explicit flows and the terminal value to today. The TV is discounted at the last
 * explicit year's factor (mid-year convention applies to the explicit flows; the TV sits at the
 * end of the final year, which is the convention the chapter specs teach).
 */
export function dcfValue(i: DcfValueInput): DcfValueResult {
  const opts: DiscountOpts = { midYear: i.midYear };
  const pvByYear = i.cashFlows.map((cf, idx) => cf * discountFactor(i.wacc, idx + 1, opts));
  const pvExplicit = pvByYear.reduce((s, v) => s + v, 0);
  const n = i.cashFlows.length;
  const pvTerminal = i.terminalValue * discountFactor(i.wacc, n);
  const enterpriseValue = pvExplicit + pvTerminal;
  return {
    pvExplicit,
    pvTerminal,
    enterpriseValue,
    terminalShare: enterpriseValue === 0 ? 0 : pvTerminal / enterpriseValue,
    pvByYear,
  };
}

/** EV → equity value → per share, the last two rows of every DCF walk-through. */
export function equityValuePerShare({ enterpriseValue, netDebt, otherClaims = 0, dilutedShares }: { enterpriseValue: number; netDebt: number; otherClaims?: number; dilutedShares: number }): { equityValue: number; perShare: number } {
  const equityValue = enterpriseValue - netDebt - otherClaims;
  return { equityValue, perShare: dilutedShares === 0 ? 0 : equityValue / dilutedShares };
}

export type SensitivityInput = {
  waccs: number[];
  growths: number[];
  cashFlows: number[];
  finalFcf: number;
  midYear?: boolean;
  /** When given, the grid returns value per share instead of enterprise value. */
  netDebt?: number;
  dilutedShares?: number;
};

/**
 * WACC × terminal-growth grid. Rows are WACCs, columns are growth rates. Cells where g ≥ WACC are
 * `null` — the widget renders those as "n/a", which is itself the lesson.
 */
export function sensitivityGrid(i: SensitivityInput): (number | null)[][] {
  return i.waccs.map((wacc) =>
    i.growths.map((growth) => {
      if (growth >= wacc) return null;
      const tv = terminalValueGordon({ finalFcf: i.finalFcf, growth, wacc });
      const { enterpriseValue } = dcfValue({ cashFlows: i.cashFlows, wacc, terminalValue: tv, midYear: i.midYear });
      if (i.dilutedShares && i.dilutedShares > 0) {
        return (enterpriseValue - (i.netDebt ?? 0)) / i.dilutedShares;
      }
      return enterpriseValue;
    }),
  );
}

/** Project a starting figure forward at a constant rate — the projections lesson's helper. */
export function project(start: number, rate: number, years: number): number[] {
  const out: number[] = [];
  let v = start;
  for (let i = 0; i < years; i++) {
    v = v * (1 + rate);
    out.push(v);
  }
  return out;
}

/**
 * Extend an explicit projection to `years` by fading the last observed growth rate linearly down
 * to the terminal rate (Loop 16, backs `tv_share`). Real models taper towards steady state rather
 * than holding the final year's growth, and the taper is what makes the terminal-value share fall
 * as the projection lengthens. Shorter than the input simply truncates.
 */
export function extendProjection(cashFlows: number[], years: number, terminalGrowth: number): number[] {
  if (cashFlows.length === 0 || years <= 0) return [];
  if (years <= cashFlows.length) return cashFlows.slice(0, years);
  const out = [...cashFlows];
  const lastGrowth = cashFlows.length > 1 ? cashFlows[cashFlows.length - 1] / cashFlows[cashFlows.length - 2] - 1 : terminalGrowth;
  const extra = years - cashFlows.length;
  for (let i = 1; i <= extra; i++) {
    const g = lastGrowth + ((terminalGrowth - lastGrowth) * i) / extra;
    out.push(out[out.length - 1] * (1 + g));
  }
  return out;
}
