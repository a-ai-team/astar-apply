import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { signInAs, unlockPrivateArea } from "./helpers/auth";

// Loop 18 — LBO + the programme close. Requires the seed chain + `npm run seed -- 03`.
// LBO is a PAID topic: everything loads `generated` and is invisible to a student under RLS. The
// setup approves the four lessons — and the three questions the lens-drill scenario needs — with
// the admin client, then restores every original status afterwards (the linked project is the only
// environment, so nothing may be left approved).
const TOPIC = "lbo";

const LESSONS = {
  overview: "lbo-overview",
  sources: "sources-and-uses",
  returns: "returns-irr-mom",
  paper: "paper-lbo-walkthrough",
} as const;

const LESSON_SLUGS = Object.values(LESSONS);

// The TMT-lens drill needs a pool: one generalist LBO question plus the two `lens:tmt` ones. With
// exactly these three approved, a TMT drill must draw both lens questions; a generalist drill
// would exclude them (the Loop 18 contract fix).
const QUESTION_SLUGS = ["what-is-an-lbo", "tmt-leverage-capacity", "tmt-rate-sensitivity"];
const TMT_QUESTION_SLUGS = ["tmt-leverage-capacity", "tmt-rate-sensitivity"];

// `debt-tranches` and `lbo-mental-maths` fold into lessons 2 and 3, so the subtopics stay in the
// taxonomy and render no row until they have a lesson.
const DEFERRED = ["Debt tranches and covenants", "LBO mental maths"];

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

const previousLessonStatuses = new Map<string, string>();
const previousQuestionStatuses = new Map<string, string>();

