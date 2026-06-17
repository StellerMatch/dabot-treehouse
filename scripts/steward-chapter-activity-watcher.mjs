import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const DEFAULT_INBOX_DIR =
  path.resolve(process.cwd(), "var/treehouse/steward-status-inbox");
const DEFAULT_ACTIVITY_DIR =
  path.resolve(process.cwd(), "var/treehouse/chapter-activity");
const DEFAULT_RECEIPT_DIR =
  path.resolve(process.cwd(), "var/treehouse/steward-status-receipts");

const inboxDir = path.resolve(
  process.env.TREEHOUSE_STEWARD_STATUS_INBOX_DIR ??
    process.env.TREEHOUSE_STEWARD_STATUS_INBOX_DIR ??
    DEFAULT_INBOX_DIR,
);
const activityDir = path.resolve(
  process.env.TREEHOUSE_CHAPTER_ACTIVITY_DIR ??
    process.env.TREEHOUSE_CHAPTER_ACTIVITY_DIR ??
    DEFAULT_ACTIVITY_DIR,
);
const receiptDir = path.resolve(
  process.env.TREEHOUSE_STEWARD_STATUS_RECEIPT_DIR ??
    process.env.TREEHOUSE_STEWARD_STATUS_RECEIPT_DIR ??
    DEFAULT_RECEIPT_DIR,
);
const now = new Date().toISOString();
const allowedStatuses = new Set(["bots_running", "needs_question", "next_ready"]);

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

function isReceivableStatus(input) {
  if (!input || typeof input !== "object") return false;
  if (input.stewardWatcher?.receivedAt) return false;
  if (!input.projectId || typeof input.projectId !== "string") return false;
  if (!allowedStatuses.has(input.status)) return false;
  return true;
}

async function receiveStatus(filePath, input) {
  const receiptId = `steward-status-${now.replace(/[:.]/g, "-")}-${randomUUID()}`;
  const receiptPath = path.join(receiptDir, `${receiptId}-${safeSlug(input.projectId)}.json`);
  const activityPath = path.join(activityDir, `${safeSlug(input.projectId)}.json`);
  const existingActivity = await readJson(activityPath).catch(() => null);
  const hasConflict =
    existingActivity &&
    existingActivity.status &&
    existingActivity.status !== input.status &&
    input.supersedesActivity !== true;

  if (hasConflict) {
    const receipt = {
      receiptId,
      receivedAt: now,
      watcher: "Steward",
      source: "steward-chapter-activity-watcher",
      status: "conflict_needs_review",
      inputPath: filePath,
      activityPath,
      existingActivity,
      incomingActivity: {
        currentChapterId: input.currentChapterId ?? null,
        message: input.message ?? null,
        nextChapterId: input.nextChapterId ?? null,
        projectId: input.projectId,
        question: input.question ?? null,
        source: input.source ?? null,
        status: input.status,
      },
      result: {
        activityRecorded: false,
        dispatchStatus: "not_dispatched",
        botNotificationStatus: "not_notified",
        needsHumanReview: true,
      },
      boundary:
        "Steward found conflicting explicit status packets and did not choose between them. No n8n, bot notification, credential use, deploy, spend, publish, or runtime/config/authority change occurred.",
    };
    const updatedInput = {
      ...input,
      stewardWatcher: {
        receivedAt: now,
        watcher: "Steward",
        receiptId,
        receiptPath,
        activityPath,
        status: "conflict_needs_review",
      },
    };

    await fs.mkdir(receiptDir, { recursive: true });
    await writeJson(receiptPath, receipt);
    await writeJson(filePath, updatedInput);

    return {
      activityPath,
      projectId: input.projectId,
      receiptId,
      receiptPath,
      status: "conflict_needs_review",
    };
  }

  const activity = {
    createdAt: now,
    currentChapterId: input.currentChapterId ?? null,
    message: input.message ?? null,
    nextChapterId: input.nextChapterId ?? null,
    projectId: input.projectId,
    question: input.question ?? null,
    source: "Steward",
    status: input.status,
    updatedAt: now,
  };
  const receipt = {
    receiptId,
    receivedAt: now,
    watcher: "Steward",
    source: "steward-chapter-activity-watcher",
    status: "received_local_only",
    inputPath: filePath,
    activityPath,
    activity,
    result: {
      activityRecorded: true,
      dispatchStatus: "not_dispatched",
      botNotificationStatus: "not_notified",
    },
    boundary:
      "Steward chapter-activity watcher only records explicit status packets. It does not decide readiness, fire n8n, notify bots, use credentials, deploy, spend, publish, or change runtime/config/authority.",
  };
  const updatedInput = {
    ...input,
    stewardWatcher: {
      receivedAt: now,
      watcher: "Steward",
      receiptId,
      receiptPath,
      activityPath,
    },
  };

  await fs.mkdir(activityDir, { recursive: true });
  await fs.mkdir(receiptDir, { recursive: true });
  await writeJson(activityPath, activity);
  await writeJson(receiptPath, receipt);
  await writeJson(filePath, updatedInput);

  return {
    activityPath,
    projectId: input.projectId,
    receiptId,
    receiptPath,
    status: input.status,
  };
}

async function main() {
  await fs.mkdir(inboxDir, { recursive: true });
  const names = await fs.readdir(inboxDir);
  const received = [];
  const skipped = [];

  for (const name of names.sort()) {
    if (!name.endsWith(".json")) continue;

    const filePath = path.join(inboxDir, name);
    const input = await readJson(filePath);
    if (!isReceivableStatus(input)) {
      skipped.push(name);
      continue;
    }

    received.push(await receiveStatus(filePath, input));
  }

  console.log(
    JSON.stringify(
      {
        checkedAt: now,
        inboxDir,
        activityDir,
        receiptDir,
        received,
        receivedCount: received.length,
        skippedCount: skipped.length,
        boundary:
          "Local Steward status scan only. Does not decide readiness, fire n8n, notify bots, use credentials, deploy, spend, publish, or change runtime/config/authority.",
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
