import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const DEFAULT_PACKET_DIR =
  path.resolve(process.cwd(), "var/treehouse/task-packets");
const DEFAULT_RECEIPT_DIR =
  path.resolve(process.cwd(), "var/treehouse/task-packet-receipts");

const packetDir = path.resolve(
  process.env.TREEHOUSE_TASK_PACKET_DIR ?? DEFAULT_PACKET_DIR,
);
const receiptDir = path.resolve(
  process.env.TREEHOUSE_TASK_RECEIPT_DIR ?? DEFAULT_RECEIPT_DIR,
);
const now = new Date().toISOString();

function isReceivablePacket(packet) {
  if (!packet || typeof packet !== "object") return false;
  if (!["created_local_only", "created_local_only_test"].includes(packet.status)) return false;
  if (packet.stewardWatcher?.receivedAt) return false;
  if (packet.n8n?.triggerStatus !== "not_triggered") return false;
  return Boolean(packet.packetId && packet.requestedAction);
}

function safeSlug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function receivePacket(filePath, packet) {
  const receiptId = `steward-receipt-${now.replace(/[:.]/g, "-")}-${randomUUID()}`;
  const receiptFilename = `${receiptId}-${safeSlug(packet.requestedAction)}.json`;
  const receiptPath = path.join(receiptDir, receiptFilename);

  const receipt = {
    receiptId,
    packetId: packet.packetId,
    receivedAt: now,
    watcher: "Steward",
    source: "steward-task-packet-watcher",
    status: "received_local_only",
    requestedAction: packet.requestedAction,
    project: packet.project ?? null,
    treehouse: packet.treehouse ?? null,
    n8n: {
      anchor: packet.n8n?.anchor ?? null,
      reportSourceKey: packet.n8n?.reportSourceKey ?? null,
      triggerStatus: "not_triggered",
    },
    result: {
      packetMarkedReceived: true,
      dispatchStatus: "not_dispatched",
      botNotificationStatus: "not_notified",
    },
    boundary:
      "Steward watcher receipt only. Does not fire n8n, notify a bot, use credentials, deploy, spend, publish, or change runtime/config/authority.",
  };

  const updatedPacket = {
    ...packet,
    status: "steward_received_local_only",
    stewardWatcher: {
      receivedAt: now,
      watcher: "Steward",
      receiptId,
      receiptPath,
      dispatchStatus: "not_dispatched",
      botNotificationStatus: "not_notified",
    },
  };

  await fs.mkdir(receiptDir, { recursive: true });
  await writeJson(receiptPath, receipt);
  await writeJson(filePath, updatedPacket);

  return {
    packetId: packet.packetId,
    receiptId,
    receiptPath,
    requestedAction: packet.requestedAction,
  };
}

async function main() {
  await fs.mkdir(packetDir, { recursive: true });
  const names = await fs.readdir(packetDir);
  const received = [];
  const skipped = [];

  for (const name of names.sort()) {
    if (!name.endsWith(".json")) continue;

    const filePath = path.join(packetDir, name);
    const packet = await readJson(filePath);
    if (!isReceivablePacket(packet)) {
      skipped.push(name);
      continue;
    }

    received.push(await receivePacket(filePath, packet));
  }

  const summary = {
    checkedAt: now,
    packetDir,
    receiptDir,
    receivedCount: received.length,
    skippedCount: skipped.length,
    received,
    boundary:
      "Local watcher scan only. Does not fire n8n, notify bots, use credentials, deploy, spend, publish, or change runtime/config/authority.",
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
