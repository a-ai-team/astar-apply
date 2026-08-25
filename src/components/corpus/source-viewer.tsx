"use client";

import { useEffect, useState } from "react";
import type { SourceKind } from "@/lib/corpus/types";

type Props = { source: { id: string; kind: SourceKind; mime: string | null; raw_text: string | null; hasFile: boolean } };

/** Shows the original: signed-URL image/PDF for files, raw text for text/Q&A, plus the transcription. */
export function SourceViewer({ source }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!source.hasFile) return;
    let alive = true;
    fetch(`/api/corpus/${source.id}/signed-url`)
      .then(async (r) => {
        const j = (await r.json()) as { url?: string; error?: string };
        if (!alive) return;
        if (!r.ok || !j.url) setErr(j.error ?? "could not load file");
        else setUrl(j.url);
      })
      .catch((e) => alive && setErr(String(e)));
    return () => { alive = false; };
  }, [source.id, source.hasFile]);

  return (
    <div className="flex flex-col gap-4" data-testid="source-viewer">
      {source.hasFile && (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          {err && <p className="p-4 text-xs text-danger">{err}</p>}
          {!err && !url && <p className="p-4 text-xs text-muted">Loading original…</p>}
          {url && source.kind === "photo" && (
            // eslint-disable-next-line @next/next/no-img-element -- signed, short-lived Storage URL
            <img src={url} alt="Original upload" className="max-h-[70vh] w-full object-contain" />
          )}
          {url && source.kind === "pdf" && <iframe src={url} title="Original PDF" className="h-[70vh] w-full" />}
        </div>
      )}
      {source.raw_text && (
        <details open={!source.hasFile} className="rounded-lg border border-border bg-surface">
          <summary className="cursor-pointer px-4 py-2 text-xs text-muted">{source.hasFile ? "Transcription (markdown)" : "Raw text"}</summary>
          <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap px-4 pb-4 text-xs">{source.raw_text}</pre>
        </details>
      )}
    </div>
  );
}
