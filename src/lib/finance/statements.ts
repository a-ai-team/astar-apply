// Three-statement walk engine (Loop 11). Pure maths: given one transaction, produce the deltas on
// the income statement, cash-flow statement and balance sheet, in the order an interviewer expects
// them (IS → CFS → BS), plus the balance check. Widgets are thin views over this; `fill_numbers`
// grading and the chapter specs use the same numbers. Money in £m, rates as decimals (0.25 = 25 %).
//
// Sign convention: every delta is from the company's point of view, as it would be written on the
// statement. A cost is negative on the income statement; a cash outflow is negative on the CFS; an
// asset increase is positive on the BS and a liability increase is positive on the BS. The balance
// check is assets − liabilities − equity ≈ 0.

export type StatementDelta = { line: string; delta: number; note?: string };

export type WalkResult = {
  is: StatementDelta[];
  cfs: StatementDelta[];
  bs: StatementDelta[];
  /** assets − liabilities − equity, rounded to the cent; `balances` is |check| < 0.005. */
  check: number;
  balances: boolean;
  cashDelta: number;
  netIncomeDelta: number;
};

export type WalkInput =
  | { kind: "depreciation"; amount: number; taxRate: number }
  | { kind: "inventory_on_credit"; amount: number }
  | { kind: "raise_debt"; amount: number; interestRate?: number; taxRate?: number }
  | { kind: "buy_ppe_with_debt"; amount: number; usefulLife?: number; taxRate?: number }
  | { kind: "pay_dividend"; amount: number }
  | { kind: "pik_interest"; amount: number; taxRate: number }
  | { kind: "asset_sale"; bookValue: number; salePrice: number; taxRate: number }
  | { kind: "deferred_revenue"; cashReceived: number; revenueRecognised: number; taxRate: number }
  | { kind: "write_down"; amount: number; taxRate: number };

export const WALK_KINDS = [
  "depreciation",
  "inventory_on_credit",
  "raise_debt",
  "buy_ppe_with_debt",
  "pay_dividend",
  "pik_interest",
  "asset_sale",
  "deferred_revenue",
  "write_down",
] as const;
export type WalkKind = (typeof WALK_KINDS)[number];

/** Human label for each transaction, used by the widget's line picker. */
export const WALK_LABELS: Record<WalkKind, string> = {
  depreciation: "Depreciation increases",
  inventory_on_credit: "Buy inventory on credit",
  raise_debt: "Raise debt",
  buy_ppe_with_debt: "Buy PP&E funded with debt",
  pay_dividend: "Pay a dividend",
  pik_interest: "PIK interest accrues",
  asset_sale: "Sell an asset",
  deferred_revenue: "Cash received before revenue is earned",
  write_down: "Write down an asset",
};

const round = (n: number) => Math.round(n * 1e6) / 1e6;
const nonZero = (rows: StatementDelta[]) => rows.filter((r) => Math.abs(r.delta) > 1e-9);

/**
 * Assemble a result and compute the balance check.
 * `assets` and `liabilities` are the balance-sheet rows; equity is derived from retained earnings
 * and any direct equity movement, both of which the caller passes in the `bs` rows tagged by name.
 */
function build(args: {
  is: StatementDelta[];
  cfs: StatementDelta[];
  assets: StatementDelta[];
  liabilities: StatementDelta[];
  equity: StatementDelta[];
  netIncomeDelta: number;
}): WalkResult {
  const cashDelta = round(args.cfs.reduce((s, r) => s + r.delta, 0));
  const assets = [{ line: "Cash", delta: cashDelta }, ...args.assets];
  const sum = (rows: StatementDelta[]) => round(rows.reduce((s, r) => s + r.delta, 0));
  const check = round(sum(assets) - sum(args.liabilities) - sum(args.equity));
  return {
    is: nonZero(args.is).map((r) => ({ ...r, delta: round(r.delta) })),
    cfs: nonZero(args.cfs).map((r) => ({ ...r, delta: round(r.delta) })),
    bs: nonZero([...assets, ...args.liabilities, ...args.equity]).map((r) => ({ ...r, delta: round(r.delta) })),
    check,
    balances: Math.abs(check) < 0.005,
    cashDelta,
    netIncomeDelta: round(args.netIncomeDelta),
  };
}

