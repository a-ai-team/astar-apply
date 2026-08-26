// Industry suite (CONTRACTS.md, Loop 09): schema 100 % over content/industry/**/{lessons,questions},
// zero 8-gram overlap with the hidden 400Q set (HIDDEN SET MISSING → warning), every industry lesson
// carries a `key_metrics` block, and readability ≥ 4/5 judged by Opus 5 on up to 10 lessons
// (NO API CREDIT → readability skipped and reported; the suite passes on schema + overlap only).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { isCredentialFailure, probeApi } from "../../dev/api-probe";
import { approvalProblems, validateLessonBody } from "../../../src/lib/content/lesson-schema";
import { jsonText, overlapCount } from "../../../src/lib/content/overlap";
import { validateQuestion } from "../../../src/lib/content/question-schema";
import { findSubtopic, INDUSTRY_MODULES, isIndustrySlug } from "../../../src/lib/content/taxonomy";
import { loadReference } from "../overlap";
import { judgeReadability } from "../readability";
import { THRESHOLDS } from "../thresholds";
import type { SuiteResult } from "../index";

type LessonFile = { slug: string; subtopic_slug: string; title: string; status: string; body: unknown };

/** `content/industry/<module>/{lessons,questions}/*.json`, tagged with the module folder. */
export function loadIndustryFiles(root = path.resolve("content", "industry")): { lessons: (LessonFile & { module: string })[]; questions: { module: string; raw: unknown }[] } {
  const lessons: (LessonFile & { module: string })[] = [];
  const questions: { module: string; raw: unknown }[] = [];
  if (!existsSync(root)) return { lessons, questions };
  for (const mod of readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()) {
    const read = (kind: string) => {
      const dir = path.join(root, mod, kind);
      if (!existsSync(dir)) return [];
      return readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")) as unknown);
    };
    for (const l of read("lessons")) lessons.push({ ...(l as LessonFile), module: mod });
    for (const q of read("questions")) questions.push({ module: mod, raw: q });
  }
  return { lessons, questions };
}

