import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_PACKET_DIR =
  "/Users/2ndbrain/.openclaw/workspace/projects/dabottree-n8n/treehouse-task-packets";
const DEFAULT_DISPATCH_DIR =
  "/Users/2ndbrain/.openclaw/workspace/projects/dabottree-n8n/treehouse-manual-dispatch-receipts";

const packetDir = path.resolve(process.env.TREEHOUSE_TASK_PACKET_DIR ?? DEFAULT_PACKET_DIR);
const dispatchDir = path.resolve(process.env.TREEHOUSE_MANUAL_DISPATCH_DIR ?? DEFAULT_DISPATCH_DIR);
const now = new Date().toISOString();

function isChiefReviewCandidate(packet) {
  if (!packet || typeof packet !== "object") return false;
  if (packet.status !== "steward_received_local_only") return false;
  if (packet.n8n?.triggerStatus !== "not_triggered") return false;
  if (packet.stewardWatcher?.dispatchStatus !== "not_dispatched") return false;
  if (packet.stewardWatcher?.botNotificationStatus !== "not_notified") return false;
  if (packet.chiefManualDispatch?.readyForReviewAt) return false;
  return Boolean(packet.packetId && packet.requestedAction && packet.stewardWatcher?.receiptId);
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

async function prepareForChiefReview(filePath, packet) {
  const dispatchPrepId = `chief-dispatch-prep-${now.replace(/[:.]/g, "-")}-${randomUUID()}`;
  const receiptFilename = `${dispatchPrepId}-${safeSlug(packet.requestedAction)}.json`;
  const receiptPath = path.join(dispatchDir, receiptFilename);

  const receipt = {
    dispatchPrepId,
    packetId: packet.packetId,
    preparedAt: now,
    reviewer: "Chief",
    source: "chief-manual-dispatch-prep",
    status: "ready_for_chief_review_local_only",
    requestedAction: packet.requestedAction,
    project: packet.project ?? null,
    treehouse: packet.treehouse ?? null,
    stewardReceiptId: packet.stewardWatcher?.receiptId ?? null,
    n8n: {
      anchor: packet.n8n?.anchor ?? null,
      reportSourceKey: packet.n8n?.reportSourceKey ?? null,
      triggerStatus: "not_triggered",
    },
    result: {
      packetMarkedReadyForChiefReview: true,
      dispatchStatus: "not_dispatched",
      botNotificationStatus: "not_notified",
      approvalStatus: "not_approved",
    },
    nextAllowedStep:
      "Boss or Chief may manually review this packet later. This receipt does not approve dispatch.",
    boundary:
      "Chief manual dispatch prep only. Does not approve, dispatch, fire n8n, notify a bot, use credentials, deploy, spend, publish, or change runtime/config/authority.",
  };

  const updatedPacket = {
    ...packet,
    status: "chief_review_ready_local_only",
    chiefManualDispatch: {
      readyForReviewAt: now,
      reviewer: "Chief",
      dispatchPrepId,
      receiptPath,
      approvalStatus: "not_approved",
      dispatchStatus: "not_dispatched",
      botNotificationStatus: "not_notified",
    },
  };

  await fs.mkdir(dispatchDir, { recursive: true });
  await writeJson(receiptPath, receipt);
  await writeJson(filePath, updatedPacket);

  return {
    packetId: packet.packetId,
    dispatchPrepId,
    receiptPath,
    requestedAction: packet.requestedAction,
  };
}

async function main() {
  await fs.mkdir(packetDir, { recursive: true });
  const names = await fs.readdir(packetDir);
  const readyForReview = [];
  const skipped = [];

  for (const name of names.sort()) {
    if (!name.endsWith(".json")) continue;

    const filePath = path.join(packetDir, name);
    const packet = await readJson(filePath);
    if (!isChiefReviewCandidate(packet)) {
      skipped.push(name);
      continue;
    }

    readyForReview.push(await prepareForChiefReview(filePath, packet));
  }

  const summary = {
    checkedAt: now,
    packetDir,
    dispatchDir,
    readyForReviewCount: readyForReview.length,
    skippedCount: skipped.length,
    readyForReview,
    boundary:
      "Local manual dispatch prep only. Does not approve, dispatch, fire n8n, notify bots, use credentials, deploy, spend, publish, or change runtime/config/authority.",
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
