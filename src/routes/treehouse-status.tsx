import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  LockKeyhole,
  Network,
} from "lucide-react";
import statusData from "@/data/treehouse-internal-status.json";

export const Route = createFileRoute("/treehouse-status")({
  head: () => ({
    meta: [
      { title: "Treehouse Status — DaBotTree" },
      {
        name: "description",
        content: "Read-only internal status for the Treehouse/n8n scaffolds.",
      },
    ],
  }),
  component: TreehouseStatusPage,
});

type ChapterStatus = (typeof statusData.chapters)[number];

function statusStyles(status: ChapterStatus["status"]) {
  if (status === "step_five_passed") {
    return {
      icon: CheckCircle2,
      label: "Step Five passed",
      tone: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
    };
  }

  return {
    icon: CircleDashed,
    label: "Local scaffold",
    tone: "border-sky-300/25 bg-sky-300/10 text-sky-100",
  };
}

function TreehouseStatusPage() {
  const rootRoom = statusData.chapters[0];
  const remainingChapters = statusData.chapters.slice(1);

  return (
    <main className="min-h-screen bg-[#10130f] text-white">
      <section className="border-b border-white/10 bg-[#171c14]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/levels"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-white/15 bg-black/25 px-3 text-sm text-white/90 transition hover:bg-black/40"
            >
              <ArrowLeft className="h-4 w-4" />
              Treehouse
            </Link>
            <div className="hidden h-9 items-center gap-2 rounded-md border border-emerald-200/25 bg-emerald-300/10 px-3 text-sm text-emerald-100 sm:inline-flex">
              <Activity className="h-4 w-4" />
              Read-only status
            </div>
          </header>

          <div className="max-w-3xl py-5">
            <p className="text-sm font-semibold text-amber-200">Internal control surface</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
              Treehouse rooms are framed. Live movement is still gated.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200">
              This page shows the local scaffolds behind the Treehouse chapters. It is a visibility
              layer only: it reads the current status snapshot and keeps production actions locked.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#0f1515]">
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-6 sm:grid-cols-3 sm:px-6 lg:px-8">
          <StatusMetric
            label="Root Room"
            value="Step Five passed"
            detail="n8n accepted test POST"
          />
          <StatusMetric
            label="Other chapters"
            value={`${statusData.summary.additionalChapterScaffolds} scaffolded`}
            detail="Chapters 3 through 11"
          />
          <StatusMetric
            label="Scaffold checks"
            value={`${statusData.summary.chapterScaffoldChecks.passed} passed`}
            detail={`${statusData.summary.chapterScaffoldChecks.failed} failed`}
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="rounded-md border border-emerald-300/20 bg-emerald-300/10 p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-emerald-200/15">
                <CheckCircle2 className="h-5 w-5 text-emerald-100" />
              </div>
              <div>
                <p className="text-sm text-emerald-100">Current gate</p>
                <h2 className="text-xl font-semibold">{rootRoom.title}</h2>
              </div>
            </div>
            <dl className="mt-5 grid gap-4 text-sm">
              <StatusRow label="State" value={rootRoom.stateLabel} />
              <StatusRow label="Proof" value={rootRoom.proof} />
              <StatusRow label="Next first move" value={rootRoom.firstMove} />
              <StatusRow label="Runner" value={rootRoom.runner} />
            </dl>
          </div>

          <div className="rounded-md border border-amber-200/20 bg-amber-200/10 p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-amber-100/15">
                <LockKeyhole className="h-5 w-5 text-amber-100" />
              </div>
              <div>
                <p className="text-sm text-amber-100">Blocked by design</p>
                <h2 className="text-xl font-semibold">No live lane starts automatically</h2>
              </div>
            </div>
            <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-200">
              {rootRoom.blockedBy.map((blocker) => (
                <li key={blocker} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-200" />
                  <span>{blocker}</span>
                </li>
              ))}
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-200" />
                <span>Start with Echo only when activation is approved.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Network className="h-4 w-4 text-sky-200" />
          Chapter run rooms
        </div>
        <div className="overflow-hidden rounded-md border border-white/10">
          {remainingChapters.map((chapter) => (
            <ChapterStatusRow key={chapter.chapter} chapter={chapter} />
          ))}
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-400">{statusData.boundary}</p>
      </section>
    </main>
  );
}

function StatusMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-slate-300">{detail}</p>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[9rem_1fr]">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-100">{value}</dd>
    </div>
  );
}

function ChapterStatusRow({ chapter }: { chapter: ChapterStatus }) {
  const status = statusStyles(chapter.status);
  const Icon = status.icon;

  return (
    <div className="grid gap-4 border-b border-white/10 bg-white/[0.035] p-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_12rem_minmax(0,1.1fr)] md:items-center">
      <div>
        <p className="text-sm text-slate-400">Chapter {chapter.chapter}</p>
        <h3 className="mt-1 text-lg font-semibold text-white">{chapter.title}</h3>
        <p className="mt-1 text-sm text-slate-300">First move: {chapter.firstMove}</p>
      </div>
      <div
        className={`inline-flex h-9 w-fit items-center gap-2 rounded-md border px-3 text-sm ${status.tone}`}
      >
        <Icon className="h-4 w-4" />
        {status.label}
      </div>
      <div className="text-sm leading-6 text-slate-300">
        <p>{chapter.proof}</p>
        <p className="mt-1 text-slate-400">{chapter.blockedBy.join(" · ")}</p>
      </div>
    </div>
  );
}
