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
import { generateWorkingProjectTitle, shouldCleanWorkingProjectTitle } from "@/lib/project-naming";
import libraryBgAsset from "@/assets/dabottree-library-bg.png.asset.json";
import logo from "@/assets/dabottree-logo.png";
import { AccountBadge, CreditsPill } from "@/components/AccountBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BookOpen, Coins, FileText, XCircle, Tag, Plus, Mic, Save } from "lucide-react";

const libraryBg = libraryBgAsset.url;

const IDEAS_STORAGE_KEY = "dabottree:ideas";
const EXTRAS_STORAGE_KEY = "dabottree:ideaExtras";
const LIBRARY_START_CREDIT_COST = 10;
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
};
type NotebookEntry = {
  id: string;
  title: string;
  body: string;
  ts: number;
};

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
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(IDEAS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return (parsed as LightbulbIdea[]).map(cleanStoredIdeaTitle).map(normalizeLibraryStage);
    }
  } catch {}
  return null;
}

function loadExtrasMap(): Record<string, IdeaExtrasRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(EXTRAS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function saveExtrasMap(extras: Record<string, IdeaExtrasRecord>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(EXTRAS_STORAGE_KEY, JSON.stringify(extras));
  } catch {}
}

function readCreditsBalance(): number {
  if (typeof window === "undefined") return 0;
  try {
    const value = Number(localStorage.getItem("dabottree:credits") ?? "0");
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  } catch {
    return 0;
  }
}

function writeCreditsBalance(value: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("dabottree:credits", String(Math.max(0, Math.floor(value))));
    window.dispatchEvent(new Event("storage"));
  } catch {}
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
  } catch {}
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

function backfillMissingIntakeExtras(ideas: LightbulbIdea[]): LightbulbIdea[] {
  if (typeof window === "undefined") return ideas;
  try {
    const rawExtras = localStorage.getItem(EXTRAS_STORAGE_KEY);
    const parsedExtras = rawExtras ? JSON.parse(rawExtras) : null;
    const existingExtras =
      parsedExtras && typeof parsedExtras === "object" && !Array.isArray(parsedExtras)
        ? parsedExtras
        : {};
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
        currentExtras.posts.some(
          (post: { source?: string }) => post && post.source === "captured-note",
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
      localStorage.setItem(EXTRAS_STORAGE_KEY, JSON.stringify(existingExtras));
    }
    return changedIdeas ? nextIdeas : ideas;
  } catch {
    return ideas;
  }
}

