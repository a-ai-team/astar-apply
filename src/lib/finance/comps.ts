// Comparable-companies maths (Loop 15). Spreading a peer set and turning a multiple back into a
// value: the arithmetic behind the `football_field` widget and every comps question in the chapter.
// Median is the working banker's default because one outlier peer should not move the answer — the
// `mean` here exists so a student can watch the two diverge. Keep this file free of React.

/** Arithmetic mean. Returns null for an empty set rather than NaN. */
export function mean(xs: number[]): number | null {
  if (xs.length === 0) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Median; the mid-point of the two central values when the count is even. */
export function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Low / high / quartiles of a peer set. Quartiles use the **inclusive** convention — the central
 * value belongs to both halves — which is what the chapter's authored ranges assume (five peers at
 * 8.0×–12.0× give an interquartile band of 9.0×–12.0×) and what a spreadsheet's QUARTILE.INC does.
 */
export function spread(xs: number[]): { low: number; q1: number; median: number; q3: number; high: number } | null {
  if (xs.length === 0) return null;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const odd = sorted.length % 2 === 1;
  const lower = sorted.slice(0, odd ? mid + 1 : mid);
  const upper = sorted.slice(mid);
  return {
    low: sorted[0],
    q1: median(lower) ?? sorted[0],
    median: median(sorted)!,
    q3: median(upper) ?? sorted[sorted.length - 1],
    high: sorted[sorted.length - 1],
  };
}

export type ImpliedInput = {
  multiple: number;
  /** The metric the multiple is applied to — EBITDA, EBIT, revenue, whatever the multiple is of. */
  metric: number;
  /**
   * Everything the EV → equity bridge subtracts, netted: debt + leases + preferred + NCI − cash.
   * For Marlow that is 240 + 30 − 60 = 210.
   */
  netDebt: number;
  shares?: number;
};

export type Implied = { enterpriseValue: number; equityValue: number; perShare: number | null };

/** Multiple × metric → EV, then across the bridge to equity value and (given a share count) per share. */
export function impliedFromMultiple({ multiple, metric, netDebt, shares }: ImpliedInput): Implied {
  const enterpriseValue = multiple * metric;
  const equityValue = enterpriseValue - netDebt;
  return { enterpriseValue, equityValue, perShare: shares && shares > 0 ? equityValue / shares : null };
}

/** The reverse: what multiple is the market itself paying for this company right now? */
export function multipleFromValue({ enterpriseValue, metric }: { enterpriseValue: number; metric: number }): number | null {
  return metric === 0 ? null : enterpriseValue / metric;
}

/** EV implied by an equity value and the bridge — the market EV a comps table is built from. */
export function enterpriseFromEquity({ equityValue, netDebt }: { equityValue: number; netDebt: number }): number {
  return equityValue + netDebt;
}
