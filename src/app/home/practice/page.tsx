// /home/practice — the question bank: approved questions, filters (topic × difficulty × kind),
// pagination. Reads with the cookie client so RLS serves only `approved`.
import type { Metadata } from "next";
import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { listTopics } from "@/lib/content/queries";
import { bankHref, DIFFICULTY_LABELS, listQuestions, parseBankFilter } from "@/lib/practice/queries";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Practice — A* Apply", robots: { index: false, follow: false } };

function Chip({ href, active, children, testId }: { href: string; active: boolean; children: React.ReactNode; testId?: string }) {
  return (
    <Link href={href} className={cn("rounded-full border px-3 py-1 text-xs transition", active ? "border-fg/40 bg-surface text-fg" : "border-border bg-surface text-muted hover:text-fg")} data-testid={testId} aria-current={active ? "true" : undefined}>
      {children}
    </Link>
  );
}

export default async function PracticePage({ searchParams }: PageProps<"/home/practice">) {
  await verifySession("/home/practice");
  const f = parseBankFilter(await searchParams);
  const db = await createClient();
  const [topics, { rows, total, page, pages }] = await Promise.all([listTopics(db), listQuestions(db, f)]);

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold" data-testid="practice-heading">Practice</h1>
        <p className="mt-1 text-sm text-muted">Say the answer out loud, reveal, grade yourself. Press ⌘K to search any question or lesson.</p>
      </div>

      <div className="flex flex-col gap-3" data-testid="bank-filters">
        <div className="flex flex-wrap gap-2">
          <Chip href={bankHref(f, { topic: undefined, page: 1 })} active={!f.topic} testId="filter-topic-all">All topics</Chip>
          {topics.map((t) => (
            <Chip key={t.id} href={bankHref(f, { topic: t.slug, page: 1 })} active={f.topic === t.slug} testId={`filter-topic-${t.slug}`}>{t.title}</Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip href={bankHref(f, { difficulty: undefined, page: 1 })} active={!f.difficulty} testId="filter-difficulty-all">Any difficulty</Chip>
          {[1, 2, 3, 4].map((d) => (
            <Chip key={d} href={bankHref(f, { difficulty: d, page: 1 })} active={f.difficulty === d} testId={`filter-difficulty-${d}`}>{d} · {DIFFICULTY_LABELS[d]}</Chip>
          ))}
          <span className="mx-1 text-muted">|</span>
          <Chip href={bankHref(f, { kind: undefined, page: 1 })} active={!f.kind} testId="filter-kind-all">Any kind</Chip>
          <Chip href={bankHref(f, { kind: "concept", page: 1 })} active={f.kind === "concept"} testId="filter-kind-concept">Concept</Chip>
          <Chip href={bankHref(f, { kind: "calculation", page: 1 })} active={f.kind === "calculation"} testId="filter-kind-calculation">Calculation</Chip>
        </div>
      </div>

      <p className="text-xs text-muted" data-testid="bank-count">{total} question{total === 1 ? "" : "s"}</p>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted" data-testid="bank-empty">
          No approved questions match. More arrive as the mentor team approves them.
        </div>
      ) : (
        <ol className="grid gap-3 md:grid-cols-2" data-testid="bank-list">
          {rows.map((q) => (
            <li key={q.id}>
              <Link href={`/home/practice/${q.slug}${bankHref(f, { page: undefined }).replace("/home/practice", "")}`} className="block h-full rounded-lg border border-border bg-surface p-4 transition hover:border-muted" data-testid="question-link" data-difficulty={q.difficulty}>
                <p className="font-medium">{q.question}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="accent">D{q.difficulty} · {DIFFICULTY_LABELS[q.difficulty]}</Badge>
                  <Badge>{q.kind}</Badge>
                  <Badge>{q.topic.title}</Badge>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}

      {pages > 1 && (
        <nav className="flex items-center gap-3 text-sm" data-testid="bank-pagination">
          {page > 1 ? <Link href={bankHref(f, { page: page - 1 })} className="underline-offset-2 hover:underline" data-testid="page-prev">← Previous</Link> : <span className="text-muted">← Previous</span>}
          <span className="text-muted">Page {page} of {pages}</span>
          {page < pages ? <Link href={bankHref(f, { page: page + 1 })} className="underline-offset-2 hover:underline" data-testid="page-next">Next →</Link> : <span className="text-muted">Next →</span>}
        </nav>
      )}
    </>
  );
}
