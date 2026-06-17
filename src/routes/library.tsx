import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  IDEA_SHELF_NEXT_ACTION,
  LIBRARY_STAGE_NEXT_ACTION,
  seedIdeas,
  stageLabels,
  type LightbulbIdea,
} from "@/lib/dabottree-state";
import { buildIntakeFolderPosts } from "@/lib/intake-folder-breakdown";
import {
  loadPersistedExtras,
  loadPersistedIdeas,
  savePersistedExtras,
  savePersistedIdeas,
} from "@/lib/idea-persistence";
import { generateWorkingProjectTitle, shouldCleanWorkingProjectTitle } from "@/lib/project-naming";
import clarityPresentingAsset from "@/assets/clarity-presenting.png.asset.json";
import libraryBgImage from "@/assets/dabottree-library.jpg";
import echoPresentingAsset from "@/assets/echo-presenting.png.asset.json";
import ledgerPresentingAsset from "@/assets/ledger-presenting.png.asset.json";
import logo from "@/assets/dabottree-logo.png";
import stampPresentingAsset from "@/assets/stamp-presenting.png.asset.json";
import { AccountBadge, CreditsPill } from "@/components/AccountBadge";
import { ChapterTemplateDialog } from "@/components/ChapterTemplateDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  TREEHOUSE_CHAPTER_TEMPLATES,
  chapterTemplateLabel,
  chapterTemplateNextAction,
  currentChapterTemplateForIdea,
  nextChapterTemplate,
  primaryChapterGuideName,
} from "@/lib/treehouse-chapter-templates";
import {
  AlertTriangle,
  BookOpen,
  FileText,
  Play,
  Plus,
  Mic,
  Save,
  Tag,
  TriangleAlert,
  XCircle,
} from "lucide-react";

const libraryBg = libraryBgImage;

type NotebookPost = {
  id: string;
  kind?: string;
  text?: string;
  fullText?: string;
  ts?: number;
  source?: string;
  categories?: string[];
};
type IdeaExtrasRecord = {
  sourceText?: string;
  posts?: NotebookPost[];
  notes?: Record<string, string>;
  attachments?: unknown[];
  answeredQuestions?: string[];
  skippedQuestions?: string[];
  clarityFollowupCount?: number;
  currentChapterId?: string;
  chapterActivity?: {
    status?: "ready" | "bots_running" | "needs_question" | "next_ready" | "complete";
    currentChapterId?: string;
    nextChapterId?: string;
  };
};
type NotebookEntry = {
  id: string;
  title: string;
  body: string;
  ts: number;
};
type BrowserSpeechRecognitionResultEvent = {
  results?: ArrayLike<ArrayLike<{ transcript?: string }>>;
};
type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: BrowserSpeechRecognitionResultEvent) => void) | null;
  start: () => void;
};
type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;
type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: BrowserSpeechRecognitionConstructor;
  webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
};

function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") return undefined;
  const speechWindow = window as SpeechRecognitionWindow;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

function cleanDraftText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function titleFromDraft(text: string, ideaType?: string): string {
  return generateWorkingProjectTitle(text, ideaType);
}

function shouldCleanSavedTitle(title: string): boolean {
  return shouldCleanWorkingProjectTitle(title);
}

function isPlaceholderIdeaType(value: string | undefined): boolean {
  return /^(idea type|undecided|unknown|new idea|project type)$/i.test((value ?? "").trim());
}

function inferIdeaType(text: string, fallback?: string): string | undefined {
  const existing = fallback?.trim();
  if (existing && !isPlaceholderIdeaType(existing)) return existing;
  if (/\btv\s*show|television show|series\b/i.test(text)) return "TV show";
  if (/\bwebsite|web\s*site|site\b/i.test(text)) {
    return /\bapp|application|program\s*\/\s*site|site\s*\/\s*program|web app\b/i.test(text)
      ? "App / website"
      : "Website";
  }
  if (/\bweb app|app|application|program\b/i.test(text)) return "App";
  if (
    /\b(construction|jobsite|job site|crew|contractor|foreman|worker manager|job address|job location|schedule update)\b/i.test(
      text,
    )
  ) {
    return "Tool";
  }
  if (
    /\btool librar(?:y|ies)|shared (?:tool|tools)|tool sharing|share (?:a )?tool|share tools\b/i.test(
      text,
    )
  ) {
    return "App";
  }
  if (
    /\bneighborhood|community|block\b/i.test(text) &&
    /\b(tool|share|shared|borrow|lend|library|shelf|shed)\b/i.test(text)
  ) {
    return "App";
  }
  if (/\bservice|business\b/i.test(text)) return "Business";
  if (/\bcourse|class|training\b/i.test(text)) return "Course";
  if (/\bbook|novel|memoir\b/i.test(text)) return "Book";
  if (/\bgame\b/i.test(text)) return "Game";
  return undefined;
}

function ideaTypeFor(idea: LightbulbIdea): string {
  const context = [idea.ideaType, idea.title, idea.description, idea.messy]
    .filter(Boolean)
    .join(" ");
  return inferIdeaType(context, idea.ideaType) ?? "Project";
}

function cleanStoredIdeaTitle(idea: LightbulbIdea): LightbulbIdea {
  const type = ideaTypeFor(idea);
  const typedIdea =
    idea.ideaType && !isPlaceholderIdeaType(idea.ideaType) ? idea : { ...idea, ideaType: type };
  if (!shouldCleanSavedTitle(typedIdea.title)) return typedIdea;
  const context = [typedIdea.description, typedIdea.messy, typedIdea.title]
    .filter(Boolean)
    .join(" ");
  const title = titleFromDraft(context, typedIdea.ideaType);
  return title && title !== typedIdea.title ? { ...typedIdea, title } : typedIdea;
}