test.describe("Loop 18 LBO", () => {
  test.beforeAll(async () => {
    const db = admin();
    const { data: lessons, error } = await db.from("lessons").select("slug, status").in("slug", LESSON_SLUGS);
    if (error) throw error;
    if ((lessons?.length ?? 0) !== LESSON_SLUGS.length) {
      throw new Error(`expected ${LESSON_SLUGS.length} LBO lessons — run \`npm run seed -- 03\``);
    }
    for (const l of lessons!) previousLessonStatuses.set(l.slug as string, l.status as string);
    await db.from("lessons").update({ status: "approved" }).in("slug", LESSON_SLUGS);

    const { data: questions, error: qErr } = await db.from("questions").select("slug, status").in("slug", QUESTION_SLUGS);
    if (qErr) throw qErr;
    if ((questions?.length ?? 0) !== QUESTION_SLUGS.length) {
      throw new Error(`expected ${QUESTION_SLUGS.length} LBO questions — run \`npm run seed -- 03\``);
    }
    for (const q of questions!) previousQuestionStatuses.set(q.slug as string, q.status as string);
    await db.from("questions").update({ status: "approved" }).in("slug", QUESTION_SLUGS);
  });

  test.afterAll(async () => {
    const db = admin();
    for (const [slug, status] of previousLessonStatuses) await db.from("lessons").update({ status }).eq("slug", slug);
    for (const [slug, status] of previousQuestionStatuses) await db.from("questions").update({ status }).eq("slug", slug);
  });

  test("topic page hides the two deferred subtopics; cheat sheet and printable paper-LBO sheet render", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, `/home/technicals/${TOPIC}`);
    await expect(page.getByTestId("topic-heading")).toHaveText("LBO");

    // Six subtopics in the taxonomy, two deferred with no lesson — so four rows.
    await expect(page.getByTestId("subtopic-row")).toHaveCount(4);
    await expect(page.getByTestId("lesson-link")).toHaveCount(4);
    for (const title of DEFERRED) await expect(page.getByText(title, { exact: true })).toHaveCount(0);

    await page.getByTestId("cheatsheet-link").click();
    await expect(page).toHaveURL(new RegExp(`/home/technicals/${TOPIC}/cheatsheet$`));
    await expect(page.getByTestId("cheatsheet")).toBeVisible();
    await expect(page.getByTestId("cheatsheet-formulas")).toContainText("Money multiple and IRR");
    await expect(page.getByTestId("cheatsheet-formulas")).toContainText("Sponsor equity (the plug)");
    await expect(page.getByTestId("cheatsheet-formulas").locator(".katex").first()).toBeVisible();
    await expect(page.getByTestId("cheatsheet-traps")).toContainText("Building a full debt schedule");
    // `ft-only` material is named so it cannot ambush the student, never taught as a lesson.
    await expect(page.getByTestId("cheatsheet-you-may-hear")).toContainText("Unitranche");

    // The chapter's takeaway artefact: the one-page paper LBO, and it survives print styling.
    await page.goto(lessonUrl(LESSONS.paper));
    await expect(page.getByTestId("template-paper_lbo")).toBeVisible();
    await expect(page.getByTestId("template-paper_lbo")).toContainText("Sources");
    await page.emulateMedia({ media: "print" });
    await expect(page.getByTestId("template-paper_lbo")).toBeVisible();
    await page.emulateMedia({ media: "screen" });
  });

  test("lbo_returns: Pennard lands at 2.47× / 19.8 %, equity is the £160m plug, exit at 7× is 2.07×", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, lessonUrl(LESSONS.returns));
    await expect(page.getByTestId("predict-options")).toBeVisible();

    const widget = page.getByTestId("widget-lbo_returns").first();
    await expect(widget).toBeVisible();

    // The deal as underwritten: £160m in, ≈ £395m out.
    await settled(page, "lr-mom").toContain("2.47×");
    await settled(page, "lr-irr").toContain("19.8%");

    // Sources & uses tab: the sponsor's cheque is the plug that balances £410m of uses.
    await widget.getByTestId("lr-tab-sources").click();
    await expect(widget.getByTestId("lr-total-uses")).toContainText("410");
    await expect(widget.getByTestId("lr-equity")).toContainText("160");
    await expect(widget.getByTestId("lr-leverage")).toContainText("5.0×");

    // Exit at 7× instead of 8×: the third lever goes negative and the multiple drops to ~2.07×.
    await widget.getByTestId("lr-tab-returns").click();
    await page.getByTestId("lr-exit-multiple").fill("7");
    await settled(page, "lr-mom").toContain("2.07×");
    await expect(widget.getByTestId("lr-verdict")).toContainText("compression");

    // And with no leverage the same deal is barely 1.25× — leverage concentrates, it doesn't create.
    await page.getByTestId("lr-exit-multiple").fill("8");
    await page.getByTestId("lr-leverage-slider").fill("0");
    await settled(page, "lr-mom").toContain("1.25×");
  });

  test("paper_lbo stepper: step 1 unlocks only when sources and uses balance", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, lessonUrl(LESSONS.paper));
    const widget = page.getByTestId("widget-paper_lbo");
    await expect(widget).toBeVisible();
    await expect(widget.getByTestId("pl-step")).toHaveText("Step 1 of 7");

    // Right EV, uses and debt but a plug that doesn't balance: the step refuses to advance.
    await widget.getByTestId("pl-input-ev").fill("400");
    await widget.getByTestId("pl-input-uses").fill("410");
    await widget.getByTestId("pl-input-debt").fill("250");
    await widget.getByTestId("pl-input-equity").fill("150");
    await widget.getByTestId("pl-check-1").click();
    await expect(widget.getByTestId("pl-feedback-1")).toContainText("Not balancing");
    await expect(widget.getByTestId("pl-step")).toHaveText("Step 1 of 7");

    // £160m — uses minus debt — and the narration moves on to the assumptions.
    await widget.getByTestId("pl-input-equity").fill("160");
    await widget.getByTestId("pl-check-1").click();
    await expect(widget.getByTestId("pl-step")).toHaveText("Step 2 of 7");
    await expect(widget).toContainText("capex equals D&A");

    // The order_steps block also lives in this lesson — the narration as a sortable list.
    await expect(page.getByTestId("order-steps-list")).toBeVisible();
  });

  test("the TMT lens swaps the lesson's industry section in", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, `${lessonUrl(LESSONS.overview)}?lens=tmt`);
    await expect(page.getByTestId("lesson-title")).toBeVisible();
    await expect(page.getByTestId("lens-badge").first()).toBeVisible();
    await expect(page.getByText("Why software is the sponsor's favourite")).toBeVisible();

    // The generalist page instead offers the hint that lenses exist.
    await page.goto(lessonUrl(LESSONS.overview));
    await expect(page.getByText("Why software is the sponsor's favourite")).toHaveCount(0);
  });

  test("week 9 of the path is the LBO chapter, closed by its cheat sheet", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, "/home/path/9");
    await expect(page.getByTestId("week-heading")).toHaveText("Week 9: LBO");
    // Four lesson days (approved in setup, so they resolve and link) + the day-5 sheet.
    await expect(page.getByTestId("day-lesson-link")).toHaveCount(4);
    const sheet = page.getByTestId("path-cheatsheet-link");
    await expect(sheet).toHaveCount(1);
    await expect(sheet).toHaveAttribute("href", `/home/technicals/${TOPIC}/cheatsheet`);
  });

  test("an LBO drill with the TMT lens draws the lens questions and labels the run", async ({ page, baseURL }) => {
    const db = admin();
    const { data: users, error } = await db.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw error;
    const uid = users.users.find((u) => u.email === "e2e-student@astar.test")!.id;
    await db.from("interviews").delete().eq("user_id", uid);

    await signIn(page, baseURL!, "/home/interviews");
    const drillCard = page.getByTestId("drill-card");
    await drillCard.getByTestId("interview-lens-select").selectOption("tmt");
    await drillCard.getByTestId(`start-drill-${TOPIC}`).click();
    await expect(page).toHaveURL(/\/home\/interviews\/[0-9a-f-]{36}$/);
    const interviewId = page.url().match(/([0-9a-f-]{36})$/)![1];
    await expect(page.getByTestId("runner-heading")).toContainText("Drill · LBO");

    // With one generalist and two `lens:tmt` questions approved, a TMT drill's pool is all three —
    // so the turns must include the lens material a generalist run is required to exclude.
    const { data: turns } = await db.from("interview_turns").select("question_id").eq("interview_id", interviewId);
    expect(turns!.length).toBeGreaterThanOrEqual(2);
    const { data: drawn } = await db.from("questions").select("slug").in("id", turns!.map((t) => t.question_id));
    const slugs = drawn!.map((q) => q.slug as string);
    expect(slugs.some((s) => TMT_QUESTION_SLUGS.includes(s))).toBe(true);

    // The lens is stored on the interview itself, inside the existing report jsonb.
    const { data: interview } = await db.from("interviews").select("report").eq("id", interviewId).single();
    expect((interview?.report as { params?: { lens?: string } })?.params?.lens).toBe("tmt");

    // Abandon and the history row still says which lens the run used.
    await page.getByTestId("abandon-interview").click();
    await expect(page).toHaveURL(/\/home\/interviews$/);
    await expect(page.getByTestId("history-item").first().getByTestId("interview-lens-label")).toContainText("TMT lens");
  });
});
