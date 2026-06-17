import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  readTreehouseChapterActivity,
  writeTreehouseChapterActivity,
} from "@/lib/treehouse-chapter-activity.server";

const TASK_PACKET_DIR =
  process.env.TREEHOUSE_TASK_PACKET_DIR ??
  path.resolve(process.cwd(), "var/treehouse/task-packets");

const CHAPTER_EVENT_DIR =
  process.env.TREEHOUSE_CHAPTER_EVENT_DIR ??
  path.resolve(process.cwd(), "var/treehouse/chapter-events");

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

const projectInputSchema = z
  .object({
    description: z.string().optional(),
    ideaType: z.string().optional(),
    projectId: z.string().min(1),
    title: z.string().min(1),
  })
  .nullable()
  .optional();

const clarityQuestionSchema = z.object({
  answerType: z.string().nullable().optional(),
  id: z.string().min(1),
  prompt: z.string().min(1),
  reason: z.string().nullable().optional(),
});

const clarityAnswerSchema = z.object({
  answer: z.string().min(1),
  questionId: z.string().min(1),
});

const clarityQuestionGroupSchema = z.object({
  answers: z.array(clarityAnswerSchema).optional(),
  id: z.string().min(1),
  questions: z.array(clarityQuestionSchema).min(1),
  reviewMessage: z.string().nullable().optional(),
  round: z.number().int().min(1),
  source: z.enum(["initial", "user_bonus", "clarity_more_needed"]),
  status: z.enum(["questions_ready", "answers_submitted", "waiting_for_questions"]).optional(),
});

const clarityIntakeRequestInputSchema = z.object({
  chapterId: z.string().min(1).default("clarity"),
  chapterTitle: z.string().min(1).default("Chapter 1: Spark Library"),
  project: z.object({
    description: z.string().optional(),
    ideaType: z.string().optional(),
    intakeText: z.string().optional(),
    projectId: z.string().min(1),
    title: z.string().min(1),
  }),
  requestedQuestionCount: z.number().int().min(1).max(10).default(5),
});

const clarityBonusRequestInputSchema = z.object({
  chapterId: z.string().min(1).default("clarity"),
  chapterTitle: z.string().min(1).default("Chapter 1: Spark Library"),
  previousAnswers: z.array(clarityAnswerSchema).optional(),
  previousQuestionGroups: z.array(clarityQuestionGroupSchema).optional(),
  project: z.object({
    description: z.string().optional(),
    ideaType: z.string().optional(),
    intakeText: z.string().optional(),
    projectId: z.string().min(1),
    title: z.string().min(1),
  }),
  reason: z.enum(["user_bonus", "clarity_more_needed"]).default("user_bonus"),
  requestedQuestionCount: z.literal(5).default(5),
  round: z.number().int().min(2),
});

const clarityAnswerSubmissionInputSchema = z.object({
  answers: z.array(clarityAnswerSchema).min(1),
  chapterId: z.string().min(1).default("clarity"),
  questionGroupId: z.string().min(1).optional(),
  questionGroups: z.array(clarityQuestionGroupSchema).optional(),
  questionRound: z.number().int().min(1).default(1),
  project: z.object({
    description: z.string().optional(),
    ideaType: z.string().optional(),
    intakeText: z.string().optional(),
    projectId: z.string().min(1),
    title: z.string().min(1),
  }),
  questions: z.array(clarityQuestionSchema).optional(),
});

const chapterReviewCompletionInputSchema = z.object({
  actor: z.string().min(1).default("Treehouse"),
  chapterId: z.string().min(1),
  chapterTitle: z.string().min(1),
  nextChapterId: z.string().min(1).nullable().optional(),
  nextChapterTitle: z.string().min(1).nullable().optional(),
  project: projectInputSchema,
  reviewAction: z.string().min(1).default("user_finished_chapter_review"),
});

const chapterActivityStatusSchema = z.enum(["bots_running", "needs_question", "next_ready"]);

const chapterActivityLookupSchema = z.object({
  projectId: z.string().min(1),
});