function summaryFromDraft(text: string): string {
  const clean = cleanDraftText(text);
  if (clean.length <= 180) return clean;
  return `${clean.slice(0, 177).trim()}...`;
}

function ideaFromDraft(text: string, ideaType?: string): LightbulbIdea {
  const ts = Date.now();
  const type = inferIdeaType(text, ideaType);
  const title = titleFromDraft(text, type);
  return {
    id: `idea-${ts}`,
    title,
    messy: summaryFromDraft(text),
    shelfReadiness: cleanDraftText(text).length >= 650 ? 82 : 32,
    updatedAt: ts,
    stage: "lightbulb",
    nextAction: IDEA_SHELF_NEXT_ACTION,
    ideaType: type,
    description: cleanDraftText(text),
  };
}

function extrasFromDraft(text: string, ts: number) {
  return {
    sourceText: text,
    notes: {},
    attachments: [],
    posts: buildIntakeFolderPosts(text, ts),
    answeredQuestions: [],
    skippedQuestions: [],
    clarityFollowupCount: 0,
  };
}

function loadStoredIdeas(): LightbulbIdea[] | null {
  return loadPersistedIdeas((idea) => normalizeLibraryStage(cleanStoredIdeaTitle(idea)));
}

function loadExtrasMap(): Record<string, IdeaExtrasRecord> {
  return loadPersistedExtras<Record<string, IdeaExtrasRecord>>() ?? {};
}

function saveExtrasMap(extras: Record<string, IdeaExtrasRecord>) {
  savePersistedExtras(extras);
}

function currentChapterIdForIdea(idea: LightbulbIdea, extras?: IdeaExtrasRecord) {
  return currentChapterTemplateForIdea({
    stage: idea.stage,
    nextAction: idea.nextAction,
    currentChapterId: extras?.currentChapterId,
  })?.id;
}

function currentChapterForIdea(idea: LightbulbIdea, extras?: IdeaExtrasRecord) {
  return currentChapterTemplateForIdea({
    stage: idea.stage,
    nextAction: idea.nextAction,
    currentChapterId: extras?.currentChapterId,
  });
}

function chapterActivityStatusFor(idea: LightbulbIdea, extras?: IdeaExtrasRecord) {
  const chapter = currentChapterForIdea(idea, extras);
  const activity = extras?.chapterActivity;
  if (!chapter || activity?.currentChapterId !== chapter.id) return undefined;
  return activity.status;
}

function chapterActionFor(idea: LightbulbIdea, extras?: IdeaExtrasRecord) {
  const chapter = currentChapterForIdea(idea, extras);
  const activityStatus = chapterActivityStatusFor(idea, extras);
  const hold = activityStatus === "bots_running";
  const answer = activityStatus === "needs_question";

  return {
    disabled: hold,
    icon: hold ? "hold" : answer ? "answer" : chapter ? "ready" : "default",
    label: chapter ? (hold ? "HOLD" : answer ? "ANSWER" : "LET'S GO!") : "Continue",
    title: chapter
      ? hold
        ? "The Crew is still working. This chapter is not ready to open yet."
        : answer
          ? "Answer the question needed before the next chapter opens."
          : `Open Chapter ${chapter.chapter}: ${chapter.title}`
      : "Continue",
    tone: hold ? "hold" : answer ? "answer" : chapter ? "ready" : "default",
  } as const;
}

function chapterProgressLabel(chapter: (typeof TREEHOUSE_CHAPTER_TEMPLATES)[number]) {
  const finalChapter =
    TREEHOUSE_CHAPTER_TEMPLATES[TREEHOUSE_CHAPTER_TEMPLATES.length - 1]?.chapter ?? chapter.chapter;
  return `Chapter ${chapter.chapter} of ${finalChapter}`;
}

function chapterProgressPercent(chapter: (typeof TREEHOUSE_CHAPTER_TEMPLATES)[number]) {
  const index = TREEHOUSE_CHAPTER_TEMPLATES.findIndex((template) => template.id === chapter.id);
  const position = index >= 0 ? index + 1 : 1;
  return `${Math.round((position / TREEHOUSE_CHAPTER_TEMPLATES.length) * 100)}%`;
}

function libraryStartPaidKey(ideaId: string) {
  return `dabottree:libraryStartPaid:${ideaId}`;
}

function libraryStartConfirmedKey(ideaId: string) {
  return `dabottree:libraryStartConfirmed:${ideaId}`;
}

function looksLikeTshirtProject(idea: LightbulbIdea): boolean {
  const text = [idea.title, idea.description, idea.messy, idea.ideaType].filter(Boolean).join(" ");
  return (
    /\b(qr|code|scan|scanned|coupon|credit|reward|discount)\b/i.test(text) &&
    /\b(t-?shirt|tee|shirt|tshirt)\b/i.test(text)
  );
}

function hasConfirmedLibraryStart(idea: LightbulbIdea): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(libraryStartConfirmedKey(idea.id)) === "1") return true;
    if (
      localStorage.getItem(libraryStartPaidKey(idea.id)) === "1" &&
      looksLikeTshirtProject(idea)
    ) {
      localStorage.setItem(libraryStartConfirmedKey(idea.id), "1");
      return true;
    }
    if (localStorage.getItem(libraryStartPaidKey(idea.id)) === "1") {
      localStorage.removeItem(libraryStartPaidKey(idea.id));
    }
  } catch {
    // Ignore storage access failures.
  }
  return false;
}

function syncLibraryStageFromPaidStart(idea: LightbulbIdea): LightbulbIdea {
  if (idea.stage !== "lightbulb" || typeof window === "undefined") return idea;
  if (!hasConfirmedLibraryStart(idea)) return idea;
  return {
    ...idea,
    stage: "pre-clarity",
    shelfReadiness: Math.max(idea.shelfReadiness, 45),
    nextAction: LIBRARY_STAGE_NEXT_ACTION,
  };
}

