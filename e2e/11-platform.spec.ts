import { test, expect, type Page } from "@playwright/test";
import { signInAs, unlockPrivateArea } from "./helpers/auth";

// Loop 11 — Technicals v2 platform. Requires `npm run seed -- 00 && npm run seed -- 03`
// (the retrofitted `three-statement-links` and `ev-bridge-basics` carry the v2 blocks).
const ACCOUNTING_LESSON = "/home/technicals/accounting/three-statement-links";
const EQV_LESSON = "/home/technicals/eqv-ev/ev-bridge-basics";

const TMT_HEADING = "Software: the cash arrives before the revenue";
const HEALTHCARE_HEADING = "Biotech: the spending is expensed, the value is not on the balance sheet";

async function signIn(page: Page, baseURL: string, next: string) {
  await unlockPrivateArea(page, baseURL);
  await signInAs(page, "e2e-student@astar.test", next);
}

test.describe("Loop 11 platform", () => {
  test("predict gate: the explanation is withheld until the student commits", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, ACCOUNTING_LESSON);
    await expect(page.getByTestId("block-predict")).toBeVisible();
    await expect(page.getByTestId("predict-option")).toHaveCount(4);
    // The punchline is gated — this is the whole point of the block.
    await expect(page.getByTestId("predict-explain")).toHaveCount(0);

    await page.getByTestId("predict-option").filter({ hasText: "Cash rises by £2.5m" }).click();
    await expect(page.getByTestId("predict-explain")).toBeVisible();
    await expect(page.getByTestId("predict-explain")).toContainText("tax shield");
    // Once answered the options lock, so a second guess cannot rewrite history.
    await expect(page.getByTestId("predict-option").first()).toBeDisabled();
  });

  test("statement ripple: changing the input changes the rendered deltas", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, ACCOUNTING_LESSON);
    const widget = page.getByTestId("widget-three_statement");
    await expect(widget).toBeVisible();

    const cells = page.getByTestId("ripple-cell");
    await expect(cells.first()).toBeVisible();
    const before = await cells.allInnerTexts();
    const balanceBefore = await page.getByTestId("ripple-balance").innerText();

    // Double the depreciation: every delta should double with it.
    await page.getByTestId("ripple-amount").fill("20");
    await expect.poll(async () => (await cells.allInnerTexts()).join("|")).not.toBe(before.join("|"));
    await expect(page.getByTestId("ripple-balance")).toContainText("Balances");

    // A different transaction produces a different set of lines entirely.
    await page.getByTestId("ripple-kind").selectOption("raise_debt");
    await expect.poll(async () => (await cells.allInnerTexts()).join("|")).not.toBe(before.join("|"));
    await expect(page.getByTestId("ripple-balance")).not.toHaveText(balanceBefore);
  });

  test("industry lens: switch, share via URL, remember across lessons, and clear", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, ACCOUNTING_LESSON);
    // No lens chosen: the hint stands in for the section, and no variant renders.
    await expect(page.getByTestId("lens-hint")).toBeVisible();
    await expect(page.getByTestId("lens-badge")).toHaveCount(0);

    await page.getByTestId("lens-picker").selectOption("tmt");
    await expect(page).toHaveURL(/\?lens=tmt$/);
    await expect(page.getByTestId("lens-badge")).toHaveText(/TMT/i);
    await expect(page.getByText(TMT_HEADING)).toBeVisible();
    await expect(page.getByText(HEALTHCARE_HEADING)).toHaveCount(0);
    await expect(page.getByTestId("lens-hint")).toHaveCount(0);

    // The choice is remembered on the next lesson, which is opened with no query param.
    await page.goto(EQV_LESSON);
    await expect(page).toHaveURL(/\?lens=tmt$/);
    await expect(page.getByTestId("lens-badge")).toHaveText(/TMT/i);
    await expect(page.getByText("Tech: net cash, and an enterprise value below the market cap")).toBeVisible();

    // Back to generalist: the badge goes, the hint returns, the URL is clean.
    await page.getByTestId("lens-picker").selectOption("");
    await expect(page).not.toHaveURL(/lens=/);
    await expect(page.getByTestId("lens-badge")).toHaveCount(0);
    await expect(page.getByTestId("lens-hint")).toBeVisible();
  });

  test("fill the numbers: per-cell feedback, wrong then right", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, ACCOUNTING_LESSON);
    await expect(page.getByTestId("block-fill_numbers")).toBeVisible();
    const first = page.getByTestId("fill-numbers-input").first(); // "Tax saved" = 20 × 30% = 6
    await expect(first).toHaveAttribute("data-state", "empty");

    await first.fill("2.5"); // the £10m answer, not this one
    await expect(first).toHaveAttribute("data-state", "wrong");
    await expect(page.getByTestId("fill-numbers-score")).toContainText("0 of 3");
    // A wrong answer offers the value rather than just marking it wrong.
    await expect(page.getByTestId("fill-numbers-show").first()).toBeVisible();

    await first.fill("6");
    await expect(first).toHaveAttribute("data-state", "correct");
    await expect(page.getByTestId("fill-numbers-score")).toContainText("1 of 3");
  });

  test("cheat sheet: reachable from the topic page and renders every section", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, "/home/technicals/accounting");
    await page.getByTestId("cheatsheet-link").click();
    await expect(page).toHaveURL(/\/home\/technicals\/accounting\/cheatsheet$/);

    await expect(page.getByTestId("cheatsheet")).toBeVisible();
    await expect(page.getByTestId("cheatsheet-formulas")).toContainText("balance-sheet identity");
    await expect(page.getByTestId("cheatsheet-canonical")).toContainText("Walk me through the three statements");
    await expect(page.getByTestId("cheatsheet-traps").locator("li").first()).toBeVisible();
    // `ft-only` material is named, never taught.
    await expect(page.getByTestId("cheatsheet-you-may-hear")).toContainText("Deferred tax");
    // The formulas render as KaTeX, not raw LaTeX.
    await expect(page.getByTestId("cheatsheet-formulas").locator(".katex").first()).toBeVisible();
  });

  test("reduced motion: the ripple offers a step-through and a textual diff instead of animating", async ({ page, baseURL }) => {
    // Emulated before the first navigation so the widget's initial render already sees it.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await signIn(page, baseURL!, ACCOUNTING_LESSON);
    const step = page.getByTestId("ripple-step");
    await expect(step).toBeVisible();
    await expect(page.getByTestId("ripple-diff")).toBeVisible();
    // The button advances through the three statements rather than playing them.
    const label = await step.innerText();
    await step.click();
    await expect(step).not.toHaveText(label);
  });

  test("practice bank: depth and lens chips filter, and lens questions are hidden by default", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, "/home/practice");
    await expect(page.getByTestId("filter-depth-sa-core")).toBeVisible();
    await expect(page.getByTestId("filter-depth-sa-stretch")).toBeVisible();
    await expect(page.getByTestId("filter-lens-tmt")).toBeVisible();
    await expect(page.getByTestId("filter-lens-none")).toBeVisible();

    const total = await page.getByTestId("bank-count").innerText();

    // The TMT filter shows only `lens:tmt` questions. Chapters seed these, so the bank may be
    // empty or populated — either way the page renders and the count differs from the generalist one.
    await page.getByTestId("filter-lens-tmt").click();
    await expect(page).toHaveURL(/lens=tmt/);
    await expect(page.getByTestId("practice-heading")).toBeVisible();
    const lensBank = page.getByTestId("bank-count");
    if (await lensBank.isVisible()) await expect(lensBank).not.toHaveText(total);
    else await expect(page.getByTestId("bank-empty")).toBeVisible();

    // Clearing the lens restores the generalist bank.
    await page.getByTestId("filter-lens-none").click();
    await expect(page.getByTestId("bank-count")).toHaveText(total);
  });
});
