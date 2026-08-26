// /home/interviews/firms/[slug] — firm dossier, process timeline and the tagged question bank
// (Loop 08). Cookie client under RLS: approved firm + approved questions only; anything else 404s.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getFirm, listFirmQuestions } from "@/lib/firms/queries";
import { LABELS } from "@/lib/firms/schema";
import { ProcessTimeline } from "@/components/firms/process-timeline";
import { FirmQuestionList } from "@/components/firms/firm-question-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { startDrillFor } from "@/app/home/interviews/actions";

export const metadata: Metadata = { title: "Firm question bank — A* Apply", robots: { index: false, follow: false } };

export default async function FirmPage({ params, searchParams }: PageProps<"/home/interviews/firms/[slug]">) {
  await verifySession("/home/interviews/firms");
  const { slug } = await params;
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;
  if (!/^[a-z0-9-]+$/.test(slug)) notFound();
  const db = await createClient();
  const firm = await getFirm(db, slug);
  if (!firm) notFound();
  const questions = await listFirmQuestions(db, firm.id);
  const facts: [string, string | null][] = [
    ["Type", LABELS.type[firm.type]],
    ["Founded", firm.founded ? String(firm.founded) : null],
    ["HQ", firm.hq],
    ["People", firm.headcount],
    ["Scale", firm.scale_note],
  ];
  return (
    <>
      <div>
        <Link href="/home/interviews/firms" className="text-sm text-muted hover:text-fg">← Firms</Link>
        <h1 className="mt-2 text-2xl font-semibold" data-testid="firm-heading">{firm.name}</h1>
        <p className="mt-1 text-sm text-muted">{questions.length} reviewed question{questions.length === 1 ? "" : "s"} · facts from the firm&apos;s own careers pages{firm.sources.length ? <> · {firm.sources.map((s, i) => <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="underline">{i ? `, ${s.title}` : s.title}</a>)}</> : null}</p>
      </div>
      {error && <p className="rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger" data-testid="firm-error">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card data-testid="firm-dossier">
          <CardTitle>Dossier</CardTitle>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            {facts.filter(([, v]) => v).map(([k, v]) => <div key={k} className="contents"><dt className="text-muted">{k}</dt><dd>{v}</dd></div>)}
          </dl>
          {firm.divisions.length > 0 && <><h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Divisions</h3><ul className="mt-1 flex flex-wrap gap-1.5">{firm.divisions.map((d) => <li key={d}><Badge>{d}</Badge></li>)}</ul></>}
          {firm.values.length > 0 && <><h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">What they say they value</h3><ul className="mt-1 flex flex-wrap gap-1.5">{firm.values.map((v) => <li key={v}><Badge tone="accent">{v}</Badge></li>)}</ul></>}
        </Card>
        <Card className="lg:col-span-2" data-testid="firm-process">
          <CardTitle>Recruitment process</CardTitle>
          <p className="mb-4 mt-1 text-sm text-muted">Typical order for the early-careers programmes; dates shift each year, so check the careers page for the current cycle.</p>
          <ProcessTimeline process={firm.process} />
        </Card>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Questions</h2>
        {questions.length === 0 ? <p className="text-sm text-muted" data-testid="firm-questions-none">No reviewed questions for this firm yet.</p> : <FirmQuestionList questions={questions} practise={startDrillFor} backHref={`/home/interviews/firms/${firm.slug}`} canPractise />}
      </section>
    </>
  );
}
