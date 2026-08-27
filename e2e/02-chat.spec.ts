import { test, expect } from "@playwright/test";
import { resetDailyUsage, signInAs, unlockPrivateArea } from "./helpers/auth";

// Requires `npm run seed -- 00 01` (users + approved corpus chunks). CHAT_MODE=fixture and
// CHAT_DAILY_CAP=1 come from playwright.config.ts.
test.describe("Loop 02 mentor chatbot", () => {
  test("student asks → streamed bubble with ≥ 1 citation chip → thumbs-up persists → conversation continues on /home/mentor → cap → 429", async ({ page, baseURL }) => {
    await resetDailyUsage("e2e-student@astar.test");
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", "/home/mentor");
    await expect(page).toHaveURL(/\/home\/mentor$/);
    await expect(page.getByTestId("chat-panel")).toBeVisible();

    await page.getByTestId("composer-input").fill("what is enterprise value");
    await page.getByTestId("composer-send").click();

    const bubble = page.getByTestId("assistant-bubble").first();
    await expect(bubble).toBeVisible({ timeout: 45_000 });
    await expect(bubble.getByTestId("citation-chip").first()).toBeVisible({ timeout: 45_000 });
    expect(await bubble.getByTestId("citation-chip").count()).toBeGreaterThanOrEqual(1);
    // Thread history is hidden for now: the conversation stays on /home/mentor (no navigation to
    // /home/mentor/[threadId]) and the thread list column is not rendered.
    await expect(page).toHaveURL(/\/home\/mentor$/);
    await expect(page.getByTestId("thread-list")).toHaveCount(0);

    // Citation chip opens the drawer with the quoted chunk.
    await bubble.getByTestId("citation-chip").first().click();
    await expect(page.getByTestId("citation-drawer")).toBeVisible();
    await page.keyboard.press("Escape");

    // Thumbs-up persists (feedback POST succeeds and the button reflects the vote).
    const up = bubble.getByTestId("thumbs-up");
    await expect(up).toBeVisible({ timeout: 45_000 });
    const feedbackRes = page.waitForResponse((r) => r.url().includes("/api/chat/feedback") && r.request().method() === "POST");
    await up.click();
    expect((await feedbackRes).status()).toBe(200);
    await expect(up).toHaveAttribute("aria-pressed", "true");

    // The thread was persisted server-side and a follow-up appends to the same thread: the cap is
    // lifted so the second message gets a reply, and both requests carry the same threadId.
    await resetDailyUsage("e2e-student@astar.test");
    const secondReq = page.waitForRequest((r) => r.url().includes("/api/chat") && r.method() === "POST");
    await page.getByTestId("composer-input").fill("and equity value?");
    await page.getByTestId("composer-send").click();
    const body = (await secondReq).postDataJSON() as { threadId?: string };
    expect(body.threadId).toMatch(/^[0-9a-f-]{36}$/);
    await expect(page.getByTestId("assistant-bubble").nth(1)).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId("assistant-bubble").nth(1).getByTestId("citation-chip").first()).toBeVisible({ timeout: 45_000 });
    await expect(page).toHaveURL(/\/home\/mentor$/);
    await expect(page.getByTestId("user-bubble")).toHaveCount(2);

    // Cap = 1 in the e2e env → the next message is refused with 429.
    const res = await page.request.post("/api/chat", { data: { threadId: body.threadId, message: "and net debt?" } });
    expect(res.status()).toBe(429);
  });

  test("unauthenticated POST /api/chat → 401", async ({ request }) => {
    const res = await request.post("/api/chat", { data: { message: "hi" } });
    expect(res.status()).toBe(401);
  });

  test("staff sees /admin/feedback", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-mentor@astar.test", "/admin/feedback");
    await expect(page.getByTestId("feedback-heading")).toHaveText("Chat feedback");
  });
});
