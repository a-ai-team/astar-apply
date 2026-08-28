// Time value of money (Loop 11): present value, NPV, IRR and the mental-maths shortcuts an
// interviewer expects. Backs the `discount_dial` widget and the Foundations/DCF/LBO chapters.
// Rates are decimals (0.10 = 10 %); `years` may be fractional.

export type DiscountOpts = { midYear?: boolean };

/** Discount exponent for period n (1-based). Mid-year convention shifts each period back half a year. */
export function periodExponent(n: number, opts: DiscountOpts = {}): number {
  return opts.midYear ? n - 0.5 : n;
}

/** Present value of a single cash flow received in `years` time. */
export function pv(cashFlow: number, rate: number, years: number, opts: DiscountOpts = {}): number {
  return cashFlow / (1 + rate) ** periodExponent(years, opts);
}

/** Discount factor applied to period n (1-based) — what the DCF build sheet shows. */
export function discountFactor(rate: number, n: number, opts: DiscountOpts = {}): number {
  return 1 / (1 + rate) ** periodExponent(n, opts);
}

/**
 * NPV of cash flows in periods 1…n. Pass a period-0 outflow separately (or prepend it and use
 * `npvFromZero`) — this treats `cashFlows[0]` as the year-1 flow, which is how a DCF is built.
 */
export function npv(cashFlows: number[], rate: number, opts: DiscountOpts = {}): number {
  return cashFlows.reduce((sum, cf, i) => sum + pv(cf, rate, i + 1, opts), 0);
}

/** NPV where `cashFlows[0]` is an undiscounted period-0 flow (the investment). */
export function npvFromZero(cashFlows: number[], rate: number): number {
  return cashFlows.reduce((sum, cf, i) => sum + cf / (1 + rate) ** i, 0);
}

export type IrrOpts = { guess?: number; tolerance?: number; maxIterations?: number };

/**
 * IRR of a period-0-first cash-flow series (`[-100, 30, 30, 30, 30, 30]`). Bisection over
 * [−0.99, 10]; returns null when the series never changes sign (no IRR exists).
 */
export function irr(cashFlows: number[], opts: IrrOpts = {}): number | null {
  const tolerance = opts.tolerance ?? 1e-7;
  const maxIterations = opts.maxIterations ?? 200;
  const hasPositive = cashFlows.some((c) => c > 0);
  const hasNegative = cashFlows.some((c) => c < 0);
  if (!hasPositive || !hasNegative) return null;

  let lo = -0.9999;
  let hi = 10;
  let fLo = npvFromZero(cashFlows, lo);
  let fHi = npvFromZero(cashFlows, hi);
  if (fLo * fHi > 0) return null;

  for (let i = 0; i < maxIterations; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npvFromZero(cashFlows, mid);
    if (Math.abs(fMid) < tolerance || hi - lo < tolerance) return mid;
    if (fLo * fMid <= 0) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return (lo + hi) / 2;
}

/**
 * Discount exponent for period n under the mid-year convention (n − 0.5): cash arrives evenly
 * through the year, not all on 31 December. Named separately from `periodExponent` because the
 * Foundations chapter teaches the convention explicitly.
 */
export function midYearExponent(n: number): number {
  return periodExponent(n, { midYear: true });
}

/**
 * Present value of £1 a year for `years` years — the annuity factor. `annuityFactor(0.08, 5)`
 * is 3.9927, so a £0.6m-a-year saving is worth 0.6 × 3.9927 = £2.396m today.
 * Falls back to the plain sum when the mid-year convention is on (the closed form assumes year-end).
 */
export function annuityFactor(rate: number, years: number, opts: DiscountOpts = {}): number {
  const n = Math.max(0, Math.floor(years));
  if (n === 0) return 0;
  if (opts.midYear) {
    let sum = 0;
    for (let i = 1; i <= n; i++) sum += discountFactor(rate, i, opts);
    return sum;
  }
  if (rate === 0) return n;
  return (1 - (1 + rate) ** -n) / rate;
}

/** Money multiple (MoM / MOIC). */
export function moneyMultiple(exit: number, entry: number): number {
  if (entry === 0) return 0;
  return exit / entry;
}

/** Years to double at a given rate — the interview shortcut. `ruleOf72(0.15) ≈ 4.8`. */
export function ruleOf72(rate: number): number {
  if (rate <= 0) return Infinity;
  return 0.72 / rate;
}

/** The annualised return implied by a money multiple over `years` — 2× in 5 years ≈ 14.87 %. */
export function impliedRateFromMultiple(multiple: number, years: number): number {
  if (years <= 0 || multiple <= 0) return 0;
  return multiple ** (1 / years) - 1;
}

/** The money multiple implied by a rate over `years` — the reverse of the above. */
export function multipleFromRate(rate: number, years: number): number {
  return (1 + rate) ** years;
}
