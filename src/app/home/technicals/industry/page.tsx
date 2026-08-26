// /home/technicals/industry — the 18 industry / group modules grouped by family (Loop 09).
// Counts come from `listIndustryModules` (the `industry_modules` view under the cookie client, so
// only approved lessons/questions are counted; base-table fallback until 0010 is applied). A module
// page is the ordinary topic page: /home/technicals/<module>.
import type { Metadata } from "next";
import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { groupByFamily, listIndustryModules } from "@/lib/content/industry";
import { INDUSTRY_MODULES } from "@/lib/content/taxonomy";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Industry modules — Technicals — A* Apply", robots: { index: false, follow: false } };

export default async function IndustryPage() {
  await verifySession("/home/technicals/industry");
  const db = await createClient();
  const { modules } = await listIndustryModules(db);
  const groups = groupByFamily(modules);
  const live = modules.filter((m) => m.lesson_count > 0).length;
  return (
    <>
      <div>
        <Link href="/home/technicals" className="text-sm text-muted hover:text-fg">← Technicals</Link>
        <h1 className="mt-2 text-2xl font-semibold" data-testid="industry-heading">Industry modules</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          How the generalist framework changes for each coverage and product group: the metrics that replace EBITDA, the valuation methods that dominate, the typical deals and what that group&apos;s interviewers probe. Do the generalist topics first.
        </p>
        <p className="mt-1 text-xs text-muted" data-testid="industry-summary">{INDUSTRY_MODULES.length} modules · {live} with published lessons</p>
      </div>
      {groups.map((g) => (
        <section key={g.family} className="flex flex-col gap-3" data-testid="industry-family" data-family={g.family}>
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">{g.label}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.modules.map((m) => {
              const soon = m.lesson_count === 0;
              return (
                <Link key={m.slug} href={`/home/technicals/${m.slug}`} data-testid="industry-card" data-slug={m.slug} data-live={soon ? "0" : "1"}>
                  <Card className={`h-full hover:border-muted ${soon ? "opacity-70" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle>{m.title}</CardTitle>
                      {soon ? <Badge>Coming soon</Badge> : <Badge tone="accent">{m.lesson_count} lesson{m.lesson_count === 1 ? "" : "s"}</Badge>}
                    </div>
                    <CardDescription>{m.summary}</CardDescription>
                    <p className="mt-3 text-xs text-muted" data-testid="industry-counts">
                      {m.subtopic_count} lesson slot{m.subtopic_count === 1 ? "" : "s"} · {m.question_count} question{m.question_count === 1 ? "" : "s"} · {m.flashcard_count} card{m.flashcard_count === 1 ? "" : "s"}
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
