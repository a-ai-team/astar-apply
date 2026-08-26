// /admin/firms/[slug] — dossier JSON editor with live FirmSchema validation, an "unverified" badge
// until approved, and the firm's questions with per-row + bulk status actions (Loop 08). Staff only;
// service-role reads so generated rows are visible.
import Link from "next/link";
import { notFound } from "next/navigation";
import { verifyStaff } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFirm, listFirmQuestions } from "@/lib/firms/queries";
import { LABELS } from "@/lib/firms/schema";
import { FirmEditor } from "@/components/firms/firm-editor";
import { StatusAction } from "@/components/admin/status-action";
import { Badge } from "@/components/ui/badge";
import { setFirmQuestionsStatus, setFirmQuestionStatus } from "../actions";

export default async function AdminFirmPage({ params }: PageProps<"/admin/firms/[slug]">) {
  await verifyStaff();
  const { slug } = await params;
  if (!/^[a-z0-9-]+$/.test(slug)) notFound();
  const db = createAdminClient();
  const firm = await getFirm(db, slug);
  if (!firm) notFound();
  const questions = await listFirmQuestions(db, firm.id);
  const { id, status, updated_at, ...body } = firm;
  const unapproved = questions.filter((q) => q.status !== "approved").length;
  return (
    <>
      <div>
        <Link href="/admin/firms" className="text-sm text-muted hover:text-fg">← Firms</Link>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold" data-testid="admin-firm-heading">
          {firm.name}
          {status === "approved" ? <Badge tone="accent">approved</Badge> : <Badge tone="danger" data-testid="admin-firm-unverified">unverified</Badge>}
        </h1>
        <p className="text-sm text-muted"><span className="font-mono">{firm.slug}</span> · {LABELS.type[firm.type]} · updated {new Date(updated_at).toLocaleString("en-GB")} · <Link href={`/home/interviews/firms/${firm.slug}`} className="underline">student view</Link> (404 until approved)</p>
      </div>
      <FirmEditor id={id} initialStatus={status} initialBody={JSON.stringify(body, null, 2)} />

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">Questions <span className="text-sm font-normal text-muted">({questions.length}, {unapproved} unverified)</span></h2>
          <StatusAction action={setFirmQuestionsStatus} fields={{ firm_id: id, slug: firm.slug, to: "approved", from: "generated,in_review,draft" }} label="Approve all unverified" variant="primary" testId="approve-all-questions" />
          <StatusAction action={setFirmQuestionsStatus} fields={{ firm_id: id, slug: firm.slug, to: "generated", from: "approved" }} label="Unapprove all" testId="unapprove-all-questions" />
        </div>
        {questions.length === 0 ? (
          <p className="text-sm text-muted">No questions yet — run <span className="font-mono">npm run firms:author -- --firm {firm.slug}</span> then <span className="font-mono">npm run seed -- 08</span>.</p>
        ) : (
          <ul className="flex flex-col gap-2" data-testid="admin-firm-questions">
            {questions.map((q) => (
              <li key={q.id} className="flex flex-col gap-1 rounded-lg border border-border bg-surface px-4 py-3 text-sm" data-testid="admin-firm-question" data-status={q.status}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{q.question}</p>
                  {q.status === "approved" ? <Badge tone="accent">approved</Badge> : <Badge tone="danger">{q.status} · unverified</Badge>}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge>{LABELS.category[q.category]}</Badge><Badge>{LABELS.stage[q.stage]}</Badge><Badge>{LABELS.programme[q.programme]}</Badge><Badge>{LABELS.frequency[q.frequency]}</Badge>
                  {q.division && <Badge>{q.division}</Badge>}
                  {q.recency_year && <span className="text-muted">asked {q.recency_year}</span>}
                  {q.reported_by && <span className="text-muted">student-reported</span>}
                  {q.generated_by && <span className="font-mono text-muted">{q.generated_by}</span>}
                  <span className="ml-auto flex gap-1">
                    {q.status !== "approved" && <StatusAction action={setFirmQuestionStatus} fields={{ id: q.id, slug: firm.slug, to: "approved" }} label="Approve" variant="primary" />}
                    {q.status !== "rejected" && <StatusAction action={setFirmQuestionStatus} fields={{ id: q.id, slug: firm.slug, to: "rejected" }} label="Reject" variant="ghost" />}
                  </span>
                </div>
                {q.guidance_md && <details className="text-xs text-muted"><summary className="cursor-pointer">Guidance</summary><pre className="mt-1 whitespace-pre-wrap font-sans">{q.guidance_md}</pre></details>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
