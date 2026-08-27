"use client";

import { useState } from "react";
import type { CorpusChunkRow } from "@/lib/corpus/types";
import { ChunkEditor } from "./chunk-editor";
import { StatusBadge } from "./status-badge";
import { Button } from "@/components/ui/button";
import { setChunkStatusAction } from "@/app/admin/corpus/actions";

export function ChunkList({ chunks }: { chunks: CorpusChunkRow[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  if (chunks.length === 0) return <p className="text-sm text-muted" data-testid="chunk-list">No chunks yet — processing may still be running.</p>;
  return (
    <ol className="flex flex-col gap-3" data-testid="chunk-list">
      {chunks.map((c) => (
        <li key={c.id} className="rounded-lg border border-border bg-surface p-4" data-testid="chunk" data-chunk-id={c.id}>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="font-mono">#{c.ordinal + 1}</span>
            <span>{c.kind}</span>
            {c.page_ref != null && <span>· p.{c.page_ref}</span>}
            {c.token_count != null && <span>· ~{c.token_count} tok</span>}
            <StatusBadge status={c.status} />
            {c.embedding_model && <span className="text-[10px]">embedded ({c.embedding_model})</span>}
            <span className="ml-auto flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setEditing(editing === c.id ? null : c.id)}>{editing === c.id ? "Close" : "Edit"}</Button>
              {c.status !== "approved" && (
                <Button size="sm" variant="ghost" data-testid="approve-chunk" onClick={() => void setChunkStatusAction(c.id, "approved")}>Approve</Button>
              )}
              {c.status !== "rejected" && (
                <Button size="sm" variant="ghost" onClick={() => void setChunkStatusAction(c.id, "rejected")}>Reject</Button>
              )}
            </span>
          </div>
          {editing === c.id ? (
            <ChunkEditor chunk={c} onDone={() => setEditing(null)} />
          ) : (
            <>
              {c.question ? (
                <div className="text-sm">
                  <p className="font-medium">Q: {c.question}</p>
                  <p className="mt-1 whitespace-pre-wrap text-muted">A: {c.answer}</p>
                </div>
              ) : (
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs" data-testid="chunk-text">{c.text}</pre>
              )}
              <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-muted">
                {c.topic_tags.map((t) => <span key={t} className="rounded-full border border-border px-2 py-0.5">{t}</span>)}
                {(c.entities.firms ?? []).map((f) => <span key={f} className="rounded-full border border-border px-2 py-0.5 text-muted">{f}</span>)}
              </div>
            </>
          )}
        </li>
      ))}
    </ol>
  );
}
