import type { z } from "zod";
import type { KeyMetricsBlock } from "@/lib/content/lesson-schema";
import { Section } from "../section";

export function KeyMetrics({ block }: { block: z.infer<typeof KeyMetricsBlock> }) {
  return (
    <Section type="key_metrics">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-muted">
            <tr><th className="py-2 pr-3">Metric</th><th className="py-2 pr-3">Definition</th><th className="py-2">Why it matters</th></tr>
          </thead>
          <tbody>
            {block.rows.map((r, i) => (
              <tr key={i} className="border-t border-border align-top">
                <td className="py-2 pr-3 font-medium">{r.metric}</td>
                <td className="py-2 pr-3 text-muted">{r.definition}</td>
                <td className="py-2">{r.why_it_matters}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
