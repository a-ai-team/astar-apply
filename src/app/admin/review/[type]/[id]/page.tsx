// /admin/review/[type]/[id] — preview (the student renderer for lessons; the answer, key points
// and follow-ups for questions), check problems, review history, and the decision form.
import Link from "next/link";
import { notFound } from "next/navigation";
import { verifyStaff } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasAnthropicKey } from "@/lib/ai/client";
import { validateLessonBody } from "@/lib/content/lesson-schema";
import { LessonRenderer } from "@/components/lesson/lesson-renderer";
import { Markdown } from "@/components/lesson/markdown";
import { Badge } from "@/components/ui/badge";
import { ReviewForm } from "@/components/review/review-form";

// Regenerate runs the writer synchronously (up to a few minutes).
export const maxDuration = 300;

type Review = { id: string; decision: string; comment: string; created_at: string; reviewer: { display_name: string | null } | null };

export default async function ReviewItemPage({ params }: PageProps<"/admin/review/[type]/[id]">) {
  await verifyStaff();
  const { type, id } = await params;
  if (type !== "lesson" && type !== "question") notFound();
  const db = createAdminClient();
  const { data: reviews, error: rvErr } = await db.from("content_reviews").select("id, decision, comment, created_at, reviewer:profiles(display_name)").eq("target_type", type).eq("target_id", id).order("created_at", { ascending: false });
  if (rvErr) throw rvErr;
  const history = ((reviews ?? []) as unknown as Review[]);
  const canRegenerate = hasAnthropicKey();

  if (type === "lesson") {
    const { data, error } = await db.from("lessons").select("id, slug, title, status, body, generated_by, prompt_version, review_note, reading_minutes, subtopic:subtopics(slug, title, topic:topics(slug, title))").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) notFound();
    const sub = data.subtopic as unknown as { slug: string; title: string; topic: { slug: string; title: string } } | null;
    const v = validateLessonBody(data.body);
    return (
      <>
        <Header back="/admin/review" title={data.title} status={data.status} meta={`${data.slug} · ${sub?.topic.title} / ${sub?.title} · ${data.reading_minutes} min · ${data.generated_by ?? "?"}${data.prompt_version ? ` · ${data.prompt_version}` : ""}`} testId="review-item-heading" extra={<Link href={`/admin/lessons/${data.id}`} className="underline">edit JSON</Link>} />
        {data.review_note && <Note note={data.review_note} />}
        <History items={history} />
        <ReviewForm type="lesson" id={data.id} currentStatus={data.status} canRegenerate={canRegenerate} />
        <div className="rounded-lg border border-border p-4" data-testid="review-preview">
          {v.ok ? <LessonRenderer body={v.value} /> : <ul className="text-sm text-danger">{v.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
        </div>
      </>
    );
  }

  const { data, error } = await db.from("questions").select("id, slug, question, status, kind, difficulty, body, source_topic, tags, generated_by, prompt_version, review_note, topic:topics(slug, title), subtopic:subtopics(slug, title)").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) notFound();
  const body = data.body as { model_answer_md?: string; key_points?: string[]; follow_ups?: { question: string; answer_md: string }[]; weak_answer_note?: string; numbers?: { inputs: Record<string, number>; answer: number } | null; flashcard_back?: string };
  const topic = data.topic as unknown as { slug: string; title: string } | null;
  const sub = data.subtopic as unknown as { slug: string; title: string } | null;
  return (
    <>
      <Header back="/admin/review?type=question" title={data.question} status={data.status} meta={`${data.slug} · ${topic?.title} / ${sub?.title ?? "—"} · ${data.kind} · difficulty ${data.difficulty} · ${data.generated_by ?? "?"}${data.prompt_version ? ` · ${data.prompt_version}` : ""} · source: ${data.source_topic ?? "—"}`} testId="review-item-heading" />
      {data.review_note && <Note note={data.review_note} />}
      <History items={history} />
      <ReviewForm type="question" id={data.id} currentStatus={data.status} canRegenerate={canRegenerate} />
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4" data-testid="review-preview">
        <section><h2 className="mb-1 text-xs uppercase tracking-wide text-muted">Model answer</h2><Markdown md={body.model_answer_md ?? ""} className="prose-lesson" /></section>
        <section><h2 className="mb-1 text-xs uppercase tracking-wide text-muted">Key points</h2><ul className="list-disc pl-5 text-sm">{(body.key_points ?? []).map((k, i) => <li key={i}>{k}</li>)}</ul></section>
        <section><h2 className="mb-1 text-xs uppercase tracking-wide text-muted">Follow-ups</h2><ol className="list-decimal pl-5 text-sm">{(body.follow_ups ?? []).map((f, i) => <li key={i} className="mb-2"><span className="font-medium">{f.question}</span><Markdown md={f.answer_md} className="prose-lesson text-muted" /></li>)}</ol></section>
        {body.weak_answer_note && <section><h2 className="mb-1 text-xs uppercase tracking-wide text-muted">Weak answer sounds like</h2><p className="text-sm">{body.weak_answer_note}</p></section>}
        {body.numbers && <section><h2 className="mb-1 text-xs uppercase tracking-wide text-muted">Numbers</h2><pre className="overflow-x-auto rounded-md bg-surface p-2 text-xs">{JSON.stringify(body.numbers, null, 2)}</pre></section>}
        {body.flashcard_back && <section><h2 className="mb-1 text-xs uppercase tracking-wide text-muted">Flashcard back</h2><p className="text-sm">{body.flashcard_back}</p></section>}
        <p className="text-xs text-muted">tags: {(data.tags as string[]).join(", ") || "—"}</p>
      </div>
    </>
  );
}

function Header({ back, title, status, meta, testId, extra }: { back: string; title: string; status: string; meta: string; testId: string; extra?: React.ReactNode }) {
  return (
    <div>
      <Link href={back} className="text-sm text-muted hover:text-fg">← Review queue</Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold" data-testid={testId}>{title}</h1>
        <Badge tone={status === "approved" ? "accent" : status === "rejected" ? "danger" : "neutral"} data-testid="review-item-status">{status}</Badge>
      </div>
      <p className="text-sm text-muted">{meta} {extra && <>· {extra}</>}</p>
    </div>
  );
}

function Note({ note }: { note: string }) {
  return (
    <div className="rounded-lg border border-danger/40 bg-danger/5 p-3 text-sm" data-testid="review-note">
      <p className="mb-1 text-xs uppercase tracking-wide text-muted">Checker / reviewer note</p>
      <pre className="whitespace-pre-wrap font-sans">{note}</pre>
    </div>
  );
}

function History({ items }: { items: Review[] }) {
  if (!items.length) return null;
  return (
    <ul className="flex flex-col gap-1 text-sm" data-testid="review-history">
      {items.map((r) => (
        <li key={r.id} className="flex flex-wrap gap-2 rounded-md border border-border bg-surface px-3 py-2">
          <Badge tone={r.decision === "approved" ? "accent" : r.decision === "rejected" ? "danger" : "neutral"}>{r.decision.replace("_", " ")}</Badge>
          <span className="text-muted">{r.reviewer?.display_name ?? (r.reviewer ? "staff" : "auto")} · {new Date(r.created_at).toLocaleString("en-GB")}</span>
          {r.comment && <span className="w-full text-fg">{r.comment}</span>}
        </li>
      ))}
    </ul>
  );
}
