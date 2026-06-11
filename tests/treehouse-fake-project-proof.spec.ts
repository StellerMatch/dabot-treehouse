import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const packetDir = path.resolve("test-results/treehouse-task-packets");
const receiptDir = path.resolve("test-results/treehouse-task-packet-receipts");
const dispatchDir = path.resolve("test-results/treehouse-manual-dispatch-receipts");
const statusDir = path.resolve("test-results/treehouse-fake-project-status");

const fakeIdea =
  "A realtor media program where a real estate photographer uploads property photos, then the program improves the photos, creates 360-style views, makes listing videos, and can let buyers upload photos of their own belongings and style so the house preview feels like their future home.";

type TreehousePacket = {
  n8n: {
    triggerStatus: string;
  };
  packetId: string;
  project: {
    description?: string;
    ideaType?: string;
    projectId: string;
    title: string;
  } | null;
  requestedAction: string;
  status: string;
  stewardWatcher?: {
    receiptId: string;
  };
  chiefManualDispatch?: {
    approvalStatus: string;
    botNotificationStatus: string;
    dispatchPrepId: string;
    dispatchStatus: string;
  };
};

type StewardReceipt = {
  packetId: string;
  project: TreehousePacket["project"];
  receiptId: string;
  result: {
    botNotificationStatus: string;
    dispatchStatus: string;
  };
  status: string;
};

type ChiefDispatchPrepReceipt = {
  dispatchPrepId: string;
  packetId: string;
  result: {
    approvalStatus: string;
    botNotificationStatus: string;
    dispatchStatus: string;
    packetMarkedReadyForChiefReview: boolean;
  };
  status: string;
};

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
  };
}

