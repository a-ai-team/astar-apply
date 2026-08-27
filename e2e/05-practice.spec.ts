import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { signInAs, unlockPrivateArea } from "./helpers/auth";

// Requires `npm run seed -- 00 … 05` (users, curriculum, 6 approved questions → 6 flashcards).
// The student's practice rows are cleared first so the counts below are exact.
function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function studentId() {
  const { data, error } = await admin().auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const u = data.users.find((x) => x.email === "e2e-student@astar.test");
  if (!u) throw new Error("e2e-student missing — run `npm run seed -- 00`");
  return u.id;
}

async function resetStudentPractice(userId: string) {
  const db = admin();
  for (const t of ["attempts", "reviews", "card_state", "lesson_progress"] as const) {
    const { error } = await db.from(t).delete().eq("user_id", userId);
    if (error) throw error;
  }
}

test.describe("Loop 05 practice", () => {
  test("bank filter → reveal → self-grade → attempts row → ⌘K → review 3 cards → progress streak 1 / 3 reviewed", async ({ page, baseURL }) => {
    const uid = await studentId();
    await resetStudentPractice(uid);
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", "/home/practice");
    await expect(page.getByTestId("practice-heading")).toHaveText("Practice");
    await expect(page.getByTestId("bank-count")).toContainText("6 questions");

    // Filter difficulty 2 → only D2 cards.
    await page.getByTestId("filter-difficulty-2").click();
    await expect(page).toHaveURL(/difficulty=2/);
    const links = page.getByTestId("question-link");
    await expect(links.first()).toBeVisible();
    const n = await links.count();
    expect(n).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < n; i++) await expect(links.nth(i)).toHaveAttribute("data-difficulty", "2");

    // Attempt: timer → reveal → follow-up → self-grade.
    await links.first().click();
    await expect(page).toHaveURL(/\/home\/practice\/[a-z0-9-]+\?difficulty=2/);
    await expect(page.getByTestId("think-timer")).toContainText("s");
    await expect(page.getByTestId("model-answer")).toHaveCount(0);
    await page.getByTestId("reveal-answer").click();
    await expect(page.getByTestId("model-answer")).toBeVisible();
    await expect(page.getByTestId("key-points").locator("li").first()).toBeVisible();
    await page.getByTestId("follow-up-0-toggle").click();
    await expect(page.getByTestId("follow-up-0-content")).toBeVisible();
    await page.getByTestId("self-grade-3").click();
    await expect(page.getByTestId("attempt-recorded")).toContainText("Nailed it");
    const { data: attempts } = await admin().from("attempts").select("self_grade, mode").eq("user_id", uid);
    expect(attempts).toHaveLength(1);
    expect(attempts![0]).toMatchObject({ self_grade: 3, mode: "practice" });

    // ⌘K palette over approved content.
    await page.keyboard.press("Control+k");
    await expect(page.getByTestId("palette")).toBeVisible();
    await page.getByTestId("palette-input").fill("enterprise value");
    await expect(page.getByTestId("palette-item").first()).toBeVisible({ timeout: 10_000 });
    expect(await page.getByTestId("palette-item").count()).toBeGreaterThanOrEqual(1);
    await page.getByTestId("palette-item").first().click();
    await expect(page).toHaveURL(/\/home\/(practice|technicals)\//);

    // Flashcards: review 3 cards in the EqV/EV deck (space flips, buttons rate).
    await page.goto("/home/flashcards");
    await expect(page.getByTestId("flashcards-heading")).toHaveText("Flashcards");
    await expect(page.getByTestId("deck-card")).toHaveCount(2);
    await page.getByTestId("deck-card").filter({ hasText: "Equity value vs enterprise value" }).click();
    await expect(page.getByTestId("deck-heading")).toContainText("Equity value vs enterprise value");
    await expect(page.getByTestId("session-position")).toHaveText("1 / 3");
    for (let i = 0; i < 3; i++) {
      await expect(page.getByTestId("flashcard-front")).toBeVisible();
      if (i === 0) await page.keyboard.press("Space");
      else await page.getByTestId("flip").click();
      await expect(page.getByTestId("flashcard-back")).toBeVisible();
      await page.getByTestId(i === 1 ? "rate-again" : "rate-good").click();
      if (i < 2) await expect(page.getByTestId("session-position")).toHaveText(`${i + 2} / 3`);
    }
    await expect(page.getByTestId("session-summary")).toContainText("3 reviewed");
    const { data: states } = await admin().from("card_state").select("streak, mastered, reps").eq("user_id", uid);
    expect(states).toHaveLength(3);
    expect(states!.filter((s) => s.streak === 1)).toHaveLength(2);
    expect(states!.every((s) => !s.mastered)).toBe(true);

    // Progress dashboard.
    await page.getByTestId("session-progress-link").click();
    await expect(page.getByTestId("progress-heading")).toHaveText("Progress");
    await expect(page.getByTestId("streak-days")).toHaveText("1");
    await expect(page.getByTestId("reviews-total")).toHaveText("3");
    await expect(page.getByTestId("attempts-total")).toHaveText("1");
    await expect(page.getByTestId("ring-questions-value")).toHaveText("1");
  });

  test("lesson: Mark complete → Completed badge, Practise this links to the topic bank, progress ring 1", async ({ page, baseURL }) => {
    const uid = await studentId();
    await resetStudentPractice(uid);
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", "/home/technicals/eqv-ev/ev-bridge-basics");
    await expect(page.getByTestId("lesson-title")).toHaveText("The EqV → EV bridge");
    await expect(page.getByTestId("lesson-practise")).toHaveAttribute("href", "/home/practice?topic=eqv-ev");
    await page.getByTestId("lesson-complete").click();
    await expect(page.getByTestId("lesson-completed")).toBeVisible();
    const { data } = await admin().from("lesson_progress").select("lesson_id").eq("user_id", uid);
    expect(data).toHaveLength(1);
    await page.getByTestId("lesson-practise").click();
    await expect(page).toHaveURL(/\/home\/practice\?topic=eqv-ev$/);
    await expect(page.getByTestId("filter-topic-eqv-ev")).toHaveAttribute("aria-current", "true");
    await page.goto("/home/progress");
    await expect(page.getByTestId("ring-lessons-value")).toHaveText("1");
    await expect(page.getByTestId("streak-days")).toHaveText("1");
  });

  test("draft questions never reach the bank, the deck or the palette", async ({ page, baseURL }) => {
    const db = admin();
    const { data: topic } = await db.from("topics").select("id").eq("slug", "eqv-ev").single();
    const body = { model_answer_md: "PLACEHOLDER — synthetic draft for e2e zebrafish.", key_points: ["a", "b", "c"], follow_ups: [{ question: "q1", answer_md: "a1" }, { question: "q2", answer_md: "a2" }], weak_answer_note: "n", numbers: null };
    const { data: q, error } = await db
      .from("questions")
      .upsert({ slug: "e2e-draft-question", topic_id: topic!.id, kind: "concept", difficulty: 2, question: "E2E draft question about zebrafish valuation?", body, status: "draft", source_topic: "e2e", generated_by: "e2e" }, { onConflict: "slug" })
      .select("id")
      .single();
    expect(error).toBeNull();
    await db.from("flashcards").upsert({ question_id: q!.id, topic_id: topic!.id, front: "E2E draft card zebrafish", back_md: "x", status: "draft" }, { onConflict: "question_id" });
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", "/home/practice?difficulty=2");
    await expect(page.getByTestId("question-link").filter({ hasText: "zebrafish" })).toHaveCount(0);
    const res = await page.goto("/home/practice/e2e-draft-question");
    expect(res?.status()).toBe(404);
    await page.goto("/home/flashcards/eqv-ev");
    await expect(page.getByTestId("deck-summary")).toContainText("3 cards");
    await page.keyboard.press("Control+k");
    await page.getByTestId("palette-input").fill("zebrafish");
    await expect(page.getByTestId("palette").getByText("No approved content matches.")).toBeVisible({ timeout: 10_000 });
  });

  test("visitor without the key to /home/practice lands on /unlock", async ({ page }) => {
    await page.goto("/home/practice");
    await expect(page).toHaveURL(/\/unlock\?next=%2Fhome%2Fpractice$/);
  });
});
