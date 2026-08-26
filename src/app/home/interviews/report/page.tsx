// /home/interviews/report — crowdsourced "report a question" (Loop 08). Static segment (wins over
// [id]). Sign-in required; 5 reports per day; every report is hand-reviewed in /admin/reports.
import type { Metadata } from "next";
import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { listFirms } from "@/lib/firms/queries";
import { REPORTS_PER_DAY } from "@/lib/firms/reports";
import { ReportForm } from "@/components/firms/report-form";

export const metadata: Metadata = { title: "Report a question — A* Apply", robots: { index: false, follow: false } };

export default async function ReportPage() {
  await verifySession("/home/interviews/report");
  const db = await createClient();
  const firms = await listFirms(db);
  return (
    <>
      <div>
        <Link href="/home/interviews/firms" className="text-sm text-muted hover:text-fg">← Firms</Link>
        <h1 className="mt-2 text-2xl font-semibold" data-testid="report-heading">Report a question</h1>
        <p className="mt-1 text-sm text-muted">Were you asked something we do not list? Tell us the firm, the stage and the question. A mentor reviews every report before it joins the bank, and nothing you write here is shown with your name. Up to {REPORTS_PER_DAY} a day.</p>
      </div>
      {firms.length === 0 ? <p className="text-sm text-muted" data-testid="report-no-firms">No firms are published yet, so there is nothing to report against.</p> : <ReportForm firms={firms.map((f) => ({ id: f.id, name: f.name }))} />}
    </>
  );
}
