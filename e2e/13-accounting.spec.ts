import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { signInAs, unlockPrivateArea } from "./helpers/auth";

// Loop 13 — Accounting. Requires the seed chain + `npm run seed -- 03`.
// Seven of the eight lessons load `generated` (student-invisible), so the setup approves them with
// the admin client and restores their original status afterwards — the linked project is the only
// environment. `three-statement-links` is already `approved` from Loop 03 and is left alone; its
// status is recorded and restored with the rest, so the test is safe either way.
// No test here asserts on the chapter's 40 questions, so none are approved.
const TOPIC = "accounting";

const LESSONS = [
  "three-statements-overview",
  "income-statement",
  "balance-sheet",
  "cash-flow-statement",
  "three-statement-links",
  "working-capital",
  "single-step-walkthroughs",
  "multi-step-walkthroughs",
] as const;

// Folded into siblings by the Loop 13 plan: kept in the taxonomy, hidden until they have a lesson.
const DEFERRED = ["Depreciation, capex and non-cash items", "Deferred taxes, leases and other items"];

const lessonPrevious = new Map<string, string>();

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function signIn(page: Page, baseURL: string, next: string) {
  await unlockPrivateArea(page, baseURL);
  await signInAs(page, "e2e-student@astar.test", next);
}

const lessonUrl = (slug: string) => `/home/technicals/${TOPIC}/${slug}`;

test.describe("Loop 13 accounting", () => {
  test.beforeAll(async () => {
    const db = admin();
    const { data: lessons, error } = await db.from("lessons").select("id, slug, status").in("slug", [...LESSONS]);
    if (error) throw error;
    if ((lessons?.length ?? 0) < LESSONS.length) throw new Error(`accounting lessons missing — run \`npm run seed -- 03\``);
    for (const l of lessons ?? []) lessonPrevious.set(l.id as string, l.status as string);
    await db.from("lessons").update({ status: "approved" }).in("slug", [...LESSONS]);
  });

  test.afterAll(async () => {
    const db = admin();
    for (const [id, status] of lessonPrevious) await db.from("lessons").update({ status }).eq("id", id);
  });

  test("topic page lists the eight lessons and hides the deferred subtopics", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, `/home/technicals/${TOPIC}`);
    await expect(page.getByTestId("topic-heading")).toHaveText("Accounting");

    // Ten subtopics in the taxonomy; the two deferred ones have no lesson, so they never render.
    await expect(page.getByTestId("subtopic-row")).toHaveCount(8);
    await expect(page.getByTestId("lesson-link")).toHaveCount(8);
    for (const heading of DEFERRED) await expect(page.getByText(heading, { exact: true })).toHaveCount(0);
  });

  test("faded walk: the student types the blanked cells and is graded per cell", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, lessonUrl("single-step-walkthroughs"));
    await expect(page.getByTestId("lesson-title")).toHaveText("One change, three statements");

    // `pay_dividend` £20m at fade level 2 hides both balance-sheet lines: cash and retained
    // earnings, each −£20m. A dividend never touches the income statement, so there is nothing
    // to hide there — which is half the lesson.
    const widget = page.getByTestId("widget-faded_walk");
    await expect(widget).toBeVisible();
    await expect(page.getByTestId("faded-walk-score")).toContainText("0 of 2 correct");

    const firstBlank = page.getByTestId("faded-walk-input").first(); // balance sheet → Cash
    await expect(firstBlank).toHaveAttribute("data-state", "empty");

    await firstBlank.fill("20"); // right magnitude, wrong direction — a dividend takes cash out
    await expect(firstBlank).toHaveAttribute("data-state", "wrong");

    await firstBlank.fill("-20");
    await expect(firstBlank).toHaveAttribute("data-state", "correct");
    await expect(page.getByTestId("faded-walk-score")).toContainText("1 of 2 correct");
    await expect(page.getByTestId("faded-walk-score")).toContainText("The walk balances");
  });

  test("cash cycle: stretching the payment terms drives the cycle negative", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, lessonUrl("working-capital"));
    await expect(page.getByTestId("lesson-title")).toHaveText("Working capital and the cash conversion cycle");

    const ccc = page.getByTestId("cycle-ccc");
    await expect(page.getByTestId("widget-cash_cycle")).toBeVisible();
    // Kestrel's base year: 48.7 days of stock + 36.5 days to be paid − 36.5 days to pay = 48.7.
    await expect.poll(async () => ccc.innerText()).toContain("48.7");

    // Push the supplier terms out past stock + collection and the suppliers fund the business.
    await page.getByTestId("cycle-dpo").fill("180");
    await expect.poll(async () => ccc.innerText()).toMatch(/-\d/);
    await expect(page.getByTestId("cycle-tied-up")).toContainText("−£57.9m");
    await expect(page.getByText("Suppliers fund")).toBeVisible();
  });

  test("filings toggle: the as-filed statement is longer but ends in the same profit", async ({ page, baseURL }) => {
    // The widget sits on the overview lesson, where the point of it lands first.
    await signIn(page, baseURL!, lessonUrl("three-statements-overview"));
    const widget = page.getByTestId("widget-filings_toggle");
    await expect(widget).toBeVisible();

    const rows = page.getByTestId("filings-row");
    const simplified = await rows.count();
    await expect(widget).toContainText("£67.5m");

    await page.getByTestId("filings-mode").click();
    await expect.poll(async () => rows.count()).toBeGreaterThan(simplified);
    // Longer, not different: the bottom line is the same number you drew on the whiteboard.
    await expect(widget).toContainText("£67.5m");
    await expect(widget).toContainText("Exceptional items");

    await page.getByTestId("filings-mode").click();
    await expect.poll(async () => rows.count()).toBe(simplified);
  });

  test("walkthrough: the PIK scenario balances and the predict gate holds its answer back", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, lessonUrl("multi-step-walkthroughs"));
    await expect(page.getByTestId("lesson-title")).toHaveText("Harder walks, and why profits aren't cash");

    // The scenario is required on a walkthrough subtopic. Its three statements are shown, but the
    // balance check is held behind a reveal so the student commits before seeing it.
    const scenario = page.getByTestId("block-scenario");
    await expect(scenario).toBeVisible();
    await expect(scenario.getByTestId("scenario-bs")).toContainText("Retained earnings");
    await expect(page.getByTestId("scenario-check-content")).toHaveCount(0);
    await page.getByTestId("scenario-check-toggle").click();
    await expect(page.getByTestId("scenario-check-content")).toContainText("Balances");

    // Selling a depot above book value *reduces* cash on the day, because tax is paid on the gain
    // — the answer is withheld until the student has committed to one.
    await expect(page.getByTestId("predict-explain")).toHaveCount(0);
    await page.getByTestId("predict-option").filter({ hasText: "It falls by £2.5m" }).click();
    await expect(page.getByTestId("predict-explain")).toBeVisible();
  });
});