/**
 * Walk one transaction through the three statements.
 *
 * Canonical case — `{ kind: "depreciation", amount: 10, taxRate: 0.25 }`:
 * net income −7.5, cash +2.5, PP&E −10, retained earnings −7.5, balances.
 */
export function walk(input: WalkInput): WalkResult {
  switch (input.kind) {
    case "depreciation": {
      const { amount, taxRate } = input;
      const pretax = -amount;
      const tax = -pretax * taxRate; // a loss saves tax
      const ni = pretax + tax;
      return build({
        is: [
          { line: "Depreciation", delta: -amount, note: "a non-cash charge against operating profit" },
          { line: "Operating profit (EBIT)", delta: -amount },
          { line: "Tax", delta: tax, note: `${Math.round(taxRate * 100)}% of the lower pre-tax profit` },
          { line: "Net income", delta: ni },
        ],
        cfs: [
          { line: "Net income", delta: ni },
          { line: "Add back depreciation", delta: amount, note: "no cash left the business" },
        ],
        assets: [{ line: "PP&E", delta: -amount }],
        liabilities: [],
        equity: [{ line: "Retained earnings", delta: ni }],
        netIncomeDelta: ni,
      });
    }

    case "inventory_on_credit": {
      const { amount } = input;
      return build({
        is: [{ line: "No income-statement impact", delta: 0, note: "nothing is sold yet" }],
        cfs: [
          { line: "Increase in inventory", delta: -amount, note: "a use of cash…" },
          { line: "Increase in payables", delta: amount, note: "…exactly offset, because the supplier is unpaid" },
        ],
        assets: [{ line: "Inventory", delta: amount }],
        liabilities: [{ line: "Accounts payable", delta: amount }],
        equity: [],
        netIncomeDelta: 0,
      });
    }

    case "raise_debt": {
      const { amount, interestRate = 0, taxRate = 0 } = input;
      const interest = amount * interestRate;
      const ni = -interest * (1 - taxRate);
      return build({
        is: interest
          ? [
              { line: "Interest expense", delta: -interest },
              { line: "Tax", delta: interest * taxRate },
              { line: "Net income", delta: ni },
            ]
          : [{ line: "No income-statement impact", delta: 0, note: "raising debt is a financing event" }],
        cfs: [
          ...(interest ? [{ line: "Net income", delta: ni }] : []),
          { line: "Debt drawn (financing)", delta: amount },
        ],
        assets: [],
        liabilities: [{ line: "Debt", delta: amount }],
        equity: interest ? [{ line: "Retained earnings", delta: ni }] : [],
        netIncomeDelta: ni,
      });
    }

    case "buy_ppe_with_debt": {
      const { amount, usefulLife = 0, taxRate = 0 } = input;
      const dep = usefulLife > 0 ? amount / usefulLife : 0;
      const ni = dep ? -dep * (1 - taxRate) : 0;
      return build({
        is: dep
          ? [
              { line: "Depreciation", delta: -dep, note: `${amount} spread over ${usefulLife} years` },
              { line: "Tax", delta: dep * taxRate },
              { line: "Net income", delta: ni },
            ]
          : [{ line: "No income-statement impact", delta: 0, note: "capex is not an expense" }],
        cfs: [
          ...(dep ? [{ line: "Net income", delta: ni }, { line: "Add back depreciation", delta: dep }] : []),
          { line: "Capital expenditure (investing)", delta: -amount },
          { line: "Debt drawn (financing)", delta: amount },
        ],
        assets: [{ line: "PP&E", delta: amount - dep }],
        liabilities: [{ line: "Debt", delta: amount }],
        equity: dep ? [{ line: "Retained earnings", delta: ni }] : [],
        netIncomeDelta: ni,
      });
    }

    case "pay_dividend": {
      const { amount } = input;
      return build({
        is: [{ line: "No income-statement impact", delta: 0, note: "a dividend is a distribution, not a cost" }],
        cfs: [{ line: "Dividend paid (financing)", delta: -amount }],
        assets: [],
        liabilities: [],
        equity: [{ line: "Retained earnings", delta: -amount }],
        netIncomeDelta: 0,
      });
    }

    case "pik_interest": {
      const { amount, taxRate } = input;
      const ni = -amount * (1 - taxRate);
      return build({
        is: [
          { line: "PIK interest expense", delta: -amount, note: "accrued, not paid in cash" },
          { line: "Tax", delta: amount * taxRate },
          { line: "Net income", delta: ni },
        ],
        cfs: [
          { line: "Net income", delta: ni },
          { line: "Add back PIK interest", delta: amount, note: "no cash left the business" },
        ],
        assets: [],
        liabilities: [{ line: "Debt (accrued PIK)", delta: amount }],
        equity: [{ line: "Retained earnings", delta: ni }],
        netIncomeDelta: ni,
      });
    }

    case "asset_sale": {
      const { bookValue, salePrice, taxRate } = input;
      const gain = salePrice - bookValue;
      const ni = gain * (1 - taxRate);
      const cashTax = gain * taxRate;
      return build({
        is: [
          { line: gain >= 0 ? "Gain on sale" : "Loss on sale", delta: gain },
          { line: "Tax", delta: -cashTax },
          { line: "Net income", delta: ni },
        ],
        cfs: [
          { line: "Net income", delta: ni },
          { line: gain >= 0 ? "Less gain on sale" : "Add back loss on sale", delta: -gain, note: "reversed out of operating — it belongs in investing" },
          { line: "Proceeds from sale (investing)", delta: salePrice },
        ],
        assets: [{ line: "PP&E", delta: -bookValue }],
        liabilities: [],
        equity: [{ line: "Retained earnings", delta: ni }],
        netIncomeDelta: ni,
      });
    }

    case "deferred_revenue": {
      const { cashReceived, revenueRecognised, taxRate } = input;
      const ni = revenueRecognised * (1 - taxRate);
      const deferred = cashReceived - revenueRecognised;
      const taxPaid = revenueRecognised * taxRate;
      return build({
        is: [
          { line: "Revenue", delta: revenueRecognised, note: "only the earned portion" },
          { line: "Tax", delta: -taxPaid },
          { line: "Net income", delta: ni },
        ],
        cfs: [
          { line: "Net income", delta: ni },
          { line: "Increase in deferred revenue", delta: deferred, note: "cash in hand the company has not yet earned" },
        ],
        assets: [],
        liabilities: [{ line: "Deferred revenue", delta: deferred }],
        equity: [{ line: "Retained earnings", delta: ni }],
        netIncomeDelta: ni,
      });
    }

    case "write_down": {
      const { amount, taxRate } = input;
      const ni = -amount * (1 - taxRate);
      return build({
        is: [
          { line: "Impairment charge", delta: -amount, note: "non-cash" },
          { line: "Tax", delta: amount * taxRate },
          { line: "Net income", delta: ni },
        ],
        cfs: [
          { line: "Net income", delta: ni },
          { line: "Add back impairment", delta: amount },
        ],
        assets: [{ line: "Asset written down", delta: -amount }],
        liabilities: [],
        equity: [{ line: "Retained earnings", delta: ni }],
        netIncomeDelta: ni,
      });
    }
  }
}

/** One-line textual diff of a walk — the reduced-motion fallback and the widget's aria-live text. */
export function walkSummary(result: WalkResult): string {
  const fmt = (n: number) => `${n >= 0 ? "+" : "−"}£${Math.abs(n)}m`;
  return result.bs.map((r) => `${r.line} ${fmt(r.delta)}`).join(", ");
}
