import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { signInAs, unlockPrivateArea } from "./helpers/auth";

// Requires `npm run seed -- 00 … 05 && npm run content:index && npm run seed -- 07`. CHAT_MODE=fixture
// (playwright.config.ts) → the grader and report run their deterministic branches. Text mode only;
// voice is behind NEXT_PUBLIC_VOICE_MOCK (off). The pool is small (3 approved Accounting questions),
// so the drill has 3 turns and the mock 6 — the UI says so.
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

/** Fixture answers keyed by a phrase in the question; the grader is keyword coverage in fixture mode. */
const ANSWERS: [RegExp, string][] = [
  [/Depreciation increases/, "Operating profit falls by 10, tax falls by 2.5, so net income is down 7.5. Cash flow statement: add back the 10 of depreciation because it is non-cash, so cash is up 2.5. Balance sheet: PP&E down 10, cash up 2.5, assets down 7.5, retained earnings down 7.5, balances."],
  [/inventory on credit/, "No income statement impact at purchase. Inventory up is a use of cash and payables up is a source, so they cancel. Paying the supplier a month later is when cash actually leaves: payables down 20, cash down 20. Cost of goods sold is recognised at sale, not at purchase."],
  [/one financial statement/, "The cash flow statement, because cash is not an opinion. Profit can diverge from cash in both directions. The CFS reconciles net income to the change in cash so it reveals the other two."],
  [/enterprise value/i, "EV = value to all capital providers; equity value = shareholders only, share price times diluted shares. The bridge adds debt-like claims and subtracts cash. EV pairs with EBITDA."],
  [/subtract cash/, "Subtract cash because a buyer can use it against debt. Operating cash the business needs is not really excess and trapped cash may not be accessible. Deducting only excess cash raises EV."],
];
function answerFor(question: string): string {
  return ANSWERS.find(([re]) => re.test(question))?.[1] ?? "Enterprise value equals equity value plus net debt.";
}

