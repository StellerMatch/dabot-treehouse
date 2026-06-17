import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const packetDir = path.resolve("test-results/treehouse-task-packets");
const receiptDir = path.resolve("test-results/treehouse-task-packet-receipts");
const execFileAsync = promisify(execFile);

type TreehousePacket = {
  boundary: string;
  createdAt?: string;
  n8n: {
    anchor: string | null;
    reportSourceKey: string | null;
    triggerStatus: string;
  };
  packetId: string;
  requestedAction: string;
  source: string;
  status: string;
  treehouse: {
    actor: string;
    chapterId: string;
    chapterTitle: string;
    partId: string;
    partTitle: string;
  };
  stewardWatcher?: {
    botNotificationStatus: string;
    dispatchStatus: string;
    receiptId: string;
    receiptPath: string;
    receivedAt: string;
    watcher: string;
  };
};

type StewardReceipt = {
  boundary: string;
  n8n: {
    anchor: string | null;
    reportSourceKey: string | null;
    triggerStatus: string;
  };
  packetId: string;
  receiptId: string;
  result: {
    botNotificationStatus: string;
    dispatchStatus: string;
    packetMarkedReceived: boolean;
  };
  status: string;
  watcher: string;
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

function expectSafeLocalPacket(packet: TreehousePacket, action: string) {
  expect(packet.packetId).toContain("treehouse-task-");
  expect(packet.source).toBe("dabottree-treehouse-levels-page");
  expect(packet.status).toBe("created_local_only");
  expect(packet.requestedAction).toBe(action);
  expect(packet.n8n.triggerStatus).toBe("not_triggered");
  expect(packet.boundary).toContain("Does not fire n8n");
  expect(packet.boundary).toContain("notify a bot");
  expect(packet.treehouse.chapterId).toBeTruthy();
  expect(packet.treehouse.partId).toBeTruthy();
  expect(packet.treehouse.actor).toBeTruthy();
}

async function runStewardWatcher() {
  const { stdout } = await execFileAsync("node", ["scripts/steward-task-packet-watcher.mjs"], {
    env: {
      ...process.env,
      TREEHOUSE_TASK_PACKET_DIR: packetDir,
      TREEHOUSE_TASK_RECEIPT_DIR: receiptDir,
    },
  });

  return JSON.parse(stdout) as {
    received: Array<{
      packetId: string;
      receiptId: string;
      receiptPath: string;
      requestedAction: string;
    }>;
    receivedCount: number;
  };
}

async function readPacketById(packetId: string): Promise<TreehousePacket> {
  const names = await fs.readdir(packetDir);
  for (const name of names) {
    if (!name.endsWith(".json")) continue;

    const filePath = path.join(packetDir, name);
    const packet = JSON.parse(await fs.readFile(filePath, "utf8")) as TreehousePacket;
    if (packet.packetId === packetId) return packet;
  }

  throw new Error(`No packet found for ${packetId}`);
}

async function readReceipt(receiptPath: string): Promise<StewardReceipt> {
  return JSON.parse(await fs.readFile(receiptPath, "utf8")) as StewardReceipt;
}

function expectStewardReceivedPacket(packet: TreehousePacket, receipt: StewardReceipt) {
  expect(packet.status).toBe("steward_received_local_only");
  expect(packet.n8n.triggerStatus).toBe("not_triggered");
  expect(packet.stewardWatcher?.watcher).toBe("Steward");
  expect(packet.stewardWatcher?.dispatchStatus).toBe("not_dispatched");
  expect(packet.stewardWatcher?.botNotificationStatus).toBe("not_notified");
  expect(packet.stewardWatcher?.receiptId).toBe(receipt.receiptId);

  expect(receipt.packetId).toBe(packet.packetId);
  expect(receipt.status).toBe("received_local_only");
  expect(receipt.watcher).toBe("Steward");
  expect(receipt.n8n.triggerStatus).toBe("not_triggered");
  expect(receipt.result.packetMarkedReceived).toBe(true);
  expect(receipt.result.dispatchStatus).toBe("not_dispatched");
  expect(receipt.result.botNotificationStatus).toBe("not_notified");
  expect(receipt.boundary).toContain("Does not fire n8n");
  expect(receipt.boundary).toContain("notify a bot");
}

async function clickUntilVisible(page: Page, buttonName: string, visibleText: string | RegExp) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await page.getByRole("button", { name: buttonName }).click();
    const target = page.getByText(visibleText).first();
    try {
      await expect(target).toBeVisible({ timeout: 1_500 });
      return;
    } catch {
      if (attempt === 3) throw new Error(`Click on ${buttonName} did not reveal ${visibleText}`);
    }
  }
}

test("Treehouse task buttons create safe local n8n handoff packets", async ({ page }) => {
  await fs.rm(receiptDir, { force: true, recursive: true });

  await page.goto("/levels");
  await expect(page.getByRole("heading", { name: /Every current chapter/i })).toBeVisible();

  await clickUntilVisible(page, "Ch 4", "Luma Design Trust");
  await clickUntilVisible(page, "Open Luma Design Trust", "Task section starters");
  await expect(page.getByText("Task section starters")).toBeVisible();

  const trunkStartedAt = Date.now();
  await page.getByRole("button", { name: "Past Pass" }).click();
  const trunkPacket = await waitForPacket("trunk_past_pass", trunkStartedAt);
  expectSafeLocalPacket(trunkPacket, "trunk_past_pass");
  expect(trunkPacket.treehouse.chapterId).toBe("trunk-ascent");
  expect(trunkPacket.treehouse.actor).toBe("Luma");

  await clickUntilVisible(page, "Ch 6", "Bones Skeleton Check");
  await clickUntilVisible(page, "Open Bones Skeleton Check", "Task section starters");

  const canopyStartedAt = Date.now();
  await page.getByRole("button", { name: "Send to Bones" }).click();
  const canopyPacket = await waitForPacket("canopy_bones_skeleton_check", canopyStartedAt);
  expectSafeLocalPacket(canopyPacket, "canopy_bones_skeleton_check");
  expect(canopyPacket.treehouse.chapterId).toBe("canopy-foundation");
  expect(canopyPacket.treehouse.actor).toBe("Bones");

  await clickUntilVisible(page, "Ch 12", "Bloom Opens Seed");
  await clickUntilVisible(page, "Open Bloom Opens Seed", "Task section starters");

  const seedStartedAt = Date.now();
  await page.getByRole("button", { name: "Prepare the Seeds" }).click();
  const seedPacket = await waitForPacket("seed_launch_packet", seedStartedAt);
  expectSafeLocalPacket(seedPacket, "seed_launch_packet");
  expect(seedPacket.treehouse.chapterId).toBe("seed");
  expect(seedPacket.treehouse.actor).toBe("Bloom");

  const watcherSummary = await runStewardWatcher();
  const receivedActions = watcherSummary.received.map((entry) => entry.requestedAction);
  expect(receivedActions).toEqual(
    expect.arrayContaining([
      "trunk_past_pass",
      "canopy_bones_skeleton_check",
      "seed_launch_packet",
    ]),
  );

  const receivedSeed = watcherSummary.received.find(
    (entry) => entry.requestedAction === "seed_launch_packet",
  );
  expect(receivedSeed).toBeTruthy();

  const watchedSeedPacket = await readPacketById(seedPacket.packetId);
  const seedReceipt = await readReceipt(receivedSeed!.receiptPath);
  expectStewardReceivedPacket(watchedSeedPacket, seedReceipt);
});
