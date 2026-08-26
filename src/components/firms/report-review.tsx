"use client";

// One pending report with the reviewer's controls (Loop 08): category + frequency + optional
// guidance, then Approve (promote) or Reject.
import { useActionState } from "react";
import { decideReport, type ReportDecisionState } from "@/app/admin/reports/actions";
import { CATEGORIES, FREQUENCIES, LABELS } from "@/lib/firms/schema";
import { Button } from "@/components/ui/button";

const field = "rounded-md border border-border bg-bg px-2 py-1 text-sm";

export function ReportReview({ id }: { id: string }) {
  const [state, action, pending] = useActionState<ReportDecisionState, FormData>(decideReport, { ok: true, errors: [] });
  if (state.ok && state.message) return <p className="text-sm text-accent" data-testid="report-decided">{state.message}</p>;
  return (
    <form action={action} className="flex flex-wrap items-end gap-2" data-testid="report-review">
      <input type="hidden" name="id" value={id} />
      <label className="flex flex-col gap-1 text-xs text-muted">Category<select name="category" className={field} defaultValue="motivation" data-testid="review-category">{CATEGORIES.map((c) => <option key={c} value={c}>{LABELS.category[c]}</option>)}</select></label>
      <label className="flex flex-col gap-1 text-xs text-muted">Frequency<select name="frequency" className={field} defaultValue="occasional">{FREQUENCIES.map((c) => <option key={c} value={c}>{LABELS.frequency[c]}</option>)}</select></label>
      <label className="flex min-w-64 flex-1 flex-col gap-1 text-xs text-muted">Guidance (optional, dash bullets)<input name="guidance_md" className={field} placeholder="- What a strong answer covers" /></label>
      <Button type="submit" name="decision" value="approved" size="sm" disabled={pending} data-testid="report-approve">Approve → bank</Button>
      <Button type="submit" name="decision" value="rejected" size="sm" variant="secondary" disabled={pending} data-testid="report-reject">Reject</Button>
      {state.errors.length > 0 && <span className="w-full text-xs text-danger" data-testid="review-errors">{state.errors.join("; ")}</span>}
    </form>
  );
}
