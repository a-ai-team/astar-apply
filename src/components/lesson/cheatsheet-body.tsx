// The body of a chapter cheat sheet (Loop 11), shared by the cheat-sheet page and the week packs
// (Loop 20). Headerless on purpose: each caller supplies its own title.
import "katex/dist/katex.min.css";
import type { CheatSheet } from "@/lib/content/cheatsheet-schema";
import { Markdown } from "./markdown";

export function CheatSheetBody({ sheet }: { sheet: CheatSheet }) {
  return (
    <>
      <section className="mt-8" data-testid="cheatsheet-formulas">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Formulas you write from memory</h2>
        <dl className="mt-3 grid gap-3">
          {sheet.formulas.map((f) => (
            <div key={f.name} className="rounded-lg border border-border p-3 print:break-inside-avoid">
              <dt className="text-sm font-medium">{f.name}</dt>
              <dd className="mt-1">
                <Markdown md={`$$${f.latex}$$`} />
                <p className="mt-1 text-sm text-muted">{f.note}</p>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-8" data-testid="cheatsheet-canonical">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">The answers, trimmed to their spine</h2>
        <dl className="mt-3 grid gap-3">
          {sheet.canonical.map((c) => (
            <div key={c.q} className="print:break-inside-avoid">
              <dt className="text-sm font-medium">{c.q}</dt>
              <dd className="mt-0.5 text-sm text-muted">{c.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <section data-testid="cheatsheet-traps">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Traps</h2>
          <ul className="mt-3 grid list-disc gap-1.5 pl-5 text-sm">
            {sheet.traps.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </section>
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">One-liners</h2>
          <ul className="mt-3 grid list-disc gap-1.5 pl-5 text-sm">
            {sheet.one_liners.map((o) => <li key={o}>{o}</li>)}
          </ul>
        </section>
      </div>

      {sheet.you_may_hear.length > 0 && (
        <section className="mt-8 rounded-lg border border-border bg-surface p-4 print:break-inside-avoid" data-testid="cheatsheet-you-may-hear">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">You may hear it — you do not need to compute it</h2>
          <p className="mt-1 text-xs text-muted">Full-time and associate-level material. Know the name and roughly what it does; say so honestly if it comes up.</p>
          <ul className="mt-2 grid list-disc gap-1.5 pl-5 text-sm">
            {sheet.you_may_hear.map((y) => <li key={y}>{y}</li>)}
          </ul>
        </section>
      )}
    </>
  );
}
