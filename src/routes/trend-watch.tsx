import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bell, CheckCircle2, Clock3, FileText, Radar, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import rootRoomBgAsset from "@/assets/root-room-bg-v2.png.asset.json";

export const Route = createFileRoute("/trend-watch")({
  head: () => ({
    meta: [
      { title: "Trend Watch - DaBotTree" },
      {
        name: "description",
        content:
          "A local-only trend watch page for real estate media, AI photo, listing video, virtual staging, and buyer preview ideas.",
      },
    ],
  }),
  component: TrendWatchPage,
});

const IDEAS_STORAGE_KEY = "dabottree:ideas";
const NOTES_STORAGE_KEY = "dabottree:trendWatchNotes";

type ActiveProject = {
  description?: string;
  id: string;
  title: string;
};

type WatchNote = {
  id: string;
  status: string;
  summary: string;
  ts: number;
};

const watchAreas = [
  {
    label: "AI photo enhancement",
    detail: "Track tools that clean, brighten, upscale, and repair ordinary property photos.",
  },
  {
    label: "Virtual staging",
    detail: "Watch furniture, decor, room-style, renovation, and empty-room staging options.",
  },
  {
    label: "360 and walkthrough media",
    detail:
      "Track simple ways to turn phone photos into tours, panoramas, or room-to-room previews.",
  },
  {
    label: "Listing video generation",
    detail: "Watch short-form listing videos, voiceover, captions, reels, and realtor ad formats.",
  },
  {
    label: "Buyer-personalized previews",
    detail: "Track ways to place a buyer's belongings, taste, or lifestyle into a possible home.",
  },
  {
    label: "Trust and compliance",
    detail:
      "Watch disclosure, photo truthfulness, watermarking, realtor rules, and seller expectations.",
  },
];

function readActiveProject(): ActiveProject | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(IDEAS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;

    const ideas = parsed.filter((idea): idea is Record<string, unknown> =>
      Boolean(idea && typeof idea === "object" && typeof idea.title === "string"),
    );
    const active = ideas.sort((a, b) => Number(b.updatedAt ?? 0) - Number(a.updatedAt ?? 0))[0];
    if (!active) return null;

    return {
      description: typeof active.description === "string" ? active.description : undefined,
      id: typeof active.id === "string" ? active.id : `idea-${Date.now()}`,
      title: active.title as string,
    };
  } catch {
    return null;
  }
}

function readWatchNotes(projectId: string | undefined): WatchNote[] {
  if (typeof window === "undefined" || !projectId) return [];

  try {
    const raw = window.localStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
    const notes = (parsed as Record<string, unknown>)[projectId];
    return Array.isArray(notes) ? (notes as WatchNote[]) : [];
  } catch {
    return [];
  }
}

function saveWatchNotes(projectId: string, notes: WatchNote[]) {
  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(NOTES_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    const existing = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    window.localStorage.setItem(
      NOTES_STORAGE_KEY,
      JSON.stringify({
        ...existing,
        [projectId]: notes,
      }),
    );
  } catch {
    // Local watch notes are helpful, but they should never block the page.
  }
}

