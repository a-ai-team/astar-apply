"use client";

import { useActionState } from "react";
import { collectGeneration, refreshGeneration, startGeneration, type GenState } from "@/app/admin/generation/actions";
import { Button } from "@/components/ui/button";

const initial: GenState = { ok: true, errors: [] };

export function StartRunForm({ topics, hasKey }: { topics: { slug: string; title: string }[]; hasKey: boolean }) {
  const [state, action, pending] = useActionState<GenState, FormData>(startGeneration, initial);
  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4" data-testid="generation-start">
      <p className="text-sm font-medium">Start a run</p>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">Kind
          <select name="kind" className="h-9 rounded-md border border-border bg-bg px-2" data-testid="generation-kind"><option value="lessons">lessons</option><option value="questions">questions</option></select>
        </label>
        <label className="flex items-center gap-2">Topic
          <select name="topic" className="h-9 rounded-md border border-border bg-bg px-2" data-testid="generation-topic"><option value="all">all</option>{topics.map((t) => <option key={t.slug} value={t.slug}>{t.title}</option>)}</select>
        </label>
        <label className="flex items-center gap-2"><input type="checkbox" name="dry_run" defaultChecked /> dry run (estimate only)</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="force" /> force (regenerate existing)</label>
        <Button type="submit" disabled={pending} data-testid="generation-submit">{pending ? "Working…" : "Run"}</Button>
      </div>
      <p className="text-xs text-muted">Batches cost half price and take up to 24 h; the estimate is gated by CONTENT_MAX_BATCH_USD. {hasKey ? "" : "ANTHROPIC_API_KEY is not set: only dry runs (heuristic estimate) work."} Results are loaded into the DB by Collect; the content/ JSON files come from <span className="font-mono">npm run content:collect</span> locally.</p>
      {state.message && <p className="text-xs text-muted" data-testid="generation-message">{state.message}</p>}
      {state.errors.length > 0 && <ul className="text-xs text-danger" data-testid="generation-errors">{state.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
    </form>
  );
}

export function RunButtons({ id, status, hasKey }: { id: string; status: string; hasKey: boolean }) {
  const [r, refreshAction, refreshing] = useActionState<GenState, FormData>(refreshGeneration, initial);
  const [c, collectAction, collecting] = useActionState<GenState, FormData>(collectGeneration, initial);
  const pollable = ["submitted", "in_progress", "ended"].includes(status);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {pollable && (
        <form action={refreshAction}><input type="hidden" name="id" value={id} /><Button type="submit" size="sm" variant="secondary" disabled={refreshing || !hasKey}>{refreshing ? "…" : "Refresh"}</Button></form>
      )}
      {(status === "ended" || status === "in_progress" || status === "submitted") && (
        <form action={collectAction}><input type="hidden" name="id" value={id} /><Button type="submit" size="sm" disabled={collecting || !hasKey}>{collecting ? "Collecting…" : "Collect"}</Button></form>
      )}
      {(r.message || c.message) && <span className="text-xs text-muted">{c.message ?? r.message}</span>}
      {[...r.errors, ...c.errors].map((e, i) => <span key={i} className="text-xs text-danger">{e}</span>)}
    </div>
  );
}
