"use client";

// Decision form + "Regenerate with note" for /admin/review/[type]/[id].
import { useActionState, useState } from "react";
import { decideReview, regenerateOne, type ReviewState } from "@/app/admin/review/actions";
import { Button } from "@/components/ui/button";

const initial: ReviewState = { ok: true, errors: [] };

export function ReviewForm({ type, id, currentStatus, canRegenerate }: { type: "lesson" | "question"; id: string; currentStatus: string; canRegenerate: boolean }) {
  const [decision, setDecision] = useState<"approved" | "changes_requested" | "rejected">("changes_requested");
  const [state, action, pending] = useActionState<ReviewState, FormData>(decideReview, initial);
  const [regen, regenAction, regenPending] = useActionState<ReviewState, FormData>(regenerateOne, initial);
  return (
    <div className="flex flex-col gap-4" data-testid="review-form">
      <form action={action} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="id" value={id} />
        {/* React 19 resets form controls after an action; the hidden field carries the React state so a controlled <select> never drifts from what is submitted. */}
        <input type="hidden" name="decision" value={decision} />
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-muted">Current status: <span className="font-mono">{currentStatus}</span></span>
          <label className="flex items-center gap-2">
            Decision
            <select value={decision} onChange={(e) => setDecision(e.target.value as typeof decision)} className="h-9 rounded-md border border-border bg-bg px-2 text-sm" data-testid="review-decision">
              <option value="approved">Approve</option>
              <option value="changes_requested">Request changes</option>
              <option value="rejected">Reject</option>
            </select>
          </label>
        </div>
        <textarea name="comment" rows={3} placeholder={decision === "approved" ? "Optional note" : "What needs to change (required)"} className="w-full rounded-md border border-border bg-bg p-2 text-sm" data-testid="review-comment" />
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending} variant={decision === "rejected" ? "danger" : "primary"} data-testid="review-submit">{pending ? "Saving…" : "Record decision"}</Button>
          {state.ok && state.message && <span className="text-xs text-muted" data-testid="review-saved">{state.message}</span>}
        </div>
        {state.errors.length > 0 && (
          <ul className="rounded-md border border-danger/40 bg-danger/5 p-2 text-xs text-danger" data-testid="review-errors">
            {state.errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        )}
      </form>

      <form action={regenAction} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="id" value={id} />
        <p className="text-sm font-medium">Regenerate with note</p>
        <p className="text-xs text-muted">Re-runs the writer synchronously (Opus 5, ~1–3 min) with your note and replaces this draft. {canRegenerate ? "" : "Unavailable: ANTHROPIC_API_KEY is not set."}</p>
        <textarea name="note" rows={2} placeholder="e.g. Use a £m example for the deferred tax step and cut the why_here block by half." className="w-full rounded-md border border-border bg-bg p-2 text-sm" data-testid="regenerate-note" />
        <div className="flex items-center gap-3">
          <Button type="submit" variant="secondary" disabled={regenPending || !canRegenerate} data-testid="regenerate-submit">{regenPending ? "Regenerating…" : "Regenerate"}</Button>
          {regen.ok && regen.message && <span className="text-xs text-muted">{regen.message}</span>}
        </div>
        {regen.errors.length > 0 && <ul className="rounded-md border border-danger/40 bg-danger/5 p-2 text-xs text-danger" data-testid="regenerate-errors">{regen.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
      </form>
    </div>
  );
}
