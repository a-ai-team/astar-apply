import "server-only";

// Read queries for Practice (question bank, flashcard decks, progress). Student pages pass the
// cookie client so RLS applies: only `approved` content and the caller's own progress rows.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuestionBody } from "@/lib/content/question-schema";
import type { CardStateRow } from "./srs";
import { computeStreak } from "./srs";
import { buildSearchQuery, SEARCH_LIMIT, type SearchHit } from "./search";

export const PAGE_SIZE = 12;
export const DIFFICULTY_LABELS: Record<number, string> = { 1: "Definition", 2: "Why", 3: "Second-order", 4: "Numerical" };
export const SESSION_SIZE = 20;

export type QuestionSummary = { id: string; slug: string; kind: string; difficulty: number; question: string; tags: string[]; topic: { slug: string; title: string } };
export type QuestionFull = QuestionSummary & { body: QuestionBody; subtopic: { slug: string; title: string } | null };

export type BankFilter = { topic?: string; difficulty?: number; kind?: string; page?: number };

/** Parses the bank's search params (strings) into a filter; invalid values are dropped. */
export function parseBankFilter(sp: Record<string, string | string[] | undefined>): BankFilter {
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]) ?? undefined;
  const d = Number(one("difficulty"));
  const p = Number(one("page"));
  const kind = one("kind");
  return {
    topic: one("topic") || undefined,
    difficulty: d >= 1 && d <= 4 ? d : undefined,
    kind: kind === "concept" || kind === "calculation" ? kind : undefined,
    page: Number.isInteger(p) && p >= 1 ? p : 1,
  };
}

export function bankHref(f: BankFilter, patch: Partial<BankFilter> = {}): string {
  const m = { ...f, ...patch };
  const q = new URLSearchParams();
  if (m.topic) q.set("topic", m.topic);
  if (m.difficulty) q.set("difficulty", String(m.difficulty));
  if (m.kind) q.set("kind", m.kind);
  if (m.page && m.page > 1) q.set("page", String(m.page));
  const s = q.toString();
  return s ? `/home/practice?${s}` : "/home/practice";
}

const SUMMARY = "id, slug, kind, difficulty, question, tags, topic:topics!inner(slug, title)";

