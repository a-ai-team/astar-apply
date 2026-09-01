// LBO maths (Loop 11): sources & uses, returns, the three-lever decomposition and a paper-LBO
// debt schedule. Backs `lbo_returns`, `paper_lbo` and the `paper_lbo` template. Money in £m.
import { impliedRateFromMultiple, moneyMultiple } from "./discount";

export type DebtTranche = {
  name: string;
  amount: number;
  rate: number;
  /** Mandatory amortisation as a share of the original principal each year (0.01 = 1 %). */
  amortPct?: number;
};

export type SourcesUsesInput = {
  entryEbitda: number;
  entryMultiple: number;
  /** Existing net debt repaid at close. */
  netDebtRepaid?: number;
  /** Transaction and financing fees. */
  fees?: number;
  debtTranches: DebtTranche[];
};

export type SourcesUsesResult = {
  purchasePrice: number;
  uses: { label: string; amount: number }[];
  sources: { label: string; amount: number }[];
  totalUses: number;
  totalDebt: number;
  sponsorEquity: number;
  /** Total debt ÷ EBITDA — the leverage an interviewer asks for. */
  leverageTurns: number;
};

/**
 * Sources & uses. Uses = purchase price (EV) + fees + any existing debt repaid. Sources = the debt
 * tranches, and the sponsor's equity is the plug that makes the two sides balance.
 */
export function sourcesAndUses(i: SourcesUsesInput): SourcesUsesResult {
  const purchasePrice = i.entryEbitda * i.entryMultiple;
  const netDebtRepaid = i.netDebtRepaid ?? 0;
  const fees = i.fees ?? 0;

  const uses = [
    { label: "Purchase of equity / enterprise value", amount: purchasePrice },
    ...(netDebtRepaid ? [{ label: "Repay existing debt", amount: netDebtRepaid }] : []),
    ...(fees ? [{ label: "Fees", amount: fees }] : []),
  ];
  const totalUses = uses.reduce((s, u) => s + u.amount, 0);
  const totalDebt = i.debtTranches.reduce((s, t) => s + t.amount, 0);
  const sponsorEquity = totalUses - totalDebt;

  return {
    purchasePrice,
    uses,
    sources: [...i.debtTranches.map((t) => ({ label: t.name, amount: t.amount })), { label: "Sponsor equity", amount: sponsorEquity }],
    totalUses,
    totalDebt,
    sponsorEquity,
    leverageTurns: i.entryEbitda === 0 ? 0 : totalDebt / i.entryEbitda,
  };
}

export type LboReturnsResult = { moM: number; irr: number };

/** MoM and the annualised IRR it implies over the hold period. */
export function lboReturns({ sponsorEquity, exitEquity, years }: { sponsorEquity: number; exitEquity: number; years: number }): LboReturnsResult {
  const moM = moneyMultiple(exitEquity, sponsorEquity);
  return { moM, irr: impliedRateFromMultiple(moM, years) };
}

export type DecomposeInput = {
  entryEbitda: number;
  exitEbitda: number;
  entryMultiple: number;
  exitMultiple: number;
  entryNetDebt: number;
  exitNetDebt: number;
};

export type DecomposeResult = {
  /** Equity created by paying debt down with the business's cash. */
  deleveraging: number;
  /** Equity created by growing EBITDA, held at the entry multiple. */
  ebitdaGrowth: number;
  /** Equity created (or destroyed) by exiting at a different multiple. */
  multipleExpansion: number;
  /** The change in sponsor equity value — the three levers sum to exactly this. */
  total: number;
  entryEquity: number;
  exitEquity: number;
};

/**
 * Split the equity gain into the three levers an interviewer wants named. Growth is measured at
 * the entry multiple, multiple expansion at exit EBITDA, and deleveraging is the net-debt change —
 * together they reconcile exactly to the equity movement.
 */
export function decomposeReturns(i: DecomposeInput): DecomposeResult {
  const entryEquity = i.entryEbitda * i.entryMultiple - i.entryNetDebt;
  const exitEquity = i.exitEbitda * i.exitMultiple - i.exitNetDebt;
  const ebitdaGrowth = (i.exitEbitda - i.entryEbitda) * i.entryMultiple;
  const multipleExpansion = (i.exitMultiple - i.entryMultiple) * i.exitEbitda;
  const deleveraging = i.entryNetDebt - i.exitNetDebt;
  return {
    deleveraging,
    ebitdaGrowth,
    multipleExpansion,
    total: exitEquity - entryEquity,
    entryEquity,
    exitEquity,
  };
}

export type PaperLboInput = {
  entryEbitda: number;
  entryMultiple: number;
  exitMultiple?: number;
  years: number;
  ebitdaGrowth: number;
  debtTranches: DebtTranche[];
  taxRate: number;
  /** D&A, capex and ΔNWC as shares of EBITDA — the simplifications a paper LBO is allowed. */
  daPctOfEbitda?: number;
  capexPctOfEbitda?: number;
  nwcPctOfEbitda?: number;
  /**
   * Flat annual amounts (Loop 18) — the Pennard convention, where D&A and capex are both £10m
   * every year so FCF equals net income. Each one overrides its percentage when set.
   */
  daAmount?: number;
  capexAmount?: number;
  nwcAmount?: number;
  fees?: number;
  netDebtRepaid?: number;
  /** Cash left in the business rather than swept against debt. */
  minimumCash?: number;
};

