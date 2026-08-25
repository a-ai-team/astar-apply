import type { z } from "zod";
import type { WorkedCalcBlock } from "@/lib/content/lesson-schema";
import { Markdown } from "../markdown";
import { Section } from "../section";

export function formatValue(value: number, unit?: string) {
  const n = Math.abs(value) >= 1000 ? value.toLocaleString("en-GB", { maximumFractionDigits: 2 }) : value.toLocaleString("en-GB", { maximumFractionDigits: 2 });
  return unit ? `${unit === "£m" ? "£" : ""}${n}${unit === "£m" ? "m" : ` ${unit}`}` : n;
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
