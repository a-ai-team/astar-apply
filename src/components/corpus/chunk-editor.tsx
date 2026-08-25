"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TOPICS } from "@/lib/content/taxonomy";
import type { CorpusChunkRow } from "@/lib/corpus/types";
import { updateChunkAction } from "@/app/admin/corpus/actions";

export function ChunkEditor({ chunk, onDone }: { chunk: CorpusChunkRow; onDone: () => void }) {
  const [text, setText] = useState(chunk.text);
  const [question, setQuestion] = useState(chunk.question ?? "");
  const [answer, setAnswer] = useState(chunk.answer ?? "");
  const [tags, setTags] = useState<string[]>(chunk.topic_tags);
  const [pending, start] = useTransition();
  const isQa = chunk.kind === "qa";

  const save = () =>
    start(async () => {
      const patch = isQa
        ? { question, answer, text: `Q: ${question.trim()}\n\nA: ${answer.trim()}`, topic_tags: tags }
        : { text, topic_tags: tags };
      await updateChunkAction(chunk.id, patch);
      onDone();
    });

  return (
    <div className="flex flex-col gap-2" data-testid="chunk-editor">
      {isQa ? (
        <>
          <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Question" />
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={6} className="w-full rounded-md border border-border bg-bg p-2 text-sm outline-none focus:border-accent" />
        </>
      ) : (
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} className="w-full rounded-md border border-border bg-bg p-2 font-mono text-xs outline-none focus:border-accent" data-testid="chunk-textarea" />
      )}
      <div className="flex flex-wrap gap-1">
        {TOPICS.map((t) => {
          const on = tags.includes(t.slug);
          return (
            <button key={t.slug} type="button" onClick={() => setTags(on ? tags.filter((x) => x !== t.slug) : [...tags, t.slug])}
              className={`rounded-full border px-2 py-0.5 text-[11px] ${on ? "border-accent bg-accent/10 text-accent" : "border-border text-muted"}`}>
              {t.slug}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted">Saving clears the embedding; Approve (or <code>npm run reembed</code>) recomputes it.</p>
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={pending} data-testid="save-chunk">{pending ? "Saving…" : "Save"}</Button>
        <Button size="sm" variant="ghost" onClick={onDone} disabled={pending}>Cancel</Button>
      </div>
    </div>
  );
}
