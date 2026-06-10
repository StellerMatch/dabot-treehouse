import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { seedIdeas, stageLabels, type LightbulbIdea } from "@/lib/dabottree-state";
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
import { BookOpen, FileText, Trash2, Tag, Plus, Mic, Save } from "lucide-react";

const libraryBg = libraryBgAsset.url;

const IDEAS_STORAGE_KEY = "dabottree:ideas";
const EXTRAS_STORAGE_KEY = "dabottree:ideaExtras";
const INTAKE_CATEGORY_KEYS = [
  "core-idea",
  "clarity",
  "problem",
  "audience",
  "features",
  "workflow",
  "design",
  "business",
  "concerns",
] as const;

type IntakeCategoryKey = (typeof INTAKE_CATEGORY_KEYS)[number];
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

const intakeCategoryLabels: Record<IntakeCategoryKey, string> = {
  "core-idea": "Core Idea",
  clarity: "Clarity",
  problem: "Problem",
  audience: "Audience",
  features: "Features",
  workflow: "Workflow",
  design: "Design",
  business: "Business",
  concerns: "Concerns",
};

function cleanDraftText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function titleFromDraft(text: string, ideaType?: string): string {
  const clean = cleanDraftText(text);
  const firstSentence = clean.split(/[.!?]/)[0]?.trim() || clean;
  const words = firstSentence.split(/\s+/).filter(Boolean).slice(0, 7);
  const title = words.join(" ");
  if (title.length > 0) return title.charAt(0).toUpperCase() + title.slice(1);
  return ideaType ? `${ideaType} idea` : "Untitled idea";
}

function summaryFromDraft(text: string): string {
  const clean = cleanDraftText(text);
  if (clean.length <= 180) return clean;
  return `${clean.slice(0, 177).trim()}...`;
}

function ideaFromDraft(text: string, ideaType?: string): LightbulbIdea {
  const ts = Date.now();
  const title = titleFromDraft(text, ideaType);
  const isStrongIntake = cleanDraftText(text).length >= 220;
  return {
    id: `idea-${ts}`,
    title,
    messy: summaryFromDraft(text),
    shelfReadiness: isStrongIntake ? 82 : 32,
    updatedAt: ts,
    stage: "lightbulb",
    nextAction: isStrongIntake
      ? "Answer three Clarity questions before moving to the next step"
      : "Answer the next clarity question",
    ideaType: ideaType || undefined,
    description: cleanDraftText(text),
  };
}

