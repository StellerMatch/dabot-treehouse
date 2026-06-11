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
