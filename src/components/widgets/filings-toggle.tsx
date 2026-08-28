"use client";

// Filings toggle (Loop 13). The same statement twice: the five-line version you draw in an
// interview, and the version a company actually files. Both reconcile to the same net income, the
// same total assets and the same change in cash — the point being that the interview version is a
// deliberate simplification, not a different set of accounts.
//
// Figures are invented (Kestrel Foods plc) and tie to the chapter's base year.
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { WidgetFrame } from "./kit/widget-frame";
import { money } from "./kit/fmt";

export type FilingsToggleProps = {
  company?: string;
  statement?: StatementKey;
};

type StatementKey = "is" | "bs" | "cfs";
type Row = { label: string; value?: number; kind?: "subtotal" | "total" | "heading"; note?: string };

const STATEMENTS: { key: StatementKey; label: string; anchor: string }[] = [
  { key: "is", label: "Income statement", anchor: "Net income" },
  { key: "bs", label: "Balance sheet", anchor: "Total assets" },
  { key: "cfs", label: "Cash flow statement", anchor: "Change in cash" },
];

const SIMPLE: Record<StatementKey, Row[]> = {
  is: [
    { label: "Revenue", value: 500 },
    { label: "Cost of goods sold", value: -300 },
    { label: "Gross profit", value: 200, kind: "subtotal" },
    { label: "Operating expenses", value: -100, note: "includes £20m of D&A" },
    { label: "EBIT", value: 100, kind: "subtotal" },
    { label: "Interest", value: -10 },
    { label: "Profit before tax", value: 90, kind: "subtotal" },
    { label: "Tax", value: -22.5 },
    { label: "Net income", value: 67.5, kind: "total" },
  ],
  bs: [
    { label: "Cash", value: 60 },
    { label: "Receivables", value: 50 },
    { label: "Inventory", value: 40 },
    { label: "PP&E", value: 300 },
    { label: "Total assets", value: 450, kind: "total" },
    { label: "Payables", value: 30 },
    { label: "Debt", value: 150 },
    { label: "Equity", value: 270 },
    { label: "Total liabilities and equity", value: 450, kind: "total" },
  ],
  cfs: [
    { label: "Net income", value: 67.5 },
    { label: "Add back D&A", value: 20 },
    { label: "Change in working capital", value: -5 },
    { label: "Cash from operations", value: 82.5, kind: "subtotal" },
    { label: "Capital expenditure", value: -30 },
    { label: "Cash from investing", value: -30, kind: "subtotal" },
    { label: "Dividends paid", value: -20 },
    { label: "Cash from financing", value: -20, kind: "subtotal" },
    { label: "Change in cash", value: 32.5, kind: "total" },
  ],
};

const FILED: Record<StatementKey, Row[]> = {
  is: [
    { label: "Revenue", value: 500 },
    { label: "Cost of sales", value: -300 },
    { label: "Gross profit", value: 200, kind: "subtotal" },
    { label: "Distribution costs", value: -44 },
    { label: "Administrative expenses", value: -58 },
    { label: "Other operating income", value: 6 },
    { label: "Operating profit before exceptional items", value: 104, kind: "subtotal" },
    { label: "Exceptional items — restructuring", value: -9 },
    { label: "Share of profit of associates", value: 5 },
    { label: "Operating profit", value: 100, kind: "subtotal", note: "this is the EBIT you drew" },
    { label: "Finance income", value: 2 },
    { label: "Finance costs", value: -12 },
    { label: "Profit before taxation", value: 90, kind: "subtotal" },
    { label: "Taxation", value: -22.5 },
    { label: "Profit for the year", value: 67.5, kind: "total", note: "the same net income" },
  ],
  bs: [
    { label: "Non-current assets", kind: "heading" },
    { label: "Property, plant and equipment", value: 262 },
    { label: "Right-of-use assets", value: 24, note: "leases, on the balance sheet since IFRS 16" },
    { label: "Goodwill", value: 8 },
    { label: "Other intangible assets", value: 4 },
    { label: "Investments in associates", value: 2 },
    { label: "Total non-current assets", value: 300, kind: "subtotal" },
    { label: "Current assets", kind: "heading" },
    { label: "Inventories", value: 40 },
    { label: "Trade and other receivables", value: 46 },
    { label: "Prepayments", value: 4 },
    { label: "Cash and cash equivalents", value: 60 },
    { label: "Total current assets", value: 150, kind: "subtotal" },
    { label: "Total assets", value: 450, kind: "total" },
    { label: "Liabilities", kind: "heading" },
    { label: "Trade payables", value: 24 },
    { label: "Accruals and other payables", value: 6 },
    { label: "Borrowings — current portion", value: 20 },
    { label: "Borrowings — non-current", value: 118 },
    { label: "Lease liabilities", value: 12 },
    { label: "Total liabilities", value: 180, kind: "subtotal" },
    { label: "Equity", kind: "heading" },
    { label: "Share capital", value: 25 },
    { label: "Share premium", value: 60 },
    { label: "Retained earnings", value: 185 },
    { label: "Total equity", value: 270, kind: "subtotal" },
    { label: "Total liabilities and equity", value: 450, kind: "total" },
  ],
  cfs: [
    { label: "Profit for the year", value: 67.5 },
    { label: "Depreciation of property, plant and equipment", value: 16 },
    { label: "Depreciation of right-of-use assets", value: 4, note: "the two together are your £20m of D&A" },
    { label: "Share of profit of associates", value: -5 },
    { label: "Net finance costs", value: 10 },
    { label: "Taxation expense", value: 22.5 },
    { label: "Operating cash flow before working capital", value: 115, kind: "subtotal" },
    { label: "Increase in inventories", value: -3 },
    { label: "Increase in receivables", value: -6 },
    { label: "Increase in payables", value: 4 },
    { label: "Cash generated from operations", value: 110, kind: "subtotal" },
    { label: "Dividends received from associates", value: 5 },
    { label: "Interest paid", value: -10 },
    { label: "Tax paid", value: -22.5 },
    { label: "Net cash from operating activities", value: 82.5, kind: "subtotal", note: "the same £82.5m" },
    { label: "Purchase of property, plant and equipment", value: -28 },
    { label: "Purchase of intangible assets", value: -2 },
    { label: "Net cash used in investing activities", value: -30, kind: "subtotal" },
    { label: "Dividends paid to shareholders", value: -20 },
    { label: "Proceeds from borrowings", value: 4 },
    { label: "Repayment of lease liabilities", value: -4 },
    { label: "Net cash used in financing activities", value: -20, kind: "subtotal" },
    { label: "Change in cash", value: 32.5, kind: "total" },
  ],
};

