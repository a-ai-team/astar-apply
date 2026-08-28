// `npx tsx scripts/content/validate.ts [dir]` — validates every lesson and question JSON under
// content/ (default) against the zod contracts, plus approval rules for rows marked `approved`.
// Exit 1 on any problem. Used by seed 03 and (Loop 04) the batch collector.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { approvalProblems, validateLessonBody } from "../../src/lib/content/lesson-schema";
import { assertQuestionApprovable, validateQuestion } from "../../src/lib/content/question-schema";
import { findSubtopic, isContentTopicSlug } from "../../src/lib/content/taxonomy";
import { validateCheatSheet } from "../../src/lib/content/cheatsheet-schema";

export type LessonFile = {
  slug: string; subtopic_slug: string; title: string; ordinal: number;
  status: "draft" | "generated" | "in_review" | "approved" | "rejected" | "archived";
  generated_by: string | null; prompt_version: string | null; body: unknown;
  /** Loop 04 provenance: problems the automatic checks found, kept on the file for reviewers. */
  check_problems?: string[];
};

function jsonFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => path.join(dir, f));
}

/**
 * Content directories: `<root>/lessons`, `<root>/questions` (generalist, Loop 03/04) plus
 * `<root>/industry/<module>/{lessons,questions}` (Loop 09 — one folder per industry module).
 */
export function contentDirs(root: string, kind: "lessons" | "questions"): string[] {
  const dirs = [path.join(root, kind)];
  const industry = path.join(root, "industry");
  if (existsSync(industry)) {
    for (const m of readdirSync(industry, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()) dirs.push(path.join(industry, m, kind));
  }
  return dirs;
}

export type QuestionMeta = { generated_by: string | null; prompt_version: string | null; check_problems: string[] | null };

/** Cheat sheets (Loop 11): `<root>/cheatsheets/<topic_slug>.json`, one per curriculum topic. */
export function validateCheatSheets(root: string): { sheets: string[]; errors: string[] } {
  const dir = path.join(root, "cheatsheets");
  const errors: string[] = [];
  const sheets: string[] = [];
  for (const file of jsonFiles(dir)) {
    const rel = path.relative(root, file);
    const raw = JSON.parse(readFileSync(file, "utf8")) as { topic_slug?: string };
    const v = validateCheatSheet(raw);
    if (!v.ok) { errors.push(...v.errors.map((e) => `${rel}: ${e}`)); continue; }
    if (!isContentTopicSlug(v.value.topic_slug)) errors.push(`${rel}: unknown topic_slug ${v.value.topic_slug}`);
    const expected = `${v.value.topic_slug}.json`;
    if (path.basename(file) !== expected) errors.push(`${rel}: file should be named ${expected}`);
    sheets.push(v.value.topic_slug);
  }
  return { sheets, errors };
}

export function validateContentDir(root: string): { lessons: LessonFile[]; questions: ReturnType<typeof validateQuestion>[]; questionMeta: Map<string, QuestionMeta>; errors: string[] } {
  const errors: string[] = [];
  const questionMeta = new Map<string, QuestionMeta>();
  const lessons: LessonFile[] = [];
  for (const file of contentDirs(root, "lessons").flatMap(jsonFiles)) {
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
  for (const file of contentDirs(root, "questions").flatMap(jsonFiles)) {
    const raw = JSON.parse(readFileSync(file, "utf8")) as { topic_slug?: string; subtopic_slug?: string | null; status?: string; generated_by?: string; prompt_version?: string; check_problems?: string[] };
    const rel = path.relative(root, file);
    const v = validateQuestion(raw);
    if (v.ok) questionMeta.set(v.value.slug, { generated_by: raw.generated_by ?? null, prompt_version: raw.prompt_version ?? null, check_problems: raw.check_problems ?? null });
    if (!v.ok) { errors.push(...v.errors.map((e) => `${rel}: ${e}`)); continue; }
    if (!isContentTopicSlug(v.value.topic_slug)) errors.push(`${rel}: unknown topic_slug ${v.value.topic_slug}`);
    if (v.value.subtopic_slug && !findSubtopic(v.value.subtopic_slug)) errors.push(`${rel}: unknown subtopic_slug ${v.value.subtopic_slug}`);
    if (v.value.status === "approved") {
      try { assertQuestionApprovable(v.value); } catch (e) { errors.push(`${rel}: ${(e as Error).message}`); }
    }
    questions.push(v);
  }
  errors.push(...validateCheatSheets(root).errors);
  return { lessons, questions, questionMeta, errors };
}

if (require.main === module) {
  const root = path.resolve(process.argv[2] ?? "content");
  const { lessons, questions, errors } = validateContentDir(root);
  const { sheets } = validateCheatSheets(root);
  for (const e of errors) console.error(`FAIL ${e}`);
  console.log(`${lessons.length} lesson(s), ${questions.length} question(s), ${sheets.length} cheat sheet(s), ${errors.length} error(s) in ${root}`);
  process.exit(errors.length ? 1 : 0);
}