function nextStepSummary(idea: LightbulbIdea): string {
  if (idea.stage === "lightbulb") return `Next step: ${IDEA_SHELF_NEXT_ACTION}`;
  const action = idea.nextAction?.trim();
  if (action) return `Next step: ${action}`;
  const stageHint =
    idea.stage === "pre-clarity"
      ? "Answer the next personalized Clarity question to keep moving forward."
      : idea.stage === "paid-creation"
        ? "Review the paid creation packet and confirm the next move."
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
  const [openEntry, setOpenEntry] = useState<NotebookEntry | null>(null);
  const [addNoteIdea, setAddNoteIdea] = useState<LightbulbIdea | null>(null);
  const [deleteIdeaTarget, setDeleteIdeaTarget] = useState<LightbulbIdea | null>(null);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<1 | 2>(1);
  const [libraryStartIdea, setLibraryStartIdea] = useState<LightbulbIdea | null>(null);
  const [creditBalance, setCreditBalance] = useState(0);
  const [noteText, setNoteText] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [listening, setListening] = useState(false);
  const [typeFilter, setTypeFilter] = useState("All");

  const ideaTypes = useMemo(() => {
    return Array.from(new Set(ideas.map(ideaTypeFor))).sort((a, b) => a.localeCompare(b));
  }, [ideas]);
  const visibleIdeas = useMemo(() => {
    if (typeFilter === "All") return ideas;
    return ideas.filter((idea) => ideaTypeFor(idea) === typeFilter);
  }, [ideas, typeFilter]);

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
        try {
          const rawExtras = localStorage.getItem(EXTRAS_STORAGE_KEY);
          const parsedExtras = rawExtras ? JSON.parse(rawExtras) : null;
          const existingExtras =
            parsedExtras && typeof parsedExtras === "object" && !Array.isArray(parsedExtras)
              ? parsedExtras
              : {};
          localStorage.setItem(
            EXTRAS_STORAGE_KEY,
            JSON.stringify({
              ...existingExtras,
              [newIdea.id]: extrasFromDraft(draft, ts),
            }),
          );
        } catch {}
        sessionStorage.removeItem("dabottree:draftIdea");
        sessionStorage.removeItem("dabottree:draftIdeaType");
      }
    } catch {}
    nextIdeas = backfillMissingIntakeExtras(nextIdeas);
    setIdeas(nextIdeas);
    setCreditBalance(readCreditsBalance());
    setReady(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncCredits = () => setCreditBalance(readCreditsBalance());
    syncCredits();
    window.addEventListener("storage", syncCredits);
    window.addEventListener("focus", syncCredits);
    document.addEventListener("visibilitychange", syncCredits);
    return () => {
      window.removeEventListener("storage", syncCredits);
      window.removeEventListener("focus", syncCredits);
      document.removeEventListener("visibilitychange", syncCredits);
    };
  }, []);

  // Persist deletions made on this page.
  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    try {
      localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(ideas));
    } catch {}
  }, [ideas, ready]);

  useEffect(() => {
    if (typeFilter !== "All" && !ideaTypes.includes(typeFilter)) {
      setTypeFilter("All");
    }
  }, [ideaTypes, typeFilter]);

  const openIdea = (id: string) => {
    navigate({ to: "/dashboard", search: { ideaId: id } });
  };

  const hasPaidLibraryStart = (id: string) => {
    if (typeof window === "undefined") return false;
    const idea = ideas.find((candidate) => candidate.id === id);
    return idea ? hasConfirmedLibraryStart(idea) : false;
  };

  const beginBuild = (idea: LightbulbIdea) => {
    if (idea.stage === "lightbulb" && !hasPaidLibraryStart(idea.id)) {
      setLibraryStartIdea(idea);
      setCreditBalance(readCreditsBalance());
      return;
    }
    if (idea.stage === "lightbulb" && hasPaidLibraryStart(idea.id)) {
      setIdeas((prev) =>
        prev.map((i) => (i.id === idea.id ? syncLibraryStageFromPaidStart(i) : i)),
      );
    }
    openIdea(idea.id);
  };

  const addCredits = (amount: number) => {
    const next = readCreditsBalance() + amount;
    writeCreditsBalance(next);
    setCreditBalance(next);
  };

  const confirmLibraryStart = () => {
    if (!libraryStartIdea) return;
    const balance = readCreditsBalance();
    if (balance < LIBRARY_START_CREDIT_COST) {
      setCreditBalance(balance);
      return;
    }
    const next = balance - LIBRARY_START_CREDIT_COST;
    writeCreditsBalance(next);
    try {
      localStorage.setItem(libraryStartPaidKey(libraryStartIdea.id), "1");
      localStorage.setItem(libraryStartConfirmedKey(libraryStartIdea.id), "1");
    } catch {}
    const id = libraryStartIdea.id;
    setIdeas((prev) =>
      prev.map((idea) => (idea.id === id ? syncLibraryStageFromPaidStart(idea) : idea)),
    );
    setLibraryStartIdea(null);
    openIdea(id);
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
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: any) => {
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
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(EXTRAS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            delete parsed[id];
            localStorage.setItem(EXTRAS_STORAGE_KEY, JSON.stringify(parsed));
          }
        }
      } catch {}
    }
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
          Saved Ideas
        </h1>

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
        ) : visibleIdeas.length === 0 ? (
          <div className="rounded-md border border-amber-200/30 bg-amber-950/40 px-4 py-6 text-center font-serif italic text-amber-100/80">
            No ideas match this filter yet.
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleIdeas.map((idea) => {
              const stage = idea.stage ? `Stage: ${stageLabels[idea.stage]}` : "Stage: Idea";
              const ideaType = ideaTypeFor(idea);
              const notebookEntryCount = notebookEntriesFor(
                idea,
                loadExtrasMap()[idea.id] ?? {},
              ).length;
              return (
                <li
                  key={idea.id}
                  className="relative flex h-full flex-col rounded-md border border-amber-200/30 bg-amber-950/60 p-4 shadow-lg backdrop-blur-sm"
                >
                  <div
                    title={stage}
                    className={`absolute left-3 top-3 inline-flex max-w-[48%] items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] shadow-sm ${stagePillClass(idea.stage)}`}
                  >
                    <Tag className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate">{stage}</span>
                  </div>
                  <div className="absolute right-3 top-3 inline-flex max-w-[45%] items-center gap-1 rounded-full border border-cyan-100/40 bg-cyan-950/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-cyan-50 shadow-sm">
                    <Tag className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate">{ideaType}</span>
                  </div>
                  <div className="pt-7 font-serif text-[15px] font-semibold text-amber-50">
                    {idea.title || "Untitled"}
                  </div>
                  <div className="mt-1 font-serif text-[12px] italic leading-relaxed text-amber-100/85">
                    {nextStepSummary(idea)}
                  </div>
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
                      onClick={() => beginBuild(idea)}
                      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-sm border border-amber-200/45 bg-gradient-to-b from-[#8b663d] via-[#6f4a28] to-[#3f2716] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-50 shadow-[inset_0_1px_0_rgba(255,232,188,0.28),0_10px_20px_-14px_rgba(0,0,0,0.9)] transition hover:from-[#9a7348] hover:via-[#795330] hover:to-[#4c301c]"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>Let's Build</span>
                    </button>
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

      {libraryStartIdea && (
        <LibraryStartCreditModal
          idea={libraryStartIdea}
          balance={creditBalance}
          cost={LIBRARY_START_CREDIT_COST}
          onAddCredits={addCredits}
          onClose={() => setLibraryStartIdea(null)}
          onConfirm={confirmLibraryStart}
        />
      )}
    </main>
  );
}

function LibraryStartCreditModal({
  idea,
  balance,
  cost,
  onAddCredits,
  onClose,
  onConfirm,
}: {
  idea: LightbulbIdea;
  balance: number;
  cost: number;
  onAddCredits: (amount: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const canAfford = balance >= cost;
  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-label="Start Library stage"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />
      <div
        className="relative w-full max-w-[500px] rounded-md border border-amber-200/60 px-6 py-6 text-amber-50 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9),0_0_70px_-10px_rgba(255,190,90,0.55)]"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(142,96,31,0.96) 0%, rgba(72,43,15,0.98) 58%, rgba(34,20,8,0.99) 100%)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full border border-amber-200/40 bg-black/40 px-2.5 py-1 text-[11px] text-amber-50/80 transition hover:bg-black/60"
        >
          x
        </button>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-amber-200/50 bg-black/25">
          <Coins className="h-6 w-6 text-amber-200" />
        </div>
        <p className="mt-4 text-center text-[11px] uppercase tracking-[0.28em] text-amber-100/75">
          First Real Step
        </p>
        <h2 className="mt-2 text-center font-serif text-[24px] leading-tight text-amber-50">
          Start Library Stage?
        </h2>
        <div className="mt-4 rounded-md border border-amber-200/20 bg-black/25 p-4 text-sm leading-relaxed text-amber-50/90">
          <p>
            This is the first real step toward turning the idea into a real project. It costs{" "}
            <strong>{cost} credits</strong> because the Library Stage starts the guided questions
            that shape the foundation before anything gets built.
          </p>
          <p className="mt-3">
            The goal is to turn the rough concept into a clear project brief you can print, share,
            or use as the starting point for building.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-sm border border-amber-200/20 bg-black/25 px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.18em] text-amber-100/60">
                Available credits
              </div>
              <div className="mt-1 text-lg font-semibold tabular-nums">{balance}</div>
            </div>
            <button
              type="button"
              onClick={() => onAddCredits(10)}
              className="rounded-sm border border-amber-200/35 bg-amber-100/12 px-3 py-2 text-left text-amber-50 transition hover:bg-amber-100/20"
            >
              <div className="text-[10px] uppercase tracking-[0.18em] text-amber-100/60">
                Need more?
              </div>
              <div className="mt-1 font-semibold">Add 10 Credits</div>
            </button>
          </div>
          {!canAfford && (
            <p className="mt-3 text-[12px] text-amber-100/75">
              Add credits before starting this Library stage.
            </p>
          )}
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-amber-200/30 px-4 py-2 text-sm text-amber-100 transition hover:bg-amber-200/10"
          >
            Not yet
          </button>
          <button
            type="button"
            disabled={!canAfford}
            onClick={onConfirm}
            className={
              "rounded-full border px-4 py-2 text-sm font-semibold transition " +
              (canAfford
                ? "border-amber-200/70 bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 hover:from-amber-200 hover:to-amber-400"
                : "cursor-not-allowed border-amber-200/20 bg-black/35 text-amber-100/45")
            }
          >
            {canAfford ? `Spend ${cost} credits and start Library` : "Add credits first"}
          </button>
        </div>
      </div>
    </div>
  );
}
