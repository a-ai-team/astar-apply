// Seed 04 — loads everything under content/ (the Loop 04 batch output once collected) into the
// DB via seed 03 (idempotent: topics/subtopics/path + loadContent), then reports what the
// acceptance check wants: ≥ 40 lessons, ≥ 320 questions, free topics approved.
import { adminClient } from "./env";
import { seedTaxonomy } from "./03-taxonomy";
import { FREE_TOPIC_SLUGS } from "../../src/lib/content/taxonomy";

export async function seedContent() {
  await seedTaxonomy();
  const db = adminClient();
  const count = async (table: "lessons" | "questions") => {
    const { count: n, error } = await db.from(table).select("id", { count: "exact", head: true });
    if (error) throw error;
    return n ?? 0;
  };
  const lessons = await count("lessons");
  const questions = await count("questions");
  const { data: topics } = await db.from("topics").select("id, slug").in("slug", [...FREE_TOPIC_SLUGS]);
  const freeIds = (topics ?? []).map((t) => t.id as string);
  const { count: freeQ } = await db.from("questions").select("id", { count: "exact", head: true }).in("topic_id", freeIds).eq("status", "approved");
  const { data: freeSubs } = await db.from("subtopics").select("id").in("topic_id", freeIds);
  const { count: freeL } = await db.from("lessons").select("id", { count: "exact", head: true }).in("subtopic_id", (freeSubs ?? []).map((s) => s.id as string)).eq("status", "approved");
  console.log(`seed 04: ${lessons} lessons, ${questions} questions in DB; free topics (${FREE_TOPIC_SLUGS.join(", ")}): ${freeL ?? 0} approved lessons, ${freeQ ?? 0} approved questions`);
  console.log(`seed 04: acceptance → lessons ≥ 40: ${lessons >= 40 ? "PASS" : "FAIL"}, questions ≥ 320: ${questions >= 320 ? "PASS" : "FAIL"}`);
}
