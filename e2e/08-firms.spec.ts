import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { signInAs, unlockPrivateArea } from "./helpers/auth";

// Requires the full seed chain (README: `seed -- 00 … 05 && content:index && seed -- 07 && seed -- 08`).
// Everything Loop 08 seeds is `generated` (student-invisible) except the synthetic sample digest, so
// the setup approves ONE firm + its questions with the admin client and puts it back afterwards —
// the linked Supabase project is the only environment, and the merge policy keeps firm rows unverified.
const FIRM = "goldman-sachs";
const QUESTION = "E2E: what did you make of the last set of results a bank in our peer group reported?";

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

let firmId = "";
let approvedQuestions = 0;
let hirevueQuestions = 0;

test.describe("Loop 08 firm bank + Pulse", () => {
  test.beforeAll(async () => {
    const db = admin();
    const { data: firm, error } = await db.from("firms").select("id").eq("slug", FIRM).single();
    if (error) throw new Error(`${FIRM} missing — run \`npm run seed -- 08\` (${error.message})`);
    firmId = firm.id as string;
    // Clean previous runs: the student's reports and the question a previous run promoted.
    const uid = await userId("e2e-student@astar.test");
    await db.from("firm_question_reports").delete().eq("user_id", uid);
    await db.from("firm_questions").delete().eq("firm_id", firmId).eq("question", QUESTION);
    await db.from("firms").update({ status: "approved" }).eq("id", firmId);
    const { data: qs } = await db.from("firm_questions").update({ status: "approved" }).eq("firm_id", firmId).select("id, stage");
    approvedQuestions = qs?.length ?? 0;
    hirevueQuestions = qs?.filter((q) => q.stage === "hirevue").length ?? 0;
    expect(approvedQuestions).toBeGreaterThanOrEqual(10);
  });

  test.afterAll(async () => {
    const db = admin();
    await db.from("firm_questions").delete().eq("firm_id", firmId).eq("question", QUESTION);
    await db.from("firm_questions").update({ status: "generated" }).eq("firm_id", firmId);
    await db.from("firms").update({ status: "generated" }).eq("id", firmId);
  });

  test("GET /api/cron/pulse without the secret → 401", async ({ request }) => {
    const res = await request.get("/api/cron/pulse");
    expect(res.status()).toBe(401);
    const bad = await request.get("/api/cron/pulse", { headers: { Authorization: "Bearer not-the-secret" } });
    expect(bad.status()).toBe(401);
  });

  test("grid → firm page → HireVue filter → report → admin approves → question visible", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", "/home/interviews/firms");
    await expect(page.getByTestId("firms-heading")).toHaveText("Firm question banks");
    const cards = page.getByTestId("firm-card");
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
    await page.locator(`[data-testid="firm-card"][data-slug="${FIRM}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/home/interviews/firms/${FIRM}$`));
    await expect(page.getByTestId("firm-heading")).toHaveText("Goldman Sachs");
    await expect(page.getByTestId("firm-dossier")).toBeVisible();
    expect(await page.getByTestId("process-stage").count()).toBeGreaterThanOrEqual(3);
    await expect(page.getByTestId("firm-question")).toHaveCount(approvedQuestions);
    await expect(page.getByTestId("practise-this").first()).toBeVisible();

    await page.getByTestId("filter-stage-hirevue").click();
    await expect(page.getByTestId("firm-question")).toHaveCount(hirevueQuestions);
    for (const stage of await page.getByTestId("firm-question").evaluateAll((els) => els.map((e) => e.getAttribute("data-stage")))) expect(stage).toBe("hirevue");
    await expect(page.getByTestId("firm-question-count")).toContainText(`${hirevueQuestions} of ${approvedQuestions}`);

    // Report a question.
    await page.goto("/home/interviews/report");
    await expect(page.getByTestId("report-heading")).toHaveText("Report a question");
    await page.getByTestId("report-firm").selectOption(firmId);
    await page.getByTestId("report-programme").selectOption("summer");
    await page.getByTestId("report-stage").selectOption("interview");
    await page.getByTestId("report-question").fill(QUESTION);
    await page.getByTestId("report-submit").click();
    await expect(page.getByTestId("report-success")).toContainText("mentor will review");
    const { data: pending } = await admin().from("firm_question_reports").select("id, status").eq("firm_id", firmId).eq("question", QUESTION);
    expect(pending).toHaveLength(1);
    expect(pending![0].status).toBe("pending");

    // Admin approves → promoted to firm_questions as approved.
    await page.context().clearCookies();
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-admin@astar.test", "/admin/reports");
    await expect(page.getByTestId("reports-heading")).toHaveText("Reported questions");
    const row = page.getByTestId("report-row").filter({ hasText: QUESTION });
    await expect(row).toHaveCount(1);
    await row.getByTestId("review-category").selectOption("commercial");
    await row.getByTestId("report-approve").click();
    // decideReport revalidates /admin/reports, so the approved row leaves the pending list.
    await expect(row).toHaveCount(0);
    await page.goto("/admin/reports?status=approved");
    await expect(page.getByTestId("report-row").filter({ hasText: QUESTION })).toHaveCount(1);
    const { data: promoted } = await admin().from("firm_questions").select("status, category, reported_by").eq("firm_id", firmId).eq("question", QUESTION).single();
    expect(promoted?.status).toBe("approved");
    expect(promoted?.category).toBe("commercial");
    expect(promoted?.reported_by).not.toBeNull();

    // Admin firm editor shows the row; another (generated) firm carries the unverified badge.
    await page.goto(`/admin/firms/${FIRM}`);
    await expect(page.getByTestId("admin-firm-heading")).toContainText("Goldman Sachs");
    await expect(page.getByTestId("firm-editor")).toBeVisible();
    await expect(page.getByTestId("firm-valid")).toContainText("Valid");
    await expect(page.getByTestId("admin-firm-question").filter({ hasText: QUESTION })).toHaveCount(1);
    await page.goto("/admin/firms/barclays");
    await expect(page.getByTestId("admin-firm-unverified")).toHaveText("unverified");
    await expect(page.getByTestId("firm-unverified")).toBeVisible();

    // Student sees the promoted question in the bank.
    await page.context().clearCookies();
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", `/home/interviews/firms/${FIRM}`);
    await expect(page.getByTestId("firm-question")).toHaveCount(approvedQuestions + 1);
    await expect(page.getByTestId("firm-question-text").filter({ hasText: QUESTION })).toHaveCount(1);
  });

  test("/home/pulse renders the approved sample digest; unapproved / non-Monday weeks 404", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", "/home/pulse");
    await expect(page.getByTestId("pulse-heading")).toHaveText("Pulse");
    await expect(page.getByTestId("pulse-week")).toContainText("Week of 24 August 2026");
    await expect(page.getByTestId("digest-synthetic")).toBeVisible();
    await expect(page.getByTestId("pulse-story")).toHaveCount(3);
    await expect(page.getByTestId("story-talking-points").first().locator("li")).toHaveCount(3);
    const r1 = await page.goto("/home/pulse/2026-08-24");
    expect(r1?.status()).toBe(200);
    await expect(page.getByTestId("pulse-story")).toHaveCount(3);
    const r2 = await page.goto("/home/pulse/2026-08-25");
    expect(r2?.status()).toBe(404);
    const r3 = await page.goto("/home/pulse/2026-08-17");
    expect(r3?.status()).toBe(404);
  });
});