export async function listQuestions(db: SupabaseClient, f: BankFilter): Promise<{ rows: QuestionSummary[]; total: number; page: number; pages: number }> {
  const page = f.page ?? 1;
  let q = db.from("questions").select(SUMMARY, { count: "exact" }).eq("status", "approved").order("difficulty").order("slug");
  if (f.topic) q = q.eq("topic.slug", f.topic);
  if (f.difficulty) q = q.eq("difficulty", f.difficulty);
  if (f.kind) q = q.eq("kind", f.kind);
  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await q.range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  const total = count ?? 0;
  return { rows: (data ?? []) as unknown as QuestionSummary[], total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** Question by slug (null when missing or hidden by RLS) plus the next slug in the same filter order. */
export async function getQuestion(db: SupabaseClient, slug: string): Promise<QuestionFull | null> {
  const { data, error } = await db.from("questions").select(`${SUMMARY}, body, subtopic:subtopics(slug, title)`).eq("slug", slug).maybeSingle();
  if (error) throw error;
  return (data as unknown as QuestionFull | null) ?? null;
}

export async function nextQuestionSlug(db: SupabaseClient, current: Pick<QuestionSummary, "difficulty" | "slug">, f: BankFilter): Promise<string | null> {
  let q = db.from("questions").select(SUMMARY).eq("status", "approved").order("difficulty").order("slug").limit(50);
  if (f.topic) q = q.eq("topic.slug", f.topic);
  if (f.difficulty) q = q.eq("difficulty", f.difficulty);
  if (f.kind) q = q.eq("kind", f.kind);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as unknown as QuestionSummary[];
  const after = rows.find((r) => r.difficulty > current.difficulty || (r.difficulty === current.difficulty && r.slug > current.slug));
  return after?.slug ?? null;
}

export async function attemptsForQuestion(db: SupabaseClient, questionId: string) {
  const { data, error } = await db.from("attempts").select("id, self_grade, created_at").eq("question_id", questionId).order("created_at", { ascending: false }).limit(5);
  if (error) throw error;
  return (data ?? []) as { id: string; self_grade: number | null; created_at: string }[];
}

// --- Flashcards ------------------------------------------------------------------------------

export type FlashcardRow = { id: string; question_id: string; topic_id: string; front: string; back_md: string };
export type DeckSummary = { topic: { id: string; slug: string; title: string; is_free: boolean }; total: number; due: number; mastered: number; started: number };

export async function listDecks(db: SupabaseClient): Promise<DeckSummary[]> {
  const [{ data: topics, error: tErr }, { data: cards, error: cErr }, { data: states, error: sErr }] = await Promise.all([
    db.from("topics").select("id, slug, title, is_free").order("ordinal"),
    db.from("flashcards").select("id, topic_id").eq("status", "approved"),
    db.from("card_state").select("flashcard_id, due, mastered"),
  ]);
  if (tErr) throw tErr;
  if (cErr) throw cErr;
  if (sErr) throw sErr;
  const stateByCard = new Map((states ?? []).map((s) => [s.flashcard_id as string, s as { due: string; mastered: boolean }]));
  const now = Date.now();
  return (topics ?? [])
    .map((t) => {
      const mine = (cards ?? []).filter((c) => c.topic_id === t.id);
      let due = 0, mastered = 0, started = 0;
      for (const c of mine) {
        const s = stateByCard.get(c.id as string);
        if (!s) continue;
        started++;
        if (s.mastered) mastered++;
        if (new Date(s.due).getTime() <= now) due++;
      }
      return { topic: t as DeckSummary["topic"], total: mine.length, due, mastered, started };
    })
    .filter((d) => d.total > 0);
}

export type SessionCard = FlashcardRow & { state: CardStateRow | null; isDue: boolean; isNew: boolean };

/** Cards for one session: due first (oldest due first), then new, then the rest — capped. */
export async function getDeckSession(db: SupabaseClient, topicSlug: string): Promise<{ topic: DeckSummary["topic"]; cards: SessionCard[]; dueCount: number; newCount: number; total: number } | null> {
  const { data: topic, error: tErr } = await db.from("topics").select("id, slug, title, is_free").eq("slug", topicSlug).maybeSingle();
  if (tErr) throw tErr;
  if (!topic) return null;
  const [{ data: cards, error: cErr }, { data: states, error: sErr }] = await Promise.all([
    db.from("flashcards").select("id, question_id, topic_id, front, back_md").eq("status", "approved").eq("topic_id", topic.id).order("front"),
    db.from("card_state").select("*"),
  ]);
  if (cErr) throw cErr;
  if (sErr) throw sErr;
  const stateByCard = new Map((states ?? []).map((s) => [s.flashcard_id as string, s as CardStateRow & { flashcard_id: string }]));
  const now = Date.now();
  const all: SessionCard[] = (cards ?? []).map((c) => {
    const state = stateByCard.get(c.id as string) ?? null;
    return { ...(c as FlashcardRow), state, isNew: !state, isDue: !!state && new Date(state.due).getTime() <= now };
  });
  const due = all.filter((c) => c.isDue).sort((a, b) => new Date(a.state!.due).getTime() - new Date(b.state!.due).getTime());
  const fresh = all.filter((c) => c.isNew);
  const rest = all.filter((c) => !c.isDue && !c.isNew).sort((a, b) => new Date(a.state!.due).getTime() - new Date(b.state!.due).getTime());
  return { topic: topic as DeckSummary["topic"], cards: [...due, ...fresh, ...rest].slice(0, SESSION_SIZE), dueCount: due.length, newCount: fresh.length, total: all.length };
}

// --- Progress --------------------------------------------------------------------------------

export type UserStats = { attempts_total: number; questions_attempted: number; reviews_total: number; cards_mastered: number; cards_due: number; lessons_completed: number; last_active_day: string | null };
export type TopicProgress = { topic: { slug: string; title: string }; questions: number; attempted: number; avgGrade: number | null; cards: number; mastered: number; lessons: number; lessonsDone: number };

export async function getProgress(db: SupabaseClient, userId: string, now = new Date()) {
  const [stats, days, topics, questions, attempts, cards, states, lessons, done] = await Promise.all([
    db.from("user_stats").select("*").eq("user_id", userId).maybeSingle(),
    db.from("user_activity_days").select("day").eq("user_id", userId),
    db.from("topics").select("id, slug, title").order("ordinal"),
    db.from("questions").select("id, topic_id").eq("status", "approved"),
    db.from("attempts").select("question_id, self_grade, created_at").order("created_at", { ascending: false }).limit(500),
    db.from("flashcards").select("id, topic_id").eq("status", "approved"),
    db.from("card_state").select("flashcard_id, mastered, lapses"),
    db.from("lessons").select("id, subtopic:subtopics!inner(topic_id)").eq("status", "approved"),
    db.from("lesson_progress").select("lesson_id"),
  ]);
  for (const r of [stats, days, topics, questions, attempts, cards, states, lessons, done]) if (r.error) throw r.error;

  const streak = computeStreak((days.data ?? []).map((d) => d.day as string), now);
  const qTopic = new Map((questions.data ?? []).map((q) => [q.id as string, q.topic_id as string]));
  const cTopic = new Map((cards.data ?? []).map((c) => [c.id as string, c.topic_id as string]));
  const doneSet = new Set((done.data ?? []).map((d) => d.lesson_id as string));
  const perTopic: TopicProgress[] = (topics.data ?? []).map((t) => {
    const qs = [...qTopic].filter(([, tid]) => tid === t.id).map(([id]) => id);
    const qSet = new Set(qs);
    const myAttempts = (attempts.data ?? []).filter((a) => qSet.has(a.question_id as string));
    const graded = myAttempts.map((a) => a.self_grade as number | null).filter((g): g is number => g != null);
    const cs = [...cTopic].filter(([, tid]) => tid === t.id).map(([id]) => id);
    const cSet = new Set(cs);
    const myStates = (states.data ?? []).filter((s) => cSet.has(s.flashcard_id as string));
    const ls = (lessons.data ?? []).filter((l) => (l.subtopic as unknown as { topic_id: string }).topic_id === t.id);
    return {
      topic: { slug: t.slug as string, title: t.title as string },
      questions: qs.length,
      attempted: new Set(myAttempts.map((a) => a.question_id as string)).size,
      avgGrade: graded.length ? graded.reduce((a, b) => a + b, 0) / graded.length : null,
      cards: cs.length,
      mastered: myStates.filter((s) => s.mastered).length,
      lessons: ls.length,
      lessonsDone: ls.filter((l) => doneSet.has(l.id as string)).length,
    };
  });
  const totals = {
    questions: qTopic.size,
    cards: cTopic.size,
    lessons: (lessons.data ?? []).length,
  };
  // Weak topics: attempted with an average self-grade under 2.5, or cards with lapses; lowest first.
  const weak = perTopic
    .filter((t) => (t.avgGrade != null && t.avgGrade < 2.5) || (t.cards > 0 && t.mastered < t.cards && t.attempted + t.mastered > 0))
    .sort((a, b) => (a.avgGrade ?? 3) - (b.avgGrade ?? 3))
    .slice(0, 3);
  const s = (stats.data ?? null) as UserStats | null;
  return {
    stats: s ?? { attempts_total: 0, questions_attempted: 0, reviews_total: 0, cards_mastered: 0, cards_due: 0, lessons_completed: 0, last_active_day: null },
    streak,
    activeDays: (days.data ?? []).map((d) => d.day as string).sort(),
    perTopic,
    totals,
    weak,
    recent: (attempts.data ?? []).slice(0, 10) as { question_id: string; self_grade: number | null; created_at: string }[],
  };
}

export async function isLessonComplete(db: SupabaseClient, lessonId: string): Promise<boolean> {
  const { count, error } = await db.from("lesson_progress").select("lesson_id", { count: "exact", head: true }).eq("lesson_id", lessonId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

/** ⌘K search over approved lessons + questions via `search_content()` (0006). */
export async function searchContent(db: SupabaseClient, raw: string): Promise<SearchHit[]> {
  const q = buildSearchQuery(raw);
  if (!q) return [];
  const { data, error } = await db.rpc("search_content", { q, n: SEARCH_LIMIT });
  if (error) throw error;
  return (data ?? []) as SearchHit[];
}
