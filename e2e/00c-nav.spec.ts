import { test, expect } from "@playwright/test";
import { signInAs, unlockPrivateArea } from "./helpers/auth";

// Requires `npm run seed -- 00`. Primary nav is a sticky horizontal bar of the five products
// (src/components/shell/app-header.tsx); no sidebar, no dropdown.
test.describe("Sticky horizontal nav", () => {
  test("five product links → Technicals navigates and is current → header gains its rule on scroll", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", "/home");
    await expect(page.getByTestId("app-shell")).toBeVisible();
    await expect(page.getByTestId("side-nav")).toHaveCount(0);
    await expect(page.getByTestId("nav-menu")).toHaveCount(0);

    const nav = page.getByTestId("nav-bar");
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link")).toHaveText(["Home", "Mentor", "Technicals", "Practice", "Interviews"]);
    await expect(nav.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByTestId("nav-staff-link")).toHaveCount(0); // students never see Admin

    // Right cluster is just search · initials · sign out — no role badge, no email.
    await expect(page.getByTestId("palette-open")).toBeVisible();
    await expect(page.getByTestId("user-avatar")).toHaveText("E");
    await expect(page.getByTestId("user-email")).toHaveCount(0);

    const header = page.getByTestId("app-header");
    await expect(header).not.toHaveAttribute("data-scrolled", "");
    await page.mouse.wheel(0, 600);
    await expect(header).toHaveAttribute("data-scrolled", "");
    await expect(header).toBeInViewport(); // sticky

    await nav.getByRole("link", { name: "Technicals" }).click();
    await expect(page).toHaveURL(/\/home\/technicals$/);
    await expect(page.getByTestId("nav-bar").getByRole("link", { name: "Technicals" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByTestId("nav-bar").getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current", "page");
  });

  test("staff see Admin at the end of the bar", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-admin@astar.test", "/home");
    const admin = page.getByTestId("nav-bar").getByTestId("nav-staff-link");
    await expect(admin).toHaveText("Admin");
    await expect(admin).toHaveAttribute("href", "/admin");
  });
});

// /home landing (Loop 19): wordmark hero that hides the header brand, toolkit grid, route, path,
// mentor bench, "in the works" row. Copy in src/content/home.ts.
test.describe("/home landing", () => {
  test("hero wordmark hides the header brand until scrolled; toolkit, bench and works render", async ({ page, baseURL }) => {
    await unlockPrivateArea(page, baseURL!);
    await signInAs(page, "e2e-student@astar.test", "/home");
    await expect(page.getByTestId("home-heading")).toHaveText("Everything between you and the offer.");
    await expect(page.getByTestId("neural-field")).toBeAttached();
    await expect(page.getByTestId("hero-wordmark")).toBeVisible();
    await expect(page.getByTestId("hero-cta-path")).toHaveAttribute("href", "/home/path");

    // One brand at a time: the header's copy is hidden while the hero wordmark is on screen.
    await expect(page.locator("html")).toHaveAttribute("data-hero-brand", "visible");
    await expect(page.getByTestId("nav-logo")).toBeHidden();

    for (const [id, href] of [
      ["home-mentor-card", "/home/mentor"],
      ["home-technicals-card", "/home/technicals"],
      ["home-practice-card", "/home/practice"],
      ["home-interviews-card", "/home/interviews"],
      ["home-path-card", "/home/path"],
    ] as const) {
      await expect(page.getByTestId(id)).toHaveAttribute("href", href);
    }
    await expect(page.getByTestId("home-route").getByRole("listitem")).toHaveCount(5);
    await expect(page.getByTestId("home-path-spine").getByRole("listitem")).toHaveCount(10);

    const works = page.getByTestId("home-works");
    await expect(works).toContainText("Firm question banks");
    await expect(works).toContainText("Pulse");
    await expect(works).not.toContainText("£");
    await expect(works).not.toContainText(/live/i);

    await page.getByTestId("mentor-grid").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("mentor-tile").first()).toContainText("Tesleem Fowora");
    await expect(page.getByTestId("mentor-seat")).toHaveCount(3);
    // Past the hero, the header brand is back.
    await expect(page.locator("html")).not.toHaveAttribute("data-hero-brand", "visible");
    await expect(page.getByTestId("nav-logo")).toBeVisible();

    await page.getByTestId("home-mentor-card").click();
    await expect(page).toHaveURL(/\/home\/mentor/);
    await expect(page.locator("html")).not.toHaveAttribute("data-hero-brand", "visible");
    await expect(page.getByTestId("nav-logo")).toBeVisible();
  });
});