const chapterActivityUpdateSchema = z.object({
  activeQuestionGroupId: z.string().min(1).nullable().optional(),
  answers: z.array(clarityAnswerSchema).optional(),
  canRequestBonusQuestions: z.boolean().optional(),
  clarityNeedsMoreQuestions: z.boolean().optional(),
  clarityReviewMessage: z.string().nullable().optional(),
  currentChapterId: z.string().min(1).nullable().optional(),
  message: z.string().nullable().optional(),
  nextChapterId: z.string().min(1).nullable().optional(),
  projectId: z.string().min(1),
  question: z.string().nullable().optional(),
  questionGroups: z.array(clarityQuestionGroupSchema).optional(),
  questions: z.array(clarityQuestionSchema).optional(),
  source: z.string().min(1).default("dabottree-app-server"),
  status: chapterActivityStatusSchema,
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

async function postLiveN8n(payload: unknown): Promise<TreehouseN8nTriggerResult> {
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
      body: JSON.stringify(payload),
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

async function triggerLiveN8n(packet: unknown): Promise<TreehouseN8nTriggerResult> {
  return postLiveN8n({
    event: "treehouse_task_packet_created",
    source: "dabottree-app-server",
    triggerIntent: "live_treehouse_button_handoff",
    packet,
  });
}

export const createTreehouseTaskPacket = createServerFn({ method: "POST" })
  .inputValidator(taskPacketInputSchema)
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

export const requestClarityIntakeQuestions = createServerFn({ method: "POST" })
  .validator(clarityIntakeRequestInputSchema)
  .handler(async ({ data }) => {
    const requestId = `clarity-intake-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID()}`;
    const event = {
      event: "treehouse_clarity_intake_requested",
      requestId,
      source: "dabottree-app-server",
      triggerIntent: "chapter_1_steward_ping_clarity_questions",
      chapterId: data.chapterId,
      chapterTitle: data.chapterTitle,
      requestedBot: "Steward",
      stewardAction: "ping_clarity_for_five_unique_questions",
      targetBot: "Clarity",
      requestedQuestionCount: data.requestedQuestionCount,
      requiredOutput: {
        format: "json",
        groupSize: 5,
        questions: [
          {
            id: "string",
            prompt: "project-specific question from real Clarity via Steward",
            reason: "why this question strengthens the project base",
            answerType: "short_text | paragraph | choice | list",
          },
        ],
        review: {
          canRequestBonusQuestions: true,
          clarityNeedsMoreQuestions: false,
          clarityReviewMessage:
            "If Clarity needs another group after the first answers, she says she has five more.",
        },
      },
      project: data.project,
      boundary:
        "Chapter 1 Clarity intake request. Sends the idea packet to the approved dabottree n8n webhook when configured. Does not deploy, spend, publish, or change runtime/config/authority.",
    };

    await writeTreehouseChapterActivity({
      currentChapterId: data.chapterId,
      message:
        "Steward is sending the intake to Clarity for five project-specific questions.",
      projectId: data.project.projectId,
      source: "dabottree-clarity-intake-request",
      status: "bots_running",
    });

    const n8nTrigger = await postLiveN8n(event);
    return {
      n8nTriggerStatus: n8nTrigger.status,
      requestId,
      status:
        n8nTrigger.status === "triggered_live_n8n"
          ? "clarity_request_sent_to_n8n"
          : n8nTrigger.status === "live_n8n_failed"
            ? "clarity_request_n8n_failed"
            : "clarity_request_created_local_only",
    };
  });

export const requestClarityBonusQuestions = createServerFn({ method: "POST" })
  .validator(clarityBonusRequestInputSchema)
  .handler(async ({ data }) => {
    const requestId = `clarity-next-five-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID()}`;
    const event = {
      event: "treehouse_clarity_bonus_questions_requested",
      requestId,
      source: "dabottree-app-server",
      triggerIntent: "chapter_1_steward_ping_clarity_next_five",
      chapterId: data.chapterId,
      chapterTitle: data.chapterTitle,
      requestedBot: "Steward",
      stewardAction: "ping_clarity_for_next_five_questions",
      targetBot: "Clarity",
      questionGroup: {
        requestedQuestionCount: 5,
        reason: data.reason,
        round: data.round,
      },
      previousAnswers: data.previousAnswers ?? [],
      previousQuestionGroups: data.previousQuestionGroups ?? [],
      requiredOutput: {
        format: "json",
        groupSize: 5,
        questions: [
          {
            id: "string",
            prompt: "next project-specific question from real Clarity via Steward",
            reason: "why this additional question strengthens the project base",
            answerType: "short_text | paragraph | choice | list",
          },
        ],
        review: {
          canRequestBonusQuestions: true,
          clarityNeedsMoreQuestions: data.reason === "clarity_more_needed",
          clarityReviewMessage:
            data.reason === "clarity_more_needed"
              ? "Clarity says she has five more before this base is strong enough."
              : "The user asked Clarity for five bonus questions.",
        },
      },
      project: data.project,
      boundary:
        "Chapter 1 Clarity next-five request. Steward owns the ping to Clarity. Sends only to the approved dabottree n8n webhook when configured. Does not deploy, spend, publish, or change runtime/config/authority.",
    };

    await writeTreehouseChapterActivity({
      activeQuestionGroupId: `clarity-round-${data.round}`,
      canRequestBonusQuestions: false,
      clarityNeedsMoreQuestions: data.reason === "clarity_more_needed",
      clarityReviewMessage:
        data.reason === "clarity_more_needed"
          ? "Clarity says she has five more."
          : "Steward is asking Clarity for five bonus questions.",
      currentChapterId: data.chapterId,
      message:
        data.reason === "clarity_more_needed"
          ? "Steward is sending Clarity's next-five request."
          : "Steward is asking Clarity for five bonus questions.",
      projectId: data.project.projectId,
      questionGroups: [
        ...(data.previousQuestionGroups ?? []),
        {
          id: `clarity-round-${data.round}`,
          questions: [],
          reviewMessage:
            data.reason === "clarity_more_needed"
              ? "Clarity says she has five more."
              : "Waiting on Clarity's five bonus questions.",
          round: data.round,
          source: data.reason,
          status: "waiting_for_questions" as const,
        },
      ],
      source: "dabottree-clarity-next-five-request",
      status: "bots_running",
    });

    const n8nTrigger = await postLiveN8n(event);
    return {
      n8nTriggerStatus: n8nTrigger.status,
      requestId,
      status:
        n8nTrigger.status === "triggered_live_n8n"
          ? "clarity_next_five_request_sent_to_n8n"
          : n8nTrigger.status === "live_n8n_failed"
            ? "clarity_next_five_request_n8n_failed"
            : "clarity_next_five_request_created_local_only",
    };
  });

export const submitClarityQuestionAnswers = createServerFn({ method: "POST" })
  .validator(clarityAnswerSubmissionInputSchema)
  .handler(async ({ data }) => {
    const submissionId = `clarity-answers-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID()}`;
    const event = {
      event: "treehouse_clarity_answers_submitted",
      submissionId,
      source: "dabottree-app-server",
      triggerIntent: "chapter_1_steward_clarity_answers",
      chapterId: data.chapterId,
      requestedBot: "Steward",
      stewardAction: "send_clarity_answers_to_admin_packet",
      targetBot: "Clarity",
      project: data.project,
      questionGroupId: data.questionGroupId ?? null,
      questionRound: data.questionRound,
      questionGroups: data.questionGroups ?? [],
      questions: data.questions ?? [],
      answers: data.answers,
      nextStepContract: {
        groupSize: 5,
        ifClarityNeedsMore: "return clarityNeedsMoreQuestions=true with five more questions",
        ifUserWantsBonus:
          "app may send treehouse_clarity_bonus_questions_requested for the next group of five",
      },
      boundary:
        "Chapter 1 Clarity answer submission. Sends user answers to the approved dabottree n8n webhook when configured. Does not deploy, spend, publish, or change runtime/config/authority.",
    };

    const submittedGroups =
      data.questionGroups?.map((group) =>
        group.id === data.questionGroupId
          ? { ...group, answers: data.answers, status: "answers_submitted" as const }
          : group,
      ) ?? [];

    await writeTreehouseChapterActivity({
      answers: data.answers,
      canRequestBonusQuestions: true,
      clarityNeedsMoreQuestions: false,
      clarityReviewMessage:
        "Clarity has this group of five. If she needs more, her review can return another five; the user can also ask for five bonus questions.",
      currentChapterId: data.chapterId,
      message:
        "Clarity answers submitted for this group of five. Bonus questions are available in another group of five.",
      projectId: data.project.projectId,
      questionGroups: submittedGroups.length > 0 ? submittedGroups : undefined,
      questions: data.questions ?? [],
      source: "dabottree-clarity-answer-submit",
      status: "next_ready",
    });

    const n8nTrigger = await postLiveN8n(event);
    return {
      n8nTriggerStatus: n8nTrigger.status,
      status:
        n8nTrigger.status === "triggered_live_n8n"
          ? "clarity_answers_sent_to_n8n"
          : n8nTrigger.status === "live_n8n_failed"
            ? "clarity_answers_n8n_failed"
            : "clarity_answers_saved_local_only",
      submissionId,
    };
  });

export const completeTreehouseChapterReview = createServerFn({ method: "POST" })
  .validator(chapterReviewCompletionInputSchema)
  .handler(async ({ data }) => {
    const receiptId = `treehouse-chapter-complete-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID()}`;
    const filename = `${receiptId}-${safeSlug(data.chapterId)}.json`;
    const receiptPath = path.join(CHAPTER_EVENT_DIR, filename);
    const completedAt = new Date().toISOString();
    const receipt = {
      receiptId,
      completedAt,
      event: "treehouse_chapter_completed",
      source: "dabottree-dashboard-review-finish",
      status: "created_local_only",
      reviewAction: data.reviewAction,
      actor: data.actor,
      currentChapter: data.chapterId,
      currentChapterId: data.chapterId,
      completedChapterId: data.chapterId,
      completedChapterTitle: data.chapterTitle,
      nextChapterId: data.nextChapterId ?? null,
      nextChapterTitle: data.nextChapterTitle ?? null,
      idea: data.project ?? null,
      project: data.project ?? null,
      boundary:
        "Chapter review completion receipt. Local dev/tests do not fire n8n. When configured, the server may POST only to the approved dabottree n8n webhook; it does not deploy, spend, publish, or change runtime/config/authority.",
    };

    await fs.mkdir(CHAPTER_EVENT_DIR, { recursive: true });
    await fs.writeFile(receiptPath, JSON.stringify(receipt, null, 2) + "\n", "utf8");
    if (data.project?.projectId) {
      await writeTreehouseChapterActivity({
        currentChapterId: data.chapterId,
        message: data.nextChapterId
          ? `Waiting for ${data.nextChapterTitle ?? data.nextChapterId} to be ready.`
          : "Chapter path complete.",
        nextChapterId: data.nextChapterId ?? null,
        projectId: data.project.projectId,
        source: "dabottree-dashboard-review-finish",
        status: data.nextChapterId ? "bots_running" : "next_ready",
      });
    }

    const n8nTrigger = await postLiveN8n({
      event: "treehouse_chapter_completed",
      source: "dabottree-app-server",
      triggerIntent: "treehouse_review_finished_chapter_gate",
      currentChapter: data.chapterId,
      currentChapterId: data.chapterId,
      completedChapterId: data.chapterId,
      completedChapterTitle: data.chapterTitle,
      nextChapterId: data.nextChapterId ?? null,
      nextChapterTitle: data.nextChapterTitle ?? null,
      status: "completed",
      idea: data.project ?? null,
      project: data.project ?? null,
      receipt,
    });

    if (n8nTrigger.status !== "not_triggered") {
      const triggeredReceipt = {
        ...receipt,
        status:
          n8nTrigger.status === "triggered_live_n8n"
            ? "created_and_sent_to_live_n8n"
            : "created_live_n8n_send_failed",
        n8n: {
          trigger: n8nTrigger,
          triggerStatus: n8nTrigger.status,
        },
      };
      await fs.writeFile(receiptPath, JSON.stringify(triggeredReceipt, null, 2) + "\n", "utf8");

      return {
        n8nTriggerStatus: n8nTrigger.status,
        receiptId,
        receiptPath,
        status: triggeredReceipt.status,
      };
    }

    return {
      n8nTriggerStatus: n8nTrigger.status,
      receiptId,
      receiptPath,
      status: receipt.status,
    };
  });

export const getTreehouseChapterActivity = createServerFn({ method: "POST" })
  .validator(chapterActivityLookupSchema)
  .handler(async ({ data }) => {
    return {
      activity: await readTreehouseChapterActivity(data.projectId),
    };
  });

export const updateTreehouseChapterActivity = createServerFn({ method: "POST" })
  .validator(chapterActivityUpdateSchema)
  .handler(async ({ data }) => {
    return {
      activity: await writeTreehouseChapterActivity(data),
    };
  });
