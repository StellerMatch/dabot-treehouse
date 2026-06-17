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

test("Treehouse strips pasted intake labels from working names", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("dabottree:authed", "1");
  });

  await page.goto("/");
  const ideaInput = page.locator("#idea");
  await expect(ideaInput).toBeVisible();

  await ideaInput.fill("Name: Mobile dog grooming for busy pet owners");

  await expect(page.getByText("Working name:")).toBeVisible();
  await expect(page.locator("div", { hasText: /^Working name:\s+Pet Care Tool$/ })).toBeVisible();
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

test("Library shelf Continue opens saved ideas with older partial extras", async ({ page }) => {
  const idea = {
    id: "idea-mobile-dog-grooming-busy",
    title: "Mobile Dog Grooming",
    messy:
      "Mobile dog grooming business idea for busy pet owners who need appointments, route planning, reminders, and saved customer preferences.",
    shelfReadiness: 62,
    updatedAt: Date.now(),
    stage: "pre-clarity",
    nextAction: "Answer personalized Clarity questions before creating the project brief.",
    audience: "Busy pet owners",
    industry: "Pet grooming",
    ideaType: "Business / service app",
    description:
      "A mobile dog grooming service workflow for busy pet owners, with booking, customer notes, route planning, reminders, and saved pet preferences.",
  };
  const partialExtras = {
    [idea.id]: {
      sourceText: idea.messy,
      notes: {},
    },
  };

  await page.addInitScript(
    ({ idea, partialExtras }) => {
      window.localStorage.setItem("dabottree:authed", "1");
      window.localStorage.setItem("dabottree:accountEmail", "boss@example.com");
      window.localStorage.setItem("dabottree:ideas", JSON.stringify([idea]));
      window.localStorage.setItem("dabottree:ideas:boss@example.com", JSON.stringify([idea]));
      window.localStorage.setItem("dabottree:ideaExtras", JSON.stringify(partialExtras));
      window.localStorage.setItem(
        "dabottree:ideaExtras:boss@example.com",
        JSON.stringify(partialExtras),
      );
    },
    { idea, partialExtras },
  );

  await page.goto("/library");
  const ideaCard = page.locator("li", { hasText: "Mobile Dog Grooming" });
  await expect(ideaCard).toBeVisible();
  await ideaCard.getByRole("button", { name: /^Continue$/ }).click();

  await expect(page).toHaveURL(/\/dashboard\?ideaId=idea-mobile-dog-grooming-busy/);
  await expect(page.getByText("This page didn't load")).toHaveCount(0);
  await expect(page.getByText("Mobile Dog Grooming").first()).toBeVisible();
});
