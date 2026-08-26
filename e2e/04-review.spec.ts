import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { signInAs, unlockPrivateArea } from "./helpers/auth";

// Loop 04: mentor review queue. Requires `npm run seed -- 00 && npm run seed -- 03` (users + curriculum).
function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}

const SLUG = "e2e-generated-lesson";
const body = {
  version: 1, reading_minutes: 7,
  blocks: [
    { type: "why_here", md: "PLACEHOLDER — synthetic generated lesson for the e2e review flow." },
    { type: "trap", md: "**\"A wrong sentence.\"** Why it is wrong." },
    { type: "canonical_answer", md: "A short answer.", seconds: 30 },
    { type: "your_turn", prompt: "Try it.", model_answer_md: "Answer.", rubric: ["one", "two", "three"] },
    { type: "quick_fire", pairs: [{ q: "q1", a: "a1" }, { q: "q2", a: "a2" }, { q: "q3", a: "a3" }, { q: "q4", a: "a4" }] },
    { type: "one_liner", md: "Remember this." },
  ],
};

test.describe("Loop 04 review queue", () => {
  test("mentor requests changes → in_review + review row; student cannot open; generation page lists runs", async ({ page, baseURL }) => {
    const db = admin();
    const { data: sub } = await db.from("subtopics").select("id").eq("slug", "ev-bridge-calculations").single();
    const { data: lesson, error } = await db.from("lessons").upsert({ slug: SLUG, subtopic_id: sub!.id, title: "E2E generated lesson", ordinal: 98, body, status: "generated", generated_by: "e2e", prompt_version: "lesson-write.v1", review_note: null }, { onConflict: "slug" }).select("id").single();
    expect(error).toBeNull();
    const lessonId = lesson!.id as string;
    await db.from("content_reviews").delete().eq("target_id", lessonId);
    try {
      await unlockPrivateArea(page, baseURL!);
      await signInAs(page, "e2e-mentor@astar.test", "/admin/review");
      await expect(page.getByTestId("review-heading")).toHaveText("Review queue");
      await page.getByTestId("review-lesson-link").filter({ hasText: "E2E generated lesson" }).click();
      await expect(page).toHaveURL(new RegExp(`/admin/review/lesson/${lessonId}$`));
      await expect(page.getByTestId("review-item-status")).toHaveText("generated");
      await expect(page.getByTestId("review-preview").getByTestId("block-quick_fire")).toBeVisible();

      // Empty comment is rejected for "changes requested".
      await page.getByTestId("review-decision").selectOption("changes_requested");
      await page.getByTestId("review-submit").click();
      await expect(page.getByTestId("review-errors")).toContainText("comment is required");

      const comment = `E2E-REVIEW-${Date.now()}`;
      await page.getByTestId("review-comment").fill(comment);
      await page.getByTestId("review-submit").click();
      await expect(page.getByTestId("review-saved")).toContainText("in_review", { timeout: 15_000 });
      await expect(page.getByTestId("review-item-status")).toHaveText("in_review");
      await expect(page.getByTestId("review-history")).toContainText(comment);

      const { data: row } = await db.from("lessons").select("status, review_note").eq("id", lessonId).single();
      expect(row).toMatchObject({ status: "in_review", review_note: comment });
      const { data: reviews } = await db.from("content_reviews").select("decision, comment").eq("target_id", lessonId);
      expect(reviews).toHaveLength(1);
      expect(reviews![0]).toMatchObject({ decision: "changes_requested", comment });

      // Approving is gated by the same rules as the editor (this body is approvable).
      await page.getByTestId("review-decision").selectOption("approved");
      await page.getByTestId("review-submit").click();
      await expect(page.getByTestId("review-item-status")).toHaveText("approved", { timeout: 15_000 });
      // …and back to in_review so the student check below is meaningful.
      await page.getByTestId("review-decision").selectOption("changes_requested");
      await page.getByTestId("review-comment").fill("second pass");
      await page.getByTestId("review-submit").click();
      await expect(page.getByTestId("review-item-status")).toHaveText("in_review", { timeout: 15_000 });

      await page.goto("/admin/generation");
      await expect(page.getByTestId("generation-heading")).toHaveText("Generation runs");
      await expect(page.getByTestId("generation-start")).toBeVisible();

      // Student: in_review lessons are a 404 and not listed.
      await page.context().clearCookies();
      await unlockPrivateArea(page, baseURL!);
      await signInAs(page, "e2e-student@astar.test", "/home/technicals");
      const res = await page.goto(`/home/technicals/eqv-ev/${SLUG}`);
      expect(res?.status()).toBe(404);
      await page.goto("/home/technicals/eqv-ev");
      await expect(page.getByTestId("lesson-link").filter({ hasText: "E2E generated lesson" })).toHaveCount(0);
      const forbidden = await page.goto("/admin/review");
      expect(forbidden?.url()).not.toContain("/admin/review");
    } finally {
      await db.from("content_reviews").delete().eq("target_id", lessonId);
      await db.from("lessons").delete().eq("id", lessonId);
    }
  });
});
