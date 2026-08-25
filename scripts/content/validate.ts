// `npx tsx scripts/content/validate.ts [dir]` — validates every lesson and question JSON under
// content/ (default) against the zod contracts, plus approval rules for rows marked `approved`.
// Exit 1 on any problem. Used by seed 03 and (Loop 04) the batch collector.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { approvalProblems, validateLessonBody } from "../../src/lib/content/lesson-schema";
import { assertQuestionApprovable, validateQuestion } from "../../src/lib/content/question-schema";
import { findSubtopic, isTopicSlug } from "../../src/lib/content/taxonomy";

export type LessonFile = {
  slug: string; subtopic_slug: string; title: string; ordinal: number;
  status: "draft" | "generated" | "in_review" | "approved" | "rejected" | "archived";
  generated_by: string | null; prompt_version: string | null; body: unknown;
};

function jsonFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => path.join(dir, f));
}

export function validateContentDir(root: string): { lessons: LessonFile[]; questions: ReturnType<typeof validateQuestion>[]; errors: string[] } {
  const errors: string[] = [];
  const lessons: LessonFile[] = [];
  for (const file of jsonFiles(path.join(root, "lessons"))) {
    const raw = JSON.parse(readFileSync(file, "utf8")) as LessonFile;
    const rel = path.relative(root, file);
    if (!raw.slug || !raw.subtopic_slug || !raw.title) errors.push(`${rel}: slug/subtopic_slug/title required`);
    const st = findSubtopic(raw.subtopic_slug);
    if (!st) errors.push(`${rel}: unknown subtopic_slug ${raw.subtopic_slug}`);
    const v = validateLessonBody(raw.body);
    if (!v.ok) errors.push(...v.errors.map((e) => `${rel}: ${e}`));
    else if (raw.status === "approved") errors.push(...approvalProblems(v.value, { walkthrough: st?.subtopic.walkthrough }).map((e) => `${rel}: ${e}`));
    lessons.push(raw);
  }
  const questions: ReturnType<typeof validateQuestion>[] = [];
  for (const file of jsonFiles(path.join(root, "questions"))) {
    const raw = JSON.parse(readFileSync(file, "utf8")) as { topic_slug?: string; subtopic_slug?: string | null; status?: string };
    const rel = path.relative(root, file);
    const v = validateQuestion(raw);
    if (!v.ok) { errors.push(...v.errors.map((e) => `${rel}: ${e}`)); continue; }
    if (!isTopicSlug(v.value.topic_slug)) errors.push(`${rel}: unknown topic_slug ${v.value.topic_slug}`);
    if (v.value.subtopic_slug && !findSubtopic(v.value.subtopic_slug)) errors.push(`${rel}: unknown subtopic_slug ${v.value.subtopic_slug}`);
    if (v.value.status === "approved") {
      try { assertQuestionApprovable(v.value); } catch (e) { errors.push(`${rel}: ${(e as Error).message}`); }
    }
    questions.push(v);
  }
  return { lessons, questions, errors };
}

if (require.main === module) {
  const root = path.resolve(process.argv[2] ?? "content");
  const { lessons, questions, errors } = validateContentDir(root);
  for (const e of errors) console.error(`FAIL ${e}`);
  console.log(`${lessons.length} lesson(s), ${questions.length} question(s), ${errors.length} error(s) in ${root}`);
  process.exit(errors.length ? 1 : 0);
}
