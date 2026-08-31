import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { signInAs, unlockPrivateArea } from "./helpers/auth";

// Loop 17 — M&A. Requires the seed chain + `npm run seed -- 03`.
// M&A is a PAID topic, so everything the chapter loads is `generated` and invisible to a student
// under RLS. The setup approves the four lessons with the admin client and restores their original
// statuses afterwards — the linked project is the only environment, so nothing may be left approved.
const TOPIC = "ma";

const LESSONS = {
  why: "why-companies-acquire",
  concepts: "accretion-dilution-concepts",
  calculations: "accretion-dilution-calculations",
  synergies: "synergies-and-deal-structure",
} as const;

const LESSON_SLUGS = Object.values(LESSONS);

// PPA beyond one stretch widget folds into lesson 4 and the cheat sheet, so the subtopic stays in
// the taxonomy and renders no row until it has a lesson.
const DEFERRED = "Purchase price allocation and goodwill";

const lessonUrl = (slug: string) => `/home/technicals/${TOPIC}/${slug}`;

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function signIn(page: Page, baseURL: string, next: string) {
  await unlockPrivateArea(page, baseURL);
  await signInAs(page, "e2e-student@astar.test", next);
}

/** Widget readouts ease to their new values via `AnimatedNumber`, so never read them once. */
const settled = (page: Page, testId: string) => expect.poll(async () => page.getByTestId(testId).innerText());

const previousStatuses = new Map<string, string>();

