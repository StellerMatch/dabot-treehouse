import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const packetDir = path.resolve("test-results/treehouse-task-packets");

type TreehousePacket = {
  boundary: string;
  n8n: {
    anchor: string | null;
    reportSourceKey: string | null;
    triggerStatus: string;
  };
  packetId: string;
  project: {
    projectId: string;
    title: string;
  } | null;
  requestedAction: string;
  status: string;
  treehouse: {
    actor: string;
    chapterId: string;
    chapterTitle: string;
    partId: string;
    partTitle: string;
  };
};

async function readRecentPacket(
  action: string,
  startedAt: number,
): Promise<TreehousePacket | null> {
  const names = await fs.readdir(packetDir).catch(() => []);

  for (const name of names) {
    if (!name.endsWith(".json")) continue;

    const filePath = path.join(packetDir, name);
    const stats = await fs.stat(filePath);
    if (stats.mtimeMs < startedAt - 500) continue;

    const packet = JSON.parse(await fs.readFile(filePath, "utf8")) as TreehousePacket;
    if (packet.requestedAction === action) return packet;
  }

  return null;
}

async function waitForPacket(action: string, startedAt: number): Promise<TreehousePacket> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const packet = await readRecentPacket(action, startedAt);
    if (packet) return packet;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`No local task packet was created for ${action}`);
}

test("Chapter 2 Go creates an inactive Root Room n8n handoff packet", async ({ page }) => {
  await fs.rm(packetDir, { force: true, recursive: true });

  const idea = {
    id: "idea-root-room-step-four",
    title: "Step Four Root Room Test",
    messy: "Local proof idea for the Root Room inactive n8n test doorway.",
    shelfReadiness: 80,
    updatedAt: Date.now(),
    stage: "paid-creation",
    nextAction: "Open Chapter 2: The Root Room.",
    ideaType: "App",
    description: "Local proof idea for the Root Room inactive n8n test doorway.",
  };

  await page.addInitScript((seedIdea) => {
    window.localStorage.setItem("dabottree:authed", "1");
    window.localStorage.setItem("dabottree:ideas", JSON.stringify([seedIdea]));
    window.localStorage.setItem(
      "dabottree:ideaExtras",
      JSON.stringify({
        [seedIdea.id]: {
          currentChapterId: "root-room",
        },
      }),
    );
  }, idea);

  await page.goto("/library");
  await expect(page.getByText("Step Four Root Room Test").first()).toBeVisible();
  await expect(page.getByText("Chapter 2 of 11")).toBeVisible();

  await page.getByRole("button", { name: "Open Chapter 2" }).click();
  await expect(page.getByRole("heading", { name: "Chapter 2: The Root Room" })).toBeVisible();
  await expect(page.getByText("n8n listener waiting")).toBeVisible();
  await expect(page.getByText("Parked gate: n8n Execute workflow listener")).toBeVisible();

  const startedAt = Date.now();
  await page.getByRole("button", { name: "Go" }).click();

  const packet = await waitForPacket("root_room_inactive_test_handoff", startedAt);
  expect(packet.status).toBe("created_local_only");
  expect(packet.requestedAction).toBe("root_room_inactive_test_handoff");
  expect(packet.treehouse.actor).toBe("Steward");
  expect(packet.treehouse.chapterId).toBe("root-room");
  expect(packet.treehouse.partId).toBe("root-room-go-test");
  expect(packet.project?.title).toBe("Step Four Root Room Test");
  expect(packet.n8n.anchor).toContain("7.2 Prepare Echo Perspective Scan");
  expect(packet.n8n.reportSourceKey).toBe("root_room_inactive_test_handoff");
  expect(packet.n8n.triggerStatus).toBe("not_triggered");
  expect(packet.boundary).toContain("Does not fire n8n");

  await expect(page.getByText("Inactive n8n test packet created")).toBeVisible();
  await expect(page.getByText("triggerStatus: not_triggered")).toBeVisible();
  await expect(page.getByText("Step Five retry kit")).toBeVisible();
  await expect(page.getByText("Status: Running")).toBeVisible();
  await expect(page.getByText("Status: Complete")).toBeVisible({ timeout: 5_000 });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open Chapter 3" })).toBeVisible({
    timeout: 5_000,
  });
});