export type PaperLboYear = {
  year: number;
  ebitda: number;
  interest: number;
  da: number;
  ebit: number;
  pretaxIncome: number;
  tax: number;
  capex: number;
  changeInNwc: number;
  /** Cash available to pay down debt after interest, tax, capex and working capital. */
  freeCashFlow: number;
  debtRepaid: number;
  openingDebt: number;
  closingDebt: number;
};

/** The mental-maths anchors every LBO interview leans on: MoM over five years → rough IRR. */
export const IRR_ANCHORS: { moM: number; approxIrr: number }[] = [
  { moM: 2, approxIrr: 0.15 },
  { moM: 2.5, approxIrr: 0.2 },
  { moM: 3, approxIrr: 0.25 },
];

/**
 * The nearest five-year anchor for a money multiple, with the exact IRR alongside — the
 * "2.5× is about 20 %" move a paper LBO ends on. `paper_lbo`'s final step grades against this.
 */
export function irrAnchor(moM: number, years = 5): { anchorMoM: number; approxIrr: number; exactIrr: number } {
  const nearest = IRR_ANCHORS.reduce((best, a) => (Math.abs(a.moM - moM) < Math.abs(best.moM - moM) ? a : best), IRR_ANCHORS[0]);
  return { anchorMoM: nearest.moM, approxIrr: nearest.approxIrr, exactIrr: impliedRateFromMultiple(moM, years) };
}

export type PaperLboResult = {
  sourcesUses: SourcesUsesResult;
  schedule: PaperLboYear[];
  exitEbitda: number;
  exitEnterpriseValue: number;
  exitNetDebt: number;
  exitEquity: number;
  returns: LboReturnsResult;
  decomposition: DecomposeResult;
};

/**
 * A five-minute paper LBO: grow EBITDA, pay cash interest on the blended debt, sweep all free cash
 * flow against debt, exit at a multiple, and read off MoM and IRR.
 */
export function paperLbo(i: PaperLboInput): PaperLboResult {
  const sourcesUses = sourcesAndUses({
    entryEbitda: i.entryEbitda,
    entryMultiple: i.entryMultiple,
    debtTranches: i.debtTranches,
    fees: i.fees,
    netDebtRepaid: i.netDebtRepaid,
  });

  const blendedRate =
    sourcesUses.totalDebt === 0 ? 0 : i.debtTranches.reduce((s, t) => s + t.amount * t.rate, 0) / sourcesUses.totalDebt;

  const daPct = i.daPctOfEbitda ?? 0;
  const capexPct = i.capexPctOfEbitda ?? 0;
  const nwcPct = i.nwcPctOfEbitda ?? 0;

  const schedule: PaperLboYear[] = [];
  let debt = sourcesUses.totalDebt;
  let ebitda = i.entryEbitda;

  for (let year = 1; year <= i.years; year++) {
    ebitda = ebitda * (1 + i.ebitdaGrowth);
    const openingDebt = debt;
    const interest = openingDebt * blendedRate;
    const da = i.daAmount ?? ebitda * daPct;
    const ebit = ebitda - da;
    const pretaxIncome = ebit - interest;
    const tax = Math.max(0, pretaxIncome) * i.taxRate;
    const capex = i.capexAmount ?? ebitda * capexPct;
    const changeInNwc = i.nwcAmount ?? ebitda * nwcPct;
    // Cash flow available for debt service: EBITDA less cash interest, tax, capex and working capital.
    const freeCashFlow = ebitda - interest - tax - capex - changeInNwc;
    const debtRepaid = Math.max(0, Math.min(openingDebt, freeCashFlow - (i.minimumCash ?? 0)));
    debt = openingDebt - debtRepaid;
    schedule.push({ year, ebitda, interest, da, ebit, pretaxIncome, tax, capex, changeInNwc, freeCashFlow, debtRepaid, openingDebt, closingDebt: debt });
  }

  const exitMultiple = i.exitMultiple ?? i.entryMultiple;
  const exitEbitda = ebitda;
  const exitEnterpriseValue = exitEbitda * exitMultiple;
  const exitNetDebt = debt;
  const exitEquity = exitEnterpriseValue - exitNetDebt;

  return {
    sourcesUses,
    schedule,
    exitEbitda,
    exitEnterpriseValue,
    exitNetDebt,
    exitEquity,
    returns: lboReturns({ sponsorEquity: sourcesUses.sponsorEquity, exitEquity, years: i.years }),
    decomposition: decomposeReturns({
      entryEbitda: i.entryEbitda,
      exitEbitda,
      entryMultiple: i.entryMultiple,
      exitMultiple,
      entryNetDebt: sourcesUses.totalDebt,
      exitNetDebt,
    }),
  };
}
