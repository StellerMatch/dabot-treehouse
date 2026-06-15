import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TASK_PACKET_DIR =
  process.env.TREEHOUSE_TASK_PACKET_DIR ??
  "/Users/2ndbrain/.openclaw/workspace/projects/dabottree-n8n/treehouse-task-packets";

const DEFAULT_TREEHOUSE_N8N_WEBHOOK_URL =
  "https://dabottree.app.n8n.cloud/webhook/dabottree-level-system-test";

type TreehouseN8nTriggerResult =
  | {
      httpStatus: number;
      httpStatusText: string;
      responseSnippet: string;
      status: "triggered_live_n8n" | "live_n8n_failed";
      webhookUrl: string;
    }
  | {
      status: "not_triggered";
      webhookUrl: null;
    };

const taskPacketInputSchema = z.object({
  actor: z.string().min(1),
  backendChapterRun: z
    .object({
      runDir: z.string().min(1),
      runId: z.string().min(1),
      status: z.string().min(1),
    })
    .nullable()
    .optional(),
  botParticipants: z.array(z.string().min(1)).optional(),
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

function liveN8nWebhookUrl(): string | null {
  const configured = process.env.TREEHOUSE_N8N_WEBHOOK_URL?.trim();
  if (configured) return configured;

  // Local dev and tests stay packet-only. Production can use the known n8n
  // webhook path without shipping the URL to the browser.
  if (process.env.NODE_ENV === "production") return DEFAULT_TREEHOUSE_N8N_WEBHOOK_URL;

  return null;
}

function responseSnippet(value: string): string {
  return value.slice(0, 2000);
}

async function triggerLiveN8n(packet: unknown): Promise<TreehouseN8nTriggerResult> {
  const webhookUrl = liveN8nWebhookUrl();
  if (!webhookUrl) {
    return {
      status: "not_triggered",
      webhookUrl: null,
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        event: "treehouse_task_packet_created",
        source: "dabottree-app-server",
        triggerIntent: "live_treehouse_button_handoff",
        packet,
      }),
    });
    const text = await response.text();

    return {
      httpStatus: response.status,
      httpStatusText: response.statusText,
      responseSnippet: responseSnippet(text),
      status: response.ok ? "triggered_live_n8n" : "live_n8n_failed",
      webhookUrl,
    };
  } catch (error) {
    return {
      httpStatus: 0,
      httpStatusText: error instanceof Error ? error.message : "Unknown n8n trigger error",
      responseSnippet: "",
      status: "live_n8n_failed",
      webhookUrl,
    };
  }
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
      backendChapterRun: data.backendChapterRun ?? null,
      botParticipants: data.botParticipants ?? [],
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

    const n8nTrigger = await triggerLiveN8n(packet);
    if (n8nTrigger.status !== "not_triggered") {
      const triggeredPacket = {
        ...packet,
        status:
          n8nTrigger.status === "triggered_live_n8n"
            ? "created_and_sent_to_live_n8n"
            : "created_live_n8n_send_failed",
        n8n: {
          ...packet.n8n,
          trigger: n8nTrigger,
          triggerStatus: n8nTrigger.status,
        },
        boundary:
          "Server-side Treehouse handoff packet. May POST to the approved dabottree n8n webhook. Does not use credentials, deploy, spend, publish, or change runtime/config/authority.",
      };
      await fs.writeFile(packetPath, JSON.stringify(triggeredPacket, null, 2) + "\n", "utf8");

      return {
        n8nTriggerStatus: n8nTrigger.status,
        packetId,
        packetPath,
        status: triggeredPacket.status,
      };
    }

    return {
      n8nTriggerStatus: n8nTrigger.status,
      packetId,
      packetPath,
      status: packet.status,
    };
  });
