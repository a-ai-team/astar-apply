// /home/interviews/firms — grid of approved firms with question counts (Loop 08). Static segment,
// so it wins over /home/interviews/[id]. Rows stay `generated` (invisible here) until approved in admin.
import type { Metadata } from "next";
import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { listFirms } from "@/lib/firms/queries";
import { LABELS } from "@/lib/firms/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Firm question banks — A* Apply", robots: { index: false, follow: false } };

export default async function FirmsPage({ searchParams }: PageProps<"/home/interviews/firms">) {
  await verifySession("/home/interviews/firms");
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;
  const db = await createClient();
  const firms = await listFirms(db);
  return (
    <>
      <div>
        <Link href="/home/interviews" className="text-sm text-muted hover:text-fg">← Mock interviews</Link>
        <h1 className="mt-2 text-2xl font-semibold" data-testid="firms-heading">Firm question banks</h1>
        <p className="mt-1 text-sm text-muted">What each firm tends to ask, by stage and programme, with a dossier and process timeline. Every question is reviewed by a mentor before it appears here. Been asked something we do not list? <Link href="/home/interviews/report" className="underline" data-testid="report-link">Report a question</Link>.</p>
      </div>
      {error && <p className="rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger" data-testid="firms-error">{error}</p>}
      {firms.length === 0 ? (
        <p className="text-sm text-muted" data-testid="firms-empty">No firms published yet — they appear here once a mentor has approved them.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="firms-grid">
          {firms.map((f) => (
            <li key={f.id}>
              <Link href={`/home/interviews/firms/${f.slug}`} data-testid="firm-card" data-slug={f.slug}>
                <Card className="h-full hover:border-accent">
                  <CardTitle>{f.name}</CardTitle>
                  <CardDescription>{f.hq ?? ""}</CardDescription>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-xs"><Badge>{LABELS.type[f.type]}</Badge><Badge tone="accent">{f.question_count} question{f.question_count === 1 ? "" : "s"}</Badge></div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
