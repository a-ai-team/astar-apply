import type { z } from "zod";
import type { ScenarioBlock, StatementLine } from "@/lib/content/lesson-schema";
import { cn } from "@/lib/cn";
import { Reveal } from "../reveal";
import { Section } from "../section";

function Lines({ title, lines, testId }: { title: string; lines: StatementLine[]; testId: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3" data-testid={testId}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      {lines.length === 0 ? (
        <p className="mt-2 text-sm text-muted">No change</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {lines.map((l, i) => (
            <li key={i} className="flex items-baseline justify-between gap-3">
              <span>
                {l.line}
                {l.note && <span className="ml-1 text-xs text-muted">— {l.note}</span>}
              </span>
              <span className={cn("shrink-0 font-mono", l.delta > 0 ? "text-accent" : l.delta < 0 ? "text-danger" : "text-muted")}>
                {l.delta > 0 ? "↑" : l.delta < 0 ? "↓" : "→"} {l.delta === 0 ? "—" : `£${Math.abs(l.delta).toLocaleString("en-GB")}m`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** IS → CFS → BS in order with ↑/↓ arrows and £ impacts; the balance check is hidden until revealed. */
export function Scenario({ block }: { block: z.infer<typeof ScenarioBlock> }) {
  return (
    <Section type="scenario">
      <p className="font-medium">{block.prompt}</p>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <Lines title="1 · Income statement" lines={block.statements.is} testId="scenario-is" />
        <Lines title="2 · Cash flow statement" lines={block.statements.cfs} testId="scenario-cfs" />
        <Lines title="3 · Balance sheet" lines={block.statements.bs} testId="scenario-bs" />
      </div>
      <div className="mt-3">
        <Reveal label="Does it balance?" hideLabel="Hide check" testId="scenario-check">
          <p className="text-sm">{block.check}</p>
        </Reveal>
      </div>
    </Section>
  );
}
