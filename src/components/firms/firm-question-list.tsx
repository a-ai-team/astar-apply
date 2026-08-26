"use client";

// Firm question bank with tag filters (Loop 08): stage / programme / category / division chips,
// a collapsible "What a strong answer covers" per question, and "Practise this" → a 1-question
// drill via the startDrillFor server action (form post; the action redirects to the runner).
import { useMemo, useState } from "react";
import { CATEGORIES, LABELS, PROGRAMMES, STAGES } from "@/lib/firms/schema";
import type { FirmQuestionRow } from "@/lib/firms/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/lesson/markdown";
import { cn } from "@/lib/cn";

type Filters = { stage: string; programme: string; category: string; division: string };
const ALL = "all";

export function filterQuestions(qs: FirmQuestionRow[], f: Filters): FirmQuestionRow[] {
  return qs.filter((q) => (f.stage === ALL || q.stage === f.stage) && (f.programme === ALL || q.programme === f.programme) && (f.category === ALL || q.category === f.category) && (f.division === ALL || (q.division ?? "Any division") === f.division));
}

export function FirmQuestionList({ questions, practise, backHref, canPractise }: { questions: FirmQuestionRow[]; practise: (formData: FormData) => Promise<void>; backHref: string; canPractise: boolean }) {
  const [f, setF] = useState<Filters>({ stage: ALL, programme: ALL, category: ALL, division: ALL });
  const divisions = useMemo(() => [...new Set(questions.map((q) => q.division ?? "Any division"))].sort(), [questions]);
  const shown = useMemo(() => filterQuestions(questions, f), [questions, f]);
  const chip = (key: keyof Filters, value: string, label: string) => (
    <button key={`${key}-${value}`} type="button" onClick={() => setF({ ...f, [key]: value })} className={cn("rounded-full border px-3 py-1 text-xs", f[key] === value ? "border-accent text-accent" : "border-border text-muted hover:text-fg")} data-testid={`filter-${key}-${value}`} aria-pressed={f[key] === value}>{label}</button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2" data-testid="firm-filters">
        <div className="flex flex-wrap items-center gap-2"><span className="w-20 text-xs uppercase tracking-wide text-muted">Stage</span>{chip("stage", ALL, "All")}{STAGES.map((s) => chip("stage", s, LABELS.stage[s]))}</div>
        <div className="flex flex-wrap items-center gap-2"><span className="w-20 text-xs uppercase tracking-wide text-muted">Programme</span>{chip("programme", ALL, "All")}{PROGRAMMES.map((s) => chip("programme", s, LABELS.programme[s]))}</div>
        <div className="flex flex-wrap items-center gap-2"><span className="w-20 text-xs uppercase tracking-wide text-muted">Category</span>{chip("category", ALL, "All")}{CATEGORIES.map((s) => chip("category", s, LABELS.category[s]))}</div>
        {divisions.length > 1 && <div className="flex flex-wrap items-center gap-2"><span className="w-20 text-xs uppercase tracking-wide text-muted">Division</span>{chip("division", ALL, "All")}{divisions.map((d) => chip("division", d, d))}</div>}
      </div>
      <p className="text-xs text-muted" data-testid="firm-question-count">{shown.length} of {questions.length} question{questions.length === 1 ? "" : "s"}</p>
      {shown.length === 0 ? (
        <p className="text-sm text-muted" data-testid="firm-questions-empty">No questions match these filters.</p>
      ) : (
        <ul className="flex flex-col gap-2" data-testid="firm-question-list">
          {shown.map((q) => (
            <li key={q.id} className="rounded-lg border border-border bg-surface" data-testid="firm-question" data-stage={q.stage} data-programme={q.programme} data-category={q.category}>
              <div className="flex flex-col gap-2 px-4 py-3">
                <p className="font-medium" data-testid="firm-question-text">{q.question}</p>
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <Badge tone="accent">{LABELS.stage[q.stage]}</Badge>
                  <Badge>{LABELS.programme[q.programme]}</Badge>
                  <Badge>{LABELS.category[q.category]}</Badge>
                  <Badge>{LABELS.frequency[q.frequency]}</Badge>
                  {q.division && <Badge>{q.division}</Badge>}
                  <span className="text-muted">{q.recency_year ? `Reported ${q.recency_year}` : "No date claimed"}</span>
                  {q.sources.length > 0 && <span className="text-muted">· {q.sources.map((s, i) => <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="underline">{i ? `, ${s.title}` : s.title}</a>)}</span>}
                </div>
                {q.guidance_md && (
                  <details className="group" data-testid="firm-guidance">
                    <summary className="cursor-pointer text-sm text-accent">What a strong answer covers</summary>
                    <div className="mt-2 rounded-md border border-border p-3 text-sm"><Markdown md={q.guidance_md} /></div>
                  </details>
                )}
                {canPractise && (
                  <form action={practise} className="flex justify-end">
                    <input type="hidden" name="firmQuestionId" value={q.id} />
                    <input type="hidden" name="back" value={backHref} />
                    <Button type="submit" size="sm" variant="secondary" data-testid="practise-this">Practise this (1-question drill)</Button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
