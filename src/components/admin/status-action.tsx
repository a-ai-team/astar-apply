"use client";

// One-click status change (Loop 08): a tiny form posting hidden fields to a server action that
// returns FirmSaveState. Used by /admin/firms/[slug] (per-question + bulk) and /admin/pulse.
import { useActionState } from "react";
import type { FirmSaveState } from "@/app/admin/firms/actions";
import { Button } from "@/components/ui/button";

type Action = (prev: FirmSaveState, formData: FormData) => Promise<FirmSaveState>;

export function StatusAction({ action, fields, label, variant = "secondary", testId }: { action: Action; fields: Record<string, string>; label: string; variant?: "primary" | "secondary" | "ghost" | "danger"; testId?: string }) {
  const [state, act, pending] = useActionState<FirmSaveState, FormData>(action, { ok: true, errors: [] });
  return (
    <form action={act} className="inline-flex items-center gap-2">
      {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <Button type="submit" size="sm" variant={variant} disabled={pending} data-testid={testId}>{pending ? "…" : label}</Button>
      {state.ok && state.message && <span className="text-xs text-accent" data-testid={testId ? `${testId}-done` : undefined}>{state.message}</span>}
      {state.errors.length > 0 && <span className="text-xs text-danger">{state.errors.join("; ")}</span>}
    </form>
  );
}