test.describe("Loop 17 M&A", () => {
  test.beforeAll(async () => {
    const db = admin();
    const { data: lessons, error } = await db.from("lessons").select("id, slug, status").in("slug", LESSON_SLUGS);
    if (error) throw error;
    if ((lessons?.length ?? 0) !== LESSON_SLUGS.length) {
      throw new Error(`expected ${LESSON_SLUGS.length} M&A lessons — run \`npm run seed -- 03\``);
    }
    for (const l of lessons!) previousStatuses.set(l.slug as string, l.status as string);
    await db.from("lessons").update({ status: "approved" }).in("slug", LESSON_SLUGS);
  });

  test.afterAll(async () => {
    const db = admin();
    for (const [slug, status] of previousStatuses) await db.from("lessons").update({ status }).eq("slug", slug);
  });

  test("topic page lists the four lessons and hides the deferred PPA subtopic", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, `/home/technicals/${TOPIC}`);
    await expect(page.getByTestId("topic-heading")).toHaveText("M&A");

    // Five subtopics in the taxonomy; `purchase-price-allocation` has no lesson, so no row.
    await expect(page.getByTestId("subtopic-row")).toHaveCount(LESSON_SLUGS.length);
    await expect(page.getByTestId("lesson-link")).toHaveCount(LESSON_SLUGS.length);
    await expect(page.getByText(DEFERRED, { exact: true })).toHaveCount(0);
  });

  test("the accretion rule: predict first, then the widget flips at the acquirer's own multiple", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, lessonUrl(LESSONS.concepts));
    await expect(page.getByTestId("lesson-title")).toHaveText("Accretive or dilutive: the rule you can run in your head");

    // The predict gate: commit to an answer before the widget hands over the punchline.
    await expect(page.getByTestId("block-predict")).toBeVisible();
    await expect(page.getByTestId("predict-option")).toHaveCount(3);
    await expect(page.getByTestId("predict-explain")).toHaveCount(0);
    await page.getByTestId("predict-option").filter({ hasText: "Higher than £1.20" }).click();
    await expect(page.getByTestId("predict-explain")).toBeVisible();

    // Simple mode at the Tamar defaults: all-stock at a 12.5× offer P/E is +4.3 % accretive, and
    // Wychwood earns 8.0 % on the £500m paid.
    await expect(page.getByTestId("widget-accretion_rule")).toBeVisible();
    await settled(page, "ar-proforma-eps").toContain("£1.25");
    await settled(page, "ar-accretion").toContain("+4.3%");
    await settled(page, "ar-target-yield").toContain("8.0%");
    await expect(page.getByTestId("ar-verdict")).toContainText("Accretive");

    // Raise the price to 16× the target's earnings — past Tamar's own 15× — and the same all-stock
    // deal turns dilutive. That is the whole rule.
    await page.getByTestId("ar-offer-pe").fill("16");
    await settled(page, "ar-accretion").not.toContain("+4.3%");
    await expect(page.getByTestId("ar-verdict")).toContainText("Dilutive");
  });

  test("industry lens: the healthcare variants render when the lens is chosen", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, `${lessonUrl(LESSONS.concepts)}?lens=healthcare`);
    await expect(page.getByTestId("lens-badge")).toBeVisible();
    await expect(page.getByText("Dilutive by design")).toBeVisible();

    // Lesson 1's healthcare lens explains contingent value rights on the same lens choice.
    await page.goto(`${lessonUrl(LESSONS.why)}?lens=healthcare`);
    await expect(page.getByTestId("lens-badge")).toBeVisible();
    await expect(page.getByText("Buying a pipeline, not profits")).toBeVisible();
    await expect(page.getByText(/contingent value right/i).first()).toBeVisible();
  });

  test("full-mode merger maths: the 50/50 deal, then synergies lift it by eleven points", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, lessonUrl(LESSONS.calculations));
    await expect(page.getByTestId("lesson-title")).toHaveText("The merger maths, one line at a time");

    // Full mode exposes the whole bridge; the lesson's props pin the 50/50 debt-and-stock deal.
    await expect(page.getByTestId("widget-accretion_rule")).toBeVisible();
    await expect(page.getByTestId("ar-debt-pct")).toBeVisible();
    await settled(page, "ar-accretion").toContain("+8.8%");

    // Add the £20m of claimed synergies: accretion jumps to +19.8 % — about eleven points, which
    // is why announcements shout about synergies.
    await page.getByTestId("ar-synergies").fill("20");
    await settled(page, "ar-accretion").toContain("+19.8%");

    // The faded walk is present for the student to finish by hand.
    await expect(page.getByTestId("block-fill_numbers")).toBeVisible();
  });

  test("synergies against the premium, and goodwill behind the reveal", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, lessonUrl(LESSONS.synergies));
    await expect(page.getByTestId("lesson-title")).toHaveText("Synergies, goodwill and what the premium buys");

    // The deal test at the Tamar numbers: ≈ £167m of after-tax synergy value against £100m paid.
    await expect(page.getByTestId("widget-synergy_npv")).toBeVisible();
    await settled(page, "sn-npv").toContain("£167m");
    await expect(page.getByTestId("sn-verdict")).toContainText("maths works");

    // At the spec's old "9–10" claim the premium is NOT covered — the corrected breakeven is
    // ≈ £12.6m, so £9.5m leaves the buyer short.
    await page.getByTestId("sn-run-rate").fill("9.5");
    await expect(page.getByTestId("sn-verdict")).toContainText("not covered");

    // PPA is the stretch piece, behind a "Going deeper" reveal. Open it: goodwill is the £220m
    // residual, and recognising the DTL on the write-ups grows the plug to £235m.
    const reveal = page.getByTestId("pg-reveal");
    await expect(reveal).toBeVisible();
    await reveal.locator("summary").click();
    await expect(page.getByTestId("widget-ppa_goodwill")).toBeVisible();
    await settled(page, "pg-goodwill").toContain("£220m");
    await settled(page, "pg-identifiable").toContain("£280m");
    await page.getByTestId("pg-dtl").check();
    await settled(page, "pg-dtl-value").toContain("£15m");
    await settled(page, "pg-goodwill").toContain("£235m");
  });

  test("cheat sheet and the printable deal summary card both render", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, `/home/technicals/${TOPIC}`);
    await page.getByTestId("cheatsheet-link").click();
    await expect(page).toHaveURL(new RegExp(`/home/technicals/${TOPIC}/cheatsheet$`));

    await expect(page.getByTestId("cheatsheet")).toBeVisible();
    await expect(page.getByTestId("cheatsheet-formulas")).toContainText("Accretion / dilution");
    await expect(page.getByTestId("cheatsheet-formulas")).toContainText("Goodwill");
    await expect(page.getByTestId("cheatsheet-formulas").locator(".katex").first()).toBeVisible();
    await expect(page.getByTestId("cheatsheet-traps")).toContainText("Calling the premium goodwill");
    // `ft-only` material is named so it cannot ambush the student, never taught as a lesson.
    await expect(page.getByTestId("cheatsheet-you-may-hear")).toContainText("Exchange-ratio collars");

    // The chapter's takeaway artefact: the deal card the student fills in and brings to interviews.
    await page.goto(lessonUrl(LESSONS.why));
    const template = page.getByTestId("template-deal_summary");
    await expect(template).toBeVisible();
    await expect(template).toContainText("Your view — would you have advised it?");
    await page.emulateMedia({ media: "print" });
    await expect(template).toBeVisible();
  });
});
