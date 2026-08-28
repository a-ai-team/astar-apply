import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { signInAs, unlockPrivateArea } from "./helpers/auth";

// Loop 12 — Finance foundations. Requires the seed chain + `npm run seed -- 03`.
// Everything Loop 12 loads is `generated` (student-invisible), so the setup approves the three
// lessons with the admin client and restores their original status afterwards — the linked project
// is the only environment. No test here asserts on the chapter's questions, so none are approved.
const TOPIC = "finance-foundations";
const LESSONS = ["time-value-of-money", "pv-npv", "wacc-intro"] as const;
const LESSON_URL = `/home/technicals/${TOPIC}/${LESSONS[0]}`;

// Folded into siblings by the Loop 12 plan: kept in the taxonomy, hidden until they have a lesson.
const DEFERRED = ["Discount rates and risk", "IRR and payback"];

const TMT_HEADING = "Growth companies are long-duration assets";
const HEALTHCARE_HEADING = "Discount the probability first, then the time";

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function signIn(page: Page, baseURL: string, next: string) {
  await unlockPrivateArea(page, baseURL);
  await signInAs(page, "e2e-student@astar.test", next);
}

const lessonPrevious = new Map<string, string>();

test.describe("Loop 12 finance foundations", () => {
  test.beforeAll(async () => {
    const db = admin();
    const { data: lessons, error } = await db.from("lessons").select("id, slug, status").in("slug", [...LESSONS]);
    if (error) throw error;
    if ((lessons?.length ?? 0) < LESSONS.length) throw new Error(`foundations lessons missing — run \`npm run seed -- 03\``);
    for (const l of lessons ?? []) lessonPrevious.set(l.id as string, l.status as string);
    await db.from("lessons").update({ status: "approved" }).in("slug", [...LESSONS]);
  });

  test.afterAll(async () => {
    const db = admin();
    for (const [id, status] of lessonPrevious) await db.from("lessons").update({ status }).eq("id", id);
  });

  test("topic page lists the three lessons and hides the deferred subtopics", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, `/home/technicals/${TOPIC}`);
    await expect(page.getByTestId("topic-heading")).toHaveText("Finance foundations");

    // Three teaching subtopics; the two deferred ones have no lesson, so they never render a row.
    await expect(page.getByTestId("subtopic-row")).toHaveCount(3);
    await expect(page.getByTestId("lesson-link")).toHaveCount(3);
    for (const heading of DEFERRED) await expect(page.getByText(heading, { exact: true })).toHaveCount(0);

    // The link carries a reading-time suffix ("… · 8 min"), so match on the title.
    await expect(page.getByTestId("lesson-link").first()).toContainText("Why a pound today beats a pound later");
  });

  test("lesson: predict gate, the discount dial, and the faded worked example", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, LESSON_URL);
    await expect(page.getByTestId("lesson-title")).toHaveText("Why a pound today beats a pound later");

    // 1. The explanation is withheld until the student commits to an answer.
    await expect(page.getByTestId("block-predict")).toBeVisible();
    await expect(page.getByTestId("predict-option")).toHaveCount(4);
    await expect(page.getByTestId("predict-explain")).toHaveCount(0);
    await page.getByTestId("predict-option").filter({ hasText: "It falls by more than 10 %" }).click();
    await expect(page.getByTestId("predict-explain")).toBeVisible();
    await expect(page.getByTestId("predict-explain")).toContainText("£0.681m");

    // 2. Moving the rate changes the present value the dial reports.
    const dial = page.getByTestId("widget-discount_dial");
    await expect(dial).toBeVisible();
    const total = page.getByTestId("dial-total");
    const before = await total.innerText();
    await page.getByTestId("dial-rate").fill("0.16");
    // AnimatedNumber eases to the new figure, so poll rather than asserting immediately.
    await expect.poll(async () => total.innerText()).not.toBe(before);

    // 3. The faded example grades each blank against the authored value.
    await expect(page.getByTestId("block-fill_numbers")).toBeVisible();
    const firstBlank = page.getByTestId("fill-numbers-input").first(); // PV of £1.0m in year 3 at 12 %
    await expect(firstBlank).toHaveAttribute("data-state", "empty");
    await expect(page.getByTestId("fill-numbers-score")).toContainText("0 of 2");

    await firstBlank.fill("0.794"); // the 8 % answer from the worked example, not this one
    await expect(firstBlank).toHaveAttribute("data-state", "wrong");

    await firstBlank.fill("0.712");
    await expect(firstBlank).toHaveAttribute("data-state", "correct");
    await expect(page.getByTestId("fill-numbers-score")).toContainText("1 of 2");
  });

  test("industry lens: TMT section appears, Healthcare stays hidden, and generalist clears it", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, LESSON_URL);
    await expect(page.getByTestId("lens-hint")).toBeVisible();
    await expect(page.getByTestId("lens-badge")).toHaveCount(0);

    await page.getByTestId("lens-picker").selectOption("tmt");
    await expect(page).toHaveURL(/\?lens=tmt$/);
    await expect(page.getByTestId("lens-badge")).toHaveText(/TMT/i);
    await expect(page.getByText(TMT_HEADING)).toBeVisible();
    await expect(page.getByText(HEALTHCARE_HEADING)).toHaveCount(0);

    await page.getByTestId("lens-picker").selectOption("");
    await expect(page).not.toHaveURL(/lens=/);
    await expect(page.getByTestId("lens-badge")).toHaveCount(0);
    await expect(page.getByTestId("lens-hint")).toBeVisible();
  });

  test("cheat sheet renders the formulas, the traps and the ft-only box", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, `/home/technicals/${TOPIC}`);
    await page.getByTestId("cheatsheet-link").click();
    await expect(page).toHaveURL(new RegExp(`/home/technicals/${TOPIC}/cheatsheet$`));

    await expect(page.getByTestId("cheatsheet")).toBeVisible();
    await expect(page.getByTestId("cheatsheet-formulas")).toContainText("Weighted average cost of capital");
    await expect(page.getByTestId("cheatsheet-formulas").locator(".katex").first()).toBeVisible();
    await expect(page.getByTestId("cheatsheet-canonical")).toContainText("Why do we discount?");
    await expect(page.getByTestId("cheatsheet-traps")).toContainText("IRR is a rate");
    // `ft-only` material is named so it cannot ambush the student, never taught as a lesson.
    await expect(page.getByTestId("cheatsheet-you-may-hear")).toContainText("Modified IRR");
  });
});
