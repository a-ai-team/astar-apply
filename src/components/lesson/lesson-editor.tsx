"use client";

// Admin lesson editor: textarea JSON → live zod errors + approval problems → rendered preview via
// the same LessonRenderer students see. Save goes through the `saveLesson` server action.
import { useActionState, useMemo, useState } from "react";
import { saveLesson, type SaveState } from "@/app/admin/lessons/actions";
import { approvalProblems, validateLessonBody, type LessonBody } from "@/lib/content/lesson-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LessonRenderer } from "./lesson-renderer";
import { cn } from "@/lib/cn";

const STATUSES = ["draft", "generated", "in_review", "approved", "rejected", "archived"] as const;

export function LessonEditor({ id, initialTitle, initialStatus, initialBody, walkthrough }: { id: string; initialTitle: string; initialStatus: string; initialBody: string; walkthrough: boolean }) {
  const [text, setText] = useState(initialBody);
  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState(initialStatus);
  const [tab, setTab] = useState<"json" | "preview">("json");
  const [state, action, pending] = useActionState<SaveState, FormData>(saveLesson, { ok: true, errors: [] });

  const live = useMemo<{ body: LessonBody | null; errors: string[]; warnings: string[] }>(() => {
    try {
      const parsed = JSON.parse(text);
      const v = validateLessonBody(parsed);
      if (!v.ok) return { body: null, errors: v.errors, warnings: [] };
      return { body: v.value, errors: [], warnings: approvalProblems(v.value, { walkthrough }) };
    } catch (e) {
      return { body: null, errors: [`JSON parse error: ${(e as Error).message}`], warnings: [] };
    }
  }, [text, walkthrough]);

  const blocked = live.errors.length > 0 || (status === "approved" && live.warnings.length > 0);

  return (
    <form action={action} className="flex flex-col gap-4" data-testid="lesson-editor">
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted">
          Title
          <Input name="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-80" data-testid="lesson-title-input" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Status
          <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-fg" data-testid="lesson-status-select">
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <Button type="submit" disabled={pending || blocked} data-testid="lesson-save">{pending ? "Saving…" : "Save"}</Button>
        {state.ok && state.savedAt && <span className="text-xs text-muted" data-testid="lesson-saved">Saved {new Date(state.savedAt).toLocaleTimeString("en-GB")}</span>}
      </div>

      {(live.errors.length > 0 || state.errors.length > 0) && (
        <ul className="rounded-lg border border-danger/40 bg-danger/5 p-3 text-sm text-danger" data-testid="lesson-errors">
          {[...live.errors, ...state.errors].map((e, i) => <li key={i} className="font-mono text-xs">{e}</li>)}
        </ul>
      )}
      {live.errors.length === 0 && live.warnings.length > 0 && (
        <ul className="rounded-lg border border-border bg-surface p-3 text-sm" data-testid="lesson-warnings">
          <li className="mb-1 text-xs uppercase tracking-wide text-muted">Valid, but not approvable yet</li>
          {live.warnings.map((w, i) => <li key={i} className="font-mono text-xs">{w}</li>)}
        </ul>
      )}
      {live.body && live.warnings.length === 0 && <p className="text-xs text-muted" data-testid="lesson-valid">Valid and approvable · {live.body.blocks.length} blocks · {live.body.reading_minutes} min</p>}

      <div role="tablist" className="flex gap-1 border-b border-border">
        {(["json", "preview"] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} data-testid={`lesson-tab-${t}`}
            className={cn("-mb-px border-b-2 px-3 py-2 text-sm", tab === t ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg")}>
            {t === "json" ? "JSON" : "Preview"}
          </button>
        ))}
      </div>
      <textarea
        name="body"
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        data-testid="lesson-json"
        className={cn("min-h-[60vh] w-full rounded-md border border-border bg-surface p-3 font-mono text-xs text-fg", tab !== "json" && "hidden")}
      />
      {tab === "preview" && (
        <div className="rounded-lg border border-border p-4" data-testid="lesson-preview">
          {live.body ? <LessonRenderer body={live.body} /> : <p className="text-sm text-muted">Fix the JSON errors to preview.</p>}
        </div>
      )}
    </form>
  );
}