async function runChiefManualDispatchPrep() {
  const { stdout } = await execFileAsync("node", ["scripts/chief-manual-dispatch-prep.mjs"], {
    env: {
      ...process.env,
      TREEHOUSE_MANUAL_DISPATCH_DIR: dispatchDir,
      TREEHOUSE_TASK_PACKET_DIR: packetDir,
    },
  });

  return JSON.parse(stdout) as {
    readyForReview: Array<{
      dispatchPrepId: string;
      packetId: string;
      receiptPath: string;
      requestedAction: string;
    }>;
    readyForReviewCount: number;
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

test("fake realtor project runs through local Treehouse packet and Steward receipt path", async ({
  page,
}) => {
  await fs.rm(receiptDir, { force: true, recursive: true });
  await fs.rm(dispatchDir, { force: true, recursive: true });
  await fs.rm(statusDir, { force: true, recursive: true });

  await page.addInitScript(() => {
    window.localStorage.setItem("dabottree:authed", "1");
  });

  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.removeItem("dabottree:ideas");
    window.localStorage.removeItem("dabottree:ideaExtras");
    window.localStorage.removeItem("dabottree:selectedIdeaId");
  });

  const ideaInput = page.locator("#idea");
  await expect(ideaInput).toBeVisible();
  await ideaInput.fill(fakeIdea);
  await expect(page.getByText("Real Estate Media Tool")).toBeVisible();
  await page.getByRole("button", { name: /Save to my library/i }).click();

  await page.waitForURL("**/library");
  await expect(page.getByText("Real Estate Media Tool").first()).toBeVisible();

  await page.goto("/levels");
  await expect(page.getByText("Active project").first()).toBeVisible();
  await expect(page.getByText("Real Estate Media Tool").first()).toBeVisible();
  await page.getByRole("link", { name: "Open Trend Watch" }).click();
  await expect(
    page.getByRole("heading", { name: "Keep the real estate media project current." }),
  ).toBeVisible();
  await expect(page.getByText("Real Estate Media Tool").first()).toBeVisible();
  await expect(page.getByText("Planned, not active yet")).toBeVisible();
  await expect(
    page.getByText("does not browse, schedule, spend, message bots, or call n8n"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Record local note" }).click();
  await expect(page.getByText("local_note_only")).not.toBeVisible();
  await expect(page.getByText("Weekly outside research is planned")).toBeVisible();

  await page.goto("/levels");
  await clickUntilVisible(page, "Ch 3", "Luma Design Trust");
  await clickUntilVisible(page, "Open Luma Design Trust", "Task section starters");

  const startedAt = Date.now();
  await page.getByRole("button", { name: "Past Pass" }).click();
  const packet = await waitForPacket("trunk_past_pass", startedAt);
  expect(packet.status).toBe("created_local_only");
  expect(packet.project?.title).toBe("Real Estate Media Tool");
  expect(packet.n8n.triggerStatus).toBe("not_triggered");

  const watcherSummary = await runStewardWatcher();
  const received = watcherSummary.received.find((entry) => entry.packetId === packet.packetId);
  expect(received).toBeTruthy();

  const watchedPacket = await readPacketById(packet.packetId);
  const receipt = JSON.parse(await fs.readFile(received!.receiptPath, "utf8")) as StewardReceipt;
  expect(watchedPacket.status).toBe("steward_received_local_only");
  expect(watchedPacket.stewardWatcher?.receiptId).toBe(receipt.receiptId);
  expect(receipt.status).toBe("received_local_only");
  expect(receipt.result.dispatchStatus).toBe("not_dispatched");
  expect(receipt.result.botNotificationStatus).toBe("not_notified");
  expect(receipt.project?.title).toBe("Real Estate Media Tool");

  const dispatchPrepSummary = await runChiefManualDispatchPrep();
  const readyForReview = dispatchPrepSummary.readyForReview.find(
    (entry) => entry.packetId === packet.packetId,
  );
  expect(readyForReview).toBeTruthy();

  const reviewedPacket = await readPacketById(packet.packetId);
  const dispatchPrepReceipt = JSON.parse(
    await fs.readFile(readyForReview!.receiptPath, "utf8"),
  ) as ChiefDispatchPrepReceipt;
  expect(reviewedPacket.status).toBe("chief_review_ready_local_only");
  expect(reviewedPacket.chiefManualDispatch?.dispatchPrepId).toBe(
    dispatchPrepReceipt.dispatchPrepId,
  );
  expect(reviewedPacket.chiefManualDispatch?.approvalStatus).toBe("not_approved");
  expect(reviewedPacket.chiefManualDispatch?.dispatchStatus).toBe("not_dispatched");
  expect(reviewedPacket.chiefManualDispatch?.botNotificationStatus).toBe("not_notified");
  expect(dispatchPrepReceipt.status).toBe("ready_for_chief_review_local_only");
  expect(dispatchPrepReceipt.result.packetMarkedReadyForChiefReview).toBe(true);
  expect(dispatchPrepReceipt.result.approvalStatus).toBe("not_approved");
  expect(dispatchPrepReceipt.result.dispatchStatus).toBe("not_dispatched");
  expect(dispatchPrepReceipt.result.botNotificationStatus).toBe("not_notified");

  await fs.mkdir(statusDir, { recursive: true });
  const statusPath = path.join(statusDir, "real-estate-media-tool-local-proof.json");
  await fs.writeFile(
    statusPath,
    `${JSON.stringify(
      {
        fakeProject: {
          input: fakeIdea,
          workingName: "Real Estate Media Tool",
        },
        packetId: packet.packetId,
        receiptId: receipt.receiptId,
        dispatchPrepId: dispatchPrepReceipt.dispatchPrepId,
        status: "ready_for_chief_review_local_only",
        manualDispatch: {
          status: "ready_for_chief_review_local_only",
          approvalStatus: "not_approved",
          dispatchStatus: "not_dispatched",
          botNotificationStatus: "not_notified",
        },
        trendWatch: {
          page: "/trend-watch",
          status: "planned_not_active",
          localNoteStatus: "saved_local_only",
        },
        boundary:
          "Local fake-project proof only. Does not fire n8n, notify bots, use credentials, deploy, spend, publish, or change runtime/config/authority.",
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  const status = JSON.parse(await fs.readFile(statusPath, "utf8")) as {
    status: string;
  };
  expect(status.status).toBe("ready_for_chief_review_local_only");
});
