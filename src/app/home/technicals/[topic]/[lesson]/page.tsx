// /home/technicals/[topic]/[lesson] — LessonRenderer over the approved lesson body. RLS hides
// non-approved rows from students, so a draft lesson is a 404 here (acceptance check).
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getLesson } from "@/lib/content/queries";
import { LessonBodySchema } from "@/lib/content/lesson-schema";
import { LessonRenderer } from "@/components/lesson/lesson-renderer";
import { Badge } from "@/components/ui/badge";
import { isLessonComplete } from "@/lib/practice/queries";
import { LessonProgressControls } from "@/components/practice/lesson-progress-controls";

export async function generateMetadata({ params }: PageProps<"/home/technicals/[topic]/[lesson]">): Promise<Metadata> {
  const { lesson } = await params;
  const db = await createClient();
  const l = await getLesson(db, lesson);
  return { title: `${l?.title ?? "Lesson"} — Technicals — A* Apply`, robots: { index: false, follow: false } };
}

export default async function LessonPage({ params }: PageProps<"/home/technicals/[topic]/[lesson]">) {
  await verifySession("/home/technicals");
  const { topic: topicSlug, lesson: lessonSlug } = await params;
  const db = await createClient();
  const lesson = await getLesson(db, lessonSlug);
  if (!lesson || lesson.subtopic.topic.slug !== topicSlug) notFound();
  const body = LessonBodySchema.safeParse(lesson.body);
  if (!body.success) notFound();
  const completed = await isLessonComplete(db, lesson.id);
  return (
    <>
      <div>
        <nav className="text-sm text-muted">
          <Link href="/home/technicals" className="hover:text-fg">Technicals</Link>
          <span className="mx-1">/</span>
          <Link href={`/home/technicals/${lesson.subtopic.topic.slug}`} className="hover:text-fg">{lesson.subtopic.topic.title}</Link>
          <span className="mx-1">/</span>
          <span>{lesson.subtopic.title}</span>
        </nav>
        <h1 className="mt-2 text-3xl font-semibold" data-testid="lesson-title">{lesson.title}</h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-muted">
          <Badge>{body.data.reading_minutes} min read</Badge>
          <span>{lesson.subtopic.kind}</span>
        </p>
      </div>
      <LessonRenderer body={body.data} />
      <LessonProgressControls lessonId={lesson.id} topicSlug={lesson.subtopic.topic.slug} completed={completed} />
    </>
  );
}
