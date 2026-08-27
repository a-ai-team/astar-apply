import Link from "next/link";
import { verifyStaff } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/corpus/status-badge";
import type { ContentStatus, CorpusSourceRow, SourceKind } from "@/lib/corpus/types";

const STATUSES: ContentStatus[] = ["draft", "generated", "in_review", "approved", "rejected", "archived"];
const KINDS: SourceKind[] = ["photo", "pdf", "text", "qa", "voice"];

type Row = Pick<CorpusSourceRow, "id" | "kind" | "title" | "status" | "topic_tags" | "extraction_confidence" | "created_at"> & {
  corpus_chunks: { count: number }[];
};

export default async function CorpusListPage({ searchParams }: PageProps<"/admin/corpus">) {
  await verifyStaff();
  const sp = await searchParams;
  const status = typeof sp.status === "string" && STATUSES.includes(sp.status as ContentStatus) ? (sp.status as ContentStatus) : null;
  const kind = typeof sp.kind === "string" && KINDS.includes(sp.kind as SourceKind) ? (sp.kind as SourceKind) : null;

  const admin = createAdminClient();
  let q = admin
    .from("corpus_sources")
    .select("id, kind, title, status, topic_tags, extraction_confidence, created_at, corpus_chunks(count)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) q = q.eq("status", status);
  if (kind) q = q.eq("kind", kind);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as unknown as Row[];

  const link = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const merged = { status, kind, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return `/admin/corpus${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="corpus-heading">Corpus</h1>
          <p className="mt-1 text-sm text-muted">{rows.length} sources. Upload photos, PDFs, notes or Q&amp;A; review the chunks; approve to make them retrievable.</p>
        </div>
        <Link href="/admin/corpus/upload">
          <Button data-testid="upload-link">Upload</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 text-xs" data-testid="corpus-filters">
        <FilterChip href={link({ status: null })} active={!status}>all statuses</FilterChip>
        {STATUSES.map((s) => (
          <FilterChip key={s} href={link({ status: s })} active={status === s}>{s.replace("_", " ")}</FilterChip>
        ))}
        <span className="mx-2 text-border">|</span>
        <FilterChip href={link({ kind: null })} active={!kind}>all kinds</FilterChip>
        {KINDS.map((k) => (
          <FilterChip key={k} href={link({ kind: k })} active={kind === k}>{k}</FilterChip>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm" data-testid="corpus-table">
          <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Kind</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Chunks</th>
              <th className="px-4 py-2">Confidence</th>
              <th className="px-4 py-2">Tags</th>
              <th className="px-4 py-2">Added</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">Nothing here yet.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-surface/60">
                <td className="px-4 py-2"><Link href={`/admin/corpus/${r.id}`} className="hover:underline">{r.title}</Link></td>
                <td className="px-4 py-2 text-muted">{r.kind}</td>
                <td className="px-4 py-2"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-2">{r.corpus_chunks?.[0]?.count ?? 0}</td>
                <td className="px-4 py-2 text-muted">{r.extraction_confidence == null ? "—" : `${Math.round(r.extraction_confidence * 100)}%`}</td>
                <td className="px-4 py-2 text-xs text-muted">{r.topic_tags.join(", ") || "—"}</td>
                <td className="px-4 py-2 text-muted">{new Date(r.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={`rounded-full border px-2.5 py-1 ${active ? "border-fg/40 bg-surface text-fg" : "border-border text-muted hover:text-fg"}`}>
      {children}
    </Link>
  );
}
