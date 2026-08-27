"use client";

// Report-a-question form (Loop 08). useActionState(reportQuestion); resets on success.
import { useActionState, useRef } from "react";
import { reportQuestion, type ReportState } from "@/app/home/interviews/report/actions";
import { LABELS, PROGRAMMES, STAGES } from "@/lib/firms/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const field = "rounded-md border border-border bg-bg px-3 py-2 text-sm";

export function ReportForm({ firms }: { firms: { id: string; name: string }[] }) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<ReportState, FormData>(async (prev, fd) => {
    const r = await reportQuestion(prev, fd);
    if (r.ok) ref.current?.reset();
    return r;
  }, { ok: true, errors: [] });
  return (
    <form ref={ref} action={action} className="flex flex-col gap-4" data-testid="report-form">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-muted">Firm
          <select name="firm_id" required className={field} data-testid="report-firm" defaultValue="">
            <option value="" disabled>Choose a firm</option>
            {firms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">Programme
          <select name="programme" required className={field} data-testid="report-programme" defaultValue="summer">{PROGRAMMES.map((p) => <option key={p} value={p}>{LABELS.programme[p]}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">Stage
          <select name="stage" required className={field} data-testid="report-stage" defaultValue="interview">{STAGES.map((s) => <option key={s} value={s}>{LABELS.stage[s]}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">Division (optional)<Input name="division" placeholder="e.g. Investment Banking" maxLength={120} data-testid="report-division" /></label>
        <label className="flex flex-col gap-1 text-xs text-muted">When were you asked? (YYYY-MM, optional)<Input name="asked_at" placeholder="2026-03" pattern="\d{4}-\d{2}(-\d{2})?" data-testid="report-asked-at" /></label>
        <label className="flex flex-col gap-1 text-xs text-muted">Context (optional)<Input name="context" placeholder="Round, format, who asked" maxLength={1000} data-testid="report-context" /></label>
      </div>
      <label className="flex flex-col gap-1 text-xs text-muted">The question, as close to verbatim as you remember
        <textarea name="question" required minLength={10} maxLength={600} rows={3} className={field} data-testid="report-question" />
      </label>
      {state.errors.length > 0 && <ul className="rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger" data-testid="report-errors">{state.errors.map((e) => <li key={e}>{e}</li>)}</ul>}
      {state.ok && state.message && <p className="rounded-md border border-accent/40 bg-surface p-3 text-sm" data-testid="report-success">{state.message}{state.remaining != null ? ` (${state.remaining} more today)` : ""}</p>}
      <div><Button type="submit" disabled={pending} data-testid="report-submit">{pending ? "Sending…" : "Send for review"}</Button></div>
    </form>
  );
}
