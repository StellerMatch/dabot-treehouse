import { expect, test } from "@playwright/test";

test("Treehouse starts with a free account gate", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByAltText("DaBotTree")).toBeVisible();
  await expect(page.getByText("TREE HOUSE")).toBeVisible();
  await expect(page.getByText("Free Treehouse account").first()).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Give every idea a place to live." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Create free account" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

  await page.getByRole("link", { name: "Create free account" }).click();
  await expect(page.getByText("TREE HOUSE")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
});

test("Treehouse suggests a short working project name from the idea text", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("dabottree:authed", "1");
  });

  await page.goto("/");
  const ideaInput = page.locator("#idea");
  await expect(ideaInput).toBeVisible();
  await ideaInput.fill(
    "A booking service for robotic lawn mower companies that lets customers request appointments and helps crews schedule each job.",
  );

  await expect(page.getByText("Working name:")).toBeVisible();
  await expect(page.getByText("Mower Booking Service")).toBeVisible();
  await expect(page.getByRole("button", { name: /Save to my library/i })).toBeEnabled();
});

test("Treehouse names ideas from meaning instead of opening filler words", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("dabottree:authed", "1");
  });

  await page.goto("/");
  const ideaInput = page.locator("#idea");
  await expect(ideaInput).toBeVisible();

  await ideaInput.fill("I want to make an app that helps people save ideas and notes.");
  await expect(page.locator("div", { hasText: /^Working name:\s+Idea Shelf$/ })).toBeVisible();

  await ideaInput.fill(
    "A platform for organizing AI bot ideas, workflows, and character-based project stages.",
  );
  await expect(
    page.locator("div", { hasText: /^Working name:\s+Bot Workflow Hub$/ }),
  ).toBeVisible();
});

test("Library shelf Continue opens the idea dashboard without the credit modal", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("dabottree:authed", "1");
    window.localStorage.setItem("dabottree:accountEmail", "boss@example.com");
    window.localStorage.setItem("dabottree:ideas", "[]");
    window.localStorage.setItem("dabottree:ideaExtras", "{}");
  });

  await page.goto("/");
  await page
    .locator("#idea")
    .fill("A simple app for saving creative ideas and notes in one shelf.");
  await page.getByRole("button", { name: /Save to my library/i }).click();
  await expect(page).toHaveURL(/\/library/);

  await expect(page.getByRole("heading", { name: "Idea Shelf" })).toBeVisible();
  await expect(page.getByText("Idea Shelf").last()).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Idea Shelf" })).toBeVisible();
  await expect(page.getByText("Idea Shelf").last()).toBeVisible();
  await expect(
    page.evaluate(() => window.localStorage.getItem("dabottree:ideas:boss@example.com")),
  ).resolves.toContain("Idea Shelf");

  await page.getByRole("button", { name: /^Continue$/ }).click();

  await expect(page.getByText("Start Library Stage?")).toHaveCount(0);
  await expect(page).toHaveURL(/\/dashboard\?ideaId=idea-/);
});
