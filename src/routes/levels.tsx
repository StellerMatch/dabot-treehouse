import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, DoorOpen, FileText, PlayCircle } from "lucide-react";
import trunkBgAsset from "@/assets/trunk-room-bg-v2.png.asset.json";
import levelSystemData from "@/data/level-system.json";

export const Route = createFileRoute("/levels")({
  head: () => ({
    meta: [
      { title: "DaBotTree Levels — Reports and Doors" },
      {
        name: "description",
        content: "Connected DaBotTree level reports and doors for internal project runs.",
      },
    ],
  }),
  component: LevelsPage,
});

type LevelStatus = "ready" | "waiting";

type LevelDoor = {
  background: string;
  door: string;
  key: string;
  level: string;
  owner: string;
  report: string;
  source: string;
  status: LevelStatus;
  summary: string;
};

const levelSystem = levelSystemData.level_result_system;
const visualScenes = levelSystemData.visual_scene_map?.active_scenes ?? [];
const runSummary = levelSystemData.run_receipt_summary ?? {};

const LEVELS: LevelDoor[] = levelSystem.levels.map((level) => {
  const door = levelSystem.doors.find((item) => item.level_key === level.level_key);
  const visual = visualScenes.find((item) => item.backend_source === level.report_source_key);

  return {
    key: level.level_key,
    level: level.level_name.replace(/ Level$/, ""),
    owner: level.owner,
    report: level.level_key === "the_clearing" ? "Naming Report" : level.level_name + " Report",
    door: door?.label ?? "Open Level Report",
    source: level.report_source_key,
    status: door?.status === "ready" ? "ready" : "waiting",
    background: visual?.background_reference_summary ?? door?.background_reference ?? "current level background",
    summary: level.report_summary || level.purpose || "Prepared internal level report is ready for inspection.",
  };
});

function LevelsPage() {
  const readyCount = LEVELS.filter((level) => level.status === "ready").length;

  return (
    <main className="min-h-screen bg-[#10151a] text-slate-100">
      <section className="relative min-h-screen overflow-hidden">
        <img
          src={trunkBgAsset.url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-45"
          draggable={false}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,15,20,0.72),rgba(10,15,20,0.94))]" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-3">
            <Link
              to="/"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-white/15 bg-black/30 px-3 text-sm text-white/85 backdrop-blur transition hover:bg-black/45"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <div className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-300/25 bg-emerald-500/10 px-3 text-sm text-emerald-100">
              <CheckCircle2 className="h-4 w-4" />
              {readyCount} reports ready
            </div>
          </header>

          <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)]">
            <div className="max-w-xl">
              <p className="mb-3 text-sm text-amber-200">Internal run map</p>
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
                {runSummary.project_name ?? "Project dry run"} moved through the level system.
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-200">
                This screen proves the inactive local workflow can classify an idea, produce a
                report at each level, and expose a door for inspecting each result before any live
                action.
              </p>
              <div className="mt-5 grid gap-2 rounded-md border border-white/12 bg-black/32 p-4 text-sm text-slate-200 backdrop-blur-md">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Status</span>
                  <span className="font-medium text-emerald-100">
                    {runSummary.status ?? levelSystem.status}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Project type</span>
                  <span className="font-medium text-white">
                    {runSummary.current_shape ?? "internal dry run"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Nodes run</span>
                  <span className="font-medium text-white">
                    {runSummary.executed_node_count ?? "complete"}
                  </span>
                </div>
                {runSummary.dry_run_id ? (
                  <p className="truncate border-t border-white/10 pt-2 text-xs text-slate-400">
                    {runSummary.dry_run_id}
                  </p>
                ) : null}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="#level-doors"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-amber-300 px-4 text-sm font-semibold text-stone-950 transition hover:bg-amber-200"
                >
                  <DoorOpen className="h-4 w-4" />
                  View doors
                </a>
                <Link
                  to="/trunk"
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-white/18 bg-white/8 px-4 text-sm font-semibold text-white transition hover:bg-white/14"
                >
                  <PlayCircle className="h-4 w-4" />
                  Preview Trunk
                </Link>
              </div>
            </div>

            <div id="level-doors" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {LEVELS.map((level) => (
                <article
                  key={level.key}
                  className="rounded-md border border-white/12 bg-black/36 p-4 backdrop-blur-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-amber-200">{level.owner}</p>
                      <h2 className="mt-1 text-xl font-semibold text-white">{level.level}</h2>
                    </div>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-400/12 text-emerald-200">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-200">
                    {level.summary}
                  </p>
                  <div className="mt-4 grid gap-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <FileText className="h-4 w-4 text-amber-200" />
                      {level.report}
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <DoorOpen className="h-4 w-4 text-amber-200" />
                      {level.door}
                    </div>
                    <p className="truncate text-xs text-slate-400">Source: {level.source}</p>
                    <p className="text-xs text-slate-400">Background: {level.background}</p>
                  </div>
                </article>
              ))}

            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
