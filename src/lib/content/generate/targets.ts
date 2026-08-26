// What to generate: one lesson per subtopic (slug = subtopic slug) and one question request per
// subtopic × kind, with counts from taxonomy.ts `target_questions` (Σ 347) and the 25/30/30/15
// difficulty ladder. Pure functions — the CLI and the admin route both build targets from here.
import { CURRICULUM, findSubtopic, type CurriculumSubtopic, type CurriculumTopic } from "../taxonomy";
import type { LessonWriteInput } from "@/lib/ai/prompts/lesson-write.v1";
import type { QuestionWriteInput } from "@/lib/ai/prompts/question-write.v1";
import type { WidgetName } from "../lesson-schema";

export type QuestionKind = "concept" | "calculation";
export type DifficultyMix = [number, number, number, number];

/** Target difficulty shares (docs/loops/CONTRACTS.md): 1 definition · 2 why · 3 second-order · 4 numerical. */
export const DIFFICULTY_SHARES = [0.25, 0.3, 0.3, 0.15] as const;

/** Rough expected output size per request, used by the dry-run estimate. */
// Output tokens are billed including adaptive thinking (effort high), so these are well above the visible JSON size.
export const EXPECTED_OUTPUT_TOKENS = { lesson: 14000, questionEach: 1500 } as const;

/** Subtopics whose lesson must embed a widget (the other subtopics get none). */
export const REQUIRED_WIDGETS: Record<string, WidgetName> = {
  "three-statement-links": "three_statement",
  "single-step-walkthroughs": "three_statement",
  "equity-and-enterprise-value": "ev_bridge",
  "ev-bridge-calculations": "ev_bridge",
  "income-statement": "filings_toggle",
  "dcf-sensitivities": "dcf_sensitivity",
  "returns-irr-mom": "lbo_returns",
};

export type ExistingLesson = { slug: string; subtopic_slug: string; title: string; one_liner: string | null };
export type ExistingQuestion = { slug: string; subtopic_slug: string | null; kind: QuestionKind; question: string };
export type ExistingContent = { lessons: ExistingLesson[]; questions: ExistingQuestion[] };

export type LessonTarget = {
  kind: "lesson";
  custom_id: string;
  slug: string;
  subtopic_slug: string;
  topic_slug: string;
  walkthrough: boolean;
  input: LessonWriteInput;
  expected_output_tokens: number;
};

export type QuestionTarget = {
  kind: "questions";
  custom_id: string;
  subtopic_slug: string;
  topic_slug: string;
  qkind: QuestionKind;
  count: number;
  mix: DifficultyMix;
  source_section: string;
  input: QuestionWriteInput;
  expected_output_tokens: number;
};

export type Target = LessonTarget | QuestionTarget;

export function lessonCustomId(slug: string): string {
  return `lesson:${slug}`;
}
export function questionsCustomId(subtopicSlug: string, kind: QuestionKind): string {
  return `questions:${subtopicSlug}:${kind}`;
}

export type ParsedCustomId = { kind: "lesson"; slug: string } | { kind: "questions"; subtopic_slug: string; qkind: QuestionKind };

export function parseCustomId(id: string): ParsedCustomId | null {
  const m = /^lesson:([a-z0-9-]+)$/.exec(id);
  if (m) return { kind: "lesson", slug: m[1] };
  const q = /^questions:([a-z0-9-]+):(concept|calculation)$/.exec(id);
  if (q) return { kind: "questions", subtopic_slug: q[1], qkind: q[2] as QuestionKind };
  return null;
}

/** Largest-remainder split of `n` questions over the four difficulty levels. */
export function difficultyMix(n: number, shares: readonly number[] = DIFFICULTY_SHARES): DifficultyMix {
  if (n <= 0) return [0, 0, 0, 0];
  const raw = shares.map((s) => s * n);
  const base = raw.map(Math.floor);
  let left = n - base.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => ({ i, frac: r - Math.floor(r) })).sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of order) {
    if (left <= 0) break;
    base[i]++;
    left--;
  }
  return base as DifficultyMix;
}

