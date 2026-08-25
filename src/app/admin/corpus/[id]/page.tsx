import Link from "next/link";
import { notFound } from "next/navigation";
import { verifyStaff } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatusBadge } from "@/components/corpus/status-badge";
import { SourceActions } from "@/components/corpus/source-actions";
import { SourceViewer } from "@/components/corpus/source-viewer";
import { ChunkList } from "@/components/corpus/chunk-list";
import type { CorpusChunkRow, CorpusSourceRow } from "@/lib/corpus/types";

export default async function CorpusSourcePage({ params }: PageProps<"/admin/corpus/[id]">) {
  await verifyStaff();
  const { id } = await params;
  const admin = createAdminClient();
  const [{ data: source }, { data: chunks }] = await Promise.all([
    admin.from("corpus_sources").select("*").eq("id", id).maybeSingle<CorpusSourceRow>(),
    admin.from("corpus_chunks").select("*").eq("source_id", id).order("ordinal").returns<CorpusChunkRow[]>(),
  ]);
  if (!source) notFound();

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link href="/admin/corpus" className="text-xs text-muted hover:text-fg">← Corpus</Link>
          <h1 className="mt-1 truncate text-2xl font-semibold" data-testid="source-title">{source.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
            <StatusBadge status={source.status} />
            <span>{source.kind}</span>
            {source.page_count != null && <span>· {source.page_count} page{source.page_count === 1 ? "" : "s"}</span>}
            {source.extraction_confidence != null && <span>· confidence {Math.round(source.extraction_confidence * 100)}%</span>}
            {source.extraction_model && <span>· {source.extraction_model}</span>}
            <span>· {(chunks ?? []).length} chunk{(chunks ?? []).length === 1 ? "" : "s"}</span>
          </div>
          {source.extraction_error && (
            <p className="mt-2 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger" data-testid="extraction-error">
              Extraction failed: {source.extraction_error}
            </p>
          )}
        </div>
        <SourceActions sourceId={source.id} status={source.status} kind={source.kind} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="min-w-0">
          <h2 className="mb-2 text-sm font-medium text-muted">Original</h2>
          <SourceViewer source={{ id: source.id, kind: source.kind, mime: source.mime, raw_text: source.raw_text, hasFile: Boolean(source.storage_path) }} />
        </section>
        <section className="min-w-0">
          <h2 className="mb-2 text-sm font-medium text-muted">Chunks</h2>
          <ChunkList chunks={chunks ?? []} />
        </section>
      </div>
    </>
  );
}
