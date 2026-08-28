import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { signInAs, unlockPrivateArea } from "./helpers/auth";

// Loop 15 — Valuation. Requires the seed chain + `npm run seed -- 03`.
// Valuation is a PAID topic, so unlike Accounting and EqV/EV it does not auto-approve: everything
// the chapter loads is `generated` and therefore invisible to a student under RLS. The setup
// approves the five lessons with the admin client and puts their original statuses back afterwards
// — the linked project is the only environment, so nothing may be left approved.
const TOPIC = "valuation";

const LESSONS = {
  methods: "valuation-methodologies",
  comps: "comparable-companies",
  precedents: "precedent-transactions",
  multiples: "multiples-and-metrics",
  choosing: "choosing-and-presenting",
} as const;

const LESSON_SLUGS = Object.values(LESSONS);

// Folded into the cheat sheet's "you may hear" box by the Loop 15 plan: kept in the taxonomy,
// hidden until it has a lesson of its own.
const DEFERRED = "Other methods: SOTP, liquidation, LBO valuation";

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

const previousStatuses = new Map<string, string>();

test.describe("Loop 15 valuation", () => {
  test.beforeAll(async () => {
    const db = admin();
    const { data: lessons, error } = await db.from("lessons").select("id, slug, status").in("slug", LESSON_SLUGS);
    if (error) throw error;
    if ((lessons?.length ?? 0) !== LESSON_SLUGS.length) {
      throw new Error(`expected ${LESSON_SLUGS.length} valuation lessons — run \`npm run seed -- 03\``);
    }
    for (const l of lessons!) previousStatuses.set(l.slug as string, l.status as string);
    await db.from("lessons").update({ status: "approved" }).in("slug", LESSON_SLUGS);
  });

  test.afterAll(async () => {
    const db = admin();
    for (const [slug, status] of previousStatuses) await db.from("lessons").update({ status }).eq("slug", slug);
  });

  test("topic page lists the five lessons and hides the deferred subtopic", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, `/home/technicals/${TOPIC}`);
    await expect(page.getByTestId("topic-heading")).toHaveText("Valuation");

    // Six subtopics in the taxonomy; `other-methodologies` has no lesson, so it never renders a row.
    await expect(page.getByTestId("subtopic-row")).toHaveCount(5);
    await expect(page.getByTestId("lesson-link")).toHaveCount(5);
    await expect(page.getByText(DEFERRED, { exact: true })).toHaveCount(0);
  });

  test("football field: every method is evidence, and turning one off redraws the defensible zone", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, lessonUrl(LESSONS.methods));
    await expect(page.getByTestId("lesson-title")).toHaveText("The three methods, and how to rank them");

    const widget = page.getByTestId("widget-football_field");
    await expect(widget).toBeVisible();

    // Three methods, three bars, plus the line marking where Marlow actually trades (£1,290m EV).
    const methodToggles = page.getByTestId("field-method");
    await expect(methodToggles).toHaveCount(3);
    await expect(page.getByTestId("field-bar")).toHaveCount(3);
    await expect(page.getByTestId("field-price")).toBeVisible();

    // With all three shown the ranges do not intersect at all — precedents start at £1,650m while
    // the DCF tops out at £1,450m. That disagreement is the honest starting position.
    const overlap = page.getByTestId("field-overlap");
    await expect(overlap).toHaveText("None — the methods disagree");

    // Drop precedents (the control-premium method) and the two market-derived views do overlap:
    // comps £1,200–1,800m against the DCF £1,250–1,450m leaves £1,250m–£1,450m defensible.
    await methodToggles.nth(1).uncheck();
    await expect(page.getByTestId("field-bar")).toHaveCount(2);
    await expect(overlap).toHaveText("£1,250m – £1,450m");

    // Restoring it takes the zone away again — the point being that each bar is evidence, and the
    // range you can defend depends on which evidence you are willing to stand behind.
    await methodToggles.nth(1).check();
    await expect(page.getByTestId("field-bar")).toHaveCount(3);
    await expect(overlap).toHaveText("None — the methods disagree");
  });

  test("comps picker: dropping the cheapest peer moves the mean further than the median", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, lessonUrl(LESSONS.comps));
    await expect(page.getByTestId("lesson-title")).toHaveText("Trading comps: picking peers and spreading them");

    const widget = page.getByTestId("widget-football_field");
    await expect(widget).toBeVisible();
    // The lesson opens the widget on its comps face; click it anyway so the test does not depend
    // on the lesson JSON keeping `mode: "comps"`.
    await page.getByTestId("field-face-comps").click();

    const median = page.getByTestId("comps-median");
    const mean = page.getByTestId("comps-mean");
    await expect(page.getByTestId("comps-peer")).toHaveCount(5);

    // All five peers: 8.0×, 9.0×, 11.0×, 12.0×, 12.0× → median 11.0×, mean 10.4×. The readouts
    // ease to their new values, so poll rather than reading once.
    await expect.poll(async () => median.innerText()).toContain("11.0×");
    await expect.poll(async () => mean.innerText()).toContain("10.4×");
    // 11.0× on £150m of EBITDA is £1,650m of EV, and £1,440m of equity over 120m shares.
    await expect.poll(async () => page.getByTestId("field-implied-ev").innerText()).toContain("£1,650m");
    await expect.poll(async () => page.getByTestId("field-implied-share").innerText()).toContain("£12.00");

    // Untick Penrose, the 8.0× outlier at the bottom of the set. Four peers remain: 9.0×, 11.0×,
    // 12.0×, 12.0× → median 11.5× (+0.5), mean 11.0× (+0.6). The mean moves further, which is
    // exactly why bankers quote the median and mention the spread.
    const penrose = page.getByTestId("comps-peer").filter({ hasText: "Penrose Metrology" });
    await penrose.getByRole("checkbox").uncheck();
    await expect(penrose).toHaveAttribute("data-kept", "false");
    await expect.poll(async () => median.innerText()).toContain("11.5×");
    await expect.poll(async () => mean.innerText()).toContain("11.0×");
  });

  test("multiples: the predict gate holds its answer back, and the faded step-up grades per cell", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, lessonUrl(LESSONS.multiples));
    await expect(page.getByTestId("lesson-title")).toHaveText("Which multiple, when — and why similar companies differ");

    // Nothing is revealed until the student commits to an answer.
    const options = page.getByTestId("predict-option");
    await expect(page.getByTestId("block-predict")).toBeVisible();
    await expect(page.getByTestId("predict-explain")).toHaveCount(0);
    await expect(options).toHaveCount(4);
    await options.first().click();
    await expect(page.getByTestId("predict-explain")).toBeVisible();

    // The faded example blanks the lines that carry the insight: Penrose's EV/EBIT and the
    // EBITDA→EBIT step-up that shows how capital-intensive it is (640 / 55 = 11.64×).
    const inputs = page.getByTestId("fill-numbers-input");
    await expect(inputs).toHaveCount(3);
    const first = inputs.first();
    await expect(first).toHaveAttribute("data-state", "empty");

    await first.fill("8");
    await expect(first).toHaveAttribute("data-state", "wrong");
    await expect(page.getByTestId("fill-numbers-score")).toContainText("0 of 3");

    await first.fill("11.64");
    await expect(first).toHaveAttribute("data-state", "correct");
    await expect(page.getByTestId("fill-numbers-score")).toContainText("1 of 3");
  });

  test("cheat sheet renders the multiple formula, the traps and the ft-only box", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, `/home/technicals/${TOPIC}`);
    await page.getByTestId("cheatsheet-link").click();
    await expect(page).toHaveURL(new RegExp(`/home/technicals/${TOPIC}/cheatsheet$`));

    await expect(page.getByTestId("cheatsheet")).toBeVisible();
    await expect(page.getByTestId("cheatsheet-formulas")).toContainText("Implied value from a multiple");
    await expect(page.getByTestId("cheatsheet-formulas")).toContainText("Control premium");
    await expect(page.getByTestId("cheatsheet-formulas").locator(".katex").first()).toBeVisible();
    await expect(page.getByTestId("cheatsheet-canonical")).toContainText("Rank them — which gives the highest value and why?");
    await expect(page.getByTestId("cheatsheet-traps")).toContainText("Quoting one number instead of a range");
    // `ft-only` material is named so it cannot ambush the student, never taught as a lesson.
    await expect(page.getByTestId("cheatsheet-you-may-hear")).toContainText("Sum-of-the-parts");
  });
});
