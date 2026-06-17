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

export type TreehouseChapterActivityRecord = {
  answers?: TreehouseClarityAnswer[];
  createdAt: string;
  currentChapterId?: string | null;
  message?: string | null;
  nextChapterId?: string | null;
  projectId: string;
  question?: string | null;
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
  answers?: TreehouseClarityAnswer[];
  currentChapterId?: string | null;
  message?: string | null;
  nextChapterId?: string | null;
  projectId: string;
  question?: string | null;
  questions?: TreehouseClarityQuestion[];
  source?: string;
  status: TreehouseChapterActivityStatus;
}): Promise<TreehouseChapterActivityRecord> {
  const existing = await readTreehouseChapterActivity(input.projectId);
  const now = new Date().toISOString();
  const record: TreehouseChapterActivityRecord = {
    createdAt: existing?.createdAt ?? now,
    currentChapterId: input.currentChapterId ?? existing?.currentChapterId ?? null,
    message: input.message ?? null,
    nextChapterId: input.nextChapterId ?? existing?.nextChapterId ?? null,
    projectId: input.projectId,
    question: input.question ?? null,
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
