// /admin/review — the mentor review queue: generated / draft / in_review lessons and questions,
// filterable by type, status and topic. Approved rows are listed only when asked for.
import Link from "next/link";
import { verifyStaff } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { CURRICULUM } from "@/lib/content/taxonomy";
import { Badge } from "@/components/ui/badge";

const STATUSES = ["generated", "draft", "in_review", "approved", "rejected"] as const;
const QUEUE_DEFAULT = ["generated", "draft", "in_review"];

type LessonRow = { id: string; slug: string; title: string; status: string; reading_minutes: number; updated_at: string; generated_by: string | null; review_note: string | null; subtopic: { title: string; topic: { slug: string; title: string } } | null };
type QuestionRow = { id: string; slug: string; question: string; status: string; kind: string; difficulty: number; updated_at: string; generated_by: string | null; review_note: string | null; topic: { slug: string; title: string } | null; subtopic: { title: string } | null };

export default async function ReviewQueuePage({ searchParams }: PageProps<"/admin/review">) {
  await verifyStaff();
  const sp = await searchParams;
  const type = typeof sp.type === "string" && ["lesson", "question"].includes(sp.type) ? sp.type : "all";
  const status = typeof sp.status === "string" && (STATUSES as readonly string[]).includes(sp.status) ? sp.status : "queue";
  const topic = typeof sp.topic === "string" && CURRICULUM.some((t) => t.slug === sp.topic) ? sp.topic : "all";
  const statuses = status === "queue" ? QUEUE_DEFAULT : [status];
  const db = createAdminClient();

  let lessons: LessonRow[] = [];
  let questions: QuestionRow[] = [];
  if (type !== "question") {
    const { data, error } = await db.from("lessons").select("id, slug, title, status, reading_minutes, updated_at, generated_by, review_note, subtopic:subtopics(title, topic:topics(slug, title))").in("status", statuses).order("updated_at", { ascending: false }).limit(200);
    if (error) throw error;
    lessons = ((data ?? []) as unknown as LessonRow[]).filter((l) => topic === "all" || l.subtopic?.topic.slug === topic);
  }
  if (type !== "lesson") {
    const { data, error } = await db.from("questions").select("id, slug, question, status, kind, difficulty, updated_at, generated_by, review_note, topic:topics(slug, title), subtopic:subtopics(title)").in("status", statuses).order("updated_at", { ascending: false }).limit(400);
    if (error) throw error;
    questions = ((data ?? []) as unknown as QuestionRow[]).filter((q) => topic === "all" || q.topic?.slug === topic);
  }
  const link = (p: Record<string, string>) => `/admin/review?${new URLSearchParams({ type, status, topic, ...p }).toString()}`;
  const tone = (s: string) => (s === "approved" ? "accent" : s === "rejected" ? "danger" : "neutral");

  return (
    <>
      <h1 className="text-2xl font-semibold" data-testid="review-heading">Review queue</h1>
      <p className="text-sm text-muted">{lessons.length} lesson{lessons.length === 1 ? "" : "s"} · {questions.length} question{questions.length === 1 ? "" : "s"}. Generated content waits here until a mentor approves it; only <span className="font-mono">approved</span> rows reach students. Batch runs live under <Link href="/admin/generation" className="underline">Generation</Link>.</p>
      <div className="flex flex-wrap gap-2 text-xs" data-testid="review-filters">
        {["all", "lesson", "question"].map((t) => <Link key={t} href={link({ type: t })} className={`rounded-full border px-3 py-1 ${type === t ? "border-accent text-accent" : "border-border text-muted"}`}>{t}</Link>)}
        <span className="mx-1 text-muted">·</span>
        {["queue", ...STATUSES].map((s) => <Link key={s} href={link({ status: s })} className={`rounded-full border px-3 py-1 ${status === s ? "border-accent text-accent" : "border-border text-muted"}`}>{s}</Link>)}
        <span className="mx-1 text-muted">·</span>
        <Link href={link({ topic: "all" })} className={`rounded-full border px-3 py-1 ${topic === "all" ? "border-accent text-accent" : "border-border text-muted"}`}>all topics</Link>
        {CURRICULUM.map((t) => <Link key={t.slug} href={link({ topic: t.slug })} className={`rounded-full border px-3 py-1 ${topic === t.slug ? "border-accent text-accent" : "border-border text-muted"}`}>{t.title}</Link>)}
      </div>

      {lessons.length === 0 && questions.length === 0 && <p className="text-sm text-muted" data-testid="review-empty">Nothing to review with these filters.</p>}

      {lessons.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Lessons</h2>
          <ul className="flex flex-col gap-2" data-testid="review-lesson-list">
            {lessons.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3" data-testid="review-row">
                <Link href={`/admin/review/lesson/${l.id}`} className="font-medium hover:underline" data-testid="review-lesson-link">{l.title}</Link>
                <span className="text-xs text-muted">{l.subtopic?.topic.title} · {l.subtopic?.title} · {l.reading_minutes} min · {l.generated_by ?? "?"}</span>
                {l.review_note && <span className="text-xs text-danger" title={l.review_note}>note</span>}
                <span className="ml-auto flex items-center gap-2 text-xs text-muted"><Badge tone={tone(l.status)}>{l.status}</Badge>{new Date(l.updated_at).toLocaleString("en-GB")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {questions.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Questions</h2>
          <ul className="flex flex-col gap-2" data-testid="review-question-list">
            {questions.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3" data-testid="review-row">
                <Link href={`/admin/review/question/${q.id}`} className="font-medium hover:underline" data-testid="review-question-link">{q.question.length > 110 ? `${q.question.slice(0, 110)}…` : q.question}</Link>
                <span className="text-xs text-muted">{q.topic?.title} · {q.subtopic?.title ?? "—"} · {q.kind} · d{q.difficulty} · {q.generated_by ?? "?"}</span>
                {q.review_note && <span className="text-xs text-danger" title={q.review_note}>note</span>}
                <span className="ml-auto flex items-center gap-2 text-xs text-muted"><Badge tone={tone(q.status)}>{q.status}</Badge>{new Date(q.updated_at).toLocaleString("en-GB")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
