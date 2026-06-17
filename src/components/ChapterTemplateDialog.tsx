import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import compassAsset from "@/assets/compass-stag.png.asset.json";
import demoGuideAsset from "@/assets/trunk-green-guide-cutout.png.asset.json";
import echoAsset from "@/assets/echo-presenting.png.asset.json";
import ledgerAsset from "@/assets/ledger-presenting.png.asset.json";
import shieldAsset from "@/assets/shield-presenting.png.asset.json";
import {
  createTreehouseTaskPacket,
  getTreehouseChapterActivity,
  requestClarityBonusQuestions,
  requestClarityIntakeQuestions,
  submitClarityQuestionAnswers,
} from "@/lib/api/treehouse-task-packets.functions";
import {
  TREEHOUSE_CHAPTER_TEMPLATES,
  chapterTemplateById,
  nextChapterTemplate,
  primaryChapterGuideName,
  type TreehouseChapterTemplate,
} from "@/lib/treehouse-chapter-templates";

type ChapterTemplateDialogProps = {
  ideaDescription?: string;
  ideaId?: string;
  ideaIntakeText?: string;
  ideaTitle?: string;
  ideaType?: string;
  chapterId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDemoComplete?: (chapterId: string) => void | Promise<void>;
};

type RootRoomRunStatus = "idle" | "running" | "complete";
type RootRoomHandoffStatus = "idle" | "creating" | "created" | "local-fallback";
type ClarityQuestion = {
  answerType?: string | null;
  id: string;
  prompt: string;
  reason?: string | null;
};
type ClarityAnswer = {
  answer: string;
  questionId: string;
};
type ClarityQuestionGroup = {
  answers?: ClarityAnswer[];
  id: string;
  questions: ClarityQuestion[];
  reviewMessage?: string | null;
  round: number;
  source: "initial" | "user_bonus" | "clarity_more_needed";
  status?: "questions_ready" | "answers_submitted" | "waiting_for_questions";
};
type ClarityRequestStatus = "idle" | "requesting" | "waiting" | "questions-ready" | "submitted" | "error";

const ROOT_ROOM_STORY_STEPS = ["Echo", "Shield", "Ledger", "Chief"];
const ROOT_ROOM_N8N_TEST_ANCHOR =
  "7.2 Prepare Echo Perspective Scan / 7.3 Prepare Chief Project Setup Packet / 7.4 Prepare Ledger Baseline Record / 7.5 Prepare Shield Safety Review";

