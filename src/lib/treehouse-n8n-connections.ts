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
  backendChapterRun: {
    runDir: string;
    runId: string;
    status: string;
  } | null;
  boundary: string | null;
  botParticipants: string[];
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
  "mud-pit": "mud-pit",
  "trunk-ascent": "trunk-ascent",
  "the-name": "the-name",
  "canopy-foundation": "canopy-foundation",
  "wind-tunnel": "wind-tunnel",
  "branchworks-level": "branchworks",
  "heavy-crown": "heavy-crown",
  "clean-sweep": "clean-sweep",
  "nest-level": "nest",
  "seed-level": "seed",
  "future-13": null,
};

const backendChapterRuns: Record<
  string,
  {
    firstPart: string;
    partCount: number;
    runDir: string;
    runId: string;
    status: string;
  }
> = {
  "root-room": {
    firstPart: "Echo",
    partCount: 4,
    runDir:
      "/Users/2ndbrain/.openclaw/workspace/projects/dabottree-n8n/root-room-runs/root-room-step-six-local-scaffold-2026-06-12",
    runId: "root-room-step-six-local-scaffold-2026-06-12",
    status: "root_room_local_scaffold_ready",
  },
  "mud-pit": {
    firstPart: "Crossfire",
    partCount: 4,
    runDir:
      "/Users/2ndbrain/.openclaw/workspace/projects/dabottree-n8n/chapter-runs/mud-pit-local-scaffold-2026-06-14",
    runId: "mud-pit-local-scaffold-2026-06-14",
    status: "mud_pit_local_scaffold_ready_waiting_real_content",
  },
  "trunk-ascent": {
    firstPart: "Luma",
    partCount: 4,
    runDir:
      "/Users/2ndbrain/.openclaw/workspace/projects/dabottree-n8n/chapter-runs/trunk-level-local-scaffold-2026-06-12",
    runId: "trunk-level-local-scaffold-2026-06-12",
    status: "chapter_3_local_closeout_complete_waiting_next_gate",
  },
  "the-name": {
    firstPart: "Moniker",
    partCount: 1,
    runDir:
      "/Users/2ndbrain/.openclaw/workspace/projects/dabottree-n8n/chapter-runs/the-clearing-local-scaffold-2026-06-12",
    runId: "the-clearing-local-scaffold-2026-06-12",
    status: "chapter_4_local_closeout_complete_waiting_next_gate",
  },
  "canopy-foundation": {
    firstPart: "Rook opens Canopy",
    partCount: 6,
    runDir:
      "/Users/2ndbrain/.openclaw/workspace/projects/dabottree-n8n/chapter-runs/canopy-level-local-scaffold-2026-06-12",
    runId: "canopy-level-local-scaffold-2026-06-12",
    status: "chapter_5_local_closeout_complete_waiting_next_gate",
  },
  "wind-tunnel": {
    firstPart: "Gauge",
    partCount: 3,
    runDir:
      "/Users/2ndbrain/.openclaw/workspace/projects/dabottree-n8n/chapter-runs/wind-tunnel-local-scaffold-2026-06-12",
    runId: "wind-tunnel-local-scaffold-2026-06-12",
    status: "chapter_6_local_closeout_complete_waiting_next_gate",
  },
  "branchworks-level": {
    firstPart: "Tinker opens Branchworks",
    partCount: 8,
    runDir:
      "/Users/2ndbrain/.openclaw/workspace/projects/dabottree-n8n/chapter-runs/branchworks-level-local-scaffold-2026-06-12",
    runId: "branchworks-level-local-scaffold-2026-06-12",
    status: "chapter_7_local_closeout_complete_waiting_next_gate",
  },
  "heavy-crown": {
    firstPart: "Weaver opens Crown",
    partCount: 9,
    runDir:
      "/Users/2ndbrain/.openclaw/workspace/projects/dabottree-n8n/chapter-runs/crown-level-local-scaffold-2026-06-12",
    runId: "crown-level-local-scaffold-2026-06-12",
    status: "chapter_8_local_closeout_complete_waiting_next_gate",
  },
  "clean-sweep": {
    firstPart: "Ghost",
    partCount: 1,
    runDir:
      "/Users/2ndbrain/.openclaw/workspace/projects/dabottree-n8n/chapter-runs/the-sweep-local-scaffold-2026-06-12",
    runId: "the-sweep-local-scaffold-2026-06-12",
    status: "chapter_9_local_closeout_complete_waiting_next_gate",
  },
  "nest-level": {
    firstPart: "Ward opens Nest",
    partCount: 5,
    runDir:
      "/Users/2ndbrain/.openclaw/workspace/projects/dabottree-n8n/chapter-runs/nest-level-local-scaffold-2026-06-12",
    runId: "nest-level-local-scaffold-2026-06-12",
    status: "chapter_10_local_closeout_complete_waiting_next_gate",
  },
  "seed-level": {
    firstPart: "Bloom opens Seed",
    partCount: 6,
    runDir:
      "/Users/2ndbrain/.openclaw/workspace/projects/dabottree-n8n/chapter-runs/seed-level-local-scaffold-2026-06-12",
    runId: "seed-level-local-scaffold-2026-06-12",
    status: "chapter_11_local_closeout_complete_sequence_complete",
  },
};