function TrendWatchPage() {
  const [activeProject, setActiveProject] = useState<ActiveProject | null>(null);
  const [notes, setNotes] = useState<WatchNote[]>([]);

  useEffect(() => {
    const project = readActiveProject();
    setActiveProject(project);
    setNotes(readWatchNotes(project?.id));
  }, []);

  const latestNote = notes[0] ?? null;
  const projectTitle = activeProject?.title ?? "Real Estate Media Tool";
  const projectDescription = activeProject?.description ?? "Local fake-project proof";
  const formattedNoteDate = useMemo(() => {
    if (!latestNote) return "No local update note yet";
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(latestNote.ts);
  }, [latestNote]);

  const addLocalWatchNote = () => {
    if (!activeProject) return;

    const nextNotes = [
      {
        id: `trend-watch-${Date.now()}`,
        status: "local_note_only",
        summary:
          "Weekly outside research is planned, but not active. Current local watch areas are saved for later approval.",
        ts: Date.now(),
      },
      ...notes,
    ];
    setNotes(nextNotes);
    saveWatchNotes(activeProject.id, nextNotes);
  };

  return (
    <main className="min-h-screen bg-[#10140f] text-white">
      <section className="relative min-h-screen overflow-hidden">
        <img
          src={rootRoomBgAsset.url}
          alt=""
          className="fixed inset-0 h-full w-full object-cover opacity-45"
          draggable={false}
        />
        <div className="fixed inset-0 bg-[linear-gradient(180deg,rgba(8,11,8,0.7),rgba(8,11,8,0.96))]" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Link
                to="/levels"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-white/15 bg-black/35 px-3 text-sm text-white/90 backdrop-blur transition hover:bg-black/50"
              >
                <ArrowLeft className="h-4 w-4" />
                Levels
              </Link>
              <Link
                to="/library"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-white/15 bg-black/35 px-3 text-sm text-white/90 backdrop-blur transition hover:bg-black/50"
              >
                Library
              </Link>
            </div>
            <div className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-200/25 bg-emerald-300/10 px-3 text-sm text-emerald-100">
              <CheckCircle2 className="h-4 w-4" />
              Local only
            </div>
          </header>

          <section className="grid flex-1 items-center gap-7 py-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
            <div className="max-w-xl">
              <p className="mb-3 inline-flex items-center gap-2 text-sm text-emerald-200">
                <Radar className="h-4 w-4" />
                Trend Watch
              </p>
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
                Keep the real estate media project current.
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-200">
                This page gives the project a dedicated place for new AI photo, video, tour,
                staging, and buyer-preview changes before any weekly outside research worker is
                approved.
              </p>

              <div className="mt-5 rounded-md border border-white/12 bg-black/35 p-4 backdrop-blur-md">
                <p className="text-xs uppercase tracking-[0.18em] text-amber-200">Active project</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{projectTitle}</h2>
                <p className="mt-2 line-clamp-5 text-sm leading-6 text-slate-300">
                  {projectDescription}
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <section className="rounded-md border border-white/12 bg-black/40 p-4 shadow-2xl backdrop-blur-md sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-sky-200">
                      Weekly updater
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold text-white">
                      Planned, not active yet
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200/25 bg-amber-300/10 px-2.5 py-1.5 text-xs text-amber-100">
                    <Clock3 className="h-3.5 w-3.5" />
                    Approval needed
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  This slot is ready for a future weekly research worker, but it does not browse,
                  schedule, spend, message bots, or call n8n right now.
                </p>
                <div className="mt-4 grid gap-2 text-sm text-slate-200 sm:grid-cols-3">
                  <div className="rounded-md border border-white/10 bg-white/[0.06] p-3">
                    <Bell className="mb-2 h-4 w-4 text-amber-200" />
                    Find new changes
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/[0.06] p-3">
                    <FileText className="mb-2 h-4 w-4 text-amber-200" />
                    Save a project note
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/[0.06] p-3">
                    <Sparkles className="mb-2 h-4 w-4 text-amber-200" />
                    Suggest test ideas
                  </div>
                </div>
              </section>

              <section className="rounded-md border border-white/12 bg-black/40 p-4 backdrop-blur-md sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-emerald-200">
                      Watch areas
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold text-white">
                      Real estate media signals
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={addLocalWatchNote}
                    disabled={!activeProject}
                    className="inline-flex min-h-9 items-center justify-center rounded-md border border-emerald-100/25 bg-emerald-200/15 px-3 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-200/25 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Record local note
                  </button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {watchAreas.map((area) => (
                    <article
                      key={area.label}
                      className="rounded-md border border-white/10 bg-white/[0.06] p-3"
                    >
                      <p className="font-semibold text-white">{area.label}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">{area.detail}</p>
                    </article>
                  ))}
                </div>

                <div className="mt-4 rounded-md border border-sky-200/18 bg-sky-300/10 p-3">
                  <p className="text-sm font-semibold text-sky-100">Latest local note</p>
                  <p className="mt-1 text-xs text-slate-400">{formattedNoteDate}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    {latestNote?.summary ??
                      "No note has been recorded yet. Use this as the project slot for future trend updates."}
                  </p>
                </div>
              </section>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
