import fs from "node:fs/promises";
import path from "node:path";

export type TreehouseChapterActivityStatus = "bots_running" | "needs_question" | "next_ready";

export type TreehouseClarityQuestion = {
  id: string;
  prompt: string;
  reason?: string | null;
  answerType?: string | null;
};

export type TreehouseClarityAnswer = {
  questionId: string;
  answer: string;
};

export type TreehouseClarityQuestionGroupSource =
  | "initial"
  | "user_bonus"
  | "clarity_more_needed";

export type TreehouseClarityQuestionGroup = {
  answers?: TreehouseClarityAnswer[];
  id: string;
  questions: TreehouseClarityQuestion[];
  reviewMessage?: string | null;
  round: number;
  source: TreehouseClarityQuestionGroupSource;
  status?: "questions_ready" | "answers_submitted" | "waiting_for_questions";
};

export type TreehouseChapterActivityRecord = {
  answers?: TreehouseClarityAnswer[];
  activeQuestionGroupId?: string | null;
  canRequestBonusQuestions?: boolean;
  clarityNeedsMoreQuestions?: boolean;
  clarityReviewMessage?: string | null;
  createdAt: string;
  currentChapterId?: string | null;
  message?: string | null;
  nextChapterId?: string | null;
  projectId: string;
  question?: string | null;
  questionGroups?: TreehouseClarityQuestionGroup[];
  questions?: TreehouseClarityQuestion[];
  source: string;
  status: TreehouseChapterActivityStatus;
  updatedAt: string;
};

const CHAPTER_ACTIVITY_DIR =
  process.env.TREEHOUSE_CHAPTER_ACTIVITY_DIR ??
  process.env.TREEHOUSE_CHAPTER_ACTIVITY_DIR ??
  path.resolve(process.cwd(), "var/treehouse/chapter-activity");

function safeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function activityPath(projectId: string): string {
  return path.join(CHAPTER_ACTIVITY_DIR, `${safeSlug(projectId)}.json`);
}

export async function readTreehouseChapterActivity(
  projectId: string,
): Promise<TreehouseChapterActivityRecord | null> {
  try {
    const raw = await fs.readFile(activityPath(projectId), "utf8");
    return JSON.parse(raw) as TreehouseChapterActivityRecord;
  } catch {
    return null;
  }
}

export async function writeTreehouseChapterActivity(input: {
  activeQuestionGroupId?: string | null;
  answers?: TreehouseClarityAnswer[];
  canRequestBonusQuestions?: boolean;
  clarityNeedsMoreQuestions?: boolean;
  clarityReviewMessage?: string | null;
  currentChapterId?: string | null;
  message?: string | null;
  nextChapterId?: string | null;
  projectId: string;
  question?: string | null;
  questionGroups?: TreehouseClarityQuestionGroup[];
  questions?: TreehouseClarityQuestion[];
  source?: string;
  status: TreehouseChapterActivityStatus;
}): Promise<TreehouseChapterActivityRecord> {
  const existing = await readTreehouseChapterActivity(input.projectId);
  const now = new Date().toISOString();
  const record: TreehouseChapterActivityRecord = {
    createdAt: existing?.createdAt ?? now,
    activeQuestionGroupId:
      input.activeQuestionGroupId ?? existing?.activeQuestionGroupId ?? null,
    canRequestBonusQuestions:
      input.canRequestBonusQuestions ?? existing?.canRequestBonusQuestions ?? false,
    clarityNeedsMoreQuestions:
      input.clarityNeedsMoreQuestions ?? existing?.clarityNeedsMoreQuestions ?? false,
    clarityReviewMessage: input.clarityReviewMessage ?? existing?.clarityReviewMessage ?? null,
    currentChapterId: input.currentChapterId ?? existing?.currentChapterId ?? null,
    message: input.message ?? null,
    nextChapterId: input.nextChapterId ?? existing?.nextChapterId ?? null,
    projectId: input.projectId,
    question: input.question ?? null,
    questionGroups: input.questionGroups ?? existing?.questionGroups ?? [],
    questions: input.questions ?? existing?.questions ?? [],
    answers: input.answers ?? existing?.answers ?? [],
    source: input.source ?? "treehouse-chapter-activity",
    status: input.status,
    updatedAt: now,
  };

  await fs.mkdir(CHAPTER_ACTIVITY_DIR, { recursive: true });
  await fs.writeFile(activityPath(input.projectId), JSON.stringify(record, null, 2) + "\n", "utf8");
  return record;
}
