"use client";

// Admin firm dossier editor (Loop 08), same pattern as the lesson editor: textarea JSON → live
// FirmSchema errors → Save through the `saveFirm` server action. Status is a select; the
// "unverified" badge stays until the row is approved.
import { useActionState, useMemo, useState } from "react";
import { saveFirm, type FirmSaveState } from "@/app/admin/firms/actions";
import { validateFirm } from "@/lib/firms/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUSES = ["draft", "generated", "in_review", "approved", "rejected", "archived"] as const;

export function FirmEditor({ id, initialStatus, initialBody }: { id: string; initialStatus: string; initialBody: string }) {
  const [text, setText] = useState(initialBody);
  const [status, setStatus] = useState(initialStatus);
  const [state, action, pending] = useActionState<FirmSaveState, FormData>(saveFirm, { ok: true, errors: [] });
  const live = useMemo<{ errors: string[]; summary: string }>(() => {
    try {
      const v = validateFirm(JSON.parse(text));
      if (!v.ok) return { errors: v.errors, summary: "" };
      return { errors: [], summary: `${v.value.name} · ${v.value.process.length} process stages · ${v.value.sources.length} sources` };
    } catch (e) {
      return { errors: [`JSON parse error: ${(e as Error).message}`], summary: "" };
    }
  }, [text]);
  return (
    <form action={action} className="flex flex-col gap-3" data-testid="firm-editor">
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted">
          Status
          <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-fg" data-testid="firm-status-select">
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        {status !== "approved" && <Badge tone="danger" data-testid="firm-unverified">unverified</Badge>}
        <Button type="submit" disabled={pending || live.errors.length > 0} data-testid="firm-save">{pending ? "Saving…" : "Save"}</Button>
        {state.ok && state.savedAt && <span className="text-xs text-muted" data-testid="firm-saved">Saved {new Date(state.savedAt).toLocaleTimeString("en-GB")}{state.message ? ` · ${state.message}` : ""}</span>}
      </div>
      {(live.errors.length > 0 || state.errors.length > 0) && (
        <ul className="rounded-lg border border-danger/40 bg-danger/5 p-3 text-sm text-danger" data-testid="firm-errors">
          {[...live.errors, ...state.errors].map((e, i) => <li key={i} className="font-mono text-xs">{e}</li>)}
        </ul>
      )}
      {live.errors.length === 0 && <p className="text-xs text-muted" data-testid="firm-valid">Valid · {live.summary}</p>}
      <textarea name="body" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} data-testid="firm-json" className="min-h-[50vh] w-full rounded-md border border-border bg-surface p-3 font-mono text-xs text-fg" />
    </form>
  );
}
