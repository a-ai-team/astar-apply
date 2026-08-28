// Working capital and the cash conversion cycle (Loop 13). Pure maths: convert between balance-sheet
// amounts and the days they represent, and turn those days back into the cash a business has tied up.
// Widgets and `fill_numbers` grading both import from here. Money in £m, days in days.
//
// The cycle is the gap between paying a supplier and being paid by a customer:
//
//     CCC = DIO + DSO − DPO
//
// A positive cycle means the company funds that gap itself. A negative cycle means its suppliers do —
// the supermarket case, where stock is sold long before the invoice for it falls due.

export const DAYS_IN_YEAR = 365;

/**
 * Days a balance represents, given the annual flow it relates to.
 * Receivables run off revenue; inventory and payables run off COGS.
 *
 * Kestrel Foods: receivables 50 on revenue 500 → 36.5 days.
 */
export function daysFromBalance(balance: number, annualFlow: number): number {
  if (annualFlow === 0) return 0;
  return (balance / annualFlow) * DAYS_IN_YEAR;
}

/** The inverse: the balance implied by a number of days. 36.5 days on revenue 500 → 50. */
export function balanceFromDays(days: number, annualFlow: number): number {
  return (days / DAYS_IN_YEAR) * annualFlow;
}

/**
 * Cash conversion cycle in days. Negative means suppliers are funding the working capital.
 *
 * Kestrel Foods: DIO 48.7 + DSO 36.5 − DPO 36.5 ≈ 48.7 days.
 */
export function cashConversionCycle({ dso, dio, dpo }: { dso: number; dio: number; dpo: number }): number {
  return dio + dso - dpo;
}

export type WorkingCapitalPosition = {
  receivables: number;
  inventory: number;
  payables: number;
  /** Receivables + inventory − payables: the operating investment, excluding cash and debt. */
  netWorkingCapital: number;
  ccc: number;
};

/**
 * The cash tied up in operating working capital, derived from the days and the annual flows.
 * Cash and debt are deliberately excluded — this is the *operating* definition a DCF forecasts.
 *
 * Kestrel Foods at its base year: 50 + 40 − 30 = £60m.
 */
export function workingCapitalTiedUp({
  dso,
  dio,
  dpo,
  revenue,
  cogs,
}: {
  dso: number;
  dio: number;
  dpo: number;
  revenue: number;
  cogs: number;
}): WorkingCapitalPosition {
  const receivables = balanceFromDays(dso, revenue);
  const inventory = balanceFromDays(dio, cogs);
  const payables = balanceFromDays(dpo, cogs);
  return {
    receivables,
    inventory,
    payables,
    netWorkingCapital: receivables + inventory - payables,
    ccc: cashConversionCycle({ dso, dio, dpo }),
  };
}