test.describe("Loop 07 mock interviews", () => {
  test("Accounting drill: fixture answers → scores ≤ 10 within 20 s each → report with focus areas whose links work", async ({ page, baseURL }) => {
    const uid = await userId("e2e-student@astar.test");
    await admin().from("interviews").delete().eq("user_id", uid);
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", "/home/interviews");
    await expect(page.getByTestId("interviews-heading")).toHaveText("Mock interviews");
    await expect(page.getByTestId("history-empty")).toBeVisible();
    await expect(page.getByTestId("mock-pool-note")).toContainText("Only 6 approved questions");
    await page.getByTestId("start-drill-accounting").click();
    await expect(page).toHaveURL(/\/home\/interviews\/[0-9a-f-]{36}$/);
    const interviewId = page.url().match(/([0-9a-f-]{36})$/)![1];
    await expect(page.getByTestId("runner-heading")).toContainText("Drill · Accounting");

    const total = Number((await page.getByTestId("runner-progress").innerText()).match(/of (\d+)/)![1]);
    expect(total).toBeGreaterThanOrEqual(3);
    expect(total).toBeLessThanOrEqual(5);
    for (let i = 1; i <= total; i++) {
      await expect(page.getByTestId("runner-position")).toHaveText(String(i));
      await expect(page.getByTestId("runner-timer")).toContainText("s");
      const q = await page.getByTestId("runner-question").innerText();
      await page.getByTestId("runner-answer").fill(answerFor(q));
      const t0 = Date.now();
      await page.getByTestId("runner-submit").click();
      await expect(page.getByTestId("grade-reveal")).toBeVisible({ timeout: 20_000 });
      expect(Date.now() - t0).toBeLessThan(20_000);
      const score = Number(await page.getByTestId("turn-score").innerText().then((s) => s.split("/")[0]));
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(10);
      await expect(page.getByTestId("grade-feedback")).not.toBeEmpty();
      // Ask Mentor from a turn carries the question + the attempt written for it.
      await expect(page.getByTestId("grade-reveal").getByTestId("ask-mentor")).toHaveAttribute("href", /\/home\/mentor\/new\?question=[0-9a-f-]{36}&attempt=[0-9a-f-]{36}$/);
      await page.getByTestId("runner-next").click();
    }
    await expect(page).toHaveURL(new RegExp(`/home/interviews/${interviewId}/report$`), { timeout: 30_000 });
    await expect(page.getByTestId("report-heading")).toContainText("report");
    const overall = Number(await page.getByTestId("overall-score").innerText());
    expect(overall).toBeGreaterThan(0);
    expect(overall).toBeLessThanOrEqual(10);
    await expect(page.getByTestId("report-summary")).not.toBeEmpty();
    const focus = page.getByTestId("focus-area");
    const n = await focus.count();
    expect(n).toBeGreaterThanOrEqual(1);
    expect(n).toBeLessThanOrEqual(3);
    await expect(page.getByTestId("turn-item")).toHaveCount(total);

    // DB: interview completed, one attempt per turn linked by interview_id with ai_score filled.
    const { data: interview } = await admin().from("interviews").select("status, overall_score, report").eq("id", interviewId).single();
    expect(interview?.status).toBe("completed");
    expect(Number(interview?.overall_score)).toBe(overall);
    const { data: attempts } = await admin().from("attempts").select("mode, ai_score, interview_id").eq("interview_id", interviewId);
    expect(attempts).toHaveLength(total);
    expect(attempts!.every((a) => a.mode === "drill" && a.ai_score != null)).toBe(true);

    // Focus-area links resolve: lesson page and deck page.
    const lessonHref = (await page.getByTestId("focus-lesson").first().getAttribute("href"))!;
    const deckHref = (await page.getByTestId("focus-deck").first().getAttribute("href"))!;
    expect(lessonHref).toMatch(/^\/home\/technicals\/[a-z0-9-]+\/[a-z0-9-]+$/);
    expect(deckHref).toMatch(/^\/home\/flashcards\/[a-z0-9-]+$/);
    const r1 = await page.goto(lessonHref);
    expect(r1?.status()).toBe(200);
    await expect(page.getByTestId("lesson-title")).toBeVisible();
    const r2 = await page.goto(deckHref);
    expect(r2?.status()).toBe(200);
    await expect(page.getByTestId("deck-heading")).toBeVisible();

    // History shows the completed drill.
    await page.goto("/home/interviews");
    await expect(page.getByTestId("history-item").first()).toHaveAttribute("data-status", "completed");
  });

  test("full mock with a small pool → abandon → status abandoned", async ({ page, baseURL }) => {
    const uid = await userId("e2e-student@astar.test");
    await admin().from("interviews").delete().eq("user_id", uid);
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", "/home/interviews");
    await page.getByTestId("start-mock").click();
    await expect(page).toHaveURL(/\/home\/interviews\/[0-9a-f-]{36}$/);
    const interviewId = page.url().match(/([0-9a-f-]{36})$/)![1];
    await expect(page.getByTestId("runner-heading")).toHaveText("Full mock");
    await expect(page.getByTestId("runner-progress")).toContainText("of 6");
    // The runner serves question 1 with a server-side shown_at.
    const { data: turns } = await admin().from("interview_turns").select("ordinal, shown_at").eq("interview_id", interviewId).order("ordinal");
    expect(turns).toHaveLength(6);
    expect(turns![0].shown_at).not.toBeNull();
    expect(turns![1].shown_at).toBeNull();
    await page.getByTestId("abandon-interview").click();
    await expect(page).toHaveURL(/\/home\/interviews$/);
    const { data: interview } = await admin().from("interviews").select("status").eq("id", interviewId).single();
    expect(interview?.status).toBe("abandoned");
    await expect(page.getByTestId("history-item").first()).toHaveAttribute("data-status", "abandoned");
    await page.goto(`/home/interviews/${interviewId}`);
    await expect(page.getByTestId("interview-abandoned")).toBeVisible();
  });

  test("another user's interview is not visible (404 page; actions return 403 — unit-tested)", async ({ page, baseURL }) => {
    const uid = await userId("e2e-student@astar.test");
    const { data: mine } = await admin().from("interviews").select("id").eq("user_id", uid).limit(1);
    expect(mine?.length).toBeGreaterThanOrEqual(1);
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-mentor@astar.test", "/home");
    const res = await page.goto(`/home/interviews/${mine![0].id}`);
    expect(res?.status()).toBe(404);
    const res2 = await page.goto(`/home/interviews/${mine![0].id}/report`);
    expect(res2?.status()).toBe(404);
  });
});
