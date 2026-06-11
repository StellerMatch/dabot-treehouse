import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TASK_PACKET_DIR =
  process.env.TREEHOUSE_TASK_PACKET_DIR ??
  "/Users/2ndbrain/.openclaw/workspace/projects/dabottree-n8n/treehouse-task-packets";

const taskPacketInputSchema = z.object({
  actor: z.string().min(1),
  chapterId: z.string().min(1),
  chapterTitle: z.string().min(1),
  n8nAnchor: z.string().nullable(),
  partId: z.string().min(1),
  partTitle: z.string().min(1),
  project: z
    .object({
      description: z.string().optional(),
      ideaType: z.string().optional(),
      projectId: z.string().min(1),
      title: z.string().min(1),
    })
    .nullable()
    .optional(),
  reportSourceKey: z.string().nullable(),
  requestedAction: z.string().min(1),
});

function safeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const createTreehouseTaskPacket = createServerFn({ method: "POST" })
  .validator(taskPacketInputSchema)
  .handler(async ({ data }) => {
    const packetId = `treehouse-task-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID()}`;
    const filename = `${packetId}-${safeSlug(data.chapterId)}-${safeSlug(data.partId)}.json`;
    const packetPath = path.join(TASK_PACKET_DIR, filename);
    const packet = {
      packetId,
      createdAt: new Date().toISOString(),
      source: "dabottree-treehouse-levels-page",
      status: "created_local_only",
      requestedAction: data.requestedAction,
      treehouse: {
        chapterId: data.chapterId,
        chapterTitle: data.chapterTitle,
        partId: data.partId,
        partTitle: data.partTitle,
        actor: data.actor,
      },
      project: data.project ?? null,
      n8n: {
        anchor: data.n8nAnchor,
        reportSourceKey: data.reportSourceKey,
        triggerStatus: "not_triggered",
      },
      boundary:
        "Local task packet only. Does not fire n8n, notify a bot, use credentials, deploy, spend, publish, or change runtime/config/authority.",
    };

    await fs.mkdir(TASK_PACKET_DIR, { recursive: true });
    await fs.writeFile(packetPath, JSON.stringify(packet, null, 2) + "\n", "utf8");

    return {
      packetId,
      packetPath,
      status: packet.status,
    };
  });
