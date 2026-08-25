// /admin/lessons/[id] — JSON editor with live zod validation and a rendered preview.
import Link from "next/link";
import { notFound } from "next/navigation";
import { verifyStaff } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { LessonEditor } from "@/components/lesson/lesson-editor";
import { findSubtopic } from "@/lib/content/taxonomy";

export default async function AdminLessonPage({ params }: PageProps<"/admin/lessons/[id]">) {
  await verifyStaff();
  const { id } = await params;
  const db = createAdminClient();
  const { data, error } = await db.from("lessons").select("id, slug, title, status, body, subtopic:subtopics(slug, title, topic:topics(slug, title))").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) notFound();
  const sub = data.subtopic as unknown as { slug: string; title: string; topic: { slug: string; title: string } } | null;
  return (
    <>
      <div>
        <Link href="/admin/lessons" className="text-sm text-muted hover:text-fg">← Lessons</Link>
        <h1 className="mt-2 text-2xl font-semibold" data-testid="admin-lesson-heading">{data.title}</h1>
        <p className="text-sm text-muted">
          <span className="font-mono">{data.slug}</span> · {sub?.topic.title} / {sub?.title} ·{" "}
          {sub && <Link href={`/home/technicals/${sub.topic.slug}/${data.slug}`} className="underline">student view</Link>}
        </p>
      </div>
      <LessonEditor id={data.id} initialTitle={data.title} initialStatus={data.status} initialBody={JSON.stringify(data.body, null, 2)} walkthrough={Boolean(sub && findSubtopic(sub.slug)?.subtopic.walkthrough)} />
    </>
  );
}
