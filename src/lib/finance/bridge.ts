// Equity value ↔ enterprise value bridge (Loop 11). The maths behind the `ev_bridge` widget, moved
// out of the component so the same numbers grade `fill_numbers` answers and back the chapter specs.
// Behaviour is identical to the Loop 03 `computeBridge`. Money in £m; share price in £.

export type BridgeInputs = {
  share_price: number;
  diluted_shares: number; // millions
  debt: number;
  cash: number;
  preferred: number;
  nci: number;
  leases: number;
};

export type BridgeResult = { eqv: number; netDebt: number; ev: number };

/** Equity value → enterprise value. Unchanged from the Loop 03 widget. */
export function computeBridge(i: BridgeInputs): BridgeResult {
  const eqv = i.share_price * i.diluted_shares;
  const netDebt = i.debt - i.cash;
  const ev = eqv + netDebt + i.preferred + i.nci + i.leases;
  return { eqv, netDebt, ev };
}

export type BridgeClaims = { debt: number; cash: number; preferred?: number; nci?: number; leases?: number };

/** EqV + net debt + other claims = EV. */
export function equityToEnterprise(equityValue: number, c: BridgeClaims): number {
  return equityValue + c.debt - c.cash + (c.preferred ?? 0) + (c.nci ?? 0) + (c.leases ?? 0);
}

/** The same bridge walked backwards — EV − net debt − other claims = EqV. */
export function enterpriseToEquity(enterpriseValue: number, c: BridgeClaims): number {
  return enterpriseValue - c.debt + c.cash - (c.preferred ?? 0) - (c.nci ?? 0) - (c.leases ?? 0);
}

export type BridgeRow = {
  label: string;
  /** The bar's own size: the starting/ending total for `start`/`end`, the step for `add`/`subtract`. */
  value: number;
  kind: "start" | "add" | "subtract" | "end";
  /** Cumulative total after this row — the waterfall's floating-bar top. */
  running: number;
};

/**
 * Waterfall rows from equity value to enterprise value. `add`/`subtract` rows float on the running
 * total; `start` and `end` are full-height columns. Zero-value steps are dropped.
 */
export function bridgeRows(i: BridgeInputs): BridgeRow[] {
  const { eqv, ev } = computeBridge(i);
  const steps: { label: string; delta: number }[] = [
    { label: "+ Debt", delta: i.debt },
    { label: "− Cash", delta: -i.cash },
    { label: "+ Preferred", delta: i.preferred },
    { label: "+ NCI", delta: i.nci },
    { label: "+ Leases", delta: i.leases },
  ];
  const rows: BridgeRow[] = [{ label: "Equity value", value: eqv, kind: "start", running: eqv }];
  let running = eqv;
  for (const s of steps) {
    if (Math.abs(s.delta) < 1e-9) continue;
    running += s.delta;
    rows.push({ label: s.label, value: s.delta, kind: s.delta >= 0 ? "add" : "subtract", running });
  }
  rows.push({ label: "Enterprise value", value: ev, kind: "end", running: ev });
  return rows;
}

/** Which multiples pair with which value — the `multiple_matcher` widget's answer key. */
export const EV_METRICS = ["Revenue", "EBITDA", "EBIT", "Unlevered free cash flow", "NOPAT"] as const;
export const EQUITY_METRICS = ["Net income", "EPS", "Levered free cash flow", "Book value of equity", "Pre-tax income"] as const;

export type MetricPairing = "enterprise" | "equity";

/** `null` when the metric is not in either list (so a widget can say "not one of these"). */
export function pairsWith(metric: string): MetricPairing | null {
  const norm = metric.trim().toLowerCase();
  if ((EV_METRICS as readonly string[]).some((m) => m.toLowerCase() === norm)) return "enterprise";
  if ((EQUITY_METRICS as readonly string[]).some((m) => m.toLowerCase() === norm)) return "equity";
  return null;
}
