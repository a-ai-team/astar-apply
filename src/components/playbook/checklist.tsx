"use client";

// Checklist (Loop 10): ticks persist to playbook_progress for signed-in users when the table
// exists, and always mirror to localStorage (the fallback when 0011 is unapplied or signed out).
// localStorage is read through useSyncExternalStore so the server render (server truth only)
// hydrates cleanly and the local copy merges in on the client without a setState-in-effect.
import { useMemo, useSyncExternalStore, useTransition } from "react";
import { togglePlaybookItem } from "@/app/non-target/actions";

const LS_KEY = "astar_playbook_progress";
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => { if (e.key === LS_KEY) cb(); };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(cb); window.removeEventListener("storage", onStorage); };
}
function getSnapshot(): string {
  try { return localStorage.getItem(LS_KEY) ?? "{}"; } catch { return "{}"; }
}
function getServerSnapshot(): string { return "{}"; }
function writeLocal(state: Record<string, boolean>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export function Checklist({ title, items, initial, signedIn }: { title: string; items: { key: string; label: string }[]; initial: Record<string, boolean>; signedIn: boolean }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const local = useMemo<Record<string, boolean>>(() => { try { return JSON.parse(raw) as Record<string, boolean>; } catch { return {}; } }, [raw]);
  // Server truth wins where it has a row; local fills the gaps (signed out, or table absent).
  const state = useMemo(() => ({ ...local, ...Object.fromEntries(Object.entries(initial).filter(([, v]) => v)) }), [local, initial]);
  const [, start] = useTransition();
  const done = items.filter((i) => state[i.key]).length;
  function toggle(key: string) {
    const next = { ...state, [key]: !state[key] };
    writeLocal(next);
    if (signedIn) start(async () => { try { await togglePlaybookItem(key, Boolean(next[key])); } catch { /* local copy stands */ } });
  }
  return (
    <div className="rounded-lg border border-border bg-surface p-4" data-testid="playbook-checklist" data-done={done} data-total={items.length}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">{title}</h3>
        <span className="text-xs tabular-nums text-muted" data-testid="checklist-count">{done} / {items.length}</span>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((i) => (
          <li key={i.key}>
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input type="checkbox" checked={Boolean(state[i.key])} onChange={() => toggle(i.key)} className="mt-0.5 h-4 w-4 accent-[var(--accent)]" data-testid={`check-${i.key}`} />
              <span className={state[i.key] ? "text-muted line-through" : ""}>{i.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
