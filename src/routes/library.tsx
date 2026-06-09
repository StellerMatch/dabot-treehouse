import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { seedIdeas, stageLabels, type LightbulbIdea } from "@/lib/dabottree-state";
import libraryBgAsset from "@/assets/dabottree-library-bg.png.asset.json";
import logo from "@/assets/dabottree-logo.png";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BookOpen, FileText, Trash2, Tag } from "lucide-react";

const libraryBg = libraryBgAsset.url;

const IDEAS_STORAGE_KEY = "dabottree:ideas";
const EXTRAS_STORAGE_KEY = "dabottree:ideaExtras";

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
    if (stored) setIdeas(stored);
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
                  <div className="mt-1 line-clamp-3 font-serif text-[12px] italic text-amber-100/80">
                    {shortIdeaSummary(idea)}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openIdea(idea.id)}
                      className="rounded-sm border border-amber-200/40 bg-amber-100/10 px-2 py-1 text-[10px] font-semibold text-amber-50 transition hover:bg-amber-100/20"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => setSummaryIdea(idea)}
                      className="inline-flex items-center gap-1 rounded-sm border border-amber-200/40 bg-amber-100/10 px-2 py-1 text-[10px] text-amber-50 transition hover:bg-amber-100/20"
                    >
                      <FileText className="h-3 w-3" />
                      Summary
                    </button>
                    <button
                      type="button"
                      onClick={(e) => e.preventDefault()}
                      title={stage}
                      className="inline-flex items-center gap-1 rounded-sm border border-amber-200/40 bg-amber-100/10 px-2 py-1 text-[10px] text-amber-50"
                    >
                      <Tag className="h-3 w-3" />
                      {stage}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteIdea(idea.id)}
                      className="ml-auto inline-flex items-center gap-1 rounded-sm border border-red-300/40 bg-red-900/30 px-2 py-1 text-[10px] text-red-50 transition hover:bg-red-900/50"
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
                  Quick summary of this saved idea.
                </DialogDescription>
              </DialogHeader>
              <p className="whitespace-pre-wrap break-words font-serif text-sm">
                {shortIdeaSummary(summaryIdea)}
              </p>
              <button
                type="button"
                onClick={() => {
                  const id = summaryIdea.id;
                  setSummaryIdea(null);
                  openIdea(id);
                }}
                className="mt-3 inline-flex items-center gap-2 self-start rounded-sm border border-amber-900/40 bg-amber-100 px-3 py-1.5 font-serif text-[12px] font-semibold text-amber-950 transition hover:bg-amber-200"
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