function normalizeLibraryStage(idea: LightbulbIdea): LightbulbIdea {
  if (idea.stage === "lightbulb") {
    const synced = syncLibraryStageFromPaidStart(idea);
    if (synced.stage !== "lightbulb" || synced.nextAction === IDEA_SHELF_NEXT_ACTION) {
      return synced;
    }
    return { ...synced, nextAction: IDEA_SHELF_NEXT_ACTION };
  }
  if (idea.stage !== "pre-clarity" || hasConfirmedLibraryStart(idea)) return idea;
  return {
    ...idea,
    stage: "lightbulb",
    nextAction: IDEA_SHELF_NEXT_ACTION,
  };
}

function shortEntryTitle(text: string): string {
  const clean = cleanDraftText(text);
  const firstSentence = clean.split(/[.!?]/)[0]?.trim() || clean;
  const title = firstSentence.split(/\s+/).filter(Boolean).slice(0, 8).join(" ");
  return title || "Notebook note";
}

function entryDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function notebookEntriesFor(idea: LightbulbIdea, extras: IdeaExtrasRecord): NotebookEntry[] {
  const entries: NotebookEntry[] = [];
  if (extras.sourceText?.trim()) {
    entries.push({
      id: `${idea.id}-source`,
      title: "Original intake",
      body: extras.sourceText.trim(),
      ts: idea.updatedAt || Date.now(),
    });
  }
  for (const post of extras.posts ?? []) {
    if (post.source !== "captured-note") continue;
    const body = (post.fullText ?? post.text ?? "").trim();
    if (!body) continue;
    entries.push({
      id: post.id,
      title:
        post.text?.trim() && post.text.trim() !== body ? post.text.trim() : shortEntryTitle(body),
      body,
      ts: post.ts || idea.updatedAt || Date.now(),
    });
  }
  if (entries.length === 0 && (idea.description || idea.messy)) {
    const body = [idea.description, idea.messy].filter(Boolean).join("\n\n");
    entries.push({
      id: `${idea.id}-summary`,
      title: "Saved idea summary",
      body,
      ts: idea.updatedAt || Date.now(),
    });
  }
  return entries.sort((a, b) => b.ts - a.ts);
}

function stagePillClass(stage: LightbulbIdea["stage"]) {
  const classes: Record<LightbulbIdea["stage"], string> = {
    lightbulb: "border-emerald-200/50 bg-gradient-to-b from-[#5f7d4a] to-[#324a26] text-emerald-50",
    "pre-clarity": "border-sky-200/50 bg-gradient-to-b from-[#6a8ca8] to-[#36556f] text-sky-50",
    "paid-creation":
      "border-amber-200/60 bg-gradient-to-b from-[#b78449] to-[#7a4f24] text-amber-50",
    "clean-packet":
      "border-violet-200/50 bg-gradient-to-b from-[#7b668f] to-[#4d3b63] text-violet-50",
    "operating-path":
      "border-rose-200/50 bg-gradient-to-b from-[#a76565] to-[#683737] text-rose-50",
  };
  return classes[stage];
}

function isCompletedIdea(idea: LightbulbIdea): boolean {
  return idea.stage === "clean-packet" || idea.stage === "operating-path";
}

const stageCharacterMap: Record<LightbulbIdea["stage"], { name: string; src: string }> = {
  lightbulb: { name: "Clarity", src: clarityPresentingAsset.url },
  "pre-clarity": { name: "Clarity", src: clarityPresentingAsset.url },
  "paid-creation": { name: "Echo", src: echoPresentingAsset.url },
  "clean-packet": { name: "Ledger", src: ledgerPresentingAsset.url },
  "operating-path": { name: "Chief", src: stampPresentingAsset.url },
};

function ideaCardStatus(
  idea: LightbulbIdea,
  extras?: IdeaExtrasRecord,
): {
  label: string;
  detail: string;
  tone: "ready" | "working" | "waiting" | "answer" | "complete";
} {
  if (isCompletedIdea(idea)) {
    return {
      label: "Completed",
      detail: "This idea has a finished shelf record ready to review.",
      tone: "complete",
    };
  }

  if (idea.stage === "pre-clarity") {
    return {
      label: "Clarity is working",
      detail: "Answer the next question so the idea can move forward.",
      tone: "working",
    };
  }

  if (idea.stage === "paid-creation") {
    const chapter = currentChapterForIdea(idea, extras);
    const activityStatus = chapterActivityStatusFor(idea, extras);

    if (activityStatus === "bots_running") {
      return {
        label: "Chapter working",
        detail: chapter
          ? `The Crew is preparing Chapter ${chapter.chapter}: ${chapter.title}.`
          : "The Crew is preparing the next chapter.",
        tone: "working",
      };
    }

    if (activityStatus === "needs_question") {
      return {
        label: "Answer needed",
        detail: "The Crew needs one answer before this can move forward.",
        tone: "answer",
      };
    }

    return {
      label: chapter ? `Chapter ${chapter.chapter} ready` : "Chapter ready",
      detail: chapter
        ? `Open the blank ${chapter.title} template and move this chapter forward.`
        : "Open the blank chapter template and move this chapter forward.",
      tone: "working",
    };
  }

  if (idea.shelfReadiness < 25) {
    return {
      label: "Needs more notes",
      detail: "Add a little more detail before it moves to the next stage.",
      tone: "waiting",
    };
  }

  return {
    label: "Ready for next step",
    detail: "Add notes or press Let's Build when you are ready.",
    tone: "ready",
  };
}

