import { test, expect, type Page } from "@playwright/test";
import { signInAs, unlockPrivateArea } from "./helpers/auth";

// Loop 14 — Equity value vs enterprise value. Requires the seed chain + `npm run seed -- 03`.
// Unlike Loops 12–13 there is no approve/restore setup: EqV/EV is a free topic that auto-approves
// once its evals pass (`npm run content:approve -- --topic eqv-ev`), so all four lessons are
// already `approved` in the linked project. The spec asserts that rather than assuming it, so a
// missing approval fails loudly instead of showing up as a confusing 404.
const TOPIC = "eqv-ev";

const LESSONS = {
  concepts: "equity-and-enterprise-value",
  bridge: "ev-bridge-basics",
  diluted: "diluted-shares",
  pairing: "pairing-metrics-with-values",
} as const;

// Folded into the bridge lesson by the Loop 14 plan: kept in the taxonomy, hidden until it has a
// lesson of its own. (`ev-bridge-calculations` also holds an `e2e-draft-lesson` from the Loop 03
// draft-isolation test; RLS hides it from students, so it never adds a link here.)
const DEFERRED = "Edge cases: leases, NCI, preferred, pensions";

const lessonUrl = (slug: string) => `/home/technicals/${TOPIC}/${slug}`;

async function signIn(page: Page, baseURL: string, next: string) {
  await unlockPrivateArea(page, baseURL);
  await signInAs(page, "e2e-student@astar.test", next);
}