const botParticipantsByChapter: Record<string, string[]> = {
  clarity: ["Clarity"],
  "root-room": ["Echo", "Shield", "Ledger", "Chief"],
  "mud-pit": ["Crossfire"],
  "trunk-ascent": ["Luma", "Bloom", "Vault", "Compass"],
  "the-name": ["Moniker"],
  "canopy-foundation": ["Rook", "Bones", "Squirrels", "Lanterns", "Ledger"],
  "wind-tunnel": ["Gauge", "Shield", "Stagehand"],
  "branchworks-level": [
    "Tinker",
    "Squirrels",
    "Lanterns",
    "Echo",
    "Momma Bear",
    "Ace",
    "Bolt",
    "Craft",
  ],
  "heavy-crown": [
    "Weaver",
    "Grandpa Bears",
    "Bones",
    "Squirrels",
    "Lanterns",
    "Anteater",
    "Shield",
  ],
  "clean-sweep": ["Ghost"],
  "nest-level": ["Ward", "Boomer", "Helper Routes"],
  "seed-level": ["Bloom", "Seed Sorting", "Senior Seeds", "Seed Admin"],
  "future-13": ["Future chapter owner"],
};

const parkedProcessLabels: Record<string, string> = {
  "root-room": "Root Room local baseline packet",
  "mud-pit": "Mud Pit local pressure-test packet",
  "future-13": "Future Chapter 13 end-state packet",
};

export function treehouseN8nConnectionForChapter(chapterId: string): TreehouseN8nConnection | null {
  const chapter = chapterTemplateById(chapterId);
  if (!chapter) return null;

  const levelKey = chapterLevelKeys[chapter.id];
  const connection = levelKey ? levelConnections[levelKey] : undefined;
  const backendChapterRun = backendChapterRuns[chapter.id];
  const requestedAction = `${chapter.id.replaceAll("-", "_")}_prepare_n8n_handoff`;

  return {
    anchor: connection?.anchor ?? null,
    backendChapterRun: backendChapterRun
      ? {
          runDir: backendChapterRun.runDir,
          runId: backendChapterRun.runId,
          status: backendChapterRun.status,
        }
      : null,
    boundary: connection?.boundary ?? null,
    botParticipants: botParticipantsByChapter[chapter.id] ?? [],
    hiddenProcessLabel:
      connection?.anchor ??
      backendChapterRun?.firstPart ??
      parkedProcessLabels[chapter.id] ??
      `${chapter.title} n8n handoff`,
    reportSourceKey:
      connection?.reportSourceKey ?? `${chapter.id.replaceAll("-", "_")}_local_handoff`,
    requestedAction,
    status: connection?.status ?? (levelKey ? "mapped_without_status" : "parked_local_hook"),
    summary:
      connection?.summary ??
      "Local chapter hook only. This prepares the handoff state without firing a live n8n workflow.",
  };
}
