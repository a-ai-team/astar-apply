// Seed 09 — industry / group modules (Loop 09). Upserts the 18 `topics kind='industry'` rows and
// their lesson subtopics from src/lib/content/taxonomy.ts INDUSTRY_CURRICULUM (via seed 03, which
// also loads content/ including content/industry/**), then reports per-module counts through
// `listIndustryModules` (the `industry_modules` view when 0010 is applied, otherwise the same
// numbers aggregated from the base tables). Idempotent. Re-run `npm run seed -- 05` and
// `npm run content:index` afterwards so decks and mentor retrieval pick up newly approved rows.
import { adminClient } from "./env";
import { seedTaxonomy } from "./03-taxonomy";
import { INDUSTRY_CURRICULUM, INDUSTRY_MODULES } from "../../src/lib/content/taxonomy";
import { listIndustryModules } from "../../src/lib/content/industry";

export async function seedIndustry() {
  await seedTaxonomy();
  const db = adminClient();
  const { modules, source } = await listIndustryModules(db);
  if (source === "tables") console.warn("seed 09: industry_modules view missing — counts aggregated from tables; run `npm run db:migrate` (0010_industry.sql)");
  const targets = new Map<string, { lessons: number; questions: number }>(INDUSTRY_CURRICULUM.map((t) => [t.slug, { lessons: t.subtopics.length, questions: t.subtopics.reduce((n, s) => n + s.target_questions, 0) }]));
  for (const r of modules) {
    const t = targets.get(r.slug);
    console.log(`  ${r.slug.padEnd(26)} ${r.group_family.padEnd(9)} subtopics ${r.subtopic_count}  approved lessons ${r.lesson_count}/${t?.lessons ?? "?"}  questions ${r.question_count}/${t?.questions ?? "?"}  cards ${r.flashcard_count}`);
  }
  const n = modules.length;
  const totalL = [...targets.values()].reduce((a, b) => a + b.lessons, 0);
  const totalQ = [...targets.values()].reduce((a, b) => a + b.questions, 0);
  console.log(`seed 09: ${n} industry modules (expected ${INDUSTRY_MODULES.length}; source: ${source}); targets ${totalL} lessons, ${totalQ} questions`);
  console.log(`seed 09: acceptance → 18 topics: ${n === INDUSTRY_MODULES.length ? "PASS" : "FAIL"}`);
  console.log("seed 09: next → `npm run seed -- 05 && npm run content:index`");
}
