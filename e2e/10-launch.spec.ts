import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { signInAs, unlockPrivateArea } from "./helpers/auth";

// Loop 10 launch flow. Runs with PUBLIC_LAUNCH=true (playwright.config.ts) and no Stripe key →
// StripeStub. Nothing under DCF is approved yet, so the setup inserts ONE temporary approved DCF
// lesson (body copied from the approved EV-bridge lesson) and deletes it in afterAll.
const TEMP_SLUG = "e2e-dcf-gate-lesson";

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}

test.describe("Loop 10 launch", () => {
  test.beforeAll(async () => {
    const db = admin();
    const { data: topic } = await db.from("topics").select("id").eq("slug", "dcf").single();
    if (!topic) throw new Error("dcf topic missing — run `npm run seed -- 03`");
    const { data: sub } = await db.from("subtopics").select("id").eq("topic_id", topic.id).order("ordinal").limit(1).single();
    if (!sub) throw new Error("dcf subtopic missing");
    const { data: src } = await db.from("lessons").select("body, body_version, reading_minutes").eq("slug", "ev-bridge-basics").single();
    if (!src) throw new Error("ev-bridge-basics missing — run `npm run seed -- 04`");
    const { error } = await db.from("lessons").upsert({ subtopic_id: sub.id, slug: TEMP_SLUG, title: "E2E DCF gate lesson", ordinal: 99, body: src.body, body_version: src.body_version, reading_minutes: src.reading_minutes, status: "approved", generated_by: "fixture" }, { onConflict: "slug" });
    if (error) throw error;
  });

  test.afterAll(async () => {
    await admin().from("lessons").delete().eq("slug", TEMP_SLUG);
  });

  test("landing: hero, demo chat answers, curriculum preview, placeholders marked", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("hero-heading")).toHaveText("Ask a mentor who got in.");
    expect(await page.getByTestId("curriculum-topic").count()).toBeGreaterThanOrEqual(7);
    await expect(page.getByTestId("vs-ai")).toBeVisible();
    await expect(page.getByTestId("social-proof")).toContainText("placeholder");
    await page.getByTestId("demo-suggestion").first().click();
    await expect(page.getByTestId("demo-answer")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("demo-answer-text")).not.toHaveText("");
    await expect(page.getByTestId("demo-signup")).toBeVisible();
  });

  test("demo chat cap: 4th question in a day is refused with 429", async ({ request }) => {
    const ip = `203.0.113.${Math.floor(Math.random() * 200) + 1}`;
    const headers = { "x-forwarded-for": ip, "Content-Type": "application/json" };
    let last = 0;
    for (let i = 0; i < 4; i++) {
      const res = await request.post("/api/demo-chat", { headers, data: { message: "What is enterprise value?" } });
      last = res.status();
      if (i < 3) expect(last).toBe(200);
    }
    expect(last).toBe(429);
  });

  test("pricing shows three tiers; sitemap, robots and legal pages respond", async ({ page, request }) => {
    await page.goto("/pricing");
    await expect(page.getByTestId("pricing-tier")).toHaveCount(3);
    await expect(page.locator('[data-testid="pricing-tier"][data-plan="core"]')).toContainText("£4.99");
    await expect(page.locator('[data-testid="pricing-tier"][data-plan="ai"]')).toContainText("£9.99");
    for (const path of ["/sitemap.xml", "/robots.txt", "/privacy", "/terms", "/non-target", "/opengraph-image"]) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(200);
    }
    expect(await (await request.get("/sitemap.xml")).text()).toContain("/pricing");
    expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /home");
    await page.goto("/privacy");
    await expect(page.getByTestId("legal-draft")).toBeVisible();
  });

  test("free user sees UpgradeCard on a DCF lesson; stub checkout → core → lesson visible", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", `/home/technicals/dcf/${TEMP_SLUG}`, "free");
    await expect(page.getByTestId("lesson-title")).toHaveText("E2E DCF gate lesson");
    await expect(page.getByTestId("lesson-locked")).toBeVisible();
    await expect(page.getByTestId("lesson-toc")).toBeVisible();
    await expect(page.getByTestId("upgrade-card")).toHaveAttribute("data-plan", "core");
    // Free bank shows only free topics; drills are disabled.
    await page.goto("/home/practice");
    await expect(page.getByTestId("filter-topic-dcf")).toHaveCount(0);
    await expect(page.getByTestId("upgrade-card")).toBeVisible();
    await page.goto("/home/interviews");
    await expect(page.getByTestId("start-mock")).toBeDisabled();
    // Upgrade through the stub.
    await page.goto("/pricing");
    await expect(page.locator('[data-testid="pricing-tier"][data-plan="free"]')).toHaveAttribute("data-current", "1");
    await page.getByTestId("checkout-core").click();
    await expect(page.getByTestId("billing-success")).toHaveAttribute("data-plan", "core");
    await page.goto(`/home/technicals/dcf/${TEMP_SLUG}`);
    await expect(page.getByTestId("lesson-locked")).toHaveCount(0);
    await expect(page.getByTestId("lesson-progress")).toBeVisible();
    await page.goto("/pricing");
    await expect(page.locator('[data-testid="pricing-tier"][data-plan="core"]')).toHaveAttribute("data-current", "1");
    await expect(page.getByTestId("pricing-portal")).toBeVisible();
  });

  test("playbook checklist persists across reloads", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", "/non-target");
    await expect(page.getByTestId("playbook-section")).toHaveCount(7);
    const box = page.getByTestId("check-summer-cv");
    await box.uncheck();
    await box.check();
    await expect(box).toBeChecked();
    await page.reload();
    await expect(page.getByTestId("check-summer-cv")).toBeChecked();
    await page.getByTestId("check-summer-cv").uncheck();
    await page.reload();
    await expect(page.getByTestId("check-summer-cv")).not.toBeChecked();
  });
});
