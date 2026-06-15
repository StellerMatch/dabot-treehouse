import levelSystemData from "@/data/level-system.json";
import { chapterTemplateById } from "@/lib/treehouse-chapter-templates";

type RawN8nLevel = {
  boundary?: string | null;
  level_key?: string;
  n8n_anchor?: string | null;
  report_source_key?: string | null;
  report_summary?: string | null;
  status?: string | null;
};

export type TreehouseN8nConnection = {
  anchor: string | null;
  boundary: string | null;
  hiddenProcessLabel: string;
  reportSourceKey: string | null;
  requestedAction: string;
  status: string | null;
  summary: string | null;
};

const rawLevels = (levelSystemData.level_result_system.levels ?? []) as RawN8nLevel[];

const levelConnections = Object.fromEntries(
  rawLevels
    .filter((level): level is RawN8nLevel & { level_key: string } => Boolean(level.level_key))
    .map((level) => [
      level.level_key.replaceAll("_", "-"),
      {
        anchor: level.n8n_anchor ?? null,
        boundary: level.boundary ?? null,
        reportSourceKey: level.report_source_key ?? null,
        status: level.status ?? null,
        summary: level.report_summary ?? null,
      },
    ]),
);

const chapterLevelKeys: Record<string, string | null> = {
  clarity: "library",
  "root-room": null,
  "bad-brother": null,
  "trunk-level": "trunk",
  "the-clearing": "the-clearing",
  "canopy-level": "canopy",
  "wind-tunnel": "wind-tunnel",
  "branchworks-level": "branchworks",
  "crown-level": "crown",
  "the-sweep": "the-sweep",
  "nest-level": "nest",
  "seed-level": "seed",
  "future-13": null,
};

const parkedProcessLabels: Record<string, string> = {
  "root-room": "Root Room local baseline packet",
  "bad-brother": "Bad Brother local pressure-test packet",
  "future-13": "Future Chapter 13 end-state packet",
};

export function treehouseN8nConnectionForChapter(chapterId: string): TreehouseN8nConnection | null {
  const chapter = chapterTemplateById(chapterId);
  if (!chapter) return null;

  const levelKey = chapterLevelKeys[chapter.id];
  const connection = levelKey ? levelConnections[levelKey] : undefined;
  const requestedAction = `${chapter.id.replaceAll("-", "_")}_prepare_n8n_handoff`;

  return {
    anchor: connection?.anchor ?? null,
    boundary: connection?.boundary ?? null,
    hiddenProcessLabel:
      connection?.anchor ?? parkedProcessLabels[chapter.id] ?? `${chapter.title} n8n handoff`,
    reportSourceKey:
      connection?.reportSourceKey ?? `${chapter.id.replaceAll("-", "_")}_local_handoff`,
    requestedAction,
    status: connection?.status ?? (levelKey ? "mapped_without_status" : "parked_local_hook"),
    summary:
      connection?.summary ??
      "Local chapter hook only. This prepares the handoff state without firing a live n8n workflow.",
  };
}