function ideaStatusClass(tone: ReturnType<typeof ideaCardStatus>["tone"]) {
  const classes: Record<ReturnType<typeof ideaCardStatus>["tone"], string> = {
    ready: "border-emerald-100/45 bg-emerald-950/45 text-emerald-50",
    working: "border-yellow-100/50 bg-yellow-900/50 text-yellow-50",
    waiting: "border-amber-100/45 bg-amber-950/50 text-amber-50",
    answer: "border-orange-100/50 bg-red-950/55 text-orange-50",
    complete: "border-violet-100/45 bg-violet-950/45 text-violet-50",
  };

  return classes[tone];
}

function backfillMissingIntakeExtras(ideas: LightbulbIdea[]): LightbulbIdea[] {
  if (typeof window === "undefined") return ideas;
  try {
    const existingExtras = loadExtrasMap();
    let changedExtras = false;
    let changedIdeas = false;

    const nextIdeas = ideas.map((idea) => {
      const fullText = cleanDraftText([idea.description, idea.messy].filter(Boolean).join(" "));
      const hasUsefulText = fullText.length >= 220;
      const currentExtras = existingExtras[idea.id];
      const hasPosts =
        currentExtras &&
        typeof currentExtras === "object" &&
        Array.isArray(currentExtras.posts) &&
        currentExtras.posts.length > 0;
      const hasUserCapturedPosts =
        hasPosts &&
        (currentExtras.posts as Array<{ source?: string }>).some(
          (post) => post && post.source === "captured-note",
        );

      if (hasUsefulText && !hasPosts) {
        existingExtras[idea.id] = extrasFromDraft(fullText, idea.updatedAt || Date.now());
        changedExtras = true;
      } else if (
        hasUsefulText &&
        hasPosts &&
        !hasUserCapturedPosts &&
        ((currentExtras.clarityFollowupCount ?? 0) >= 3 ||
          (currentExtras.answeredQuestions ?? []).length > 0)
      ) {
        existingExtras[idea.id] = {
          ...currentExtras,
          answeredQuestions: [],
          clarityFollowupCount: 0,
        };
        changedExtras = true;
      }

      if (idea.stage === "lightbulb" && idea.nextAction !== IDEA_SHELF_NEXT_ACTION) {
        changedIdeas = true;
        return {
          ...idea,
          shelfReadiness: hasUsefulText && idea.shelfReadiness >= 90 ? 82 : idea.shelfReadiness,
          nextAction: IDEA_SHELF_NEXT_ACTION,
        };
      }

      if (hasUsefulText && idea.shelfReadiness >= 90) {
        changedIdeas = true;
        return {
          ...idea,
          shelfReadiness: 82,
        };
      }
      return idea;
    });

    if (changedExtras) {
      saveExtrasMap(existingExtras);
    }
    return changedIdeas ? nextIdeas : ideas;
  } catch {
    return ideas;
  }
}