export function ChapterTemplateDialog({
  ideaDescription,
  ideaId,
  ideaIntakeText,
  ideaTitle,
  ideaType,
  chapterId,
  open,
  onOpenChange,
  onDemoComplete,
}: ChapterTemplateDialogProps) {
  const chapter = chapterTemplateById(chapterId) ?? TREEHOUSE_CHAPTER_TEMPLATES[0];
  const ideaKey = useMemo(() => ideaId || ideaTitle || "untitled", [ideaId, ideaTitle]);
  const demoStorageKey = useMemo(() => {
    return `dabottree:chapter-demo:${ideaKey}:${chapter.id}`;
  }, [chapter.id, ideaKey]);
  const rootRoomRunStorageKey = useMemo(() => {
    return `dabottree:chapter-run-demo:${ideaKey}:${chapter.id}`;
  }, [chapter.id, ideaKey]);
  const [demoComplete, setDemoComplete] = useState(false);
  const [rootRoomRunStatus, setRootRoomRunStatus] = useState<RootRoomRunStatus>("idle");
  const [rootRoomRunStep, setRootRoomRunStep] = useState(0);
  const [rootRoomHandoffStatus, setRootRoomHandoffStatus] = useState<RootRoomHandoffStatus>("idle");
  const [rootRoomPacketId, setRootRoomPacketId] = useState<string | null>(null);
  const [clarityStatus, setClarityStatus] = useState<ClarityRequestStatus>("idle");
  const [clarityQuestions, setClarityQuestions] = useState<ClarityQuestion[]>([]);
  const [clarityQuestionGroups, setClarityQuestionGroups] = useState<ClarityQuestionGroup[]>([]);
  const [activeClarityGroupId, setActiveClarityGroupId] = useState<string | null>(null);
  const [clarityAnswers, setClarityAnswers] = useState<Record<string, string>>({});
  const [canRequestBonusQuestions, setCanRequestBonusQuestions] = useState(false);
  const [clarityNeedsMoreQuestions, setClarityNeedsMoreQuestions] = useState(false);
  const [clarityReviewMessage, setClarityReviewMessage] = useState<string | null>(null);
  const [clarityMessage, setClarityMessage] = useState<string | null>(null);
  const isRootRoomChapter = chapter.id === "root-room";
  const isClarityChapter = chapter.id === "clarity";
  const nextChapter = nextChapterTemplate(chapter.id);
  const forwardActionLabel = nextChapter
    ? `Finish Review`
    : `Finish Chapter ${chapter.chapter}`;

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    setDemoComplete(window.localStorage.getItem(demoStorageKey) === "complete");
    if (!isRootRoomChapter) {
      setRootRoomRunStatus("idle");
      setRootRoomRunStep(0);
      setRootRoomHandoffStatus("idle");
      setRootRoomPacketId(null);
      return;
    }
    const storedRunStatus = window.localStorage.getItem(rootRoomRunStorageKey);
    const storedPacketId = window.localStorage.getItem(`${rootRoomRunStorageKey}:packetId`);
    setRootRoomRunStatus(storedRunStatus === "complete" ? "complete" : "idle");
    setRootRoomRunStep(storedRunStatus === "complete" ? ROOT_ROOM_STORY_STEPS.length - 1 : 0);
    setRootRoomPacketId(storedPacketId);
    setRootRoomHandoffStatus(storedPacketId ? "created" : "idle");
  }, [demoStorageKey, isRootRoomChapter, open, rootRoomRunStorageKey]);

  useEffect(() => {
    if (!open || !isClarityChapter || !ideaId) return;
    let cancelled = false;

    const requestKey = `${demoStorageKey}:clarity-requested`;
    const requestClarity = async () => {
      if (typeof window !== "undefined" && window.localStorage.getItem(requestKey)) {
        setClarityStatus("waiting");
        return;
      }

      setClarityStatus("requesting");
      setClarityMessage("Steward is sending the intake to Clarity.");
      try {
        const result = await requestClarityIntakeQuestions({
          data: {
            chapterId: chapter.id,
            chapterTitle: `Chapter ${chapter.chapter}: ${chapter.title}`,
            project: {
              description: ideaDescription || ideaIntakeText || "",
              ideaType: ideaType || "",
              intakeText: ideaIntakeText || ideaDescription || "",
              projectId: ideaId,
              title: ideaTitle || "Untitled idea",
            },
            requestedQuestionCount: 5,
          },
        });
        if (cancelled) return;
        if (typeof window !== "undefined") {
          window.localStorage.setItem(requestKey, result.requestId);
        }
        setClarityStatus("waiting");
        setClarityMessage(
          "Steward has pinged Clarity. Waiting for her five project questions.",
        );
      } catch {
        if (cancelled) return;
        setClarityStatus("error");
        setClarityMessage("The Clarity request could not be sent yet.");
      }
    };

    void requestClarity();
    return () => {
      cancelled = true;
    };
  }, [
    chapter.chapter,
    chapter.id,
    chapter.title,
    demoStorageKey,
    ideaDescription,
    ideaId,
    ideaIntakeText,
    ideaTitle,
    ideaType,
    isClarityChapter,
    open,
  ]);

  useEffect(() => {
    if (!open || !isClarityChapter || !ideaId) return;
    let cancelled = false;

    const syncClarityActivity = async () => {
      const result = await getTreehouseChapterActivity({
        data: { projectId: ideaId },
      }).catch(() => null);
      if (cancelled || !result?.activity) return;

      const activity = result.activity as {
        activeQuestionGroupId?: string | null;
        answers?: ClarityAnswer[];
        canRequestBonusQuestions?: boolean;
        clarityNeedsMoreQuestions?: boolean;
        clarityReviewMessage?: string | null;
        message?: string | null;
        questionGroups?: ClarityQuestionGroup[];
        questions?: ClarityQuestion[];
        status?: string;
      };
      if (activity.message) setClarityMessage(activity.message);
      setCanRequestBonusQuestions(Boolean(activity.canRequestBonusQuestions));
      setClarityNeedsMoreQuestions(Boolean(activity.clarityNeedsMoreQuestions));
      setClarityReviewMessage(activity.clarityReviewMessage ?? null);
      if (Array.isArray(activity.questionGroups) && activity.questionGroups.length > 0) {
        const groups = activity.questionGroups;
        const activeGroup =
          groups.find((group) => group.id === activity.activeQuestionGroupId) ??
          [...groups].reverse().find((group) => group.questions.length > 0) ??
          groups[groups.length - 1];
        setClarityQuestionGroups(groups);
        setActiveClarityGroupId(activeGroup?.id ?? null);
        if (activeGroup?.questions.length) {
          setClarityQuestions(activeGroup.questions.slice(0, 5));
          setClarityStatus(activity.status === "next_ready" ? "submitted" : "questions-ready");
        }
      }
      if (Array.isArray(activity.questions) && activity.questions.length > 0) {
        setClarityQuestions(activity.questions.slice(0, 5));
        if (activity.questionGroups?.length === 0 || !activity.questionGroups) {
          const initialGroup = {
            id: "clarity-round-1",
            questions: activity.questions.slice(0, 5),
            reviewMessage: activity.clarityReviewMessage ?? null,
            round: 1,
            source: "initial" as const,
            status:
              activity.status === "next_ready"
                ? ("answers_submitted" as const)
                : ("questions_ready" as const),
          };
          setClarityQuestionGroups([initialGroup]);
          setActiveClarityGroupId(initialGroup.id);
        }
        setClarityStatus(activity.status === "next_ready" ? "submitted" : "questions-ready");
      } else if (activity.status === "bots_running") {
        setClarityStatus("waiting");
      }
      if (Array.isArray(activity.answers) && activity.answers.length > 0) {
        setClarityAnswers(
          Object.fromEntries(activity.answers.map((answer) => [answer.questionId, answer.answer])),
        );
      }
    };

    void syncClarityActivity();
    const interval = window.setInterval(() => void syncClarityActivity(), 5_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [clarityStatus, ideaId, isClarityChapter, open]);

  const markDemoComplete = async () => {
    setDemoComplete(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(demoStorageKey, "complete");
    }
    await onDemoComplete?.(chapter.id);
  };

  const continueChapter = async () => {
    await markDemoComplete();
    onOpenChange(false);
  };

  const startRootRoomRun = async () => {
    if (!isRootRoomChapter || rootRoomRunStatus === "running" || demoComplete) return;

    setRootRoomHandoffStatus("creating");
    setRootRoomPacketId(null);

    try {
      const packet = await createTreehouseTaskPacket({
        data: {
          actor: "Steward",
          chapterId: chapter.id,
          chapterTitle: `Chapter ${chapter.chapter}: ${chapter.title}`,
          n8nAnchor: ROOT_ROOM_N8N_TEST_ANCHOR,
          partId: "root-room-go-test",
          partTitle: "Root Room inactive n8n test doorway",
          project: {
            projectId: ideaKey,
            title: ideaTitle || "Untitled idea",
          },
          reportSourceKey: "root_room_inactive_test_handoff",
          requestedAction: "root_room_inactive_test_handoff",
        },
      });
      setRootRoomPacketId(packet.packetId);
      setRootRoomHandoffStatus("created");
      if (typeof window !== "undefined") {
        window.localStorage.setItem(`${rootRoomRunStorageKey}:packetId`, packet.packetId);
      }
    } catch {
      setRootRoomHandoffStatus("local-fallback");
    }

    setRootRoomRunStatus("running");
    setRootRoomRunStep(0);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(rootRoomRunStorageKey, "running");
    }

    ROOT_ROOM_STORY_STEPS.forEach((_, index) => {
      window.setTimeout(
        () => {
          setRootRoomRunStep(index);
        },
        450 * (index + 1),
      );
    });

    window.setTimeout(
      () => {
        setRootRoomRunStatus("complete");
        setRootRoomRunStep(ROOT_ROOM_STORY_STEPS.length - 1);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(rootRoomRunStorageKey, "complete");
        }

        window.setTimeout(() => {
          void markDemoComplete();
        }, 650);
      },
      450 * (ROOT_ROOM_STORY_STEPS.length + 1),
    );
  };

  const submitClarityAnswers = async () => {
    if (!ideaId || clarityQuestions.length === 0) return;
    const questionGroupId =
      activeClarityGroupId ?? `clarity-round-${clarityQuestionGroups.length || 1}`;
    const currentRound =
      clarityQuestionGroups.find((group) => group.id === questionGroupId)?.round ??
      (clarityQuestionGroups.length || 1);
    const answers = clarityQuestions
      .map((question) => ({
        questionId: question.id,
        answer: clarityAnswers[question.id]?.trim() ?? "",
      }))
      .filter((answer) => answer.answer);
    if (answers.length !== clarityQuestions.length) return;

    setClarityStatus("requesting");
    setClarityMessage("Sending Clarity your answers.");
    try {
      await submitClarityQuestionAnswers({
        data: {
          answers,
          chapterId: chapter.id,
          project: {
            description: ideaDescription || ideaIntakeText || "",
            ideaType: ideaType || "",
            intakeText: ideaIntakeText || ideaDescription || "",
            projectId: ideaId,
            title: ideaTitle || "Untitled idea",
          },
          questionGroupId,
          questionGroups:
            clarityQuestionGroups.length > 0
              ? clarityQuestionGroups
              : [
                  {
                    id: questionGroupId,
                    questions: clarityQuestions,
                    round: currentRound,
                    source: "initial",
                    status: "questions_ready",
                  },
                ],
          questionRound: currentRound,
          questions: clarityQuestions,
        },
      });
      setClarityStatus("submitted");
      setCanRequestBonusQuestions(true);
      setClarityMessage("Clarity answers are saved to the Chapter 1 packet.");
      setClarityReviewMessage(
        "Clarity has this group of five. If she needs more, her review can return five more. You can also ask for five bonus questions.",
      );
    } catch {
      setClarityStatus("error");
      setClarityMessage("The Clarity answers could not be submitted yet.");
    }
  };

  const requestMoreClarityQuestions = async (
    reason: "user_bonus" | "clarity_more_needed" = "user_bonus",
  ) => {
    if (!ideaId) return;
    const nextRound = Math.max(1, ...clarityQuestionGroups.map((group) => group.round)) + 1;
    setClarityStatus("requesting");
    setCanRequestBonusQuestions(false);
    setClarityNeedsMoreQuestions(reason === "clarity_more_needed");
    setClarityMessage(
      reason === "clarity_more_needed"
        ? "Steward is sending Clarity's next-five request."
        : "Steward is asking Clarity for five bonus questions.",
    );
    try {
      await requestClarityBonusQuestions({
        data: {
          chapterId: chapter.id,
          chapterTitle: `Chapter ${chapter.chapter}: ${chapter.title}`,
          previousAnswers: clarityQuestions
            .map((question) => ({
              questionId: question.id,
              answer: clarityAnswers[question.id]?.trim() ?? "",
            }))
            .filter((answer) => answer.answer),
          previousQuestionGroups: clarityQuestionGroups,
          project: {
            description: ideaDescription || ideaIntakeText || "",
            ideaType: ideaType || "",
            intakeText: ideaIntakeText || ideaDescription || "",
            projectId: ideaId,
            title: ideaTitle || "Untitled idea",
          },
          reason,
          requestedQuestionCount: 5,
          round: nextRound,
        },
      });
      setClarityQuestions([]);
      setActiveClarityGroupId(`clarity-round-${nextRound}`);
      setClarityStatus("waiting");
    } catch {
      setClarityStatus("error");
      setCanRequestBonusQuestions(true);
      setClarityMessage("The next five Clarity questions could not be requested yet.");
    }
  };

  const canContinueChapter =
    !isClarityChapter ||
    ((clarityStatus === "submitted" || demoComplete) && !clarityNeedsMoreQuestions);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl overflow-hidden border-amber-900/35 bg-[#f3dfb4] p-0 text-amber-950">
        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-0 opacity-50"
            style={{
              background:
                "radial-gradient(circle at 24% 20%, rgba(255,245,205,0.8), transparent 32%), linear-gradient(135deg, rgba(96,54,19,0.18), transparent 44%, rgba(58,31,12,0.24))",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(rgba(112,68,24,0.22) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          />
          <div className="relative grid max-h-[85vh] overflow-y-auto md:grid-cols-[240px_1fr]">
            <DemoGuidePanel
              chapter={chapter}
              forwardActionLabel={forwardActionLabel}
              demoComplete={demoComplete}
              canContinueChapter={canContinueChapter}
              onChapterContinue={() => {
                if (canContinueChapter) void continueChapter();
              }}
            />
            <ChapterTemplateBody
              ideaTitle={ideaTitle}
              chapter={chapter}
              nextChapter={nextChapter}
              forwardActionLabel={forwardActionLabel}
              demoComplete={demoComplete}
              onChapterContinue={continueChapter}
              rootRoomRunStatus={rootRoomRunStatus}
              rootRoomRunStep={rootRoomRunStep}
              rootRoomHandoffStatus={rootRoomHandoffStatus}
              rootRoomPacketId={rootRoomPacketId}
              onStartRootRoomRun={startRootRoomRun}
              clarityStatus={clarityStatus}
              clarityQuestions={clarityQuestions}
              clarityQuestionGroups={clarityQuestionGroups}
              clarityAnswers={clarityAnswers}
              clarityMessage={clarityMessage}
              clarityReviewMessage={clarityReviewMessage}
              canRequestBonusQuestions={canRequestBonusQuestions}
              clarityNeedsMoreQuestions={clarityNeedsMoreQuestions}
              canContinueChapter={canContinueChapter}
              onClarityAnswerChange={(questionId, answer) =>
                setClarityAnswers((prev) => ({ ...prev, [questionId]: answer }))
              }
              onRequestMoreClarityQuestions={requestMoreClarityQuestions}
              onSubmitClarityAnswers={submitClarityAnswers}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const guideAssets: Record<string, string> = {
  Compass: compassAsset.url,
  Echo: echoAsset.url,
  Ledger: ledgerAsset.url,
  Shield: shieldAsset.url,
};

function DemoGuidePanel({
  chapter,
  forwardActionLabel,
  demoComplete,
  canContinueChapter,
  onChapterContinue,
}: {
  chapter: TreehouseChapterTemplate;
  forwardActionLabel: string;
  demoComplete: boolean;
  canContinueChapter: boolean;
  onChapterContinue: () => void;
}) {
  const guideName = primaryChapterGuideName(chapter);
  const guideAsset = guideAssets[guideName] ?? demoGuideAsset.url;

  return (
    <aside className="relative min-h-72 overflow-hidden border-b border-amber-900/25 bg-gradient-to-b from-[#6b421f] via-[#3f2513] to-[#1f1209] p-5 text-amber-50 md:border-b-0 md:border-r">
      <div
        aria-hidden
        className="absolute inset-x-8 bottom-8 h-32 rounded-full bg-amber-200/20 blur-3xl"
      />
      <div className="relative flex h-full flex-col items-center justify-end gap-3">
        <div className="rounded-full border border-amber-100/35 bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-50 shadow-sm backdrop-blur-sm">
          {guideName}
        </div>
        <img
          src={guideAsset}
          alt=""
          className="max-h-56 w-full object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.55)]"
          draggable={false}
        />
        <div className="rounded-sm border border-amber-100/35 bg-amber-100/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-amber-50/90">
          Chapter guide
        </div>
        <button
          type="button"
          onClick={onChapterContinue}
          disabled={demoComplete || !canContinueChapter}
          className="rounded-sm border border-amber-100/45 bg-amber-100/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-50 shadow-sm transition hover:bg-amber-100/30 disabled:cursor-default disabled:bg-emerald-900/45"
        >
          {demoComplete ? "Chapter Complete" : !canContinueChapter ? "Answer Clarity" : forwardActionLabel}
        </button>
      </div>
    </aside>
  );
}

function ChapterTemplateBody({
  ideaTitle,
  chapter,
  nextChapter,
  forwardActionLabel,
  demoComplete,
  onChapterContinue,
  clarityStatus,
  clarityQuestions,
  clarityQuestionGroups,
  clarityAnswers,
  clarityMessage,
  clarityReviewMessage,
  canRequestBonusQuestions,
  clarityNeedsMoreQuestions,
  canContinueChapter,
  onClarityAnswerChange,
  onRequestMoreClarityQuestions,
  onSubmitClarityAnswers,
  rootRoomRunStatus,
  rootRoomRunStep,
  rootRoomHandoffStatus,
  rootRoomPacketId,
  onStartRootRoomRun,
}: {
  ideaTitle?: string;
  chapter: TreehouseChapterTemplate;
  nextChapter?: TreehouseChapterTemplate;
  forwardActionLabel: string;
  demoComplete: boolean;
  onChapterContinue: () => void;
  clarityStatus: ClarityRequestStatus;
  clarityQuestions: ClarityQuestion[];
  clarityQuestionGroups: ClarityQuestionGroup[];
  clarityAnswers: Record<string, string>;
  clarityMessage: string | null;
  clarityReviewMessage: string | null;
  canRequestBonusQuestions: boolean;
  clarityNeedsMoreQuestions: boolean;
  canContinueChapter: boolean;
  onClarityAnswerChange: (questionId: string, answer: string) => void;
  onRequestMoreClarityQuestions: (reason?: "user_bonus" | "clarity_more_needed") => void;
  onSubmitClarityAnswers: () => void;
  rootRoomRunStatus: RootRoomRunStatus;
  rootRoomRunStep: number;
  rootRoomHandoffStatus: RootRoomHandoffStatus;
  rootRoomPacketId: string | null;
  onStartRootRoomRun: () => void;
}) {
  const isRootRoomChapter = chapter.id === "root-room";
  const isClarityChapter = chapter.id === "clarity";
  const answeredClarityCount = clarityQuestions.filter(
    (question) => clarityAnswers[question.id]?.trim(),
  ).length;
  const canSubmitClarityAnswers =
    clarityQuestions.length > 0 &&
    answeredClarityCount === clarityQuestions.length &&
    clarityStatus !== "requesting" &&
    clarityStatus !== "submitted";

  return (
    <section className="relative p-5 sm:p-6">
      <DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-fit rounded-full border border-amber-900/25 bg-amber-100/55 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-900/75">
            Empty chapter template
          </div>
          <div className="w-fit rounded-full border border-amber-900/20 bg-amber-950/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-900/70">
            Future-ready shell
          </div>
          <div className="w-fit rounded-sm border border-amber-900/35 bg-amber-950/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-950">
            {demoComplete ? "Chapter complete" : "Chapter ready"}
          </div>
        </div>
        <DialogTitle className="font-serif text-2xl text-amber-950">
          Chapter {chapter.chapter}: {chapter.title}
        </DialogTitle>
        <DialogDescription className="font-serif text-sm leading-relaxed text-amber-900/75">
          {chapter.purpose}
        </DialogDescription>
      </DialogHeader>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-md border border-amber-900/25 bg-amber-50/60 p-4 shadow-inner">
          <div className="font-serif text-[11px] uppercase tracking-[0.2em] text-amber-900/60">
            Project
          </div>
          <h3 className="mt-1 font-serif text-lg font-semibold leading-tight text-amber-950">
            {ideaTitle || "Untitled idea"}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-amber-950/75">
            {isClarityChapter
              ? "Clarity reads the intake, asks five project-specific questions, and sends the answers back to the source packet."
              : "This is the empty working room for the chapter. Add the real questions, lane notes, and output when this chapter is ready."}
          </p>
        </div>

        <div className="rounded-md border border-amber-900/20 bg-amber-100/45 p-4">
          <div className="font-serif text-[11px] uppercase tracking-[0.2em] text-amber-900/60">
            Chapter status
          </div>
          <div className="mt-2 rounded-sm border border-amber-900/20 bg-amber-50/55 px-3 py-2 font-serif text-sm font-semibold text-amber-950">
            {isClarityChapter
              ? clarityStatus === "submitted" || demoComplete
                ? "Clarity answers submitted"
                : clarityStatus === "questions-ready"
                  ? "Clarity questions ready"
                  : clarityStatus === "waiting" || clarityStatus === "requesting"
                    ? "Waiting on Clarity"
                    : clarityStatus === "error"
                      ? "Clarity bridge needs attention"
                      : "Clarity intake ready"
              : demoComplete
                ? "Chapter marked complete"
                : "Blank template ready"}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-amber-950/70">
            {isClarityChapter
              ? clarityMessage ||
                "Opening this chapter sends the idea intake to real Clarity through n8n."
              : demoComplete
              ? nextChapter
                ? `The next step is Chapter ${nextChapter.chapter}: ${nextChapter.title}.`
                : "This is the final chapter shell in the current template list."
              : "No live workflow is attached yet."}
          </p>
        </div>
      </div>

      {isRootRoomChapter ? (
        <RootRoomRunPanel
          status={rootRoomRunStatus}
          activeStep={rootRoomRunStep}
          handoffStatus={rootRoomHandoffStatus}
          packetId={rootRoomPacketId}
          demoComplete={demoComplete}
          onStart={onStartRootRoomRun}
        />
      ) : null}

      {isClarityChapter ? (
        <ClarityQuestionPanel
          status={clarityStatus}
          questions={clarityQuestions}
          questionGroups={clarityQuestionGroups}
          answers={clarityAnswers}
          answeredCount={answeredClarityCount}
          reviewMessage={clarityReviewMessage}
          canRequestBonus={canRequestBonusQuestions}
          clarityNeedsMore={clarityNeedsMoreQuestions}
          onAnswerChange={onClarityAnswerChange}
          onRequestMore={onRequestMoreClarityQuestions}
          onSubmit={onSubmitClarityAnswers}
          canSubmit={canSubmitClarityAnswers}
        />
      ) : null}

      <div className="mt-4">
        <div className="font-serif text-[11px] uppercase tracking-[0.2em] text-amber-900/60">
          Work slots
        </div>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {chapter.parts.map((label) => (
            <div key={label} className="rounded-sm border border-amber-900/25 bg-amber-100/45 p-3">
              <div className="font-serif text-[10px] uppercase tracking-[0.18em] text-amber-900/60">
                Empty slot
              </div>
              <div className="mt-0.5 font-serif text-sm font-semibold text-amber-950">{label}</div>
              <div className="mt-2 min-h-12 rounded-sm border border-dashed border-amber-900/25 bg-amber-50/35 p-2 text-xs leading-relaxed text-amber-950/60">
                Add this lane's prompt, notes, output, or handoff here.
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TemplatePanel title="Starter Notes">
          <TemplateLine label="What this chapter needs" />
          <TemplateLine label="What is still missing" />
          <TemplateLine label="What Boss should decide later" />
        </TemplatePanel>
        <TemplatePanel title="Exit Check">
          {chapter.checkpoints.map((checkpoint) => (
            <TemplateCheck key={checkpoint} label={checkpoint} />
          ))}
        </TemplatePanel>
      </div>

      <div className="mt-4 rounded-md border border-amber-900/25 bg-amber-950/10 p-3">
        <div className="font-serif text-[10px] uppercase tracking-[0.18em] text-amber-900/60">
          Boundary
        </div>
        <p className="mt-1 text-xs leading-relaxed text-amber-950/75">{chapter.boundary}</p>
      </div>

      <div className="mt-4 rounded-md border border-amber-900/20 bg-amber-950/10 p-3">
        <div className="font-serif text-[10px] uppercase tracking-[0.18em] text-amber-900/60">
          Future chapter shells
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {TREEHOUSE_CHAPTER_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className={`rounded-sm border px-2.5 py-2 font-serif text-[11px] ${
                template.id === chapter.id
                  ? "border-amber-900/50 bg-amber-100/65 text-amber-950"
                  : "border-amber-900/20 bg-amber-50/35 text-amber-900/70"
              }`}
            >
              Chapter {template.chapter}: {template.title}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-900/25 bg-amber-50/60 p-3">
        <div>
          <div className="font-serif text-[10px] uppercase tracking-[0.18em] text-amber-900/60">
            Chapter progression
          </div>
          <p className="mt-1 text-xs leading-relaxed text-amber-950/70">
            {nextChapter
              ? `Finish the Chapter ${chapter.chapter} review and send The Crew toward Chapter ${nextChapter.chapter}: ${nextChapter.title}.`
              : `Finish Chapter ${chapter.chapter} and mark the current chapter path complete.`}
          </p>
        </div>
        <button
          type="button"
          onClick={onChapterContinue}
          disabled={demoComplete || !canContinueChapter}
          className="rounded-sm border border-amber-950/20 bg-amber-950 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-50 shadow-sm transition hover:bg-amber-900 disabled:cursor-default disabled:bg-emerald-900"
        >
          {demoComplete
            ? "Chapter Complete"
            : !canContinueChapter
              ? "Answer Clarity First"
              : forwardActionLabel}
        </button>
      </div>
    </section>
  );
}

function ClarityQuestionPanel({
  status,
  questions,
  questionGroups,
  answers,
  answeredCount,
  reviewMessage,
  canRequestBonus,
  clarityNeedsMore,
  canSubmit,
  onAnswerChange,
  onRequestMore,
  onSubmit,
}: {
  status: ClarityRequestStatus;
  questions: ClarityQuestion[];
  questionGroups: ClarityQuestionGroup[];
  answers: Record<string, string>;
  answeredCount: number;
  reviewMessage: string | null;
  canRequestBonus: boolean;
  clarityNeedsMore: boolean;
  canSubmit: boolean;
  onAnswerChange: (questionId: string, answer: string) => void;
  onRequestMore: (reason?: "user_bonus" | "clarity_more_needed") => void;
  onSubmit: () => void;
}) {
  const waiting = status === "requesting" || status === "waiting" || questions.length === 0;
  const activeGroup = [...questionGroups].reverse().find((group) => group.questions.length > 0);
  const currentRound = activeGroup?.round ?? Math.max(1, questionGroups.length);
  const submitted = status === "submitted";

  return (
    <div className="mt-4 rounded-md border border-amber-900/30 bg-amber-50/70 p-4 shadow-inner">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-serif text-[11px] uppercase tracking-[0.2em] text-amber-900/60">
            Real Clarity intake
          </div>
          <h4 className="mt-1 font-serif text-base font-semibold text-amber-950">
            Group {currentRound} of five project-specific questions
          </h4>
        </div>
        <div className="rounded-sm border border-amber-900/25 bg-amber-100/70 px-2.5 py-1 font-serif text-[11px] font-semibold text-amber-950">
          {answeredCount}/{questions.length || 5} answered
        </div>
      </div>

      {waiting ? (
        <p className="mt-3 rounded-sm border border-dashed border-amber-900/30 bg-amber-100/45 p-3 text-sm leading-relaxed text-amber-950/75">
          Steward has been pinged through the Chapter 1 bridge. Clarity's next five questions
          will appear here when n8n posts the Clarity packet back to this idea.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {questions.map((question, index) => (
            <label
              key={question.id}
              className="block rounded-sm border border-amber-900/25 bg-amber-100/45 p-3"
            >
              <span className="font-serif text-[10px] uppercase tracking-[0.18em] text-amber-900/60">
                Clarity question {index + 1}
              </span>
              <span className="mt-1 block font-serif text-sm font-semibold leading-snug text-amber-950">
                {question.prompt}
              </span>
              {question.reason ? (
                <span className="mt-1 block text-xs leading-relaxed text-amber-950/65">
                  {question.reason}
                </span>
              ) : null}
              <textarea
                value={answers[question.id] ?? ""}
                onChange={(event) => onAnswerChange(question.id, event.target.value)}
                rows={3}
                className="mt-2 w-full rounded-sm border border-amber-900/25 bg-amber-50/80 px-3 py-2 text-sm leading-relaxed text-amber-950 outline-none transition focus:border-amber-800 focus:ring-2 focus:ring-amber-600/25"
                placeholder="Answer this Clarity question..."
              />
            </label>
          ))}
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="rounded-sm border border-emerald-950/20 bg-emerald-800 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-50 shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-amber-950/35"
          >
            {submitted ? "Answers Saved" : "Send Answers To Clarity"}
          </button>
          {submitted ? (
            <div className="rounded-sm border border-amber-900/25 bg-amber-100/65 p-3">
              <div className="font-serif text-[10px] uppercase tracking-[0.18em] text-amber-900/60">
                Clarity review
              </div>
              <p className="mt-1 text-sm leading-relaxed text-amber-950/75">
                {clarityNeedsMore
                  ? "I have five more before this base is strong enough."
                  : reviewMessage ||
                    "Clarity has this group of five. You can continue or ask for five bonus questions."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {clarityNeedsMore ? (
                  <button
                    type="button"
                    onClick={() => onRequestMore("clarity_more_needed")}
                    className="rounded-sm border border-amber-950/20 bg-amber-950 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-50 shadow-sm transition hover:bg-amber-900"
                  >
                    Get Clarity's Next Five
                  </button>
                ) : canRequestBonus ? (
                  <button
                    type="button"
                    onClick={() => onRequestMore("user_bonus")}
                    className="rounded-sm border border-amber-950/20 bg-amber-950 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-50 shadow-sm transition hover:bg-amber-900"
                  >
                    Ask 5 Bonus Questions
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function RootRoomRunPanel({
  status,
  activeStep,
  handoffStatus,
  packetId,
  demoComplete,
  onStart,
}: {
  status: RootRoomRunStatus;
  activeStep: number;
  handoffStatus: RootRoomHandoffStatus;
  packetId: string | null;
  demoComplete: boolean;
  onStart: () => void;
}) {
  const statusLabel =
    status === "complete" || demoComplete ? "Complete" : status === "running" ? "Running" : "Ready";
  const statusDetail =
    status === "complete" || demoComplete
      ? "Fake Root Room run complete. This can move the idea to Chapter 3: Mud Pit."
      : status === "running"
        ? "Steward is running the local Root Room test sequence."
        : "Local fake Go test only. No n8n workflow will run.";
  const handoffLabel =
    handoffStatus === "created"
      ? "Inactive n8n test packet created"
      : handoffStatus === "creating"
        ? "Creating inactive n8n test packet"
        : handoffStatus === "local-fallback"
          ? "Local fallback active"
          : "n8n listener waiting";
  const handoffDetail =
    handoffStatus === "created" && packetId
      ? `Packet ${packetId} created with triggerStatus: not_triggered. Open n8n and click Execute workflow, then run the Step Five retry kit.`
      : handoffStatus === "creating"
        ? "The app is writing a server-side handoff packet before the fake story run starts."
        : handoffStatus === "local-fallback"
          ? "The local story run continued without firing n8n. The Step Five retry kit can be used when the n8n listener is open."
          : "Open n8n and click Execute workflow when you are ready to retry Step Five. Go still creates only a local handoff packet here.";

  return (
    <div className="mt-4 rounded-md border border-cyan-900/25 bg-cyan-50/50 p-4 shadow-inner">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-serif text-[11px] uppercase tracking-[0.2em] text-cyan-950/60">
            Root Room Go test
          </div>
          <div className="mt-1 font-serif text-lg font-semibold text-cyan-950">
            Steward starts the local Root Room run
          </div>
          <p className="mt-1 text-xs leading-relaxed text-cyan-950/70">{statusDetail}</p>
        </div>
        <button
          type="button"
          onClick={onStart}
          disabled={status === "running" || demoComplete}
          className="rounded-sm border border-cyan-900/30 bg-cyan-950 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-50 shadow-sm transition hover:bg-cyan-900 disabled:cursor-default disabled:border-emerald-900/30 disabled:bg-emerald-800"
        >
          {status === "running"
            ? "Running"
            : status === "complete" || demoComplete
              ? "Complete"
              : "Go"}
        </button>
      </div>

      <div className="mt-3 rounded-sm border border-cyan-900/20 bg-white/50 px-3 py-2 font-serif text-sm font-semibold text-cyan-950">
        Status: {statusLabel}
      </div>
      <div className="mt-2 rounded-sm border border-cyan-900/20 bg-white/45 px-3 py-2">
        <div className="font-serif text-[10px] uppercase tracking-[0.18em] text-cyan-950/55">
          n8n test doorway
        </div>
        <div className="mt-1 font-serif text-sm font-semibold text-cyan-950">{handoffLabel}</div>
        <p className="mt-1 text-[11px] leading-relaxed text-cyan-950/65">{handoffDetail}</p>
        <div className="mt-2 rounded-sm border border-cyan-900/15 bg-cyan-100/45 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-950/65">
          Parked gate: n8n Execute workflow listener
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        {ROOT_ROOM_STORY_STEPS.map((step, index) => {
          const reached =
            status === "complete" || demoComplete || (status === "running" && index <= activeStep);
          return (
            <div
              key={step}
              className={`rounded-sm border px-2.5 py-2 text-center font-serif text-xs font-semibold ${
                reached
                  ? "border-emerald-900/35 bg-emerald-100/70 text-emerald-950"
                  : "border-cyan-900/15 bg-cyan-100/45 text-cyan-950/55"
              }`}
            >
              {step}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-cyan-950/65">
        Test path: Go -&gt; Steward -&gt; fake Root Room module -&gt; Echo / Shield / Ledger / Chief
        -&gt; Complete. No live n8n, bot route, credential, or external action fires.
      </p>
    </div>
  );
}

function TemplatePanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-amber-900/20 bg-amber-50/45 p-3">
      <div className="font-serif text-[10px] uppercase tracking-[0.18em] text-amber-900/60">
        {title}
      </div>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}

function TemplateLine({ label }: { label: string }) {
  return (
    <div className="rounded-sm border border-dashed border-amber-900/25 bg-amber-100/35 px-3 py-2 text-xs leading-relaxed text-amber-950/65">
      {label}
    </div>
  );
}

function TemplateCheck({ label }: { label: string }) {
  return (
    <div className="flex gap-2 rounded-sm border border-amber-900/20 bg-amber-100/35 px-3 py-2 text-xs leading-relaxed text-amber-950/75">
      <span className="mt-0.5 h-3 w-3 shrink-0 rounded-sm border border-amber-900/35 bg-amber-50/60" />
      <span>{label}</span>
    </div>
  );
}