export function FilingsToggle(props: FilingsToggleProps) {
  const company = props.company ?? "Kestrel Foods plc";
  const initial = props.statement ?? "is";
  const [statement, setStatement] = useState<StatementKey>(initial);
  const [filed, setFiled] = useState(false);

  const rows = filed ? FILED[statement] : SIMPLE[statement];
  const meta = useMemo(() => STATEMENTS.find((s) => s.key === statement)!, [statement]);
  const anchorRow = rows.find((r) => r.kind === "total");

  return (
    <WidgetFrame
      title={`${company} — ${meta.label}`}
      testId="widget-filings_toggle"
      onReset={() => {
        setStatement(initial);
        setFiled(false);
      }}
      notice={[
        "The as-filed version is longer, not different — find the line that is your EBIT.",
        "Every extra line is a real business fact someone decided to disclose separately.",
        "The balance sheet grows most, because it splits everything into current and non-current.",
      ]}
    >
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1" role="group" aria-label="Statement">
          {STATEMENTS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStatement(s.key)}
              aria-pressed={statement === s.key}
              data-testid="filings-statement"
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs transition",
                statement === s.key ? "border-accent bg-accent/10 text-fg" : "border-border text-muted hover:text-fg",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setFiled((f) => !f)}
          aria-pressed={filed}
          data-testid="filings-mode"
          className="rounded-md border border-border px-3 py-1 text-xs text-muted hover:text-fg"
        >
          {filed ? "Show the interview version" : "Show it as filed"}
        </button>
      </div>

      <p className="mt-2 text-xs text-muted">
        {filed
          ? `${rows.length} lines, as a company would file them.`
          : `${rows.length} lines — the version you draw on a whiteboard.`}
      </p>

      <table className="mt-3 w-full text-sm">
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={`${r.label}-${i}`}
              data-testid="filings-row"
              className={cn(
                r.kind === "heading" && "text-xs uppercase tracking-wide text-muted",
                (r.kind === "subtotal" || r.kind === "total") && "border-t border-border",
                r.kind === "total" && "font-semibold",
              )}
            >
              <td className={cn("py-1 pr-3", r.kind === "heading" && "pt-3")}>
                {r.label}
                {r.note && <span className="ml-1.5 text-xs text-muted">({r.note})</span>}
              </td>
              <td className={cn("py-1 text-right font-mono tabular-nums", r.value !== undefined && r.value < 0 && "text-danger")}>
                {r.value === undefined ? "" : money(r.value, Number.isInteger(r.value) ? 0 : 1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-3 text-xs" aria-live="polite">
        <span className="text-muted">{meta.anchor} is the same either way: </span>
        <span className="font-mono font-semibold">{anchorRow?.value === undefined ? "—" : money(anchorRow.value, Number.isInteger(anchorRow.value) ? 0 : 1)}</span>
      </p>
    </WidgetFrame>
  );
}