function nextStepSummary(idea: LightbulbIdea): string {
  if (idea.stage === "lightbulb") return `Next step: ${IDEA_SHELF_NEXT_ACTION}`;
  const chapter = currentChapterForIdea(idea, loadExtrasMap()[idea.id]);
  if (chapter) return `Next step: ${chapterTemplateLabel(chapter.id)}.`;
  const action = idea.nextAction?.trim();
  if (action) return `Next step: ${action}`;
  const stageHint =
    idea.stage === "pre-clarity"
      ? "Answer the next personalized Clarity question to keep moving forward."
      : idea.stage === "paid-creation"
        ? "Open the blank Chapter 2: Root Room template."
        : idea.stage === "clean-packet"
          ? "Open the clean packet and decide what to build first."
          : "Continue along the operating path.";
  return `Next step: ${stageHint}`;
}

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Idea Shelf — DaBotTree" },
      {
        name: "description",
        content: "Your saved ideas, ready to open from the DaBotTree idea shelf.",
      },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<LightbulbIdea[]>(seedIdeas);
  const [ready, setReady] = useState(false);
  const [notebookIdea, setNotebookIdea] = useState<LightbulbIdea | null>(null);
  const [chapterTemplateIdea, setChapterTemplateIdea] = useState<LightbulbIdea | null>(null);
  const [openEntry, setOpenEntry] = useState<NotebookEntry | null>(null);
  const [addNoteIdea, setAddNoteIdea] = useState<LightbulbIdea | null>(null);
  const [deleteIdeaTarget, setDeleteIdeaTarget] = useState<LightbulbIdea | null>(null);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<1 | 2>(1);
  const [noteText, setNoteText] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [listening, setListening] = useState(false);
  const [typeFilter, setTypeFilter] = useState("All");
  const [shelfView, setShelfView] = useState<"active" | "completed">("active");

  const ideaTypes = useMemo(() => {
    return Array.from(new Set(ideas.map(ideaTypeFor))).sort((a, b) => a.localeCompare(b));
  }, [ideas]);
  const visibleIdeas = useMemo(() => {
    if (typeFilter === "All") return ideas;
    return ideas.filter((idea) => ideaTypeFor(idea) === typeFilter);
  }, [ideas, typeFilter]);
  const activeIdeas = useMemo(
    () => visibleIdeas.filter((idea) => !isCompletedIdea(idea)),
    [visibleIdeas],
  );
  const completedIdeas = useMemo(
    () => visibleIdeas.filter((idea) => isCompletedIdea(idea)),
    [visibleIdeas],
  );
  const shelfIdeas = shelfView === "completed" ? completedIdeas : activeIdeas;

  useEffect(() => {
    const stored = loadStoredIdeas();
    let nextIdeas = stored ?? seedIdeas;
    try {
      const draft = sessionStorage.getItem("dabottree:draftIdea") ?? "";
      const draftType = sessionStorage.getItem("dabottree:draftIdeaType") ?? "";
      if (draft.trim().length > 0) {
        const newIdea = ideaFromDraft(draft, draftType);
        const ts = Number(newIdea.id.replace("idea-", "")) || Date.now();
        nextIdeas = [newIdea, ...nextIdeas];
        const existingExtras = loadExtrasMap();
        saveExtrasMap({
          ...existingExtras,
          [newIdea.id]: extrasFromDraft(draft, ts),
        });
        sessionStorage.removeItem("dabottree:draftIdea");
        sessionStorage.removeItem("dabottree:draftIdeaType");
      }
    } catch {
      // Ignore storage access failures.
    }
    nextIdeas = backfillMissingIntakeExtras(nextIdeas);
    setIdeas(nextIdeas);
    setReady(true);
  }, []);

  // Persist deletions made on this page.
  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    savePersistedIdeas(ideas);
  }, [ideas, ready]);

  useEffect(() => {
    if (typeFilter !== "All" && !ideaTypes.includes(typeFilter)) {
      setTypeFilter("All");
    }
  }, [ideaTypes, typeFilter]);

  const openIdea = (id: string) => {
    navigate({ to: "/dashboard", search: { ideaId: id } });
  };

  const continueIdea = (idea: LightbulbIdea) => {
    const extras = loadExtrasMap()[idea.id];
    const action = chapterActionFor(idea, extras);
    if (action.disabled) return;

    if (currentChapterForIdea(idea, extras)) {
      setChapterTemplateIdea(idea);
      return;
    }

    if (idea.stage === "lightbulb") {
      try {
        localStorage.setItem(libraryStartConfirmedKey(idea.id), "1");
      } catch {
        // Ignore storage access failures.
      }

      const nextIdeas = ideas.map((candidate) =>
        candidate.id === idea.id ? syncLibraryStageFromPaidStart(candidate) : candidate,
      );
      setIdeas(nextIdeas);
      savePersistedIdeas(nextIdeas);
    }
    openIdea(idea.id);
  };

  const advanceChapterDemo = (idea: LightbulbIdea, completedChapterId: string) => {
    const nextChapter = nextChapterTemplate(completedChapterId);
    const extras = loadExtrasMap();
    const current = extras[idea.id] ?? {};

    if (nextChapter) {
      extras[idea.id] = {
        ...current,
        currentChapterId: nextChapter.id,
      };
      saveExtrasMap(extras);
      setIdeas((prev) => {
        const nextIdeas = prev.map((candidate) =>
          candidate.id === idea.id
            ? {
                ...candidate,
                updatedAt: Date.now(),
                stage: "paid-creation" as const,
                nextAction: chapterTemplateNextAction(nextChapter.id),
              }
            : candidate,
        );
        savePersistedIdeas(nextIdeas);
        return nextIdeas;
      });
      return;
    }

    setIdeas((prev) => {
      const nextIdeas = prev.map((candidate) =>
        candidate.id === idea.id
          ? {
              ...candidate,
              updatedAt: Date.now(),
              stage: "clean-packet" as const,
              nextAction: "All demo chapter templates are complete.",
            }
          : candidate,
      );
      savePersistedIdeas(nextIdeas);
      return nextIdeas;
    });
  };

  const addNotebookNote = () => {
    if (!addNoteIdea || !noteText.trim()) return;
    const ts = Date.now();
    const body = noteText.trim();
    const title = noteTitle.trim() || shortEntryTitle(body);
    const extras = loadExtrasMap();
    const current = extras[addNoteIdea.id] ?? {};
    const post: NotebookPost = {
      id: `post-${ts}`,
      kind: "idea-notes",
      text: title,
      fullText: body,
      ts,
      categories: ["clarity"],
      source: "captured-note",
    };
    extras[addNoteIdea.id] = {
      ...current,
      notes: current.notes ?? {},
      attachments: current.attachments ?? [],
      posts: [post, ...(current.posts ?? [])],
      answeredQuestions: current.answeredQuestions ?? [],
      skippedQuestions: current.skippedQuestions ?? [],
      clarityFollowupCount: current.clarityFollowupCount ?? 0,
    };
    saveExtrasMap(extras);
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === addNoteIdea.id
          ? {
              ...idea,
              updatedAt: ts,
              nextAction: "Review notebook note, then keep shaping the project",
            }
          : idea,
      ),
    );
    setNoteText("");
    setNoteTitle("");
    setAddNoteIdea(null);
  };

  const startNoteVoice = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        setNoteText((prev) => [prev, transcript].filter(Boolean).join(prev ? "\n" : ""));
      }
    };
    recognition.start();
  };

  const requestDeleteIdea = (idea: LightbulbIdea) => {
    setDeleteIdeaTarget(idea);
    setDeleteConfirmStep(1);
  };

  const cancelDeleteIdea = () => {
    setDeleteIdeaTarget(null);
    setDeleteConfirmStep(1);
  };

  const deleteIdea = () => {
    if (!deleteIdeaTarget) return;
    const id = deleteIdeaTarget.id;
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    const extras = loadExtrasMap();
    delete extras[id];
    saveExtrasMap(extras);
    cancelDeleteIdea();
  };

  return (
    <main
      className="relative flex w-full max-w-[100vw] flex-col overflow-x-hidden text-amber-50"
      style={{ minHeight: "100dvh" }}
    >
      {/* Idea Shelf scene background — distinct from the idea dashboard. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-30 bg-cover bg-center"
        style={{ backgroundImage: `url(${libraryBg})` }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-20"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255,225,160,0.25), transparent 70%), linear-gradient(180deg, rgba(20,10,2,0.10), rgba(10,6,2,0.35))",
        }}
      />

      <header className="relative z-30 flex items-center justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-6">
        <Link to="/" className="flex items-center gap-2" title="Home">
          <img
            src={logo}
            alt="DaBotTree"
            className="h-9 w-9 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
          />
          <span className="font-serif text-[14px] uppercase tracking-[0.25em] text-amber-50/90">
            Idea Shelf
          </span>
        </Link>
        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
          <Link
            to="/"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-emerald-200/30 bg-emerald-900/40 px-3.5 text-[11px] font-semibold text-emerald-50 shadow-sm backdrop-blur-sm transition hover:border-emerald-200/50 hover:bg-emerald-800/50"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            <span className="whitespace-nowrap">New Idea</span>
          </Link>
          <CreditsPill />
          <AccountBadge placement="inline" prominence="large" />
        </div>
      </header>

      <section className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-6 font-serif text-2xl text-amber-50 drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)]">
          Idea Shelf
        </h1>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:max-w-3xl">
          <Link
            to="/"
            className="group flex aspect-square min-h-36 flex-col justify-between rounded-md border border-emerald-200/35 bg-emerald-950/55 p-4 shadow-lg backdrop-blur-sm transition hover:border-emerald-100/70 hover:bg-emerald-900/70"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-100/35 bg-emerald-100/12 text-emerald-50 shadow-sm">
              <Plus className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-serif text-lg font-semibold text-emerald-50">
                Create New Idea
              </span>
              <span className="mt-1 block text-xs leading-5 text-emerald-50/70">
                Start a fresh project shelf.
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setShelfView("completed")}
            className={`group flex aspect-square min-h-36 flex-col justify-between rounded-md border p-4 text-left shadow-lg backdrop-blur-sm transition ${
              shelfView === "completed"
                ? "border-amber-100/70 bg-amber-900/70"
                : "border-amber-200/35 bg-amber-950/55 hover:border-amber-100/70 hover:bg-amber-900/70"
            }`}
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-100/35 bg-amber-100/12 text-amber-50 shadow-sm">
              <BookOpen className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-serif text-lg font-semibold text-amber-50">
                Completed Ideas
              </span>
              <span className="mt-1 block text-xs leading-5 text-amber-50/70">
                {completedIdeas.length} finished shelf{" "}
                {completedIdeas.length === 1 ? "card" : "cards"}.
              </span>
            </span>
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-full border border-amber-200/25 bg-amber-950/45 p-1 shadow-sm backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setShelfView("active")}
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] transition ${
                shelfView === "active"
                  ? "bg-amber-100/20 text-amber-50"
                  : "text-amber-100/65 hover:text-amber-50"
              }`}
            >
              Active Ideas
            </button>
            <button
              type="button"
              onClick={() => setShelfView("completed")}
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] transition ${
                shelfView === "completed"
                  ? "bg-amber-100/20 text-amber-50"
                  : "text-amber-100/65 hover:text-amber-50"
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {ideas.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {["All", ...ideaTypes].map((type) => {
              const active = typeFilter === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTypeFilter(type)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] shadow-sm transition ${
                    active
                      ? "border-amber-100/70 bg-amber-100/20 text-amber-50"
                      : "border-amber-200/25 bg-amber-950/35 text-amber-100/70 hover:border-amber-100/50 hover:text-amber-50"
                  }`}
                >
                  <Tag className="h-3 w-3" />
                  {type}
                </button>
              );
            })}
          </div>
        )}

        {ideas.length === 0 ? (
          <div className="rounded-md border border-amber-200/30 bg-amber-950/40 px-4 py-6 text-center font-serif italic text-amber-100/80">
            No ideas yet. Head to the start screen to capture one.
          </div>
        ) : shelfIdeas.length === 0 ? (
          <div className="rounded-md border border-amber-200/30 bg-amber-950/40 px-4 py-6 text-center font-serif italic text-amber-100/80">
            {shelfView === "completed"
              ? "No completed ideas yet."
              : "No active ideas match this filter yet."}
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shelfIdeas.map((idea) => {
              const extras = loadExtrasMap()[idea.id] ?? {};
              const chapter = currentChapterForIdea(idea, extras);
              const stage = chapter
                ? `Stage: ${chapterTemplateLabel(chapter.id)}`
                : idea.stage
                  ? `Stage: ${stageLabels[idea.stage]}`
                  : "Stage: Idea";
              const chapterAction = chapterActionFor(idea, extras);
              const ideaType = ideaTypeFor(idea);
              const character = chapter
                ? {
                    name: primaryChapterGuideName(chapter),
                    src:
                      idea.stage === "paid-creation"
                        ? echoPresentingAsset.url
                        : stageCharacterMap.lightbulb.src,
                  }
                : (stageCharacterMap[idea.stage] ?? stageCharacterMap.lightbulb);
              const status = ideaCardStatus(idea, extras);
              const notebookEntryCount = notebookEntriesFor(idea, extras).length;
              return (
                <li
                  key={idea.id}
                  className="relative flex min-h-64 overflow-hidden rounded-md border border-amber-200/30 bg-amber-950/60 p-4 shadow-lg backdrop-blur-sm"
                >
                  <div className="relative z-10 flex min-w-0 flex-1 flex-col pr-24 sm:pr-28">
                    <div className="flex flex-wrap gap-1.5">
                      <div
                        title={stage}
                        className={`inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] shadow-sm ${stagePillClass(idea.stage)}`}
                      >
                        <Tag className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">{stage}</span>
                      </div>
                      <div className="inline-flex max-w-full items-center gap-1 rounded-full border border-cyan-100/40 bg-cyan-950/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-cyan-50 shadow-sm">
                        <Tag className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">{ideaType}</span>
                      </div>
                    </div>

                    <div className="mt-4 text-left font-serif text-xl font-semibold leading-tight text-amber-50">
                      {idea.title || "Untitled"}
                    </div>
                    <div
                      className={`mt-3 inline-flex w-fit max-w-full rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.11em] ${ideaStatusClass(status.tone)}`}
                    >
                      {status.label}
                    </div>
                    <div className="mt-2 text-left text-[12px] leading-relaxed text-amber-100/82">
                      {status.detail}
                    </div>
                    <div className="mt-2 text-left text-[11px] leading-relaxed text-amber-100/62">
                      {nextStepSummary(idea)}
                    </div>
                    {chapter ? (
                      <div className="mt-3 rounded-sm border border-amber-100/25 bg-black/20 p-2.5 text-left shadow-inner">
                        <div className="flex items-center justify-between gap-3 text-[9px] font-bold uppercase tracking-[0.14em] text-amber-100/70">
                          <span>Current chapter</span>
                          <span>{chapterProgressLabel(chapter)}</span>
                        </div>
                        <div className="mt-1 font-serif text-sm font-semibold leading-tight text-amber-50">
                          Chapter {chapter.chapter}: {chapter.title}
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-amber-950/70">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-200 via-cyan-200 to-emerald-200"
                            style={{ width: chapterProgressPercent(chapter) }}
                          />
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-auto space-y-2 pt-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setNotebookIdea(idea)}
                          className="inline-flex items-center gap-1 rounded-sm border border-amber-900/40 bg-gradient-to-b from-[#a8763d] to-[#7a4f24] px-2.5 py-1 text-[10px] font-semibold text-amber-50 shadow-sm transition hover:from-[#b78449] hover:to-[#8b5a2a]"
                        >
                          <FileText className="h-3 w-3" />
                          Notebook ({notebookEntryCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddNoteIdea(idea);
                            setNoteTitle("");
                            setNoteText("");
                          }}
                          className="inline-flex items-center gap-1 rounded-sm border border-amber-200/40 bg-gradient-to-b from-[#8a7350] to-[#5a4024] px-2.5 py-1 text-[10px] font-semibold text-amber-50 shadow-sm transition hover:from-[#9b825c] hover:to-[#6a4d2c]"
                        >
                          <Plus className="h-3 w-3" />
                          Add More Notes
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDeleteIdea(idea)}
                          title="Delete idea"
                          className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-200/45 bg-red-950/45 text-red-50 shadow-sm transition hover:border-red-100/70 hover:bg-red-900/65"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => continueIdea(idea)}
                        disabled={chapterAction.disabled}
                        title={chapterAction.title}
                        className={`relative z-10 mx-auto flex h-12 w-[220px] items-center justify-center gap-2 rounded-sm border px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.12em] shadow-[inset_0_1px_0_rgba(255,232,188,0.28),0_10px_20px_-14px_rgba(0,0,0,0.9)] transition disabled:cursor-not-allowed disabled:opacity-85 sm:w-[240px] ${
                          chapterAction.tone === "hold"
                            ? "border-yellow-100/60 bg-gradient-to-b from-[#f0c94f] via-[#b98216] to-[#664007] text-[#241202]"
                            : chapterAction.tone === "answer"
                              ? "border-orange-100/55 bg-gradient-to-b from-[#9b3720] via-[#72210f] to-[#3d1008] text-orange-50 hover:from-[#ad4329] hover:via-[#842917] hover:to-[#4b160c]"
                              : chapterAction.tone === "ready"
                                ? "border-emerald-100/55 bg-gradient-to-b from-[#2f8f5b] via-[#1d653d] to-[#0f3820] text-emerald-50 hover:from-[#3aa86c] hover:via-[#237247] hover:to-[#124627]"
                                : "border-amber-200/45 bg-gradient-to-b from-[#8b663d] via-[#6f4a28] to-[#3f2716] text-amber-50 hover:from-[#9a7348] hover:via-[#795330] hover:to-[#4c301c]"
                        }`}
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                          {chapterAction.icon === "hold" ? (
                            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                          ) : chapterAction.icon === "answer" ? (
                            <TriangleAlert className="h-4 w-4" aria-hidden="true" />
                          ) : chapterAction.icon === "ready" ? (
                            <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                          ) : (
                            <BookOpen className="h-4 w-4" aria-hidden="true" />
                          )}
                        </span>
                        <span className="min-w-0 truncate">{chapterAction.label}</span>
                      </button>
                    </div>
                  </div>

                  <div className="pointer-events-none absolute bottom-2 right-2 top-6 flex w-28 flex-col items-center justify-end sm:w-32">
                    <div className="mb-1 rounded-full border border-amber-100/25 bg-black/25 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-50/80 shadow-sm backdrop-blur-sm">
                      {character.name}
                    </div>
                    <img
                      src={character.src}
                      alt=""
                      className="max-h-40 w-full object-contain object-bottom drop-shadow-[0_12px_18px_rgba(0,0,0,0.5)]"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="absolute bottom-8 right-5 -z-10 h-24 w-24 rounded-full bg-amber-200/15 blur-2xl" />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Dialog
        open={Boolean(notebookIdea)}
        onOpenChange={(open) => {
          if (!open) {
            setNotebookIdea(null);
            setOpenEntry(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          {notebookIdea && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif">
                  Notebook: {notebookIdea.title || "Untitled idea"}
                </DialogTitle>
                <DialogDescription>
                  Original dated entries saved under this project.
                </DialogDescription>
              </DialogHeader>
              {openEntry ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setOpenEntry(null)}
                    className="mb-3 rounded-sm border border-amber-900/30 px-2 py-1 font-serif text-[11px] text-amber-950 transition hover:bg-amber-100"
                  >
                    Back to entries
                  </button>
                  <div className="rounded-sm border border-amber-900/25 bg-amber-50/70 p-3">
                    <div className="font-serif text-[11px] uppercase tracking-[0.2em] text-amber-900/70">
                      {entryDate(openEntry.ts)}
                    </div>
                    <h3 className="mt-1 font-serif text-[16px] font-semibold text-amber-950">
                      {openEntry.title}
                    </h3>
                    <p className="mt-3 max-h-[50vh] overflow-y-auto whitespace-pre-wrap break-words font-serif text-sm leading-relaxed text-amber-950">
                      {openEntry.body}
                    </p>
                  </div>
                </div>
              ) : (
                <ul className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
                  {notebookEntriesFor(notebookIdea, loadExtrasMap()[notebookIdea.id] ?? {}).map(
                    (entry) => (
                      <li key={entry.id}>
                        <button
                          type="button"
                          onClick={() => setOpenEntry(entry)}
                          className="w-full rounded-sm border border-amber-900/25 bg-amber-50/70 px-3 py-2 text-left font-serif text-amber-950 transition hover:bg-amber-100"
                        >
                          <div className="text-[10px] uppercase tracking-[0.2em] text-amber-900/60">
                            {entryDate(entry.ts)}
                          </div>
                          <div className="mt-0.5 text-sm font-semibold">{entry.title}</div>
                        </button>
                      </li>
                    ),
                  )}
                </ul>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <ChapterTemplateDialog
        ideaId={chapterTemplateIdea?.id}
        ideaTitle={chapterTemplateIdea?.title}
        chapterId={
          chapterTemplateIdea
            ? (currentChapterIdForIdea(
                chapterTemplateIdea,
                loadExtrasMap()[chapterTemplateIdea.id],
              ) ?? TREEHOUSE_CHAPTER_TEMPLATES[0].id)
            : TREEHOUSE_CHAPTER_TEMPLATES[0].id
        }
        open={Boolean(chapterTemplateIdea)}
        onDemoComplete={(chapterId) => {
          if (chapterTemplateIdea) advanceChapterDemo(chapterTemplateIdea, chapterId);
        }}
        onOpenChange={(open) => {
          if (!open) setChapterTemplateIdea(null);
        }}
      />

      <Dialog
        open={Boolean(addNoteIdea)}
        onOpenChange={(open) => {
          if (!open) {
            setAddNoteIdea(null);
            setNoteText("");
            setNoteTitle("");
            setListening(false);
          }
        }}
      >
        <DialogContent>
          {addNoteIdea && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif">
                  Add notebook note: {addNoteIdea.title || "Untitled idea"}
                </DialogTitle>
                <DialogDescription>
                  {entryDate(Date.now())} - save original project information here.
                </DialogDescription>
              </DialogHeader>
              <input
                value={noteTitle}
                onChange={(event) => setNoteTitle(event.target.value)}
                placeholder="Optional note title"
                className="w-full rounded-sm border border-amber-900/30 bg-amber-50/80 px-3 py-2 font-serif text-sm text-amber-950 outline-none focus:border-amber-950"
              />
              <textarea
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                placeholder="Add the original note, idea detail, quote, transcript, or update..."
                rows={7}
                className="mt-3 w-full resize-none rounded-sm border border-amber-900/30 bg-amber-50/80 px-3 py-2 font-serif text-sm text-amber-950 outline-none focus:border-amber-950"
              />
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={startNoteVoice}
                  className="inline-flex items-center gap-1 rounded-sm border border-amber-900/40 bg-amber-100/70 px-3 py-1.5 font-serif text-[12px] text-amber-950 transition hover:bg-amber-100"
                >
                  <Mic className="h-3.5 w-3.5" />
                  {listening ? "Listening..." : "Speak"}
                </button>
                <button
                  type="button"
                  disabled={!noteText.trim()}
                  onClick={addNotebookNote}
                  className="inline-flex items-center gap-1 rounded-sm border border-emerald-900/60 bg-gradient-to-b from-[#5f7d4a] to-[#324a26] px-3 py-1.5 font-serif text-[12px] font-semibold text-amber-50 transition hover:from-[#708e5a] hover:to-[#3d5a30] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Note
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteIdeaTarget)}
        onOpenChange={(open) => {
          if (!open) cancelDeleteIdea();
        }}
      >
        <DialogContent>
          {deleteIdeaTarget && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif">
                  {deleteConfirmStep === 1 ? "Delete this idea?" : "Last chance"}
                </DialogTitle>
                <DialogDescription>
                  {deleteConfirmStep === 1
                    ? `This will delete "${deleteIdeaTarget.title || "Untitled idea"}" off the shelf. Is this something you want to do?`
                    : `Are you sure? This is your last chance to keep "${deleteIdeaTarget.title || "Untitled idea"}" on the shelf.`}
                </DialogDescription>
              </DialogHeader>
              {deleteConfirmStep === 1 ? (
                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={cancelDeleteIdea}
                    className="rounded-sm border border-amber-900/30 bg-amber-50/70 px-3 py-1.5 font-serif text-[12px] font-semibold text-amber-950 transition hover:bg-amber-100"
                  >
                    No, keep it
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmStep(2)}
                    className="rounded-sm border border-red-900/50 bg-red-900/80 px-3 py-1.5 font-serif text-[12px] font-semibold text-red-50 transition hover:bg-red-800"
                  >
                    Yes, delete it
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={deleteIdea}
                    className="rounded-sm border border-red-900/50 bg-red-900/80 px-3 py-1.5 font-serif text-[12px] font-semibold text-red-50 transition hover:bg-red-800"
                  >
                    Yes, delete it
                  </button>
                  <button
                    type="button"
                    onClick={cancelDeleteIdea}
                    className="rounded-sm border border-amber-900/30 bg-amber-50/70 px-3 py-1.5 font-serif text-[12px] font-semibold text-amber-950 transition hover:bg-amber-100"
                  >
                    No, keep it
                  </button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
