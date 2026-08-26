// /admin/firms — every firm with its status and question counts by status (Loop 08). Rows seeded
// by `seed -- 08` and the authoring script are `generated` = unverified until approved here.
import Link from "next/link";
import { verifyStaff } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { LABELS } from "@/lib/firms/schema";
import { Badge } from "@/components/ui/badge";

type Row = { id: string; slug: string; name: string; type: keyof typeof LABELS.type; status: string; updated_at: string };

export default async function AdminFirmsPage() {
  await verifyStaff();
  const db = createAdminClient();
  const [{ data: firms, error }, { data: qs, error: qErr }] = await Promise.all([
    db.from("firms").select("id, slug, name, type, status, updated_at").order("name"),
    db.from("firm_questions").select("firm_id, status"),
  ]);
  if (error) throw error;
  if (qErr) throw qErr;
  const counts = new Map<string, Record<string, number>>();
  for (const q of (qs ?? []) as { firm_id: string; status: string }[]) {
    const c = counts.get(q.firm_id) ?? {};
    c[q.status] = (c[q.status] ?? 0) + 1;
    counts.set(q.firm_id, c);
  }
  const rows = (firms ?? []) as Row[];
  return (
    <>
      <h1 className="text-2xl font-semibold" data-testid="admin-firms-heading">Firms</h1>
      <p className="text-sm text-muted">{rows.length} firms · {rows.filter((f) => f.status === "approved").length} approved. A firm and its questions are both <span className="font-mono">generated</span> (unverified) until you approve them; students see only approved questions of approved firms.</p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted" data-testid="admin-firms-empty">No firms — run <span className="font-mono">npm run seed -- 08</span>.</p>
      ) : (
        <ul className="flex flex-col gap-2" data-testid="admin-firms-list">
          {rows.map((f) => {
            const c = counts.get(f.id) ?? {};
            return (
              <li key={f.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm" data-testid="admin-firm-row" data-slug={f.slug} data-status={f.status}>
                <Link href={`/admin/firms/${f.slug}`} className="font-medium underline" data-testid="admin-firm-link">{f.name}</Link>
                <Badge>{LABELS.type[f.type]}</Badge>
                {f.status === "approved" ? <Badge tone="accent">approved</Badge> : <Badge tone="danger">{f.status} · unverified</Badge>}
                <span className="ml-auto text-xs text-muted">
                  {Object.entries(c).map(([s, n]) => `${n} ${s}`).join(" · ") || "no questions"} · {new Date(f.updated_at).toLocaleDateString("en-GB")}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
