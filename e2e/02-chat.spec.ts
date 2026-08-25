import { test, expect } from "@playwright/test";
import { resetDailyUsage, signInAs, unlockPrivateArea } from "./helpers/auth";

// Requires `npm run seed -- 00 01` (users + approved corpus chunks). CHAT_MODE=fixture and
// CHAT_DAILY_CAP=1 come from playwright.config.ts.
test.describe("Loop 02 mentor chatbot", () => {
  test("student asks → streamed bubble with ≥ 1 citation chip → thumbs-up persists → thread in sidebar → cap → 429", async ({ page, baseURL }) => {
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
    await expect(page).toHaveURL(/\/home\/mentor\/[0-9a-f-]{36}$/, { timeout: 45_000 });
    const threadUrl = page.url();

    // Citation chip opens the drawer with the quoted chunk.
    await bubble.getByTestId("citation-chip").first().click();
    await expect(page.getByTestId("citation-drawer")).toBeVisible();
    await page.keyboard.press("Escape");

    // Thumbs-up persists across reload.
    const up = bubble.getByTestId("thumbs-up");
    await expect(up).toBeVisible({ timeout: 45_000 });
    const feedbackRes = page.waitForResponse((r) => r.url().includes("/api/chat/feedback") && r.request().method() === "POST");
    await up.click();
    expect((await feedbackRes).status()).toBe(200);
    await page.reload();
    await expect(page.getByTestId("assistant-bubble").first().getByTestId("thumbs-up")).toHaveAttribute("aria-pressed", "true");

    // Thread appears in the sidebar with the question as its title.
    const link = page.getByTestId("thread-link").first();
    await expect(link).toContainText("what is enterprise value");
    expect(threadUrl).toContain(await link.getAttribute("href"));

    // Cap = 1 in the e2e env → the next message is refused with 429.
    const res = await page.request.post("/api/chat", { data: { message: "and equity value?" } });
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