export async function run({ limit }: { limit: number | null }): Promise<SuiteResult> {
  const t = THRESHOLDS.industry;
  const thresholds = { schema_rate: t.schema_rate, overlap_hits: t.overlap_hits, readability: t.readability };
  const all = loadIndustryFiles();
  const lessons = all.lessons.slice(0, limit ?? undefined);
  const questions = all.questions.slice(0, limit ?? undefined);
  const notes: string[] = [];
  const items: unknown[] = [];
  if (!lessons.length && !questions.length) {
    return { suite: "industry", passed: false, metrics: { n_lessons: 0, n_questions: 0 }, thresholds, items, notes: ["no files under content/industry — run `npm run content:generate -- lessons --kind industry --all` + content:collect first"] };
  }
  const ref = loadReference();
  if (!ref) notes.push("HIDDEN SET MISSING — overlap not checked (run scripts/eval/extract-400q.ts)");

  let schemaOk = 0;
  let overlapHits = 0;
  let missingMetrics = 0;
  let approvable = 0;
  const valid: { slug: string; title: string; text: string }[] = [];
  for (const l of lessons) {
    const v = validateLessonBody(l.body);
    const st = findSubtopic(l.subtopic_slug);
    const item: Record<string, unknown> = { module: l.module, slug: l.slug, status: l.status, schema: v.ok };
    if (!st || st.topic.slug !== l.module || !isIndustrySlug(l.module)) { item.schema = false; item.errors = [`subtopic ${l.subtopic_slug} is not in industry module ${l.module}`]; items.push(item); console.log(`  module ${l.slug}: ${item.errors}`); continue; }
    if (v.ok) {
      schemaOk++;
      const problems = approvalProblems(v.value, { walkthrough: st.subtopic.walkthrough });
      if (!v.value.blocks.some((b) => b.type === "key_metrics")) { missingMetrics++; problems.push("no key_metrics block"); }
      item.approval_problems = problems;
      if (!problems.length) approvable++;
      const text = jsonText(v.value);
      if (ref) { const hits = overlapCount(text, ref); item.overlap_hits = hits; overlapHits += hits; if (hits) console.log(`  overlap ${l.slug}: ${hits} hit(s)`); }
      valid.push({ slug: l.slug, title: l.title, text });
    } else { item.errors = v.errors; console.log(`  schema ${l.slug}: ${v.errors[0]}`); }
    items.push(item);
  }
  let qOk = 0;
  const perModule = new Map<string, { lessons: number; questions: number }>();
  for (const l of lessons) perModule.set(l.module, { ...(perModule.get(l.module) ?? { lessons: 0, questions: 0 }), lessons: (perModule.get(l.module)?.lessons ?? 0) + 1 });
  for (const { module, raw } of questions) {
    const v = validateQuestion(raw);
    const slug = (raw as { slug?: string }).slug;
    if (!v.ok) { items.push({ module, slug, schema: false, errors: v.errors }); console.log(`  schema ${slug}: ${v.errors[0]}`); continue; }
    if (v.value.topic_slug !== module || !isIndustrySlug(module)) { items.push({ module, slug, schema: false, errors: [`topic_slug ${v.value.topic_slug} ≠ module folder ${module}`] }); continue; }
    qOk++;
    perModule.set(module, { ...(perModule.get(module) ?? { lessons: 0, questions: 0 }), questions: (perModule.get(module)?.questions ?? 0) + 1 });
    let hits = 0;
    if (ref) { hits = overlapCount(jsonText(v.value), ref); overlapHits += hits; if (hits) console.log(`  overlap ${slug}: ${hits} hit(s)`); }
    items.push({ module, slug, schema: true, difficulty: v.value.difficulty, kind: v.value.kind, overlap_hits: ref ? hits : null });
  }
  const n = lessons.length + questions.length;
  const schemaRate = (schemaOk + qOk) / n;
  const covered = [...perModule.keys()].filter((m) => (perModule.get(m)?.lessons ?? 0) > 0).length;
  notes.push(`modules with ≥ 1 lesson: ${covered}/${INDUSTRY_MODULES.length} (${[...perModule.entries()].map(([m, c]) => `${m} ${c.lessons}L/${c.questions}Q`).join(", ")})`);

  // Readability: up to 10 lessons, deterministic sample (every k-th).
  const sampleSize = Math.min(10, valid.length);
  const step = Math.max(1, Math.floor(valid.length / Math.max(1, sampleSize)));
  const sample = valid.filter((_, i) => i % step === 0).slice(0, sampleSize);
  let readability: number | null = null;
  let skipped: string | undefined;
  const probe = await probeApi();
  if (!probe.ok) {
    skipped = `${probe.reason === "billing" ? "NO API CREDIT" : probe.reason === "no-key" ? "NO API KEY" : `API ${probe.reason.toUpperCase()}`} — readability not judged`;
    console.warn(`  ${skipped} (${probe.message.slice(0, 100)})`);
    if (!isCredentialFailure(probe)) throw new Error(probe.message);
  } else {
    let sum = 0;
    for (const s of sample) {
      const r = await judgeReadability({ title: s.title, text: s.text });
      sum += r.readability;
      items.push({ slug: s.slug, readability: r.readability, notes: r.notes });
      if (r.readability < t.readability) console.log(`  readability ${s.slug}: ${r.readability} — ${r.notes}`);
    }
    readability = sample.length ? sum / sample.length : null;
  }

  const passed = schemaRate >= t.schema_rate && overlapHits <= t.overlap_hits && missingMetrics === 0 && (readability === null ? Boolean(skipped) : readability >= t.readability);
  return {
    suite: "industry",
    passed,
    skipped,
    metrics: { n_lessons: lessons.length, n_questions: questions.length, schema_rate: schemaRate, approvable_lessons: approvable, lessons_without_key_metrics: missingMetrics, modules_covered: covered, overlap_hits: ref ? overlapHits : null, overlap_checked: Boolean(ref), readability, readability_sample: probe.ok ? sample.length : 0 },
    thresholds,
    items,
    notes,
  };
}
