// /home/technicals/[topic] — subtopics in order, each with its (approved) lessons.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getTopic, listLessonSummaries, listSubtopics } from "@/lib/content/queries";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata({ params }: PageProps<"/home/technicals/[topic]">): Promise<Metadata> {
  const { topic } = await params;
  const db = await createClient();
  const t = await getTopic(db, topic);
  return { title: `${t?.title ?? "Topic"} — Technicals — A* Apply`, robots: { index: false, follow: false } };
}

export default async function TopicPage({ params }: PageProps<"/home/technicals/[topic]">) {
  await verifySession("/home/technicals");
  const { topic: slug } = await params;
  const db = await createClient();
  const topic = await getTopic(db, slug);
  if (!topic) notFound();
  const subtopics = await listSubtopics(db, topic.id);
  const lessons = await listLessonSummaries(db, subtopics.map((s) => s.id));
  return (
    <>
      <div>
        <Link href="/home/technicals" className="text-sm text-muted hover:text-fg">← Technicals</Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold" data-testid="topic-heading">{topic.title}</h1>
          {topic.is_free && <Badge tone="accent">Free</Badge>}
          <Badge>{topic.level}</Badge>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-muted">{topic.summary}</p>
      </div>
      <ol className="flex flex-col gap-3" data-testid="subtopic-list">
        {subtopics.map((s, i) => {
          const ls = lessons.filter((l) => l.subtopic_id === s.id);
          return (
            <li key={s.id} className="rounded-lg border border-border bg-surface p-4" data-testid="subtopic-row">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-xs text-muted">{i + 1}</span>
                <h2 className="font-medium">{s.title}</h2>
                <Badge className="ml-auto">{s.kind}</Badge>
              </div>
              {ls.length === 0 ? (
                <p className="mt-2 text-xs text-muted">Lesson coming soon.</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-1">
                  {ls.map((l) => (
                    <li key={l.id}>
                      <Link href={`/home/technicals/${topic.slug}/${l.slug}`} className="text-sm underline-offset-2 hover:underline" data-testid="lesson-link">
                        {l.title} <span className="text-xs text-muted">· {l.reading_minutes} min</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}
