// Paper rendering of a lesson for the week packs (Loop 20). Same JSON, same block order, same
// section chrome as LessonRenderer — but nothing here needs a click: reveals are laid out open
// under a "check" rule, blanks become write-in lines with the answers beneath, and a widget becomes
// a pointer back to the site. Industry-lens blocks are left out: the generalist lesson is complete
// without them (02-lens-design.md) and the pack is the core, nothing more. Server component.
import "katex/dist/katex.min.css";
import type { ReactNode } from "react";
import type { LessonBlock, LessonBody } from "@/lib/content/lesson-schema";
import { Markdown } from "./markdown";
import { Section } from "./section";
import { LessonBlockView } from "./lesson-renderer";
import { formatValue } from "./blocks/worked-calc";

/** The part a student covers with a hand on first pass. */
function Check({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-4 border-t border-dashed border-border pt-3" data-testid="print-check">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

const widgetTitle = (name: string) => name.replace(/_/g, " ").replace(/\b(dcf|lbo|ev|tv|wacc|tsm|ppa|nci|npv)\b/g, (m) => m.toUpperCase()).replace(/^[a-z]/, (m) => m.toUpperCase());
const delta = (n: number) => (n === 0 ? "—" : `${n > 0 ? "↑" : "↓"} £${Math.abs(n).toLocaleString("en-GB")}m`);

function PrintBlock({ block }: { block: LessonBlock }) {
  switch (block.type) {
    case "canonical_answer":
      return (
        <Section type="canonical_answer" tone="accent">
          <p className="text-sm text-muted">Say your answer out loud first — aim for about {block.seconds} seconds — then compare.</p>
          <Check label="The model answer"><Markdown md={block.md} /></Check>
        </Section>
      );
    case "scenario":
      return (
        <Section type="scenario">
          <p className="font-medium">{block.prompt}</p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {([["1 · Income statement", block.statements.is], ["2 · Cash flow statement", block.statements.cfs], ["3 · Balance sheet", block.statements.bs]] as const).map(([title, lines]) => (
              <div key={title} className="rounded-lg border border-border p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
                {lines.length === 0 ? <p className="mt-2 text-sm text-muted">No change</p> : (
                  <ul className="mt-2 flex flex-col gap-1 text-sm">
                    {lines.map((l, i) => (
                      <li key={i} className="flex items-baseline justify-between gap-2">
                        <span>{l.line}{l.note && <span className="ml-1 text-xs text-muted">— {l.note}</span>}</span>
                        <span className="shrink-0 font-mono">{delta(l.delta)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          <Check label="Does it balance?"><p className="text-sm">{block.check}</p></Check>
        </Section>
      );
    case "your_turn":
      return (
        <Section type="your_turn" tone="accent">
          <Markdown md={block.prompt} />
          <Check label="Model answer">
            <Markdown md={block.model_answer_md} />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">A strong answer…</p>
            <ul className="mt-1 list-disc pl-5 text-sm">{block.rubric.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </Check>
        </Section>
      );
    case "quick_fire":
      return (
        <Section type="quick_fire">
          <ol className="grid grid-cols-2 gap-3">
            {block.pairs.map((p, i) => (
              <li key={i} className="rounded-lg border border-border p-3 text-sm">
                <p className="font-medium">{p.q}</p>
                <p className="mt-2 text-muted">{p.a}</p>
              </li>
            ))}
          </ol>
        </Section>
      );
    case "predict":
      return (
        <Section type="predict" tone="accent">
          <p className="font-medium">{block.prompt}</p>
          <ol className="mt-3 grid list-[upper-alpha] gap-1.5 pl-6 text-sm">
            {block.options.map((o, i) => <li key={i}>{o.label}</li>)}
          </ol>
          <Check label={`Answer: ${String.fromCharCode(65 + block.options.findIndex((o) => o.correct))}`}><Markdown md={block.explain_md} /></Check>
        </Section>
      );
    case "fill_numbers":
      return (
        <Section type="fill_numbers">
          <Markdown md={block.md} />
          <table className="mt-4 w-full text-sm">
            <tbody>
              {block.steps.map((s, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="py-2 pr-3 text-muted">{i + 1}</td>
                  <td className="py-2 pr-3">{s.label}</td>
                  <td className="py-2 pr-3 font-mono text-muted">{s.blank ? "" : s.expr}</td>
                  <td className="py-2 text-right font-mono font-semibold">
                    {s.blank ? <span className="inline-block h-5 w-24 border-b border-fg align-bottom" aria-label="write your answer" /> : formatValue(s.value, s.unit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Check label="The blanks">
            <ul className="grid gap-1 text-sm">
              {block.steps.map((s, i) => s.blank && (
                <li key={i}>{i + 1}. {s.label}: <span className="font-mono text-muted">{s.expr}</span> = <span className="font-mono font-semibold">{formatValue(s.value, s.unit)}</span></li>
              ))}
            </ul>
          </Check>
        </Section>
      );
    case "order_steps":
      return (
        <Section type="order_steps">
          <p className="font-medium">{block.prompt}</p>
          <p className="mt-1 text-sm text-muted">Write the order from memory before you read it.</p>
          <Check label="The order">
            <ol className="grid list-decimal gap-1 pl-6 text-sm">{block.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
          </Check>
        </Section>
      );
    case "widget":
      return (
        <Section type="widget">
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted" data-testid="print-widget-note">
            <span className="font-medium text-fg">{widgetTitle(block.widget)}</span> is an interactive model — open this lesson on A* Apply to move the inputs yourself.
          </p>
        </Section>
      );
    default:
      // Everything else is already static (and `template` is already a print layout).
      return <LessonBlockView block={block} />;
  }
}

export function PrintLesson({ body }: { body: LessonBody }) {
  return (
    <div className="space-y-8" data-testid="print-lesson">
      {body.blocks.map((block, i) => block.type === "lens" ? null : (
        <div key={`${block.type}-${i}`} data-block-index={i}>
          <PrintBlock block={block} />
        </div>
      ))}
    </div>
  );
}