test.describe("Loop 14 equity value vs enterprise value", () => {
  test("topic page lists the four lessons and hides the deferred subtopic", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, `/home/technicals/${TOPIC}`);
    await expect(page.getByTestId("topic-heading")).toHaveText("Equity value vs enterprise value");

    // Five subtopics in the taxonomy; `ev-edge-cases` has no lesson, so it never renders a row.
    await expect(page.getByTestId("subtopic-row")).toHaveCount(4);
    await expect(page.getByTestId("lesson-link")).toHaveCount(4);
    await expect(page.getByText(DEFERRED, { exact: true })).toHaveCount(0);
  });

  test("treasury-stock method: dilution appears above the strike and vanishes below it", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, lessonUrl(LESSONS.diluted));
    await expect(page.getByTestId("lesson-title")).toHaveText("Diluted shares and the treasury-stock method");

    const widget = page.getByTestId("widget-tsm_dilution");
    await expect(widget).toBeVisible();
    const diluted = page.getByTestId("tsm-diluted");
    const netNew = page.getByTestId("tsm-net-new");
    const moneyness = page.getByTestId("tsm-in-the-money");

    // Harbourline at £4.20: 20m options struck at £2.10 bring in £42m, which buys back 10m shares,
    // so the net new count is 10m and the diluted count 250m. `AnimatedNumber` eases, so poll.
    await expect.poll(async () => diluted.innerText()).toContain("250.0m");
    await expect.poll(async () => netNew.innerText()).toContain("10.0m");
    await expect(moneyness).toContainText("in the money");

    // Below the £2.10 strike nobody exercises: the options are worthless and add nothing at all.
    await page.getByTestId("tsm-price").fill("1.5");
    await expect(moneyness).toContainText("out of the money");
    await expect.poll(async () => netNew.innerText()).toContain("0.0m");
    await expect.poll(async () => diluted.innerText()).toContain("240.0m");
    await expect(widget).toContainText("the diluted count is just the basic count");

    // Well above it the proceeds are fixed but buy back fewer shares, so dilution *grows*:
    // £42m at £8.40 repurchases only 5m, leaving 15m net new and a 255m diluted count.
    await page.getByTestId("tsm-price").fill("8.4");
    await expect(moneyness).toContainText("in the money");
    await expect.poll(async () => netNew.innerText()).toContain("15.0m");
    await expect.poll(async () => diluted.innerText()).toContain("255.0m");
  });

  test("lease toggle: EBITDA and enterprise value move together, so the multiple barely shifts", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, lessonUrl(LESSONS.bridge));
    const widget = page.getByTestId("widget-lease_toggle");
    await expect(widget).toBeVisible();

    const ebitda = page.getByTestId("lease-ebitda");
    const ev = page.getByTestId("lease-ev");
    const multiple = page.getByTestId("lease-multiple");
    const toggle = page.getByTestId("lease-capitalise");

    // The widget opens capitalised (IFRS 16), which is the reported basis: EBITDA £170m, the £45m
    // lease liability in the bridge, EV £1,530m → 9.0×.
    await expect(toggle).toBeChecked();
    await expect.poll(async () => ebitda.innerText()).toContain("£170m");
    await expect.poll(async () => ev.innerText()).toContain("£1,530m");
    await expect.poll(async () => multiple.innerText()).toContain("9.0×");

    // Un-capitalise and *both* sides fall: the £12m rent goes back into operating costs and the
    // £45m liability leaves the bridge. A £45m swing in EV moves the multiple by four-tenths.
    await toggle.uncheck();
    await expect.poll(async () => ebitda.innerText()).toContain("£158m");
    await expect.poll(async () => ev.innerText()).toContain("£1,485m");
    await expect.poll(async () => multiple.innerText()).toContain("9.4×");

    // Re-capitalising raises both again and restores the multiple — the point being that the error
    // is not picking a basis, it is mixing bases across comparables.
    await toggle.check();
    await expect.poll(async () => ebitda.innerText()).toContain("£170m");
    await expect.poll(async () => ev.innerText()).toContain("£1,530m");
    await expect.poll(async () => multiple.innerText()).toContain("9.0×");
  });

  test("multiple matcher: a pre-interest metric scores, a post-interest one sent to EV does not", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, lessonUrl(LESSONS.pairing));
    await expect(page.getByTestId("widget-multiple_matcher")).toBeVisible();

    const score = page.getByTestId("matcher-score");
    await expect(page.getByTestId("matcher-metric")).toHaveCount(8);
    await expect(score).toContainText("0 of 8");

    // EBITDA is before interest, so it belongs on top of enterprise value — correct.
    const ebitdaRow = page.getByTestId("matcher-metric").filter({ hasText: "EBITDA" }).first();
    await ebitdaRow.getByRole("button", { name: "Enterprise value" }).click();
    await expect(score).toContainText("1 of 8");
    await expect(page.getByTestId("matcher-bucket-ev")).toContainText("EBITDA");

    // Net income is after interest and tax, so sending it to EV is exactly the mismatch the
    // widget exists to catch: it lands in the EV bucket but the score does not move.
    const netIncomeRow = page.getByTestId("matcher-metric").filter({ hasText: "Net income" }).first();
    await netIncomeRow.getByRole("button", { name: "Enterprise value" }).click();
    await expect(page.getByTestId("matcher-bucket-ev")).toContainText("Net income");
    await expect(score).toContainText("1 of 8");
    await expect(score).toContainText("6 still to place");
  });

  test("cheat sheet renders the bridge formula, the traps and the ft-only box", async ({ page, baseURL }) => {
    await signIn(page, baseURL!, `/home/technicals/${TOPIC}`);
    await page.getByTestId("cheatsheet-link").click();
    await expect(page).toHaveURL(new RegExp(`/home/technicals/${TOPIC}/cheatsheet$`));

    await expect(page.getByTestId("cheatsheet")).toBeVisible();
    await expect(page.getByTestId("cheatsheet-formulas")).toContainText("The bridge to enterprise value");
    await expect(page.getByTestId("cheatsheet-formulas")).toContainText("Treasury-stock method");
    await expect(page.getByTestId("cheatsheet-formulas").locator(".katex").first()).toBeVisible();
    await expect(page.getByTestId("cheatsheet-canonical")).toContainText("Why do you subtract cash?");
    await expect(page.getByTestId("cheatsheet-traps")).toContainText("Cash is subtracted, never added");
    // `ft-only` material is named so it cannot ambush the student, never taught as a lesson.
    await expect(page.getByTestId("cheatsheet-you-may-hear")).toContainText("Restricted cash");
  });
});
