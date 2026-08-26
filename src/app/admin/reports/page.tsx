// /admin/reports — student-reported questions waiting for a mentor (Loop 08). Approve promotes the
// report to an approved firm_questions row; reject leaves it on record. Staff only, service role.
import Link from "next/link";
import { verifyStaff } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { LABELS } from "@/lib/firms/schema";
import { Badge } from "@/components/ui/badge";
import { ReportReview } from "@/components/firms/report-review";

type Row = { id: string; programme: keyof typeof LABELS.programme; stage: keyof typeof LABELS.stage; division: string | null; asked_at: string | null; context: string | null; question: string; status: string; created_at: string; firm: { slug: string; name: string } | null; reporter: { display_name: string | null } | null };
const STATUSES = ["pending", "approved", "rejected"] as const;

export default async function AdminReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  await verifyStaff();
  const sp = await searchParams;
  const status = typeof sp.status === "string" && (STATUSES as readonly string[]).includes(sp.status) ? sp.status : "pending";
  const db = createAdminClient();
  const { data, error } = await db.from("firm_question_reports").select("id, programme, stage, division, asked_at, context, question, status, created_at, firm:firms(slug, name), reporter:profiles(display_name)").eq("status", status).order("created_at", { ascending: false }).limit(200);
  if (error) throw error;
  const rows = (data ?? []) as unknown as Row[];
  return (
    <>
      <h1 className="text-2xl font-semibold" data-testid="reports-heading">Reported questions</h1>
      <p className="text-sm text-muted">{rows.length} {status}. Approving adds the question to the firm&apos;s bank as <span className="font-mono">approved</span> with the year it was asked as its recency; the firm itself must be approved under <Link href="/admin/firms" className="underline">Firms</Link> for students to see it.</p>
      <div className="flex gap-2 text-xs">{STATUSES.map((s) => <Link key={s} href={`/admin/reports?status=${s}`} className={`rounded-full border px-3 py-1 ${status === s ? "border-accent text-accent" : "border-border text-muted"}`}>{s}</Link>)}</div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted" data-testid="reports-empty">Nothing here.</p>
      ) : (
        <ul className="flex flex-col gap-3" data-testid="reports-list">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4" data-testid="report-row">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium text-fg">{r.firm?.name ?? "?"}</span>
                <Badge tone="accent">{LABELS.stage[r.stage]}</Badge><Badge>{LABELS.programme[r.programme]}</Badge>{r.division && <Badge>{r.division}</Badge>}
                {r.asked_at && <span className="text-muted">asked {String(r.asked_at).slice(0, 7)}</span>}
                <span className="ml-auto text-muted">{r.reporter?.display_name ?? "?"} · {new Date(r.created_at).toLocaleString("en-GB")}</span>
              </div>
              <p className="text-sm" data-testid="report-row-question">{r.question}</p>
              {r.context && <p className="text-xs text-muted">Context: {r.context}</p>}
              {status === "pending" && <ReportReview id={r.id} />}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
