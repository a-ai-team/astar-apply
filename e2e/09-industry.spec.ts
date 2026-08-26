import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { signInAs, unlockPrivateArea } from "./helpers/auth";
import { flashcardBack } from "../src/lib/content/question-schema";

// Requires the seed chain + `npm run seed -- 09` (README). Everything Loop 09 loads is `generated`
// (student-invisible), so the setup approves the ONE hand-written Real Estate lesson and its 8
// questions with the admin client, derives their flashcards the way `seed -- 05` does, and puts
// everything back afterwards — the linked project is the only environment.
const MODULE = "real-estate";
const LESSON = "real-estate-noi-cap-rates";

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function userId(email: string) {
  const { data, error } = await admin().auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const u = data.users.find((x) => x.email === email);
  if (!u) throw new Error(`${email} missing — run \`npm run seed -- 00\``);
  return u.id;
}

let topicId = "";
let questionIds: string[] = [];
let previousStatuses = new Map<string, string>();
let lessonPrevious = "generated";

test.describe("Loop 09 industry modules", () => {
  test.beforeAll(async () => {
    const db = admin();
    const { data: topic, error } = await db.from("topics").select("id").eq("slug", MODULE).eq("kind", "industry").single();
    if (error) throw new Error(`${MODULE} module missing — run \`npm run seed -- 09\` (${error.message})`);
    topicId = topic.id as string;
    const { data: lesson } = await db.from("lessons").select("id, status").eq("slug", LESSON).single();
    if (!lesson) throw new Error(`${LESSON} missing — run \`npm run seed -- 09\``);
    lessonPrevious = lesson.status as string;
    await db.from("lessons").update({ status: "approved" }).eq("id", lesson.id);
    const { data: qs } = await db.from("questions").select("id, status, question, body").eq("topic_id", topicId);
    expect(qs?.length ?? 0).toBeGreaterThanOrEqual(8);
    previousStatuses = new Map((qs ?? []).map((q) => [q.id as string, q.status as string]));
    questionIds = (qs ?? []).map((q) => q.id as string);
    await db.from("questions").update({ status: "approved" }).in("id", questionIds);
    for (const q of qs ?? []) {
      const body = (q.body ?? {}) as { model_answer_md?: string; flashcard_back?: string };
      const back = flashcardBack({ model_answer_md: body.model_answer_md ?? "", flashcard_back: body.flashcard_back });
      const { error: fErr } = await db.from("flashcards").upsert({ question_id: q.id, topic_id: topicId, front: q.question, back_md: back, status: "approved" }, { onConflict: "question_id" });
      if (fErr) throw fErr;
    }
    const uid = await userId("e2e-student@astar.test");
    await db.from("interviews").delete().eq("user_id", uid).eq("topic_id", topicId);
  });

  test.afterAll(async () => {
    const db = admin();
    const uid = await userId("e2e-student@astar.test");
    await db.from("interviews").delete().eq("user_id", uid).eq("topic_id", topicId);
    await db.from("flashcards").update({ status: "archived" }).in("question_id", questionIds);
    for (const [id, status] of previousStatuses) await db.from("questions").update({ status }).eq("id", id);
    await db.from("lessons").update({ status: lessonPrevious }).eq("slug", LESSON);
  });

  test("technicals → industry grid grouped by family → Real Estate module → lesson renders key_metrics", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", "/home/technicals");
    await expect(page.getByTestId("technicals-heading")).toHaveText("Technicals");
    // Industry topics are not in the generalist grid; they sit behind the industry link.
    await expect(page.getByTestId("topic-card")).toHaveCount(9);
    await page.getByTestId("industry-link").click();
    await expect(page).toHaveURL(/\/home\/technicals\/industry$/);
    await expect(page.getByTestId("industry-heading")).toHaveText("Industry modules");
    await expect(page.getByTestId("industry-card")).toHaveCount(18);
    expect(await page.getByTestId("industry-family").count()).toBeGreaterThanOrEqual(3);
    await expect(page.locator('[data-testid="industry-family"][data-family="coverage"] [data-testid="industry-card"]').first()).toBeVisible();
    const re = page.locator(`[data-testid="industry-card"][data-slug="${MODULE}"]`);
    await expect(re).toHaveAttribute("data-live", "1");
    await expect(re.getByTestId("industry-counts")).toContainText("8 questions");
    await expect(page.locator('[data-testid="industry-card"][data-live="0"]').first()).toContainText("Coming soon");
    await re.click();
    await expect(page).toHaveURL(new RegExp(`/home/technicals/${MODULE}$`));
    await expect(page.getByTestId("topic-heading")).toHaveText("Real Estate");
    await expect(page.getByTestId("industry-family-badge")).toHaveText("Coverage groups");
    await expect(page.getByTestId("subtopic-row")).toHaveCount(3);
    await expect(page.getByTestId("lesson-link")).toHaveCount(1);
    await page.getByTestId("lesson-link").click();
    await expect(page).toHaveURL(new RegExp(`/home/technicals/${MODULE}/${LESSON}$`));
    await expect(page.getByTestId("lesson-title")).toHaveText("NOI, cap rates and NAV");
    await expect(page.getByTestId("block-key_metrics")).toBeVisible();
    await expect(page.getByTestId("block-key_metrics").locator("tbody tr")).toHaveCount(6);
    await expect(page.getByTestId("block-key_metrics")).toContainText("Cap rate");
    await expect(page.getByTestId("block-worked_calc")).toContainText("700");
  });

  test("deck exists, the module drill starts, and the mock offers the industry option", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", "/home/flashcards");
    await expect(page.getByTestId("flashcards-heading")).toHaveText("Flashcards");
    await expect(page.getByTestId("deck-card").filter({ hasText: "Real Estate" })).toContainText("8 cards");

    await page.goto("/home/interviews");
    await expect(page.getByTestId("interviews-heading")).toHaveText("Mock interviews");
    const industry = page.getByTestId("mock-industry");
    await expect(industry).toBeEnabled();
    await expect(industry.locator(`option[value="${MODULE}"]`)).toHaveCount(1);
    await page.getByTestId(`start-drill-${MODULE}`).click();
    await expect(page).toHaveURL(/\/home\/interviews\/[0-9a-f-]{36}$/);
    await expect(page.getByTestId("runner-heading")).toContainText("Drill · Real Estate");
    await expect(page.getByTestId("runner-question")).not.toBeEmpty();
    const { data: rows } = await admin().from("interviews").select("id, mode, topic_id, question_ids").eq("topic_id", topicId);
    expect(rows?.length).toBe(1);
    expect(rows![0].mode).toBe("drill");
    expect((rows![0].question_ids as string[]).every((id) => questionIds.includes(id))).toBe(true);
  });
});
