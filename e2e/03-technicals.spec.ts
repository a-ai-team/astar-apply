import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { signInAs, unlockPrivateArea } from "./helpers/auth";

// Requires `npm run seed -- 00 && npm run seed -- 03` (users + curriculum + 2 approved lessons).
function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}

const REQUIRED_BLOCKS = ["trap", "canonical_answer", "your_turn", "quick_fire", "one_liner", "scenario"];

test.describe("Loop 03 technicals", () => {
  test("student: 9 topic cards → EqV/EV → lesson has the required blocks → your-turn reveal → path has 10 weeks", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", "/home/technicals");
    await expect(page.getByTestId("technicals-heading")).toHaveText("Technicals");
    await expect(page.getByTestId("topic-card")).toHaveCount(9);
    await expect(page.getByTestId("free-badge")).toHaveCount(2);

    await page.getByTestId("topic-card").filter({ hasText: "Equity value vs enterprise value" }).click();
    await expect(page).toHaveURL(/\/home\/technicals\/eqv-ev$/);
    await expect(page.getByTestId("topic-heading")).toContainText("Equity value vs enterprise value");
    await page.getByTestId("lesson-link").filter({ hasText: "The EqV → EV bridge" }).click();
    await expect(page).toHaveURL(/\/home\/technicals\/eqv-ev\/ev-bridge-basics$/);
    await expect(page.getByTestId("lesson-title")).toHaveText("The EqV → EV bridge");
    for (const b of REQUIRED_BLOCKS) await expect(page.getByTestId(`block-${b}`)).toBeVisible();
    await expect(page.getByTestId("quick-fire-card")).toHaveCount(4);
    await expect(page.getByTestId("widget-ev-bridge")).toBeVisible();
    await expect(page.getByTestId("ev-bridge-ev")).toHaveText("£1,530m");
    // KaTeX rendered the display formula.
    await expect(page.locator(".katex").first()).toBeVisible();

    // Reveal interaction.
    await expect(page.getByTestId("your-turn-content")).toHaveCount(0);
    await page.getByTestId("your-turn-toggle").click();
    await expect(page.getByTestId("your-turn-content")).toBeVisible();
    // Rubrics gain items as chapters extend a lesson (Loop 14 added a stretch item here).
    expect(await page.getByTestId("your-turn-rubric").locator("li").count()).toBeGreaterThanOrEqual(4);

    // Widget slider changes EV.
    await page.getByTestId("ev-bridge-cash").fill("500");
    await expect(page.getByTestId("ev-bridge-ev")).toHaveText("£1,150m");

    await page.goto("/home/path");
    await expect(page.getByTestId("path-heading")).toBeVisible();
    await expect(page.getByTestId("week-card")).toHaveCount(10);
    await page.getByTestId("week-card").nth(3).click();
    await expect(page.getByTestId("week-heading")).toContainText("Week 4");
    await expect(page.getByTestId("day-row")).toHaveCount(5);
    await expect(page.getByTestId("day-lesson-link").filter({ hasText: "The EqV → EV bridge" })).toBeVisible();
  });

  test("student GET of a draft lesson → 404", async ({ page, baseURL }) => {
    const db = admin();
    const { data: sub } = await db.from("subtopics").select("id").eq("slug", "ev-bridge-calculations").single();
    const body = { version: 1, reading_minutes: 5, blocks: [{ type: "why_here", md: "PLACEHOLDER — synthetic draft for e2e." }] };
    const { error } = await db.from("lessons").upsert({ slug: "e2e-draft-lesson", subtopic_id: sub!.id, title: "E2E draft", ordinal: 99, body, status: "draft", generated_by: "e2e" }, { onConflict: "slug" });
    expect(error).toBeNull();
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", "/home/technicals");
    const res = await page.goto("/home/technicals/eqv-ev/e2e-draft-lesson");
    expect(res?.status()).toBe(404);
    // …and it is not listed on the topic page either.
    await page.goto("/home/technicals/eqv-ev");
    await expect(page.getByTestId("lesson-link").filter({ hasText: "E2E draft" })).toHaveCount(0);
  });

  test("staff edits lesson JSON in /admin/lessons and the change shows on the student page", async ({ page, baseURL }) => {
    const db = admin();
    const { data: before } = await db.from("lessons").select("id, body").eq("slug", "three-statement-links").single();
    expect(before).toBeTruthy();
    try {
      await unlockPrivateArea(page, baseURL!);
      await signInAs(page, "e2e-mentor@astar.test", "/admin/lessons");
      await expect(page.getByTestId("admin-lessons-heading")).toHaveText("Lessons");
      await page.getByTestId("admin-lesson-link").filter({ hasText: "How the three statements link" }).click();
      await expect(page.getByTestId("admin-lesson-heading")).toBeVisible();

      // Invalid JSON blocks the save button; a valid edit enables it.
      const editor = page.getByTestId("lesson-json");
      await editor.fill("{ not json");
      await expect(page.getByTestId("lesson-errors")).toContainText("JSON parse error");
      await expect(page.getByTestId("lesson-save")).toBeDisabled();

      const marker = `E2E-EDIT-${Date.now()}`;
      const edited = JSON.parse(JSON.stringify(before!.body)) as { blocks: { type: string; md?: string }[] };
      const one = edited.blocks.find((b) => b.type === "one_liner")!;
      one.md = `${one.md} ${marker}`;
      await editor.fill(JSON.stringify(edited, null, 2));
      await expect(page.getByTestId("lesson-valid")).toBeVisible();
      await page.getByTestId("lesson-tab-preview").click();
      await expect(page.getByTestId("lesson-preview").getByTestId("block-one_liner")).toContainText(marker);
      await page.getByTestId("lesson-save").click();
      await expect(page.getByTestId("lesson-saved")).toBeVisible({ timeout: 15_000 });

      await page.goto("/home/technicals/accounting/three-statement-links");
      await expect(page.getByTestId("block-one_liner")).toContainText(marker);
    } finally {
      await db.from("lessons").update({ body: before!.body }).eq("id", before!.id);
    }
  });
});
