import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { signInAs, unlockPrivateArea } from "./helpers/auth";

// Loop 16 — DCF. Requires the seed chain + `npm run seed -- 03`.
// DCF is a PAID topic, so everything the chapter loads is `generated` and invisible to a student
// under RLS. The setup approves the seven lessons with the admin client and restores their original
// statuses afterwards — the linked project is the only environment, so nothing may be left approved.
const TOPIC = "dcf";

const LESSONS = {
  overview: "dcf-overview",
  ufcf: "unlevered-free-cash-flow",
  projections: "projections-and-assumptions",
  capm: "cost-of-equity-capm",
  wacc: "wacc",
  terminal: "terminal-value",
  sensitivities: "dcf-sensitivities",
} as const;

const LESSON_SLUGS = Object.values(LESSONS);

// Levered DCF / FCFE and APV are named in the cheat sheet's "you may hear" box rather than taught,
// so the subtopic stays in the taxonomy and renders no row until it has a lesson.
const DEFERRED = "Levered DCF and other variants";

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

test.describe("Loop 16 DCF", () => {
  test.beforeAll(async () => {
    const db = admin();
    const { data: lessons, error } = await db.from("lessons").select("id, slug, status").in("slug", LESSON_SLUGS);
    if (error) throw error;
    if ((lessons?.length ?? 0) !== LESSON_SLUGS.length) {
      throw new Error(`expected ${LESSON_SLUGS.length} DCF lessons — run \`npm run seed -- 03\``);
    }
    for (const l of lessons!) previousStatuses.set(l.slug as string, l.status as string);
    await db.from("lessons").update({ status: "approved" }).in("slug", LESSON_SLUGS);
  });

  test.afterAll(async () => {
    const db = admin();
    for (const [slug, status] of previousStatuses) await db.from("lessons").update({ status }).eq("slug", slug);
  });

  test("topic page lists the seven lessons and hides the deferred subtopic", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, `/home/technicals/${TOPIC}`);
    await expect(page.getByTestId("topic-heading")).toHaveText("DCF");

    // Eight subtopics in the taxonomy; `levered-dcf-and-variants` has no lesson, so no row.
    await expect(page.getByTestId("subtopic-row")).toHaveCount(7);
    await expect(page.getByTestId("lesson-link")).toHaveCount(7);
    await expect(page.getByText(DEFERRED, { exact: true })).toHaveCount(0);
  });

  test("terminal value dominates, and forecasting longer only shrinks its share", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, lessonUrl(LESSONS.overview));
    await expect(page.getByTestId("lesson-title")).toHaveText("What a DCF is actually doing");

    const widget = page.getByTestId("widget-tv_share");
    await expect(widget).toBeVisible();

    // Harbourline's five-year forecast: EV £1,548m, of which the terminal value is 76 %. The whole
    // point of the lesson is that the number you argue about is the one after the forecast ends.
    await settled(page, "tv-share-pct").toContain("76%");
    await settled(page, "tv-ev").toContain("£1,548m");

    // Stretch the forecast to ten years. The terminal share falls — but only to the high 50s, so it
    // is still the majority of the answer. Forecasting harder does not make the problem go away.
    await page.getByTestId("tv-years").fill("10");
    await settled(page, "tv-share-pct").toContain("59%");

    // And it never breaks below half within the slider's range.
    const share = Number((await page.getByTestId("tv-share-pct").innerText()).replace("%", ""));
    expect(share).toBeGreaterThan(50);
  });

  test("the two terminal-value methods each imply the other", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, lessonUrl(LESSONS.terminal));
    await expect(page.getByTestId("lesson-title")).toHaveText("Terminal value: the three-quarters you cannot skip");

    await expect(page.getByTestId("widget-gordon_vs_exit")).toBeVisible();

    // Defaults: 2 % perpetuity growth gives £1,739m, an 8.5× exit multiple gives £1,971m. They do
    // not agree, and the cross-checks say by how much: the growth rate implies 7.5×, the multiple
    // implies 2.7 % growth.
    await settled(page, "gve-tv-gordon").toContain("£1,739m");
    await settled(page, "gve-tv-exit").toContain("£1,971m");
    await settled(page, "gve-implied-multiple").toContain("7.5×");
    await settled(page, "gve-implied-g").toContain("2.7%");
    await expect(page.getByTestId("gve-verdict")).toContainText("disagree");

    // Raising the growth assumption raises the multiple it implies — that is the cross-check
    // moving in the direction it should.
    await page.getByTestId("gve-growth").fill("0.03");
    await settled(page, "gve-implied-multiple").not.toContain("7.5×");
    await settled(page, "gve-tv-gordon").not.toContain("£1,739m");

    // And pushing the exit multiple up raises the growth rate it quietly assumes. At 12× the
    // implied growth passes the point where the widget warns it is above long-run GDP.
    await page.getByTestId("gve-multiple").fill("12");
    await settled(page, "gve-implied-g").not.toContain("2.7%");
    await expect(page.getByTestId("gve-verdict")).toContainText("forever");
  });

  test("WACC: fixed beta falls in a straight line, relevered beta bends it into a U", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, lessonUrl(LESSONS.wacc));
    await expect(page.getByTestId("lesson-title")).toHaveText("WACC on a listed company, and the U-shape proved");

    await expect(page.getByTestId("widget-wacc_builder")).toBeVisible();

    // Harbourline as it stands: 36 % debt, cost of equity 10.0 %, WACC 8.02 %.
    await settled(page, "wacc-ke").toContain("10.0%");
    await settled(page, "wacc-result").toContain("8.02%");
    const relever = page.getByTestId("wacc-relever");
    await expect(relever).not.toBeChecked();
    await expect(page.getByTestId("wacc-sweep-note")).toContainText("straight line");

    // Relevering OFF — the naive answer. Push debt to 70 % of capital with beta held fixed and WACC
    // falls to 6.15 %, because you are simply swapping 10 % money for 4.5 % money.
    await page.getByTestId("wacc-dv").fill("0.7");
    await settled(page, "wacc-ke").toContain("10.0%");
    await settled(page, "wacc-result").toContain("6.15%");

    // Relevering ON at the same 70 % debt — the honest answer. The equity now carries the risk the
    // debt shed, so beta and the cost of equity climb, and WACC ends up ABOVE where it started
    // rather than below it. This is the whole reason "why not fund everything with debt?" has an
    // answer beyond the tax shield.
    await relever.check();
    await settled(page, "wacc-ke").toContain("15.6%");
    await settled(page, "wacc-result").toContain("9.49%");

    const levered = Number((await page.getByTestId("wacc-result").innerText()).replace("%", ""));
    expect(levered).toBeGreaterThan(8.02);
    await expect(page.getByTestId("wacc-sweep-note")).toContainText("bottoms out");
  });

  test("beta: unlever each comp, take the median, relever at your own structure", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, lessonUrl(LESSONS.capm));
    await expect(page.getByTestId("lesson-title")).toHaveText("Cost of equity: where the discount rate starts");

    await expect(page.getByTestId("widget-beta_relever")).toBeVisible();
    await expect(page.getByTestId("beta-comp-row")).toHaveCount(3);

    // Levered betas of 1.2 / 0.9 / 1.1 at their own debt levels unlever to 0.828 / 0.735 / 0.800,
    // and the median — the underlying business risk — is 0.800.
    await expect(page.getByTestId("beta-median-unlevered")).toHaveText("0.800");
    // Relevered at Harbourline's own 0.56 debt/equity that becomes 1.137.
    await settled(page, "beta-relevered").toContain("1.137");

    // Drag the target capital structure: the median never moves (business risk is unchanged), only
    // what you relever it to. That separation is the point of doing it in two steps.
    await page.getByTestId("beta-target-de").fill("1.5");
    await settled(page, "beta-relevered").toContain("1.700");
    await expect(page.getByTestId("beta-median-unlevered")).toHaveText("0.800");
  });

  test("cheat sheet and the printable build sheet both render", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, `/home/technicals/${TOPIC}`);
    await page.getByTestId("cheatsheet-link").click();
    await expect(page).toHaveURL(new RegExp(`/home/technicals/${TOPIC}/cheatsheet$`));

    await expect(page.getByTestId("cheatsheet")).toBeVisible();
    await expect(page.getByTestId("cheatsheet-formulas")).toContainText("Unlevered free cash flow");
    await expect(page.getByTestId("cheatsheet-formulas")).toContainText("Terminal value — perpetuity growth");
    await expect(page.getByTestId("cheatsheet-formulas").locator(".katex").first()).toBeVisible();
    await expect(page.getByTestId("cheatsheet-canonical")).toContainText("Walk me through a DCF.");
    await expect(page.getByTestId("cheatsheet-traps")).toContainText("Discounting unlevered cash flow at the cost of equity");
    // `ft-only` material is named so it cannot ambush the student, never taught as a lesson.
    await expect(page.getByTestId("cheatsheet-you-may-hear")).toContainText("Levered DCF");

    // The chapter's takeaway artefact: a blank one-page DCF the student fills in by hand.
    await page.goto(lessonUrl(LESSONS.overview));
    await expect(page.getByTestId("template-dcf_sheet")).toBeVisible();
    await expect(page.getByTestId("template-dcf_sheet")).toContainText("Unlevered free cash flow");
  });
});
