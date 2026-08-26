import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { resetDailyUsage, signInAs, unlockPrivateArea } from "./helpers/auth";

// Requires `npm run seed -- 00 … 05` then `npm run content:index` (content_chunks for the 2 approved
// lessons + 6 questions). CHAT_MODE=fixture and CHAT_DAILY_CAP=1 come from playwright.config.ts, so
// each test sends exactly one message and resets the student's usage first.
function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}

test.describe("Loop 06 chatbot ↔ technicals fusion", () => {
  test("Ask Mentor from a question → thread quotes it → answer has a curriculum chip → chip deep-links to the lesson anchor", async ({ page, baseURL }) => {
    await resetDailyUsage("e2e-student@astar.test");
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", "/home/practice/what-is-enterprise-value");
    await expect(page.getByTestId("question-text")).toContainText("enterprise value");
    await page.getByTestId("reveal-answer").click();
    const ask = page.getByTestId("question-grade").getByTestId("ask-mentor").first();
    await expect(ask).toHaveAttribute("href", /\/home\/mentor\/new\?question=[0-9a-f-]{36}$/);
    await ask.click();

    // The landing page auto-sends the opening message and navigates to the new thread.
    await expect(page).toHaveURL(/\/home\/mentor\/[0-9a-f-]{36}$/, { timeout: 45_000 });
    await expect(page.getByTestId("user-bubble").first()).toContainText("What is enterprise value");
    await expect(page.getByTestId("thread-context")).toContainText("What is enterprise value");
    const bubble = page.getByTestId("assistant-bubble").first();
    await expect(bubble.getByTestId("citation-chip").first()).toBeVisible({ timeout: 45_000 });
    const lessonChip = bubble.locator('[data-testid="citation-chip"][data-kind="lesson"]').first();
    await expect(lessonChip).toBeVisible();
    const href = (await lessonChip.getAttribute("data-href"))!;
    expect(href).toMatch(/^\/home\/technicals\/[a-z0-9-]+\/[a-z0-9-]+#block-\d+$/);

    // Persisted: reload keeps the chip + context; the stored thread carries the question context.
    await page.reload();
    await expect(page.getByTestId("thread-context")).toBeVisible();
    const threadId = page.url().match(/\/home\/mentor\/([0-9a-f-]{36})$/)![1];
    const { data: thread } = await admin().from("chat_threads").select("context").eq("id", threadId).single();
    expect(thread?.context).toMatchObject({ question_id: expect.stringMatching(/^[0-9a-f-]{36}$/) });
    const { data: msgs } = await admin().from("chat_messages").select("role, content").eq("thread_id", threadId).eq("role", "assistant");
    const citations = (msgs?.[0]?.content as { citations: { kind: string; href?: string }[]; rung: string }).citations;
    expect(citations.some((c) => c.kind === "lesson" && c.href === href)).toBe(true);

    // Chip → lesson page scrolled to the cited block, which is highlighted and carries its own Ask Mentor link.
    await page.locator('[data-testid="citation-chip"][data-kind="lesson"]').first().click();
    await expect(page).toHaveURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    const anchor = href.split("#")[1];
    const block = page.locator(`#${anchor}`);
    await expect(block).toBeVisible();
    await expect(block.getByTestId("ask-mentor")).toHaveAttribute("href", new RegExp(`/home/mentor/new\\?lesson=[0-9a-f-]{36}&block=${anchor.replace("block-", "")}$`));
    expect(await block.evaluate((el) => { const r = el.getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0; })).toBe(true);
  });

  test("Ask Mentor from a lesson block → context chip links back to the anchor; flashcards show the button when flipped", async ({ page, baseURL }) => {
    await resetDailyUsage("e2e-student@astar.test");
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", "/home/technicals/eqv-ev/ev-bridge-basics");
    const trap = page.locator('[data-testid="block-trap"]').locator("xpath=ancestor::div[@data-block-index]");
    const idx = await trap.getAttribute("data-block-index");
    await trap.getByTestId("ask-mentor").click();
    await expect(page).toHaveURL(/\/home\/mentor\/[0-9a-f-]{36}$/, { timeout: 45_000 });
    await expect(page.getByTestId("user-bubble").first()).toContainText("The trap");
    await expect(page.getByTestId("thread-context")).toHaveAttribute("href", new RegExp(`/home/technicals/eqv-ev/ev-bridge-basics#block-${idx}$`));
    await expect(page.getByTestId("assistant-bubble").first().getByTestId("citation-chip").first()).toBeVisible({ timeout: 45_000 });

    await page.goto("/home/flashcards/eqv-ev");
    await expect(page.getByTestId("ask-mentor")).toHaveCount(0);
    await page.getByTestId("flip").click();
    await expect(page.getByTestId("ask-mentor")).toHaveAttribute("href", /\/home\/mentor\/new\?question=[0-9a-f-]{36}$/);
  });

  test("/home/mentor/new refuses unknown or draft items (404) and bad input", async ({ page, baseURL }) => {
    const db = admin();
    const { data: topic } = await db.from("topics").select("id").eq("slug", "eqv-ev").single();
    const body = { model_answer_md: "PLACEHOLDER — synthetic draft for e2e zebrafish.", key_points: ["a", "b", "c"], follow_ups: [{ question: "q1", answer_md: "a1" }, { question: "q2", answer_md: "a2" }], weak_answer_note: "n", numbers: null };
    const { data: draft } = await db.from("questions").upsert({ slug: "e2e-draft-question", topic_id: topic!.id, kind: "concept", difficulty: 2, question: "E2E draft question about zebrafish valuation?", body, status: "draft", source_topic: "e2e", generated_by: "e2e" }, { onConflict: "slug" }).select("id").single();
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", "/home/mentor");
    expect((await page.goto(`/home/mentor/new?question=${draft!.id}`))?.status()).toBe(404);
    expect((await page.goto("/home/mentor/new?question=00000000-0000-4000-8000-000000000000"))?.status()).toBe(404);
    expect((await page.goto("/home/mentor/new"))?.status()).toBe(404);
    // Draft items never become chunks either.
    const { count } = await db.from("content_chunks").select("id", { count: "exact", head: true }).eq("question_id", draft!.id);
    expect(count).toBe(0);
    // A draft reference in the API body is ignored rather than leaking the draft.
    const res = await page.request.post("/api/chat", { data: { message: "hi", context: { question_id: "not-a-uuid" } } });
    expect(res.status()).toBe(400);
  });
});