function extrasFromDraft(text: string, ts: number) {
  const clean = cleanDraftText(text);
  const isStrongIntake = clean.length >= 220;
  const clarityText = isStrongIntake
    ? `Captured a strong front-screen idea intake. Direction reads in the low 80s because the prompt gives the library a strong base, but Clarity still needs three focused answers before the report unlocks.\n\n-- Source Notes --\n${clean}`
    : `Captured the front-screen idea intake. Add more answers to strengthen the category folders.\n\n-- Source Notes --\n${clean}`;

  return {
    sourceText: text,
    notes: {},
    attachments: [],
    posts: INTAKE_CATEGORY_KEYS.map((category, index) => ({
      id: `post-${ts}-${category}`,
      kind: "idea-notes",
      text: intakeCategoryLabels[category],
      fullText: category === "clarity" ? clarityText : clean,
      ts: ts - index,
      categories: [category],
      source: "generated-folder",
    })),
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
    if (Array.isArray(parsed)) return parsed as LightbulbIdea[];
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
      title: post.text?.trim() && post.text.trim() !== body ? post.text.trim() : shortEntryTitle(body),
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
    lightbulb:
      "border-emerald-200/50 bg-gradient-to-b from-[#5f7d4a] to-[#324a26] text-emerald-50",
    "pre-clarity":
      "border-sky-200/50 bg-gradient-to-b from-[#6a8ca8] to-[#36556f] text-sky-50",
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

      if (hasUsefulText) {
        if (
          idea.shelfReadiness >= 90 ||
          idea.nextAction === "Answer the next clarity question" ||
          idea.nextAction === "Review idea progress, then move to the next step"
        ) {
          changedIdeas = true;
          return {
            ...idea,
            shelfReadiness: 82,
            nextAction: "Answer three Clarity questions before moving to the next step",
          };
        }
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
  const action = idea.nextAction?.trim();
  if (action) return `Next step: ${action}`;
  const stageHint =
    idea.stage === "lightbulb"
      ? "Add a few more notes so we can start shaping this idea."
      : idea.stage === "pre-clarity"
        ? "Answer Clarity's next question to keep moving forward."
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
  const [noteText, setNoteText] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [listening, setListening] = useState(false);

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
        sessionStorage.removeItem("dabottree:packageTier");
        sessionStorage.removeItem("dabottree:reportPath");
      }
    } catch {}
    nextIdeas = backfillMissingIntakeExtras(nextIdeas);
    setIdeas(nextIdeas);
    setReady(true);
  }, []);

  // Persist deletions made on this page.
  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    try {
      localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(ideas));
    } catch {}
  }, [ideas, ready]);

  const openIdea = (id: string) => {
    navigate({ to: "/dashboard", search: { ideaId: id } });
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

  const deleteIdea = (id: string) => {
    const target = ideas.find((i) => i.id === id);
    const ok = window.confirm(
      `Delete "${target?.title || "Untitled"}" from your library?`,
    );
    if (!ok) return;
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

        {ideas.length === 0 ? (
          <div className="rounded-md border border-amber-200/30 bg-amber-950/40 px-4 py-6 text-center font-serif italic text-amber-100/80">
            No ideas yet. Head to the start screen to capture one.
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ideas.map((idea) => {
              const stage = idea.stage
                ? `Stage: ${stageLabels[idea.stage]}`
                : "Stage: Idea";
              return (
                <li
                  key={idea.id}
                  className="rounded-md border border-amber-200/30 bg-amber-950/60 p-4 shadow-lg backdrop-blur-sm"
                >
                  <div className="font-serif text-[15px] font-semibold text-amber-50">
                    {idea.title || "Untitled"}
                  </div>
                  <div className="mt-1 line-clamp-3 font-serif text-[12px] italic text-amber-100/85">
                    {nextStepSummary(idea)}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openIdea(idea.id)}
                      className="inline-flex items-center gap-1 rounded-sm border border-emerald-200/60 bg-gradient-to-b from-[#68a15a] to-[#2f6b35] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-50 shadow-[0_0_18px_-8px_rgba(165,255,180,0.95)] transition hover:from-[#77b86a] hover:to-[#387a40]"
                    >
                      <BookOpen className="h-3 w-3" />
                      Continue Project
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotebookIdea(idea)}
                      className="inline-flex items-center gap-1 rounded-sm border border-amber-900/40 bg-gradient-to-b from-[#a8763d] to-[#7a4f24] px-2.5 py-1 text-[10px] font-semibold text-amber-50 shadow-sm transition hover:from-[#b78449] hover:to-[#8b5a2a]"
                    >
                      <FileText className="h-3 w-3" />
                      Notebook
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
                      Add Note
                    </button>
                    <button
                      type="button"
                      onClick={(e) => e.preventDefault()}
                      title={stage}
                      className={`inline-flex items-center gap-1 rounded-sm px-2.5 py-1 text-[10px] font-semibold shadow-sm ${stagePillClass(idea.stage)}`}
                    >
                      <Tag className="h-3 w-3" />
                      {stage}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteIdea(idea.id)}
                      className="ml-auto inline-flex items-center gap-1 rounded-sm border border-red-300/40 bg-red-900/40 px-2 py-1 text-[10px] text-red-50 transition hover:bg-red-900/60"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
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
    </main>
  );
}
