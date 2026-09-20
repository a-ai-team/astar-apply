import type { z } from "zod";
import type { WorkedCalcBlock } from "@/lib/content/lesson-schema";
import { Markdown } from "../markdown";
import { Section } from "../section";

/** Units that hug the number (£12m, £1.31, 15×, 250m); any other unit follows after a space. */
const UNIT_AFFIX: Record<string, [prefix: string, suffix: string]> = { "£m": ["£", "m"], "£": ["£", ""], "×": ["", "×"], m: ["", "m"] };

export function formatValue(value: number, unit?: string) {
  // Unit-less steps are rates, weights and betas held as decimals: at 2 dp a 4.5 % cost of debt
  // reads "0.05" and an 8.02 % WACC is indistinguishable from the 7.02 % wrong answer.
  const n = Math.abs(value).toLocaleString("en-GB", { maximumFractionDigits: unit ? 2 : 4 });
  const [prefix, suffix] = unit ? (UNIT_AFFIX[unit] ?? ["", ` ${unit}`]) : ["", ""];
  // The sign leads the currency symbol: −£10m, never £-10m.
  return `${value < 0 ? "−" : ""}${prefix}${n}${suffix}`;
}

export function WorkedCalc({ block }: { block: z.infer<typeof WorkedCalcBlock> }) {
  return (
    <Section type="worked_calc">
      <Markdown md={block.md} />
      <table className="mt-4 w-full text-sm" data-testid="worked-calc-steps">
        <tbody>
          {block.steps.map((s, i) => (
            <tr key={i} className="border-t border-border">
              <td className="py-2 pr-3 text-muted">{i + 1}</td>
              <td className="py-2 pr-3">{s.label}</td>
              <td className="py-2 pr-3 font-mono text-muted">{s.expr}</td>
              <td className="py-2 text-right font-mono font-semibold">{formatValue(s.value, s.unit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}
