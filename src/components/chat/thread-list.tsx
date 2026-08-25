"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { Button, Dialog, Input } from "@/components/ui";
import { deleteThread, renameThread } from "@/app/home/mentor/actions";

export type ThreadSummary = { id: string; title: string; last_message_at: string | null };

export function ThreadList({ threads }: { threads: ThreadSummary[] }) {
  const params = useParams<{ threadId?: string }>();
  const active = params?.threadId;
  const [editing, setEditing] = useState<ThreadSummary | null>(null);
  const [title, setTitle] = useState("");
  const [pending, start] = useTransition();

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-border md:w-64 md:border-r md:border-b-0" data-testid="thread-list">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Threads</h2>
        <Link href="/home/mentor" className="text-sm text-accent hover:underline" data-testid="new-thread">
          + New
        </Link>
      </div>
      <ul className="flex max-h-40 flex-col overflow-y-auto px-2 pb-2 md:max-h-none md:flex-1">
        {threads.length === 0 && <li className="px-2 py-2 text-sm text-muted">No threads yet — ask something.</li>}
        {threads.map((t) => (
          <li key={t.id} className="group flex items-center gap-1" data-testid="thread-item">
            <Link
              href={`/home/mentor/${t.id}`}
              className={cn("min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-sm", active === t.id ? "bg-surface text-fg" : "text-muted hover:bg-surface hover:text-fg")}
              title={t.title}
              data-testid="thread-link"
            >
              {t.title}
            </Link>
            <button
              type="button"
              className="rounded px-1 text-xs text-muted opacity-0 hover:text-fg group-hover:opacity-100 focus:opacity-100"
              aria-label={`Rename ${t.title}`}
              onClick={() => { setEditing(t); setTitle(t.title); }}
              data-testid="thread-rename"
            >
              ✎
            </button>
          </li>
        ))}
      </ul>
      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} title="Thread">
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!editing) return;
            const id = editing.id;
            start(async () => { await renameThread(id, title); setEditing(null); });
          }}
        >
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} autoFocus data-testid="thread-title-input" />
          <div className="flex justify-between gap-2">
            <Button type="button" variant="danger" size="sm" disabled={pending} onClick={() => { if (!editing) return; const id = editing.id; start(async () => { await deleteThread(id); }); }} data-testid="thread-delete">
              Delete
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={pending || !title.trim()} data-testid="thread-save">Save</Button>
            </div>
          </div>
        </form>
      </Dialog>
    </aside>
  );
}
