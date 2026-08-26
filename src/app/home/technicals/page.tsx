// /home/technicals — nine topic cards with subtopic/lesson counts and free badges, plus the link to
// the industry modules (Loop 09; industry topics are listed on /home/technicals/industry, not here).
import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { topicOverview } from "@/lib/content/queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function TechnicalsPage() {
  await verifySession("/home/technicals");
  const db = await createClient();
  const overview = (await topicOverview(db)).filter(({ topic }) => topic.kind !== "industry");
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold" data-testid="technicals-heading">Technicals</h1>
        <p className="mt-1 text-sm text-muted">The textbook for IB technicals that doesn&apos;t exist yet — written for a second-year with one finance module. Follow the <Link href="/home/path" className="underline">10-week path</Link> or browse by topic.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="topic-grid">
        {overview.map(({ topic, subtopics, lessonCount }) => (
          <Link key={topic.id} href={`/home/technicals/${topic.slug}`} data-testid="topic-card">
            <Card className="h-full hover:border-muted">
              <div className="flex items-start justify-between gap-2">
                <CardTitle>{topic.title}</CardTitle>
                <div className="flex gap-1">
                  {topic.is_free && <Badge tone="accent" data-testid="free-badge">Free</Badge>}
                  <Badge>{topic.level}</Badge>
                </div>
              </div>
              <CardDescription>{topic.summary}</CardDescription>
              <p className="mt-3 text-xs text-muted" data-testid="topic-counts">
                {subtopics.length} subtopics · {lessonCount} lesson{lessonCount === 1 ? "" : "s"}
              </p>
            </Card>
          </Link>
        ))}
        <Link href="/home/technicals/industry" data-testid="industry-link">
          <Card className="h-full border-dashed hover:border-muted">
            <div className="flex items-start justify-between gap-2">
              <CardTitle>Industry &amp; group modules</CardTitle>
              <Badge>advanced</Badge>
            </div>
            <CardDescription>How the framework changes for FIG, real estate, TMT, LevFin and 14 other groups — metrics, valuation methods, typical deals.</CardDescription>
            <p className="mt-3 text-xs text-muted">18 modules</p>
          </Card>
        </Link>
      </div>
    </>
  );
}