/** Which question kinds a subtopic gets, with the target count split between them. */
export function questionKindsFor(sub: CurriculumSubtopic): { kind: QuestionKind; count: number }[] {
  if (sub.kind === "concept") return [{ kind: "concept", count: sub.target_questions }];
  if (sub.kind === "calculation") return [{ kind: "calculation", count: sub.target_questions }];
  const concept = Math.ceil(sub.target_questions / 2);
  return [
    { kind: "concept", count: concept },
    { kind: "calculation", count: sub.target_questions - concept },
  ];
}

export type TargetFilter = { topics?: string[]; slugs?: string[]; all?: boolean; force?: boolean };

function selectedTopics(f: TargetFilter): CurriculumTopic[] {
  if (f.topics?.length) return CURRICULUM.filter((t) => f.topics!.includes(t.slug));
  return CURRICULUM;
}

/** One lesson per subtopic that has no lesson yet (unless `force` or the slug is named explicitly). */
export function lessonTargets(existing: ExistingContent, f: TargetFilter = {}): LessonTarget[] {
  const out: LessonTarget[] = [];
  const bySubtopic = new Map<string, ExistingLesson[]>();
  for (const l of existing.lessons) bySubtopic.set(l.subtopic_slug, [...(bySubtopic.get(l.subtopic_slug) ?? []), l]);
  const priorOneLiners = existing.lessons.map((l) => l.one_liner).filter((s): s is string => Boolean(s)).slice(0, 12);
  for (const topic of selectedTopics(f)) {
    for (const sub of topic.subtopics) {
      const named = f.slugs?.includes(sub.slug);
      if (f.slugs?.length && !named) continue;
      if (!named && !f.force && bySubtopic.has(sub.slug)) continue;
      const siblings = topic.subtopics.filter((s) => s.slug !== sub.slug).map((s) => s.title);
      out.push({
        kind: "lesson",
        custom_id: lessonCustomId(sub.slug),
        slug: sub.slug,
        subtopic_slug: sub.slug,
        topic_slug: topic.slug,
        walkthrough: Boolean(sub.walkthrough),
        input: {
          subtopic_slug: sub.slug,
          subtopic_title: sub.title,
          topic_title: topic.title,
          source_section: sub.source_section,
          walkthrough: Boolean(sub.walkthrough),
          sibling_titles: siblings,
          prior_one_liners: priorOneLiners,
          required_widget: REQUIRED_WIDGETS[sub.slug] ?? null,
        },
        expected_output_tokens: EXPECTED_OUTPUT_TOKENS.lesson,
      });
    }
  }
  return out;
}

/** One request per subtopic × kind for the questions still missing against `target_questions`. */
export function questionTargets(existing: ExistingContent, f: TargetFilter = {}): QuestionTarget[] {
  const out: QuestionTarget[] = [];
  for (const topic of selectedTopics(f)) {
    for (const sub of topic.subtopics) {
      if (f.slugs?.length && !f.slugs.includes(sub.slug)) continue;
      const have = existing.questions.filter((q) => q.subtopic_slug === sub.slug);
      for (const { kind, count } of questionKindsFor(sub)) {
        const haveKind = have.filter((q) => q.kind === kind);
        const missing = f.force ? count : Math.max(0, count - haveKind.length);
        if (missing === 0) continue;
        out.push({
          kind: "questions",
          custom_id: questionsCustomId(sub.slug, kind),
          subtopic_slug: sub.slug,
          topic_slug: topic.slug,
          qkind: kind,
          count: missing,
          mix: difficultyMix(missing),
          source_section: sub.source_section,
          input: {
            subtopic_slug: sub.slug,
            subtopic_title: sub.title,
            topic_title: topic.title,
            kind,
            count: missing,
            mix: difficultyMix(missing),
            source_section: sub.source_section,
            existing_questions: have.map((q) => q.question),
          },
          expected_output_tokens: EXPECTED_OUTPUT_TOKENS.questionEach * missing,
        });
      }
    }
  }
  return out;
}

/** Rebuilds the target for a custom_id (used by the collector when the run's targets are not on disk). */
export function targetFromCustomId(id: string, existing: ExistingContent): Target | null {
  const p = parseCustomId(id);
  if (!p) return null;
  if (p.kind === "lesson") return lessonTargets(existing, { slugs: [p.slug], force: true })[0] ?? null;
  const st = findSubtopic(p.subtopic_slug);
  if (!st) return null;
  return questionTargets(existing, { slugs: [p.subtopic_slug], force: true }).find((t) => t.qkind === p.qkind) ?? null;
}
