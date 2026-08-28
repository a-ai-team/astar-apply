import type { z } from "zod";
import type { TemplateBlock, TemplateKind } from "@/lib/content/lesson-schema";
import { Section } from "../section";

/** The rows each printable template lays out. Chapter loops pass `props.prefill` to add numbers. */
const TEMPLATE_ROWS: Record<TemplateKind, { title: string; blurb: string; rows: string[] }> = {
  three_statement_grid: {
    title: "Three-statement walk grid",
    blurb: "Print this and walk a change through it by hand until you no longer need the grid.",
    rows: ["Income statement — the line that moves", "… tax at the marginal rate", "Net income", "Cash flow — start from net income", "… add back non-cash", "… working-capital move", "… investing / financing", "Change in cash", "Balance sheet — cash", "… the asset or liability that moved", "… retained earnings", "Balance check: assets − liabilities − equity = 0"],
  },
  dcf_sheet: {
    title: "DCF build sheet",
    blurb: "One page, five years. Fill it in from memory before an interview.",
    rows: ["Revenue", "Growth %", "EBITDA", "Margin %", "D&A", "EBIT", "Tax", "NOPAT", "+ D&A", "− Capex", "− ΔNWC", "Unlevered free cash flow", "Discount factor", "PV of FCF", "Σ PV (explicit)", "Terminal value (method + inputs)", "PV of terminal value", "Enterprise value", "− Net debt / prefs / NCI", "Equity value", "÷ Diluted shares", "Value per share", "TV share of EV %", "Implied multiple / implied growth"],
  },
  paper_lbo: {
    title: "Paper LBO sheet",
    blurb: "Sources and uses, five years of cash, exit and returns — the whole thing on one page.",
    rows: ["Uses: purchase EV", "Uses: fees / refinanced debt", "Sources: senior debt", "Sources: junior debt", "Sources: sponsor equity", "Assumptions: growth, margin, tax, capex, interest", "FCF by year: EBITDA − interest − tax − capex − ΔNWC", "Debt roll: opening / repaid / closing", "Exit: multiple × exit EBITDA", "Less exit net debt = exit equity", "Money multiple", "IRR (rule-of-72 anchor)", "Sensitivity: exit multiple ±1×"],
  },
  deal_summary: {
    title: "Deal summary card",
    blurb: "Fill one in for the deal you will bring to every interview.",
    rows: ["Buyer", "Target", "Announced", "Price (equity value)", "Enterprise value", "Premium %", "Implied multiple (EV/EBITDA, P/E)", "Consideration (% cash / stock / debt)", "Rationale in one line", "Synergies claimed", "Market reaction", "Biggest risk", "Your view — would you have advised it?"],
  },
};

/** Printable takeaway artefact (Loop 11). Screen shows the rows; `print.css` makes it a clean grid. */
export function Template({ block }: { block: z.infer<typeof TemplateBlock> }) {
  const t = TEMPLATE_ROWS[block.kind];
  return (
    <Section type="template" title={t.title}>
      <p className="text-sm text-muted">{t.blurb}</p>
      <table className="mt-4 w-full text-sm print:text-xs" data-testid={`template-${block.kind}`}>
        <tbody>
          {t.rows.map((row) => (
            <tr key={row} className="border-t border-border">
              <td className="w-1/2 py-2 pr-3">{row}</td>
              <td className="py-2">
                <span className="block h-6 rounded border border-dashed border-border" aria-hidden />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}
