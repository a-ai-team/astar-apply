"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { prepareUploads } from "@/app/admin/corpus/actions";

type Item = { name: string; sourceId?: string; state: "queued" | "uploading" | "processing" | "done" | "error"; detail?: string };
const BUCKET = "corpus"; // mirrors CORPUS_BUCKET (server); the browser only needs the name for signed uploads

/**
 * Drop/select files → server action creates draft sources + signed upload URLs → the browser
 * uploads straight to Storage → POST /api/corpus/[id]/process per file → redirect.
 */
export function UploadDropzone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [drag, setDrag] = useState(false);
  const [busy, startTransition] = useTransition();

  const patch = (i: number, p: Partial<Item>) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, ...p } : x)));

  async function handleFiles(files: File[]) {
    if (!files.length) return;
    setItems(files.map((f) => ({ name: f.name, state: "queued" })));
    startTransition(async () => {
      const { uploads, errors } = await prepareUploads(files.map((f) => ({ name: f.name, type: f.type, size: f.size })));
      for (const e of errors) {
        const i = files.findIndex((f) => e.startsWith(f.name));
        if (i >= 0) patch(i, { state: "error", detail: e });
      }
      const supabase = createClient();
      let k = 0;
      const doneIds: string[] = [];
      for (let i = 0; i < files.length; i++) {
        if (items[i]?.state === "error" || errors.some((e) => e.startsWith(files[i].name))) continue;
        const u = uploads[k++];
        if (!u) continue;
        patch(i, { state: "uploading", sourceId: u.sourceId });
        const { error } = await supabase.storage.from(BUCKET).uploadToSignedUrl(u.path, u.token, files[i], { contentType: files[i].type });
        if (error) {
          patch(i, { state: "error", detail: error.message });
          continue;
        }
        patch(i, { state: "processing" });
        const res = await fetch(`/api/corpus/${u.sourceId}/process`, { method: "POST" });
        const body = (await res.json().catch(() => ({}))) as { chunks?: number; error?: string; status?: string };
        if (!res.ok) {
          patch(i, { state: "error", detail: body.error ?? `HTTP ${res.status}` });
          continue;
        }
        patch(i, { state: "done", detail: `${body.chunks ?? 0} chunk(s) · ${body.status}` });
        doneIds.push(u.sourceId);
      }
      if (doneIds.length === 1) router.push(`/admin/corpus/${doneIds[0]}`);
      else if (doneIds.length > 1) router.push("/admin/corpus");
    });
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div
        data-testid="upload-dropzone"
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); void handleFiles(Array.from(e.dataTransfer.files)); }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center ${drag ? "border-accent bg-accent/5" : "border-border"}`}
      >
        <p className="text-sm">Drop photos (PNG/JPEG/WebP) or PDFs here, or click to choose.</p>
        <p className="text-xs text-muted">Up to 50 MB each. Photos: one page per image. PDFs: one chunk per page.</p>
        <input
          ref={inputRef}
          data-testid="upload-input"
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
          className="hidden"
          onChange={(e) => void handleFiles(Array.from(e.target.files ?? []))}
        />
      </div>
      {items.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm" data-testid="upload-status">
          {items.map((it, i) => (
            <li key={i} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <span className="truncate">{it.name}</span>
              <span className={`ml-3 shrink-0 text-xs ${it.state === "error" ? "text-danger" : "text-muted"}`} data-state={it.state}>
                {it.state}{it.detail ? ` — ${it.detail}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div>
        <Button type="button" variant="secondary" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? "Working…" : "Choose files"}
        </Button>
      </div>
    </div>
  );
}
