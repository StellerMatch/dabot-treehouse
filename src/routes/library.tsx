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
import { BookOpen, FileText, Trash2, Tag, Plus } from "lucide-react";

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
    shelfReadiness: isStrongIntake ? 96 : 32,
    updatedAt: ts,
    stage: "lightbulb",
    nextAction: isStrongIntake
      ? "Review idea progress, then move to the next step"
      : "Answer the next clarity question",
    ideaType: ideaType || undefined,
    description: cleanDraftText(text),
  };
}

function extrasFromDraft(text: string, ts: number) {
  const clean = cleanDraftText(text);
  const isStrongIntake = clean.length >= 220;
  const clarityText = isStrongIntake
    ? `Captured a strong front-screen idea intake. Direction reads about 90% because the prompt gives the library enough detail to start across the main folders.\n\n-- Source Notes --\n${clean}`
    : `Captured the front-screen idea intake. Add more answers to strengthen the category folders.\n\n-- Source Notes --\n${clean}`;

  return {
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
    answeredQuestions: isStrongIntake
      ? [
          "problem",
          "who",
          "version-one",
          "who-does-work",
          "trust-first",
          "most-important-detail",
          "first-paid-version",
          "look-like",
        ]
      : [],
    skippedQuestions: [],
    clarityFollowupCount: isStrongIntake ? 5 : 0,
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

      if (hasUsefulText && !hasPosts) {
        existingExtras[idea.id] = extrasFromDraft(fullText, idea.updatedAt || Date.now());
        changedExtras = true;
        if (idea.shelfReadiness < 90 || idea.nextAction === "Answer the next clarity question") {
          changedIdeas = true;
          return {
            ...idea,
            shelfReadiness: Math.max(idea.shelfReadiness, 96),
            nextAction: "Review idea progress, then move to the next step",
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
      { title: "Library — DaBotTree" },
      {
        name: "description",
        content: "Your saved ideas, ready to open from the DaBotTree library.",
      },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<LightbulbIdea[]>(seedIdeas);
  const [ready, setReady] = useState(false);
  const [summaryIdea, setSummaryIdea] = useState<LightbulbIdea | null>(null);

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
      {/* Library scene background — distinct from the idea dashboard. */}
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
            Library
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
          <AccountBadge placement="inline" />
        </div>
      </header>

      <section className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-6 font-serif text-2xl text-amber-50 drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)]">
          My Saved Ideas
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
                      className="inline-flex items-center gap-1 rounded-sm border border-emerald-900/60 bg-gradient-to-b from-[#5f7d4a] to-[#324a26] px-2.5 py-1 text-[10px] font-semibold text-amber-50 shadow-sm transition hover:from-[#708e5a] hover:to-[#3d5a30]"
                    >
                      <BookOpen className="h-3 w-3" />
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => setSummaryIdea(idea)}
                      className="inline-flex items-center gap-1 rounded-sm border border-amber-900/40 bg-gradient-to-b from-[#a8763d] to-[#7a4f24] px-2.5 py-1 text-[10px] font-semibold text-amber-50 shadow-sm transition hover:from-[#b78449] hover:to-[#8b5a2a]"
                    >
                      <FileText className="h-3 w-3" />
                      Review
                    </button>
                    <button
                      type="button"
                      onClick={(e) => e.preventDefault()}
                      title={stage}
                      className="inline-flex items-center gap-1 rounded-sm border border-amber-900/40 bg-gradient-to-b from-[#8a6a3a] to-[#5c4421] px-2.5 py-1 text-[10px] font-semibold text-amber-50 shadow-sm"
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
        open={Boolean(summaryIdea)}
        onOpenChange={(open) => !open && setSummaryIdea(null)}
      >
        <DialogContent>
          {summaryIdea && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif">
                  {summaryIdea.title || "Untitled idea"}
                </DialogTitle>
                <DialogDescription>
                  Next step for this saved idea.
                </DialogDescription>
              </DialogHeader>
              <p className="whitespace-pre-wrap break-words font-serif text-sm">
                {nextStepSummary(summaryIdea)}
              </p>
              <button
                type="button"
                onClick={() => {
                  const id = summaryIdea.id;
                  setSummaryIdea(null);
                  openIdea(id);
                }}
                className="mt-3 inline-flex items-center gap-2 self-start rounded-sm border border-emerald-900/60 bg-gradient-to-b from-[#5f7d4a] to-[#324a26] px-3 py-1.5 font-serif text-[12px] font-semibold text-amber-50 transition hover:from-[#708e5a] hover:to-[#3d5a30]"
              >
                <BookOpen className="h-4 w-4" />
                Open This Idea
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
