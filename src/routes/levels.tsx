import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Activity,
  BookOpen,
  ChevronRight,
  CheckCircle2,
  DoorOpen,
  FileText,
  Layers3,
  Search,
  X,
} from "lucide-react";
import rootRoomBgAsset from "@/assets/root-room-bg-v2.png.asset.json";
import genericBotAsset from "@/assets/echo-presenting.png.asset.json";
import levelSystemData from "@/data/level-system.json";
import { createTreehouseTaskPacket } from "@/lib/api/treehouse-task-packets.functions";

export const Route = createFileRoute("/levels")({
  head: () => ({
    meta: [
      { title: "Treehouse Book — DaBotTree" },
      {
        name: "description",
        content: "Basic Treehouse book and page skeleton for the current chapter canon.",
      },
    ],
  }),
  component: LevelsPage,
});

type TreehousePart = {
  id: string;
  title: string;
  actor: string;
  userAction?: string;
  story: string;
  taskIdeas: string[];
};

type TreehouseChapter = {
  id: string;
  chapter: number;
  title: string;
  subtitle: string;
  parts: TreehousePart[];
};

type HeroAlignment = "left" | "right" | "center";

type N8nLevelConnection = {
  anchor: string | null;
  boundary: string | null;
  reportSourceKey: string | null;
  status: string | null;
  summary: string | null;
};

type TreehouseActionBundle = {
  action: string;
  description: string;
  label: string;
};

type RawN8nLevel = {
  boundary?: string | null;
  level_key?: string;
  n8n_anchor?: string | null;
  report_source_key?: string | null;
  report_summary?: string | null;
  status?: string | null;
};

const squirrelNames = "Gauge, Quill, Signal, Trail, Circuit, SkillSmith, Glyph, and Tally";
const lanternNames = "Vault, Bloom, Luma, and Compass";
const heroAlignments: HeroAlignment[] = ["left", "right", "center"];
const n8nChapterKeyAliases: Record<string, string> = {
  trunk: "trunk-ascent",
  clearing: "the-name",
  canopy: "canopy-foundation",
  crown: "heavy-crown",
  sweep: "clean-sweep",
  "trunk-level": "trunk-ascent",
  "the-clearing": "the-name",
  "canopy-level": "canopy-foundation",
  "crown-level": "heavy-crown",
  "the-sweep": "clean-sweep",
  "wind-tunnel": "wind-tunnel",
};
const n8nLevels = (levelSystemData.level_result_system.levels ?? []) as RawN8nLevel[];
const N8N_LEVEL_CONNECTIONS: Record<string, N8nLevelConnection> = Object.fromEntries(
  n8nLevels
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
const TREEHOUSE_ACTION_BUNDLES: Record<string, TreehouseActionBundle[]> = {
  library: [
    {
      action: "library_shape_idea_packet",
      description: "Create the first clean packet from the saved idea.",
      label: "Shape the Idea",
    },
    {
      action: "library_prepare_review_output",
      description: "Prepare the user-review output n8n bundle.",
      label: "Prepare Review",
    },
  ],
  "root-room": [
    {
      action: "root_room_prepare_roots",
      description: "Create the local roots packet for memory, safety, record, and handoff checks.",
      label: "Prepare the Roots",
    },
  ],
  "trunk-ascent": [
    {
      action: "trunk_past_pass",
      description: "Bundle Luma, Bloom, Vault, and Compass around past/source context.",
      label: "Past Pass",
    },
    {
      action: "trunk_present_pass",
      description: "Bundle Luma, Bloom, Vault, and Compass around the current project state.",
      label: "Present Pass",
    },
    {
      action: "trunk_future_pass",
      description: "Bundle Luma, Bloom, Vault, and Compass around future options and risks.",
      label: "Future Pass",
    },
  ],
  "the-name": [
    {
      action: "clearing_name_direction",
      description: "Prepare Moniker name and identity direction work.",
      label: "Name the Thing",
    },
    {
      action: "clearing_url_direction",
      description: "Prepare URL/domain direction without buying or reserving anything.",
      label: "Check the Trail Sign",
    },
  ],
  "canopy-foundation": [
    {
      action: "canopy_rook_foundation_packet",
      description: "Prepare Rook's foundation packet from the earlier levels.",
      label: "Build the Foundation",
    },
    {
      action: "canopy_bones_skeleton_check",
      description: "Ask Bones to check missing structure before deeper work.",
      label: "Send to Bones",
    },
    {
      action: "canopy_review_team_pass",
      description: "Gather Squirrels, Lanterns, and Ledger into one review bundle.",
      label: "Gather the Review Team",
    },
  ],
  "wind-tunnel": [
    {
      action: "wind_tunnel_worthiness_test",
      description: "Prepare Gauge's worthiness test bundle.",
      label: "Start the Wind Test",
    },
    {
      action: "wind_tunnel_boundary_pressure",
      description: "Prepare Shield's pressure-boundary review bundle.",
      label: "Check the Edges",
    },
    {
      action: "wind_tunnel_repair_pass",
      description: "Prepare Stagehand's repair/pass/revise bundle.",
      label: "Tighten the Boards",
    },
  ],
  branchworks: [
    {
      action: "branchworks_open_build_paths",
      description: "Prepare Tinker's first build-direction bundle.",
      label: "Open the Workbench",
    },
    {
      action: "branchworks_bear_packet",
      description: "Prepare Momma Bear's neutral packet for Ace, Bolt, and Craft.",
      label: "Prepare the Bear Packet",
    },
    {
      action: "branchworks_collect_directions",
      description: "Collect the build directions for Crown without choosing one yet.",
      label: "Collect the Branches",
    },
  ],
  "heavy-crown": [
    {
      action: "crown_weaver_package",
      description: "Prepare Weaver's prototype-package bundle.",
      label: "Weave the Package",
    },
    {
      action: "crown_bubba_pull_useful_pieces",
      description: "Prepare Bubba's useful-pieces pass across Ace, Bolt, and Craft.",
      label: "Call Bubba In",
    },
    {
      action: "crown_final_boundary_pass",
      description: "Prepare final Shield/Bones/Ledger boundary checks before handoff.",
      label: "Check the Crown",
    },
  ],
  "clean-sweep": [
    {
      action: "sweep_ghost_simulation",
      description: "Prepare Ghost simulation/testing report work.",
      label: "Start the Sweep",
    },
    {
      action: "sweep_read_results",
      description: "Prepare the simulation result readout and next fixes.",
      label: "Read the Dust",
    },
  ],
  nest: [
    {
      action: "nest_living_home_packet",
      description: "Prepare Ward's living project home packet.",
      label: "Open the Nest",
    },
    {
      action: "nest_health_watch_signals",
      description: "Prepare health, support, and care signals for the living project.",
      label: "Set the Watch",
    },
  ],
  seed: [
    {
      action: "seed_launch_packet",
      description: "Prepare Bloom's launch/growth packet.",
      label: "Prepare the Seeds",
    },
    {
      action: "seed_growth_plan",
      description: "Prepare growth, follow-up, and planted-work categories.",
      label: "Plant the Path",
    },
  ],
};
const CANON_ACTOR_SAYINGS: Record<string, string> = {
  Bloom: "I send Seeds into the world and learn what takes root.",
  Bones: "I make sure the project has a spine before we start decorating it.",
  Bubba:
    "What already exists, what is weak or broken, and what practical repair makes it stronger without rebuilding more than necessary?",
  Clarity: "I help scattered thoughts become organized understanding.",
  Compass:
    "I look backward, around, and ahead so Boss can decide whether this direction deserves the tree's energy.",
  Craft: "How do we make this feel premium, finished, readable, and worth using?",
  Gauge: "Before we call this done, let me test it.",
  Luma: "I illuminate the design so rough things become beautiful, clear, and welcoming.",
  Quill: "Let me turn that into something the next bot can actually use.",
  Rook: "Rook studies early app ideas and returning Seed signals before the tree spends energy growing them.",
  Signal: "Here is what users are actually doing or saying.",
  Tinker: "I watch the idea become testable before the tree commits to building it.",
  Trail: "My job is to turn messy movement into a clear path.",
  Vault: "The Finance bot protects the money side of the tree.",
  Ward: "I keep built apps alive, fed, protected, and watched after they leave the nest.",
  Weaver:
    "I protect the young build and weave paths around dead ends until it is strong enough to leave the nest.",
};

function heroAlignmentFor(seed: string): HeroAlignment {
  const hash = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return heroAlignments[hash % heroAlignments.length];
}

function canonSayingFor(actor: string): string | null {
  return CANON_ACTOR_SAYINGS[actor] ?? null;
}

function n8nConnectionFor(chapterId: string): N8nLevelConnection | null {
  const key = n8nChapterKeyAliases[chapterId] ?? chapterId;
  const connection = N8N_LEVEL_CONNECTIONS[key];
  if (!connection?.anchor) return null;
  return connection;
}

function treehouseActionsFor(chapterId: string): TreehouseActionBundle[] {
  return (
    TREEHOUSE_ACTION_BUNDLES[chapterId] ?? [
      {
        action: `${chapterId.replaceAll("-", "_")}_prepare_packet`,
        description: "Create a local task packet for this Treehouse chapter.",
        label: "Prepare Packet",
      },
    ]
  );
}

const TREEHOUSE_CHAPTERS: TreehouseChapter[] = [
  {
    id: "library",
    chapter: 1,
    title: "Spark Library",
    subtitle: "Clarity turns a messy idea into the first clean packet.",
    parts: [
      {
        id: "clarity",
        title: "Clarity Intake",
        actor: "Clarity",
        userAction: "Answer questions and provide missing intake details.",
        story:
          "Clarity meets the idea at the shelf, asks the first useful questions, and starts sorting the raw notes into a project packet the rest of the Treehouse can understand.",
        taskIdeas: [
          "Collect the creator's rough idea, audience, problem, and first useful version.",
          "Separate known facts from guesses and missing answers.",
          "Prepare a clean packet summary for the Root Room.",
        ],
      },
    ],
  },
  {
    id: "root-room",
    chapter: 2,
    title: "Root Room",
    subtitle: "The project gets memory, safety, record, and handoff roots.",
    parts: [
      {
        id: "echo",
        title: "Echo Perspective Pass",
        actor: "Echo",
        story:
          "Echo reads the project from another angle, checks memory and intent, and looks for meaning the first packet may not have named yet.",
        taskIdeas: [
          "Check the idea against Boss memory and project intent.",
          "Name useful angles, likely drift risks, and missing context.",
          "Write the perspective note that later chapters can reuse.",
        ],
      },
      {
        id: "shield",
        title: "Shield Boundary Check",
        actor: "Shield",
        story:
          "Shield walks the packet's edges and checks safety, privacy, authority, public-action risk, and major boundaries before the project climbs higher.",
        taskIdeas: [
          "List privacy, safety, account, payment, and public-action concerns.",
          "Mark what requires human approval or a later Shield pass.",
          "Keep the project moving only inside approved boundaries.",
        ],
      },
      {
        id: "ledger",
        title: "Ledger Baseline Record",
        actor: "Ledger",
        story:
          "Ledger records the baseline so the project can be checked against its original intent later instead of drifting quietly.",
        taskIdeas: [
          "Record the starting purpose, owner decisions, and known constraints.",
          "Create a baseline checkpoint for later stay-on-track reviews.",
          "Flag unresolved decisions without turning them into approvals.",
        ],
      },
      {
        id: "chief",
        title: "Chief Root Handoff",
        actor: "Chief",
        userAction:
          "Only if the path needs a visible checkpoint, missing setup decision, or correction.",
        story:
          "Chief gathers the Root Room outputs into one ready handoff and decides whether the packet can continue toward Trunk.",
        taskIdeas: [
          "Combine Echo, Shield, and Ledger notes into the next handoff.",
          "Name blockers, current owner, and the next level path.",
          "Ask the creator only when a real decision is needed.",
        ],
      },
    ],
  },
  {
    id: "mud-pit",
    chapter: 3,
    title: "Mud Pit",
    subtitle: "Crossfire pressure-tests the idea before research starts.",
    parts: [
      {
        id: "crossfire",
        title: "Crossfire Pressure Test",
        actor: "Crossfire",
        story:
          "Crossfire walks the idea through the mud before the project climbs higher, naming weak assumptions, proof needs, likely break points, and the smaller stronger version.",
        taskIdeas: [
          "Ask hard questions about what must be true.",
          "Name weak spots, proof needs, and likely failure points.",
          "Prepare the stronger version for Trunk Ascent.",
        ],
      },
    ],
  },
  {
    id: "trunk-ascent",
    chapter: 4,
    title: "Trunk Ascent",
    subtitle:
      "The first practical direction passes through design, growth, money, and compass sense.",
    parts: [
      {
        id: "luma",
        title: "Luma Design Trust",
        actor: "Luma",
        story:
          "Luma checks readability, product feel, visual trust, and whether the idea's first shape would feel usable to the person it serves.",
        taskIdeas: [
          "Name the intended feeling, visual risks, and trust cues.",
          "List first-screen and onboarding needs.",
          "Protect clarity over decorative polish.",
        ],
      },
      {
        id: "bloom",
        title: "Bloom Audience Growth",
        actor: "Bloom",
        story:
          "Bloom studies who the project can reach, how it may grow, what launch paths make sense, and whether it has future planting potential.",
        taskIdeas: [
          "Identify the first audience and likely early channel.",
          "Name retention or growth signals to watch.",
          "Separate launch ideas from claims that still need proof.",
        ],
      },
      {
        id: "vault",
        title: "Vault Money Sense",
        actor: "Vault",
        story:
          "Vault reads the money side: price, sustainability, operating cost, revenue shape, and whether the project can stay grounded.",
        taskIdeas: [
          "Estimate likely cost categories and money risks.",
          "List possible pricing or revenue models without approving them.",
          "Mark payment or billing areas for Shield review later.",
        ],
      },
      {
        id: "compass",
        title: "Compass Direction",
        actor: "Compass",
        story:
          "Compass gathers the Trunk direction and keeps the project pointed north before it moves into naming and foundation work.",
        taskIdeas: [
          "Synthesize design, growth, and money notes into one direction.",
          "Name the north-star outcome and what not to drift toward.",
          "Prepare the Clearing-ready handoff.",
        ],
      },
    ],
  },
  {
    id: "the-name",
    chapter: 5,
    title: "The Name",
    subtitle: "Moniker helps find the best working name, not the fanciest name.",
    parts: [
      {
        id: "moniker",
        title: "Moniker Name and URL Direction",
        actor: "Moniker",
        userAction: "Choose or approve the name and URL direction.",
        story:
          "Moniker opens a clean patch in the woods and helps the creator name the thing clearly enough for design, copy, and future pages to point at it.",
        taskIdeas: [
          "Draft name directions and URL options.",
          "Check tone, memorability, and obvious confusion risk.",
          "Ask the creator to choose, approve, or redirect the identity.",
        ],
      },
    ],
  },
  {
    id: "canopy-foundation",
    chapter: 6,
    title: "Canopy Foundation",
    subtitle: "Rook turns the earlier work into a usable project foundation.",
    parts: [
      {
        id: "rook-open",
        title: "Rook Opens Canopy",
        actor: "Rook",
        story:
          "Rook intakes the full stack and explains that Canopy is where the idea becomes a stronger foundation before build directions begin.",
        taskIdeas: [
          "Gather Library, Root, Trunk, and Clearing inputs.",
          "Name the foundation goal for this pass.",
          "Prepare the structure for Bones and the review teams.",
        ],
      },
      {
        id: "bones",
        title: "Bones Skeleton Check",
        actor: "Bones",
        userAction: "Only if missing structure must be answered or approved.",
        story:
          "Bones checks whether the project skeleton is complete: user, problem, offer, pages, main flow, inputs, outputs, payment needs, and missing structure.",
        taskIdeas: [
          "List required pages, flows, records, and infrastructure surfaces.",
          "Mark missing structural decisions without building them yet.",
          "Route auth, payments, data, and support risks to the right later lane.",
        ],
      },
      {
        id: "squirrels",
        title: "Squirrel Foundation Session",
        actor: "Squirrels",
        story: `The Squirrels enter as a group scene. ${squirrelNames} check the foundation beams from their own specialties.`,
        taskIdeas: [
          "Run foundation checks for measurement, writing, signal, route, tools, skill shape, UI symbols, and counts.",
          "Separate group findings from individual rabbit holes.",
          "Prepare only the strongest foundation notes for Rook.",
        ],
      },
      {
        id: "lanterns",
        title: "Individual Lantern Planning Pages",
        actor: "Lanterns",
        story: `${lanternNames} each get a visible pass and add practical planning input before Canopy closes.`,
        taskIdeas: [
          "Give each Lantern one focused planning page.",
          "Capture money, growth, design, and direction notes separately.",
          "Make the output usable for the Branchworks handoff.",
        ],
      },
      {
        id: "ledger",
        title: "Ledger Canopy Track Check",
        actor: "Ledger",
        story:
          "Ledger checks whether the Canopy packet stayed on track against baseline, Trunk truth, and unresolved decisions.",
        taskIdeas: [
          "Compare the foundation against the Root Room baseline.",
          "Mark any drift, unresolved approvals, or changed assumptions.",
          "Record the stay-on-track note for Rook.",
        ],
      },
      {
        id: "rook-close",
        title: "Rook Closes Canopy",
        actor: "Rook",
        userAction: "Only if approval or a missing foundation decision is needed.",
        story:
          "Rook gathers Bones, Squirrels, Lanterns, and Ledger into a Branchworks-ready foundation handoff.",
        taskIdeas: [
          "Create the Branchworks-ready foundation packet.",
          "Name the first questions Tinker should preserve.",
          "Hold the gate if the structure is not ready.",
        ],
      },
    ],
  },
  {
    id: "wind-tunnel",
    chapter: 7,
    title: "Wind Tunnel",
    subtitle: "The foundation gets pressure-tested before build-shape work.",
    parts: [
      {
        id: "gauge",
        title: "Gauge Worthiness Test",
        actor: "Gauge",
        story:
          "Gauge pressure-tests whether the project is ready enough and measurable enough to keep moving.",
        taskIdeas: [
          "Score clarity, measurability, scope, and proof strength.",
          "Name what would make the project pass, revise, or stop.",
          "Prepare measurable checks for later build reviews.",
        ],
      },
      {
        id: "shield",
        title: "Shield Pressure Boundary",
        actor: "Shield",
        story:
          "Shield checks risk and boundary pressure before the project moves into build-shape work.",
        taskIdeas: [
          "Review risk under more realistic build pressure.",
          "Flag account, payment, data, public-action, and support boundaries.",
          "Define what later builders must not assume.",
        ],
      },
      {
        id: "stagehand",
        title: "Stagehand Repair Pass",
        actor: "Stagehand",
        userAction: "Only if the result needs a pass, revise, or stop decision.",
        story:
          "Stagehand tightens or repairs what the pressure test found so the project does not stumble into Branchworks with loose boards.",
        taskIdeas: [
          "Repair unclear scope, broken sequence, or weak presentation.",
          "Prepare a clean pass/revise/stop result.",
          "Ask the creator only when the pressure test changes the path.",
        ],
      },
    ],
  },
  {
    id: "branchworks",
    chapter: 8,
    title: "Branchworks",
    subtitle: "Tinker turns the foundation into possible build directions.",
    parts: [
      {
        id: "tinker-open",
        title: "Tinker Opens Branchworks",
        actor: "Tinker",
        story:
          "Tinker intakes everything and explains that Branchworks turns the project foundation into possible build directions.",
        taskIdeas: [
          "Gather Canopy and Wind Tunnel outputs.",
          "Name the build-direction questions.",
          "Protect experiment scope before Bear work begins.",
        ],
      },
      {
        id: "squirrel-rails",
        title: "Squirrel Build Rails",
        actor: "Squirrels",
        story:
          "Squirrels return as build-rail checkers for development guardrails, constraints, assumptions, acceptance checks, and Bear-ready input.",
        taskIdeas: [
          "Draft acceptance checks and development guardrails.",
          "Name assumptions each Bear direction must respect.",
          "Keep rail notes brief enough for Momma Bear to use.",
        ],
      },
      {
        id: "lantern-build",
        title: "Lantern Build Passes",
        actor: "Lanterns",
        story: `${lanternNames} each check the build paths from practical angles before Momma Bear packages them.`,
        taskIdeas: [
          "Review build paths for money, growth, design, and direction.",
          "Mark gaps that would confuse the Bears.",
          "Keep the Lantern outputs independent and readable.",
        ],
      },
      {
        id: "echo",
        title: "Echo Memory Check",
        actor: "Echo",
        story:
          "Echo checks memory and intent before Momma Bear packages the work, making sure the project still sounds like itself.",
        taskIdeas: [
          "Compare build directions against original intent.",
          "Name drift risk and preference alignment.",
          "Prepare a short memory note for Momma Bear.",
        ],
      },
      {
        id: "momma-package",
        title: "Momma Bear Neutral Packet",
        actor: "Momma Bear",
        story:
          "Momma Bear packages a neutral packet for Ace, Bolt, and Craft so none of the three starts with a hidden advantage.",
        taskIdeas: [
          "Create one neutral Bear packet.",
          "Protect source facts and constraints.",
          "Avoid ranking, merging, or choosing a direction early.",
        ],
      },
      {
        id: "bear-working-scene",
        title: "Ace / Bolt / Craft Working Scene",
        actor: "Ace, Bolt, and Craft",
        story:
          "Ace, Bolt, and Craft work visibly in three different directions. This is a working scene, not a user-choice door.",
        taskIdeas: [
          "Show three parallel directions without making the creator choose.",
          "Keep outputs separate for Bubba and Crown.",
          "Make it visually clear this is progress, not approval.",
        ],
      },
      {
        id: "momma-collection",
        title: "Momma Bear Collection",
        actor: "Momma Bear",
        story:
          "Momma Bear gathers the three Bear directions without making the creator choose between them.",
        taskIdeas: [
          "Collect each Bear direction faithfully.",
          "Preserve differences and useful conflicts.",
          "Prepare a Crown-ready bundle.",
        ],
      },
      {
        id: "tinker-close",
        title: "Tinker Closes Branchworks",
        actor: "Tinker",
        story: "Tinker checks the packet and sends the gathered directions to Crown.",
        taskIdeas: [
          "Confirm all required Bear outputs exist.",
          "Name unresolved build questions.",
          "Send Crown a clear assembly packet.",
        ],
      },
    ],
  },
  {
    id: "heavy-crown",
    chapter: 9,
    title: "Heavy Crown",
    subtitle: "Weaver assembles, polishes, and packages the project.",
    parts: [
      {
        id: "weaver-open",
        title: "Weaver Opens Crown",
        actor: "Weaver",
        story:
          "Weaver intakes the Branchworks work and explains that Crown assembles, polishes, and packages the project.",
        taskIdeas: [
          "Gather Branchworks directions and open Crown scope.",
          "Name what Crown must assemble versus preserve separately.",
          "Prepare Grandpa Bears for focused work.",
        ],
      },
      {
        id: "grandpa-bears",
        title: "Grandpa Bears",
        actor: "Byte, Bubba, and Boomer",
        story:
          "Byte studies technical logic, Bubba pulls useful pieces from Ace, Bolt, and Craft, and Boomer checks support readiness and confusion prevention.",
        taskIdeas: [
          "Split technical, builder, and support-readiness work.",
          "Have Bubba synthesize without erasing source directions.",
          "Prepare a clearer prototype package.",
        ],
      },
      {
        id: "bones-return",
        title: "Bones Returns",
        actor: "Bones",
        userAction: "Only if Bones finds a missing structural decision.",
        story:
          "Bones double-checks that the structure still has everything it needs and calls out missing pieces like payment pages or required flows.",
        taskIdeas: [
          "Check the assembled package for missing structural beams.",
          "Mark live infrastructure needs for later approved work.",
          "Stop drift before the package gets too polished.",
        ],
      },
      {
        id: "squirrel-qa",
        title: "Squirrel QA Session",
        actor: "Squirrels",
        story:
          "Squirrels return as QA and polish reviewers, checking specialty weak spots and proof needs.",
        taskIdeas: [
          "Run specialty QA across copy, route, measures, UI, skill shape, and counts.",
          "Mark proof gaps and weak spots.",
          "Keep findings actionable for Weaver.",
        ],
      },
      {
        id: "lantern-final",
        title: "Lantern Final Reviews",
        actor: "Lanterns",
        story: `${lanternNames} do final practical review against money, growth, design, and direction.`,
        taskIdeas: [
          "Review final package from each Lantern angle.",
          "Flag any last practical mismatch.",
          "Prepare notes that Shield and Weaver can use.",
        ],
      },
      {
        id: "ant-gate",
        title: "Anteater / Ant Gate",
        actor: "Anteater and Ants",
        story:
          "Anteater and the Ants set up future watch signals for bugs, friction, wins, patterns, and business signals.",
        taskIdeas: [
          "Define Bug, Friction, Win, Pattern, and Business watch signals.",
          "Keep watch setup as future-facing guidance for now.",
          "Prepare Nest-friendly health signals.",
        ],
      },
      {
        id: "weaver-package",
        title: "Weaver Final Package",
        actor: "Weaver",
        userAction: "Review or approve the near-final package if this checkpoint is kept.",
        story:
          "Weaver gathers the package into its near-final form so it can be checked before Ghost sees it.",
        taskIdeas: [
          "Assemble the near-final project package.",
          "Separate creator checkpoint needs from automatic progress.",
          "Prepare the Shield final boundary pass.",
        ],
      },
      {
        id: "shield-final",
        title: "Shield Final Boundary Pass",
        actor: "Shield",
        story:
          "Shield checks safety, privacy, authority, public claims, support boundaries, and external-action risk one more time.",
        taskIdeas: [
          "Run final boundary review before simulation.",
          "Flag public, payment, data, and account actions that still need approval.",
          "Keep the project inside internal-only scope.",
        ],
      },
      {
        id: "weaver-close",
        title: "Weaver Closes Crown",
        actor: "Weaver",
        story:
          "Weaver hands the project to Ghost with the package, checks, and known boundaries intact.",
        taskIdeas: [
          "Create the Ghost-ready handoff.",
          "Name unresolved blockers and assumptions.",
          "Close Crown without launching anything.",
        ],
      },
    ],
  },
  {
    id: "clean-sweep",
    chapter: 10,
    title: "Clean Sweep",
    subtitle: "Ghost simulates and tests the near-final project.",
    parts: [
      {
        id: "ghost",
        title: "Ghost Simulation",
        actor: "Ghost",
        userAction: "Only if Ghost finds a decision, blocker, or repair.",
        story:
          "Ghost simulates, tests, and sweeps the near-final project before it moves into its home.",
        taskIdeas: [
          "Run scenario checks against the near-final package.",
          "Report blocker, repair, or pass status.",
          "Avoid claiming real production testing unless it truly happened.",
        ],
      },
    ],
  },
  {
    id: "nest",
    chapter: 11,
    title: "Nestwatch",
    subtitle: "Ward gives the project a home, watch signals, and care plan.",
    parts: [
      {
        id: "ward-open",
        title: "Ward Opens Nest",
        actor: "Ward",
        story:
          "Ward intakes the finished project and explains that Nest gives the project a home and care plan.",
        taskIdeas: [
          "Receive the swept package into a project home.",
          "Name current status and care needs.",
          "Prepare health profile work.",
        ],
      },
      {
        id: "health-profile",
        title: "Ward Health Profile",
        actor: "Ward",
        story:
          "Ward creates the health profile and watch signals that tell the system when the project needs care.",
        taskIdeas: [
          "Define healthy, stale, broken, and growing signals.",
          "Name cadence recommendations without creating cron automatically.",
          "Prepare clear owner-facing status.",
        ],
      },
      {
        id: "boomer",
        title: "Boomer Support Readiness",
        actor: "Boomer",
        story:
          "Boomer sets up support, care, onboarding help, FAQ signals, and calm explanation readiness.",
        taskIdeas: [
          "Identify confusing moments and likely support questions.",
          "Draft first FAQ and onboarding needs.",
          "Mark live support as future approved work only.",
        ],
      },
      {
        id: "helper-routes",
        title: "Helper Routes",
        actor: "Ward",
        story: "Ward shows which helper gets called later if the project needs care.",
        taskIdeas: [
          "Map common care needs to the right helper lane.",
          "Keep routes descriptive, not live automation.",
          "Prepare owner review of care flow.",
        ],
      },
      {
        id: "ward-close",
        title: "Ward Closes Nest",
        actor: "Ward",
        userAction: "Approve or adjust watch cadence, project status, or next care plan if needed.",
        story: "Ward gathers the home, care, support, and watch plan into a closed Nest packet.",
        taskIdeas: [
          "Summarize home, health, support, and helper routes.",
          "Ask for creator approval only where needed.",
          "Prepare the Seed handoff.",
        ],
      },
    ],
  },
  {
    id: "seed",
    chapter: 12,
    title: "Seed Garden",
    subtitle: "Bloom decides what can be planted next.",
    parts: [
      {
        id: "bloom-open",
        title: "Bloom Opens Seed",
        actor: "Bloom",
        story:
          "Bloom intakes the living project and explains that Seed decides what can be planted next.",
        taskIdeas: [
          "Receive the Living Seed Packet.",
          "Name what growth decisions are in scope.",
          "Prepare sorting categories.",
        ],
      },
      {
        id: "seed-sorting",
        title: "Seed Sorting",
        actor: "Bloom",
        story:
          "Bloom sorts seeds into audience, message, channel, content, trust, growth, money, and future categories.",
        taskIdeas: [
          "Inventory seeds by category.",
          "Mark ready, proof-needed, owner-decision, and not-now seeds.",
          "Avoid vague someday parking.",
        ],
      },
      {
        id: "senior-seeds",
        title: "Senior Seeds",
        actor: "Senior Seeds",
        story:
          "Senior Seeds give each baby seed a current foundation so future growth starts from known ground.",
        taskIdeas: [
          "Write a foundation note for each baby seed.",
          "Name evidence, owner choice, or trigger needed.",
          "Keep future paths staged and retrievable.",
        ],
      },
      {
        id: "admin-page",
        title: "Seed Admin Page",
        actor: "Bloom",
        story:
          "The owner/admin view of the seed system is prepared so future planting choices can be seen in one place.",
        taskIdeas: [
          "Sketch admin sections for seed categories and status.",
          "Separate live admin functionality from page planning.",
          "Prepare data needs for later approved implementation.",
        ],
      },
      {
        id: "owner-decision",
        title: "Owner Planting Decision",
        actor: "Owner and Bloom",
        userAction:
          "Choose what gets planted, saved for later, needs proof, or should not be planted.",
        story:
          "The creator decides what gets planted now, saved with a trigger, sent for proof, or dropped.",
        taskIdeas: [
          "Present seed decisions clearly.",
          "Give each parked item a return trigger or review point.",
          "Record what is planted, held, proved, or rejected.",
        ],
      },
      {
        id: "bloom-close",
        title: "Bloom Closes Seed",
        actor: "Bloom",
        story: "Bloom gathers the launch and growth packet and closes the current Treehouse path.",
        taskIdeas: [
          "Summarize the Seed launch/growth packet.",
          "Name next planted work and parked triggers.",
          "Close the book skeleton with boundaries intact.",
        ],
      },
    ],
  },
];

const totalParts = TREEHOUSE_CHAPTERS.reduce((sum, chapter) => sum + chapter.parts.length, 0);
const IDEAS_STORAGE_KEY = "dabottree:ideas";

type LocalTreehouseProject = {
  description?: string;
  ideaType?: string;
  projectId: string;
  title: string;
};

type MudPitQuestion = {
  id: string;
  bucket: string;
  label: string;
  round: "essential" | "bonus";
  prompt: string;
};

const ROOT_ROOM_BOT_QUESTIONS_KEY = "dabottree:rootRoomBotQuestions";
const MUD_PIT_ANSWERS_KEY = "dabottree:mudPitPressureAnswers";
const THE_NAME_DIRECTION_KEY = "dabottree:theNameDirection";
const CANOPY_FOUNDATION_CHECK_KEY = "dabottree:canopyFoundationChecks";
const WIND_TUNNEL_REVIEW_KEY = "dabottree:windTunnelReview";
const BRANCHWORKS_FUTURE_VISION_KEY = "dabottree:branchworksFutureVision";

const MONIKER_PRIMARY_NAME_SLOTS = Array.from({ length: 10 }, (_, index) => ({
  id: `primary-${index + 1}`,
  label: `Name candidate ${index + 1}`,
  status: "Primary list",
}));

const MONIKER_RESERVE_NAME_SLOTS = Array.from({ length: 10 }, (_, index) => ({
  id: `reserve-${index + 1}`,
  label: `Reserve name ${index + 1}`,
  status: "Reserve bench",
}));

const CANOPY_FOUNDATION_CHECKS = [
  {
    id: "bones-structure",
    actor: "Bones",
    role: "Structure check",
    question: "What part of this project feels least defined right now?",
    options: [
      "The main user",
      "The main problem",
      "The main flow",
      "The pages or features",
      "How it makes money",
      "I am not sure yet",
    ],
  },
  {
    id: "gauge-proof",
    actor: "Gauge",
    role: "Measurement squirrel",
    question: "What would prove this project is working?",
    options: [
      "More users",
      "Time saved",
      "Money made",
      "Fewer mistakes",
      "Better feedback",
      "I am not sure yet",
    ],
  },
  {
    id: "quill-words",
    actor: "Quill",
    role: "Words squirrel",
    question: "What part will need the clearest wording?",
    options: [
      "The homepage",
      "The main offer",
      "The instructions",
      "The pricing",
      "The app buttons",
      "The whole thing",
    ],
  },
  {
    id: "signal-demand",
    actor: "Signal",
    role: "Attention squirrel",
    question: "Where do you think the strongest signal will come from?",
    options: [
      "People searching for it",
      "People sharing it",
      "A workplace or community need",
      "A repeated frustration",
      "A trend or opportunity",
      "Unknown right now",
    ],
  },
  {
    id: "trail-flow",
    actor: "Trail",
    role: "Path squirrel",
    question: "Where might the user path get confusing?",
    options: [
      "Starting the app",
      "Knowing what to do next",
      "Finishing the main task",
      "Saving or receiving results",
      "Coming back later",
      "I do not know yet",
    ],
  },
  {
    id: "circuit-tools",
    actor: "Circuit",
    role: "Tools squirrel",
    question: "What kind of outside connection might this project need?",
    options: [
      "Payments",
      "Email or messages",
      "Calendar or scheduling",
      "File uploads",
      "AI, search, or data",
      "None yet",
    ],
  },
  {
    id: "skillsmith-process",
    actor: "SkillSmith",
    role: "Workflow squirrel",
    question: "What should this project become good at doing repeatedly?",
    options: [
      "Collecting info",
      "Making decisions",
      "Producing outputs",
      "Guiding users step by step",
      "Tracking progress",
      "Improving over time",
    ],
  },
  {
    id: "glyph-interface",
    actor: "Glyph",
    role: "Interface squirrel",
    question: "What needs to be easiest to recognize on screen?",
    options: [
      "Main action button",
      "Progress or status",
      "Warnings",
      "Categories or sections",
      "Results or output",
      "Navigation",
    ],
  },
  {
    id: "tally-scope",
    actor: "Tally",
    role: "Scope squirrel",
    question: "What feels most likely to grow too large?",
    options: [
      "Number of features",
      "Number of pages",
      "Number of user choices",
      "Cost or time",
      "Data or details",
      "Bot involvement",
    ],
  },
];

const WIND_TUNNEL_EXCITING_THINGS = [
  "The project has enough collected direction to test against.",
  "The foundation now has a name, structure, and early user signals.",
  "The next chapter can turn this into clearer build directions.",
];

const WIND_TUNNEL_LOOK_MORE_INTO = [
  "Which assumption could break first when real users touch it.",
  "Which risk needs a stronger boundary before build work moves too far.",
  "What proof would make the project feel ready instead of just promising.",
];

const BRANCHWORKS_FUTURE_OPTIONS = [
  "Something small, useful, and easy to keep alive",
  "Something polished that people remember",
  "Something powerful that can do a lot",
  "Something that helps a real community",
  "Something that can become a real business",
  "I am still not sure yet",
];

const MUD_PIT_QUESTION_BUCKETS: Array<{
  id: string;
  label: string;
  round: "essential" | "bonus";
  missingPrompt: (name: string, mention: string) => string;
  deeperPrompt: (name: string, snippet: string) => string;
}> = [
  {
    id: "must-be-true",
    label: "Must Be True",
    round: "essential",
    missingPrompt: (name, mention) =>
      `For ${name} to work, what has to be true about “${mention}”?`,
    deeperPrompt: (name, snippet) =>
      `Mini Crossfire sees this already: “${snippet}.” What has to be true for that piece of ${name} to hold up in real life?`,
  },
  {
    id: "weak-assumption",
    label: "Weak Assumption",
    round: "essential",
    missingPrompt: (name, mention) =>
      `What is the riskiest guess inside “${mention}” that could make ${name} weaker than it looks?`,
    deeperPrompt: (name, snippet) =>
      `Mini Crossfire sees this assumption: “${snippet}.” Where could that be wrong, too broad, or too easy to misunderstand?`,
  },
  {
    id: "proof-needed",
    label: "Proof Needed",
    round: "essential",
    missingPrompt: (name) =>
      `What proof would make ${name} feel real instead of just like a good idea?`,
    deeperPrompt: (name, snippet) =>
      `Mini Crossfire sees this signal: “${snippet}.” What proof would show that part of ${name} is actually true?`,
  },
  {
    id: "failure-point",
    label: "Failure Point",
    round: "essential",
    missingPrompt: (name) =>
      `Where would ${name} most likely break first: user interest, trust, money, workflow, design, or something else?`,
    deeperPrompt: (name, snippet) =>
      `Mini Crossfire sees this part: “${snippet}.” What could break first if ${name} reached real users?`,
  },
  {
    id: "smaller-stronger",
    label: "Smaller Stronger Version",
    round: "essential",
    missingPrompt: (name) =>
      `What is the smaller version of ${name} that could prove the idea before building the bigger version?`,
    deeperPrompt: (name, snippet) =>
      `Mini Crossfire sees this shape: “${snippet}.” What smaller version could test that before ${name} grows bigger?`,
  },
  {
    id: "user-resistance",
    label: "User Resistance",
    round: "bonus",
    missingPrompt: (name) =>
      `Why might the first user say no, ignore it, or keep doing things the old way instead of using ${name}?`,
    deeperPrompt: (name, snippet) =>
      `Mini Crossfire sees this user signal: “${snippet}.” Why might that person still say no or not care enough yet?`,
  },
  {
    id: "trust-risk",
    label: "Trust Risk",
    round: "bonus",
    missingPrompt: (name) =>
      `What would make someone not trust ${name}: data, claims, cost, complexity, quality, or something else?`,
    deeperPrompt: (name, snippet) =>
      `Mini Crossfire sees this trust-sensitive part: “${snippet}.” What would make a user hesitate or not believe it?`,
  },
  {
    id: "money-pressure",
    label: "Money Pressure",
    round: "bonus",
    missingPrompt: (name) =>
      `What money pressure should ${name} survive: price, cost to build, support, ads, subscriptions, or time saved?`,
    deeperPrompt: (name, snippet) =>
      `Mini Crossfire sees this money-related piece: “${snippet}.” What would need to be true for ${name} to be worth the money or time?`,
  },
  {
    id: "workflow-friction",
    label: "Workflow Friction",
    round: "bonus",
    missingPrompt: (name) =>
      `What step in ${name} could feel annoying, confusing, slow, or too much work for the user?`,
    deeperPrompt: (name, snippet) =>
      `Mini Crossfire sees this workflow piece: “${snippet}.” Which step could become annoying, confusing, or too slow?`,
  },
  {
    id: "kill-or-change",
    label: "Kill Or Change Signal",
    round: "bonus",
    missingPrompt: (name) =>
      `What result would tell us to change ${name}, shrink it, or stop this direction before wasting energy?`,
    deeperPrompt: (name, snippet) =>
      `Mini Crossfire sees this direction: “${snippet}.” What result would tell us to change, shrink, or stop that direction?`,
  },
];

function readActiveTreehouseProject(): LocalTreehouseProject | null {
  if (typeof window === "undefined") return null;

  try {
    const rawIdeas = window.localStorage.getItem(IDEAS_STORAGE_KEY);
    if (!rawIdeas) return null;

    const parsed = JSON.parse(rawIdeas) as unknown;
    if (!Array.isArray(parsed)) return null;

    const selectedId = window.localStorage.getItem("dabottree:selectedIdeaId");
    const ideas = parsed.filter((idea): idea is Record<string, unknown> =>
      Boolean(
        idea &&
        typeof idea === "object" &&
        typeof idea.id === "string" &&
        typeof idea.title === "string",
      ),
    );
    const active =
      ideas.find((idea) => selectedId && idea.id === selectedId) ??
      ideas.sort((a, b) => Number(b.updatedAt ?? 0) - Number(a.updatedAt ?? 0))[0];

    if (!active) return null;

    return {
      description: typeof active.description === "string" ? active.description : undefined,
      ideaType: typeof active.ideaType === "string" ? active.ideaType : undefined,
      projectId: active.id as string,
      title: active.title as string,
    };
  } catch {
    return null;
  }
}

function readRootRoomBotQuestionText(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = window.localStorage.getItem(ROOT_ROOM_BOT_QUESTIONS_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || !("questions" in parsed)) return "";
    const questions = (parsed as { questions?: unknown }).questions;
    if (!questions || typeof questions !== "object") return "";
    return Object.values(questions)
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .join(" ");
  } catch {
    return "";
  }
}

function mudPitProjectName(project: LocalTreehouseProject | null): string {
  return project?.title?.trim() || "this idea";
}

function mudPitMention(project: LocalTreehouseProject | null, rootRoomNotes: string): string {
  const source = [project?.description, project?.ideaType, rootRoomNotes]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (!source) return mudPitProjectName(project);
  return source.length > 86 ? `${source.slice(0, 84).replace(/\s+\S*$/, "")}...` : source;
}

function mudPitSnippetFor(questionId: string, context: string): string {
  const wordsByQuestion: Record<string, string[]> = {
    "must-be-true": ["need", "must", "should", "work", "help", "make", "create", "build"],
    "weak-assumption": ["always", "everyone", "people", "user", "customer", "client", "easy"],
    "proof-needed": ["prove", "real", "trust", "result", "save", "paid", "worth"],
    "failure-point": ["problem", "hard", "miss", "lose", "confusing", "risk", "wrong"],
    "smaller-stronger": ["first", "version", "simple", "small", "start", "mvp"],
    "user-resistance": ["user", "customer", "client", "audience", "people", "buyer"],
    "trust-risk": ["trust", "private", "safe", "claim", "quality", "data"],
    "money-pressure": ["money", "pay", "price", "cost", "save", "subscription", "revenue"],
    "workflow-friction": ["step", "process", "workflow", "screen", "click", "use"],
    "kill-or-change": ["stop", "change", "fail", "test", "signal", "result"],
  };
  const sentences = context
    .split(/[.!?\n]+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 18);
  const words = wordsByQuestion[questionId] ?? [];
  const match =
    sentences.find((sentence) => words.some((word) => sentence.toLowerCase().includes(word))) ??
    sentences[0];
  if (!match) return "";
  return match.length > 92 ? `${match.slice(0, 90).replace(/\s+\S*$/, "")}...` : match;
}

function buildMudPitQuestions(
  project: LocalTreehouseProject | null,
  rootRoomNotes: string,
): MudPitQuestion[] {
  const name = mudPitProjectName(project);
  const mention = mudPitMention(project, rootRoomNotes);
  const context = [project?.title, project?.description, project?.ideaType, rootRoomNotes]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return MUD_PIT_QUESTION_BUCKETS.map((bucket) => {
    const snippet = mudPitSnippetFor(bucket.id, context);
    return {
      id: bucket.id,
      bucket: bucket.id,
      label: bucket.label,
      round: bucket.round,
      prompt: snippet ? bucket.deeperPrompt(name, snippet) : bucket.missingPrompt(name, mention),
    };
  });
}

function LevelsPage() {
  const [activeChapterId, setActiveChapterId] = useState(TREEHOUSE_CHAPTERS[1]?.id ?? "library");
  const [activePartId, setActivePartId] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<LocalTreehouseProject | null>(null);
  const [rootRoomNotes, setRootRoomNotes] = useState("");

  useEffect(() => {
    setActiveProject(readActiveTreehouseProject());
    setRootRoomNotes(readRootRoomBotQuestionText());
  }, []);

  const activeChapter = useMemo(
    () =>
      TREEHOUSE_CHAPTERS.find((chapter) => chapter.id === activeChapterId) ?? TREEHOUSE_CHAPTERS[0],
    [activeChapterId],
  );
  const activePart = activePartId
    ? (activeChapter.parts.find((part) => part.id === activePartId) ?? null)
    : null;

  const selectChapter = (chapterId: string) => {
    setActiveChapterId(chapterId);
    setActivePartId(null);
  };

  return (
    <main className="min-h-screen bg-[#11160f] text-white">
      <section className="relative min-h-screen overflow-hidden">
        <img
          src={rootRoomBgAsset.url}
          alt=""
          className="fixed inset-0 h-full w-full object-cover opacity-55"
          draggable={false}
        />
        <div className="fixed inset-0 bg-[linear-gradient(180deg,rgba(9,12,7,0.72),rgba(9,12,7,0.95))]" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-3">
            <Link
              to="/"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-white/15 bg-black/35 px-3 text-sm text-white/90 backdrop-blur transition hover:bg-black/50"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <div className="inline-flex h-9 items-center gap-2 rounded-md border border-amber-200/25 bg-amber-300/10 px-3 text-sm text-amber-100">
              <BookOpen className="h-4 w-4" />
              {TREEHOUSE_CHAPTERS.length} chapters · {totalParts} pages
            </div>
            <Link
              to="/treehouse-status"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-200/25 bg-emerald-300/10 px-3 text-sm text-emerald-100 transition hover:bg-emerald-300/15"
            >
              <Activity className="h-4 w-4" />
              Status
            </Link>
          </header>

          <section className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div className="max-w-xl">
              <p className="mb-3 text-sm text-amber-200">Treehouse book skeleton</p>
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
                Every current chapter now has a basic page to stand on.
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-200">
                This is the first reusable book/page pass from the June 11 chapter canon: correct
                names, starter story copy, and a task section for each current part. Visuals stay
                generic for now so Boss can swap art later.
              </p>
              <div className="mt-5 grid gap-3 rounded-md border border-white/12 bg-black/35 p-4 text-sm text-slate-200 backdrop-blur-md">
                <div className="flex items-center gap-2 font-semibold text-amber-100">
                  <Layers3 className="h-4 w-4" />
                  Internal organization
                </div>
                <p>
                  Chapter data is organized as reusable chapters with nested parts. Each part has a
                  title, actor, story body, optional user action, and starter task ideas.
                </p>
                <p className="text-slate-400">Source brief: June 11 chapter canon packet</p>
              </div>
            </div>

            <section
              aria-label="What we've created so far"
              className="rounded-md border border-white/12 bg-black/38 p-4 shadow-2xl backdrop-blur-md sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-amber-200">
                    What we&apos;ve created so far
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">
                    Chapter {activeChapter.chapter}: {activeChapter.title}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{activeChapter.subtitle}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200/20 bg-emerald-300/10 px-2.5 py-1.5 text-xs text-emerald-100">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Skeleton ready
                </span>
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {TREEHOUSE_CHAPTERS.map((chapter) => (
                  <button
                    key={chapter.id}
                    type="button"
                    onClick={() => selectChapter(chapter.id)}
                    className={`h-10 shrink-0 rounded-md border px-3 text-sm font-semibold transition ${
                      chapter.id === activeChapter.id
                        ? "border-amber-200/70 bg-amber-300 text-stone-950"
                        : "border-white/12 bg-white/8 text-white/85 hover:bg-white/14"
                    }`}
                  >
                    Ch {chapter.chapter}
                  </button>
                ))}
              </div>

              <div className="mt-2 grid gap-5 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)]">
                <div className="rounded-md border border-white/10 bg-white/[0.06] p-3">
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-3">
                    {activeChapter.parts.map((part, index) => (
                      <button
                        key={part.id}
                        type="button"
                        onClick={() => setActivePartId(part.id)}
                        className={`aspect-square rounded-md border text-sm font-semibold transition ${
                          activePart?.id === part.id
                            ? "border-amber-200 bg-amber-300 text-stone-950"
                            : "border-white/12 bg-black/30 text-amber-50 hover:bg-white/12"
                        }`}
                        aria-label={`Open ${part.title}`}
                      >
                        Pt {index + 1}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 rounded-md border border-white/10 bg-black/24 p-3">
                    <p className="text-sm font-semibold text-white">Parent overview</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      Pick a square part selector to preview that page in this same section instead
                      of stacking a full block for every part.
                    </p>
                  </div>
                </div>

                <article className="relative min-h-[460px] overflow-hidden rounded-md border border-white/12 bg-[#1a150f]">
                  <img
                    src={rootRoomBgAsset.url}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-35"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(251,191,36,0.18),transparent_34%),linear-gradient(180deg,rgba(16,13,8,0.56),rgba(16,13,8,0.93))]" />

                  {activePart ? (
                    <PartPage
                      chapter={activeChapter}
                      part={activePart}
                      partNumber={
                        activeChapter.parts.findIndex((part) => part.id === activePart.id) + 1
                      }
                      project={activeProject}
                      onGo={() => setActivePartId(null)}
                    />
                  ) : (
                    <ChapterOverview
                      chapter={activeChapter}
                      project={activeProject}
                      rootRoomNotes={rootRoomNotes}
                    />
                  )}
                </article>
              </div>
            </section>
          </section>
        </div>
      </section>
    </main>
  );
}

function TreehouseActionButtons({
  chapter,
  n8nConnection,
  part,
  project,
}: {
  chapter: TreehouseChapter;
  n8nConnection: N8nLevelConnection | null;
  part?: TreehousePart;
  project: LocalTreehouseProject | null;
}) {
  const actions = treehouseActionsFor(chapter.id);
  const [packetStatus, setPacketStatus] = useState<
    Record<
      string,
      | { kind: "creating" }
      | { kind: "created"; packetId: string; packetPath: string }
      | { kind: "error"; message: string }
    >
  >({});

  const createPacket = async (bundle: TreehouseActionBundle) => {
    setPacketStatus((current) => ({ ...current, [bundle.action]: { kind: "creating" } }));
    try {
      const result = await createTreehouseTaskPacket({
        data: {
          actor: part?.actor ?? chapter.title,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          n8nAnchor: n8nConnection?.anchor ?? null,
          partId: part?.id ?? "chapter-overview",
          partTitle: part?.title ?? chapter.title,
          project,
          reportSourceKey: n8nConnection?.reportSourceKey ?? null,
          requestedAction: bundle.action,
        },
      });
      setPacketStatus((current) => ({
        ...current,
        [bundle.action]: {
          kind: "created",
          packetId: result.packetId,
          packetPath: result.packetPath,
        },
      }));
    } catch (error) {
      setPacketStatus((current) => ({
        ...current,
        [bundle.action]: {
          kind: "error",
          message: error instanceof Error ? error.message : "Could not create task packet",
        },
      }));
    }
  };

  return (
    <div className="mt-3 rounded-md border border-sky-200/18 bg-black/24 p-3">
      <p className="text-sm font-semibold text-sky-100">Treehouse action buttons</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">
        These create local task packets for hidden n8n bundles. They do not fire live automation.
      </p>
      {project ? (
        <p className="mt-2 rounded-md border border-emerald-200/18 bg-emerald-300/10 p-2 text-xs leading-5 text-emerald-100">
          Active project: {project.title}
        </p>
      ) : null}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {actions.map((bundle) => {
          const status = packetStatus[bundle.action];
          return (
            <div key={bundle.action} className="rounded-md border border-white/10 bg-black/24 p-2">
              <button
                type="button"
                onClick={() => createPacket(bundle)}
                disabled={status?.kind === "creating"}
                className="inline-flex min-h-9 w-full items-center justify-center rounded-md border border-sky-100/25 bg-sky-200/15 px-3 text-sm font-semibold text-sky-50 transition hover:bg-sky-200/25 disabled:cursor-wait disabled:opacity-70"
              >
                {status?.kind === "creating" ? "Creating..." : bundle.label}
              </button>
              <p className="mt-2 text-xs leading-5 text-slate-300">{bundle.description}</p>
              <p className="mt-1 break-all text-[11px] leading-4 text-slate-500">{bundle.action}</p>
              {status?.kind === "created" ? (
                <p className="mt-2 break-all rounded-md border border-emerald-200/18 bg-emerald-300/10 p-2 text-xs leading-5 text-emerald-100">
                  Created: {status.packetId}
                  <br />
                  {status.packetPath}
                </p>
              ) : null}
              {status?.kind === "error" ? (
                <p className="mt-2 rounded-md border border-red-300/20 bg-red-400/10 p-2 text-xs leading-5 text-red-100">
                  {status.message}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChapterOverview({
  chapter,
  project,
  rootRoomNotes,
}: {
  chapter: TreehouseChapter;
  project: LocalTreehouseProject | null;
  rootRoomNotes: string;
}) {
  const n8nConnection = n8nConnectionFor(chapter.id);
  const showMudPitGuide = chapter.id === "mud-pit";
  const showTheNameGuide = chapter.id === "the-name";
  const showCanopyGuide = chapter.id === "canopy-foundation";
  const showWindTunnelGuide = chapter.id === "wind-tunnel";
  const showBranchworksGuide = chapter.id === "branchworks";

  return (
    <div className="relative z-10 flex h-full min-h-[460px] flex-col justify-between p-5 sm:p-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-amber-100">
          <DoorOpen className="h-4 w-4" />
          Chapter overview
        </div>
        <h3 className="mt-3 text-3xl font-semibold text-white">{chapter.title}</h3>
        <p className="mt-3 max-w-xl text-base leading-7 text-slate-200">{chapter.subtitle}</p>
        {project ? (
          <div className="mt-4 rounded-md border border-emerald-200/18 bg-emerald-300/10 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-emerald-100">Active project</p>
            <p className="mt-1 text-sm font-semibold text-white">{project.title}</p>
            {project.ideaType ? (
              <p className="mt-1 text-xs text-slate-300">{project.ideaType}</p>
            ) : null}
            <Link
              to="/trend-watch"
              className="mt-3 inline-flex min-h-9 items-center justify-center rounded-md border border-emerald-100/25 bg-emerald-200/15 px-3 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-200/25"
            >
              Open Trend Watch
            </Link>
          </div>
        ) : null}
        {n8nConnection ? (
          <div className="mt-4 rounded-md border border-sky-200/20 bg-sky-300/10 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-sky-100">n8n connection</p>
            <p className="mt-1 text-sm font-semibold text-white">{n8nConnection.anchor}</p>
            <p className="mt-1 text-xs text-slate-300">
              Report source: {n8nConnection.reportSourceKey ?? "not mapped yet"}
            </p>
            {n8nConnection.summary ? (
              <p className="mt-2 text-sm leading-6 text-slate-200">{n8nConnection.summary}</p>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 rounded-md border border-amber-200/20 bg-amber-300/10 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-amber-100">
              n8n connection needed
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-200">
              This chapter exists in the Treehouse book, but no matching local n8n level anchor is
              mapped yet.
            </p>
          </div>
        )}
        {showMudPitGuide ? (
          <MudPitMiniCrossfirePanel project={project} rootRoomNotes={rootRoomNotes} />
        ) : null}
        {showTheNameGuide ? <TheNameMonikerPanel project={project} /> : null}
        {showCanopyGuide ? <CanopyFoundationPanel project={project} /> : null}
        {showWindTunnelGuide ? <WindTunnelStagehandPanel project={project} /> : null}
        {showBranchworksGuide ? <BranchworksMommaBearPanel project={project} /> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {chapter.parts.map((part, index) => (
          <div key={part.id} className="rounded-md border border-white/10 bg-black/30 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-amber-200">Pt {index + 1}</p>
            <p className="mt-1 font-semibold text-white">{part.title}</p>
            <p className="mt-1 text-sm text-slate-300">{part.actor}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function WindTunnelStagehandPanel({ project }: { project: LocalTreehouseProject | null }) {
  const [status, setStatus] = useState<"idle" | "running" | "complete">("idle");
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (status !== "running") return undefined;
    const timer = window.setTimeout(() => {
      setStatus("complete");
      setShowReview(true);
      try {
        window.localStorage.setItem(
          WIND_TUNNEL_REVIEW_KEY,
          JSON.stringify({
            completedAt: new Date().toISOString(),
            projectId: project?.projectId ?? null,
            excitingThings: WIND_TUNNEL_EXCITING_THINGS,
            lookMoreInto: WIND_TUNNEL_LOOK_MORE_INTO,
          }),
        );
      } catch {
        // The reveal can still work if local storage is unavailable.
      }
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [project?.projectId, status]);

  const runWindTest = () => {
    setStatus("running");
    setShowReview(false);
  };

  return (
    <div className="mt-4 rounded-md border border-cyan-200/22 bg-cyan-300/10 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-cyan-100">Stagehand</p>
          <h4 className="mt-1 text-lg font-semibold text-white">Wind Tunnel test bench</h4>
          <p className="mt-1 text-sm leading-6 text-slate-200">
            This is the first time your project goes through real stress. Stagehand shakes the
            foundation a little and sees what still holds.
          </p>
        </div>
        <div className="rounded-md border border-cyan-100/20 bg-black/24 px-3 py-2 text-right">
          <p className="text-xs text-cyan-100">
            {status === "complete" ? "Review ready" : status === "running" ? "Testing" : "Ready"}
          </p>
          <p className="mt-1 text-[11px] text-slate-300">Stagehand scene</p>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-md border border-white/10 bg-stone-950/70 p-3">
        <div className="relative min-h-[230px] rounded-md border border-cyan-100/10 bg-[radial-gradient(circle_at_50%_20%,rgba(125,211,252,0.18),rgba(12,10,9,0.05)_44%,rgba(0,0,0,0.22)_100%)] p-4">
          <div className="absolute left-4 top-4 flex gap-2">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className={`h-3 w-3 rounded-sm border border-cyan-100/25 bg-cyan-200/25 ${
                  status === "running" ? "animate-pulse" : ""
                }`}
                style={{ animationDelay: `${index * 180}ms` }}
              />
            ))}
          </div>
          <div className="absolute right-4 top-4 h-12 w-12 rounded-full border border-cyan-100/20 bg-cyan-200/10">
            <div
              className={`mx-auto mt-2 h-8 w-8 rounded-full border border-cyan-100/30 border-t-cyan-200 ${
                status === "running" ? "animate-spin" : ""
              }`}
            />
          </div>
          <div className="flex min-h-[198px] flex-col items-center justify-center text-center">
            <div
              className={`relative grid h-24 w-24 place-items-center rounded-md border transition ${
                status === "complete"
                  ? "border-cyan-100/60 bg-cyan-200/30 shadow-[0_0_36px_rgba(125,211,252,0.34)]"
                  : "border-white/12 bg-white/8"
              } ${status === "running" ? "animate-pulse" : ""}`}
            >
              <div className="h-12 w-12 rounded-sm border border-cyan-100/35 bg-cyan-100/20" />
              <div className="absolute -left-8 top-9 h-2 w-6 rounded-full bg-cyan-100/30" />
              <div className="absolute -right-8 top-9 h-2 w-6 rounded-full bg-cyan-100/30" />
              <div className="absolute -bottom-6 left-1/2 h-5 w-2 -translate-x-1/2 rounded-full bg-cyan-100/30" />
            </div>
            <p className="mt-5 text-sm font-semibold text-white">
              {status === "complete"
                ? "All right. Looks like we have something here."
                : status === "running"
                  ? "Stagehand is testing the foundation..."
                  : "Stagehand is ready at the bench."}
            </p>
            <p className="mt-2 max-w-sm text-xs leading-5 text-slate-300">
              {status === "running"
                ? "Checking weak spots, tightening loose boards, and preparing the first test result."
                : "Run the test to reveal a quick review of what looks exciting and what needs more attention."}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-300">
          Wind Tunnel is a reveal moment. The user starts the test, then Stagehand brings back the
          review.
        </p>
        <button
          type="button"
          onClick={status === "complete" ? () => setShowReview(true) : runWindTest}
          disabled={status === "running"}
          className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-md border border-cyan-100/25 bg-cyan-300 px-3 text-sm font-semibold text-stone-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
        >
          <Activity className="h-4 w-4" />
          {status === "complete" ? "Open Wind Test Review" : "Run Wind Test"}
        </button>
      </div>

      {showReview ? (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black p-4">
          <div className="max-h-[86vh] w-full max-w-lg overflow-y-auto rounded-md border border-cyan-100/25 bg-stone-950 p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-100">
                  Wind Test Review
                </p>
                <h4 className="mt-1 text-xl font-semibold text-white">First stress result</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowReview(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/12 bg-white/8 text-white/85 transition hover:bg-white/14"
                aria-label="Close Wind Test Review"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-md border border-emerald-100/20 bg-emerald-300/10 p-3">
                <p className="text-sm font-semibold text-emerald-50">Top 3 exciting things</p>
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-200">
                  {WIND_TUNNEL_EXCITING_THINGS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </div>
              <div className="rounded-md border border-amber-100/20 bg-amber-300/10 p-3">
                <p className="text-sm font-semibold text-amber-50">Top 3 things to look into</p>
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-200">
                  {WIND_TUNNEL_LOOK_MORE_INTO.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowReview(false)}
              className="mt-4 inline-flex min-h-9 w-full items-center justify-center rounded-md border border-cyan-100/25 bg-cyan-300 px-3 text-sm font-semibold text-stone-950 transition hover:bg-cyan-200"
            >
              Continue to Branchworks
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BranchworksMommaBearPanel({ project }: { project: LocalTreehouseProject | null }) {
  const [futureVision, setFutureVision] = useState("");

  const chooseFutureVision = (option: string) => {
    setFutureVision(option);
    try {
      window.localStorage.setItem(
        BRANCHWORKS_FUTURE_VISION_KEY,
        JSON.stringify({
          answeredAt: new Date().toISOString(),
          projectId: project?.projectId ?? null,
          answer: option,
        }),
      );
    } catch {
      // The scene can still work if local storage is unavailable.
    }
  };

  return (
    <div className="mt-4 rounded-md border border-lime-200/22 bg-lime-300/10 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-lime-100">Momma Bear</p>
          <h4 className="mt-1 text-lg font-semibold text-white">Branchworks treehouse build</h4>
          <p className="mt-1 text-sm leading-6 text-slate-200">
            My little builders are hard at work. They are making room for this idea to grow into
            something pretty awesome.
          </p>
        </div>
        <div className="rounded-md border border-lime-100/20 bg-black/24 px-3 py-2 text-right">
          <p className="text-xs text-lime-100">
            {futureVision ? "Future noted" : "Growth question"}
          </p>
          <p className="mt-1 text-[11px] text-slate-300">Branchworks scene</p>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-md border border-white/10 bg-stone-950/70 p-3">
        <div className="relative min-h-[310px] rounded-md border border-lime-100/10 bg-[radial-gradient(circle_at_50%_16%,rgba(190,242,100,0.18),rgba(12,10,9,0.06)_44%,rgba(0,0,0,0.24)_100%)] p-4">
          <div className="absolute bottom-0 left-1/2 h-52 w-16 -translate-x-1/2 rounded-t-full border border-amber-900/50 bg-[#6f4425] shadow-[inset_12px_0_rgba(255,255,255,0.08)]" />
          <div className="absolute left-[16%] right-[16%] top-[128px] h-8 rounded-full border border-amber-900/55 bg-[#754925] shadow-[0_10px_28px_rgba(0,0,0,0.34)]" />
          <div className="absolute left-1/2 top-[88px] h-24 w-16 -translate-x-1/2 rounded-t-full bg-[#6f4425]" />

          <div className="relative z-10 grid min-h-[270px] grid-rows-[1fr_auto] gap-4">
            <div className="grid items-end gap-3 sm:grid-cols-3">
              <BranchworksTreehouse
                accent="sky"
                bear="Ace"
                house="clear little house"
                position="left"
              />
              <BranchworksTreehouse
                accent="amber"
                bear="Bolt"
                house="busy little house"
                position="center"
              />
              <BranchworksTreehouse
                accent="rose"
                bear="Craft"
                house="warm little house"
                position="right"
              />
            </div>

            <div className="mx-auto flex w-full max-w-md items-center gap-3 rounded-md border border-lime-100/20 bg-black/55 p-3">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-lime-100/25 bg-[#8f5d3c]">
                <div className="relative h-10 w-12 rounded-full bg-[#c58a58]">
                  <span className="absolute -left-2 top-1 h-5 w-5 rounded-full bg-[#c58a58]" />
                  <span className="absolute -right-2 top-1 h-5 w-5 rounded-full bg-[#c58a58]" />
                  <span className="absolute left-3 top-4 h-1.5 w-1.5 rounded-full bg-stone-950" />
                  <span className="absolute right-3 top-4 h-1.5 w-1.5 rounded-full bg-stone-950" />
                  <span className="absolute left-1/2 top-6 h-2 w-3 -translate-x-1/2 rounded-full bg-stone-900" />
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-lime-100">Momma Bear</p>
                <p className="mt-1 text-sm leading-6 text-slate-100">
                  Before they get too far, tell me what you hope this project grows into.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-white/10 bg-black/24 p-3">
        <p className="text-sm font-semibold text-white">
          When you picture this project grown up, what do you hope it becomes?
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {BRANCHWORKS_FUTURE_OPTIONS.map((option) => {
            const selected = futureVision === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => chooseFutureVision(option)}
                className={`min-h-10 rounded-md border px-3 py-2 text-left text-sm transition ${
                  selected
                    ? "border-lime-100/70 bg-lime-300 text-stone-950"
                    : "border-white/10 bg-stone-950/60 text-slate-200 hover:bg-white/10"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
        {futureVision ? (
          <div className="mt-3 rounded-md border border-lime-100/20 bg-lime-300/10 p-3">
            <p className="text-sm font-semibold text-lime-50">
              Good. I will keep that in mind while the little ones keep building.
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-300">
              Nothing is locked yet. Branchworks is just giving the project room to grow.
            </p>
          </div>
        ) : (
          <p className="mt-3 text-xs leading-5 text-slate-300">
            The houses are only a clue. The user does not need to know what each builder is shaping
            behind the scenes.
          </p>
        )}
      </div>
    </div>
  );
}

function BranchworksTreehouse({
  accent,
  bear,
  house,
  position,
}: {
  accent: "amber" | "rose" | "sky";
  bear: string;
  house: string;
  position: "center" | "left" | "right";
}) {
  const palette = {
    amber: {
      border: "border-amber-100/35",
      roof: "border-b-amber-300",
      wall: "bg-amber-200/35",
      bear: "bg-amber-300",
      trim: "bg-amber-100/45",
      text: "text-amber-100",
    },
    rose: {
      border: "border-rose-100/35",
      roof: "border-b-rose-300",
      wall: "bg-rose-200/35",
      bear: "bg-rose-300",
      trim: "bg-rose-100/45",
      text: "text-rose-100",
    },
    sky: {
      border: "border-sky-100/35",
      roof: "border-b-sky-300",
      wall: "bg-sky-200/35",
      bear: "bg-sky-300",
      trim: "bg-sky-100/45",
      text: "text-sky-100",
    },
  }[accent];
  const lift =
    position === "center"
      ? "sm:-translate-y-5"
      : position === "left"
        ? "sm:translate-y-4"
        : "sm:translate-y-2";

  return (
    <div className={`flex min-h-[180px] flex-col items-center justify-end ${lift}`}>
      <div className="relative h-24 w-28">
        <div
          className={`absolute left-1/2 top-0 h-0 w-0 -translate-x-1/2 border-x-[48px] border-b-[34px] border-x-transparent ${palette.roof}`}
        />
        <div
          className={`absolute bottom-0 left-1/2 h-16 w-24 -translate-x-1/2 rounded-md border ${palette.border} ${palette.wall} shadow-[0_12px_22px_rgba(0,0,0,0.32)]`}
        >
          <div className={`mx-auto mt-4 h-9 w-5 rounded-t-md ${palette.trim}`} />
          <div className="absolute left-3 top-5 h-4 w-4 rounded-sm bg-black/24" />
          <div className="absolute right-3 top-5 h-4 w-4 rounded-sm bg-black/24" />
        </div>
      </div>
      <div className="mt-2 flex items-end gap-1">
        <div className={`relative h-9 w-10 rounded-full ${palette.bear}`}>
          <span className={`absolute -left-1 top-1 h-3 w-3 rounded-full ${palette.bear}`} />
          <span className={`absolute -right-1 top-1 h-3 w-3 rounded-full ${palette.bear}`} />
          <span className="absolute left-2.5 top-4 h-1 w-1 rounded-full bg-stone-950" />
          <span className="absolute right-2.5 top-4 h-1 w-1 rounded-full bg-stone-950" />
          <span className="absolute left-1/2 top-5 h-1.5 w-2 -translate-x-1/2 rounded-full bg-stone-900" />
        </div>
        <div className="h-8 w-2 -rotate-12 rounded-full bg-stone-200/55" />
      </div>
      <p
        className={`mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] ${palette.text}`}
      >
        {bear}
      </p>
      <p className="mt-1 text-center text-[11px] text-slate-400">{house}</p>
    </div>
  );
}

function CanopyFoundationPanel({ project }: { project: LocalTreehouseProject | null }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [foundationStarted, setFoundationStarted] = useState(false);
  const answeredCount = CANOPY_FOUNDATION_CHECKS.filter((check) => answers[check.id]).length;
  const canBuild = answeredCount === CANOPY_FOUNDATION_CHECKS.length;

  const chooseAnswer = (checkId: string, option: string) => {
    setAnswers((current) => ({ ...current, [checkId]: option }));
  };

  const buildFoundationPacket = () => {
    if (!canBuild) return;
    try {
      window.localStorage.setItem(
        CANOPY_FOUNDATION_CHECK_KEY,
        JSON.stringify({
          completedAt: new Date().toISOString(),
          projectId: project?.projectId ?? null,
          answers,
        }),
      );
    } catch {
      // The chapter can still show the handoff state if local storage is unavailable.
    }
    setFoundationStarted(true);
  };

  return (
    <div className="mt-4 rounded-md border border-emerald-200/22 bg-emerald-300/10 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-100">Rook</p>
          <h4 className="mt-1 text-lg font-semibold text-white">Canopy Foundation check</h4>
          <p className="mt-1 text-sm leading-6 text-slate-200">
            Welcome to Canopy Foundation. I will turn this project into a stronger foundation.
            First, Bones checks the main structure. Then the Squirrels inspect the small beams.
          </p>
        </div>
        <div className="rounded-md border border-emerald-100/20 bg-black/24 px-3 py-2 text-right">
          <p className="text-xs text-emerald-100">
            {foundationStarted ? "Packet started" : "Multiple choice"}
          </p>
          <p className="mt-1 text-[11px] text-slate-300">
            {answeredCount}/{CANOPY_FOUNDATION_CHECKS.length} checks answered
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-3">
        {CANOPY_FOUNDATION_CHECKS.map((check) => {
          const selected = answers[check.id];
          return (
            <div key={check.id} className="rounded-md border border-white/10 bg-black/24 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-emerald-100">
                    {check.actor}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">{check.role}</p>
                </div>
                {selected ? (
                  <span className="rounded-md border border-emerald-100/20 bg-emerald-300/12 px-2 py-1 text-[11px] font-semibold text-emerald-50">
                    Answered
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-100">
                {check.question}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {check.options.map((option) => {
                  const isSelected = selected === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => chooseAnswer(check.id, option)}
                      className={`min-h-10 rounded-md border px-3 py-2 text-left text-sm transition ${
                        isSelected
                          ? "border-emerald-100/70 bg-emerald-300 text-stone-950"
                          : "border-white/10 bg-stone-950/60 text-slate-200 hover:bg-white/10"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 rounded-md border border-white/10 bg-black/24 p-3">
        {foundationStarted ? (
          <>
            <p className="text-sm font-semibold text-white">
              Rook has what he needs to build the foundation packet.
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-300">
              The visible check is complete. The next pass can use these answers to shape the
              Branchworks-ready foundation handoff.
            </p>
          </>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-300">
              Answer each quick check so Rook can turn the project into a foundation packet.
            </p>
            <button
              type="button"
              onClick={buildFoundationPacket}
              disabled={!canBuild}
              className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-md border border-emerald-100/25 bg-emerald-300 px-3 text-sm font-semibold text-stone-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
            >
              <CheckCircle2 className="h-4 w-4" />
              Build Foundation Packet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TheNameMonikerPanel({ project }: { project: LocalTreehouseProject | null }) {
  const [tone, setTone] = useState("");
  const [shape, setShape] = useState("");
  const [avoid, setAvoid] = useState("");
  const [sentToMoniker, setSentToMoniker] = useState(false);
  const [showReserve, setShowReserve] = useState(false);
  const [removedNames, setRemovedNames] = useState<Record<string, boolean>>({});
  const canSend = tone.trim().length > 0 && shape.trim().length > 0;
  const visibleNames = showReserve ? MONIKER_RESERVE_NAME_SLOTS : MONIKER_PRIMARY_NAME_SLOTS;
  const keptCount = visibleNames.filter((name) => !removedNames[name.id]).length;

  const sendToMoniker = () => {
    if (!canSend) return;
    try {
      window.localStorage.setItem(
        THE_NAME_DIRECTION_KEY,
        JSON.stringify({
          completedAt: new Date().toISOString(),
          projectId: project?.projectId ?? null,
          tone,
          shape,
          avoid,
        }),
      );
    } catch {
      // The level can still show the process if local storage is unavailable.
    }
    setSentToMoniker(true);
  };

  return (
    <div className="mt-4 rounded-md border border-fuchsia-200/22 bg-fuchsia-300/10 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-fuchsia-100">Moniker</p>
          <h4 className="mt-1 text-lg font-semibold text-white">The Name process</h4>
          <p className="mt-1 text-sm leading-6 text-slate-200">
            A good name has to fit the project, sound right, and have a path to being used. Moniker
            asks for direction first, then works on a real shortlist.
          </p>
        </div>
        <div className="rounded-md border border-fuchsia-100/20 bg-black/24 px-3 py-2 text-right">
          <p className="text-xs text-fuchsia-100">
            {sentToMoniker ? "Names in review" : "Direction needed"}
          </p>
          <p className="mt-1 text-[11px] text-slate-300">10 primary · 10 reserve</p>
        </div>
      </div>

      {!sentToMoniker ? (
        <div className="mt-3 grid gap-3">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-fuchsia-100">
              How should it sound?
            </span>
            <input
              value={tone}
              onChange={(event) => setTone(event.target.value)}
              placeholder="Clear, clever, professional, playful, emotional, mythic..."
              className="mt-2 min-h-10 w-full rounded-md border border-fuchsia-100/20 bg-stone-950/75 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-fuchsia-100/45 focus:ring-2 focus:ring-fuchsia-200/15"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-fuchsia-100">
              What kind of name should it be?
            </span>
            <input
              value={shape}
              onChange={(event) => setShape(event.target.value)}
              placeholder="Descriptive, brand-like, story-based, short URL-friendly..."
              className="mt-2 min-h-10 w-full rounded-md border border-fuchsia-100/20 bg-stone-950/75 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-fuchsia-100/45 focus:ring-2 focus:ring-fuchsia-200/15"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-fuchsia-100">
              Anything to avoid or lean toward?
            </span>
            <textarea
              value={avoid}
              onChange={(event) => setAvoid(event.target.value)}
              placeholder="Words, feelings, examples, names you dislike, names you like..."
              className="mt-2 min-h-[76px] w-full resize-none rounded-md border border-fuchsia-100/20 bg-stone-950/75 px-3 py-2 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-fuchsia-100/45 focus:ring-2 focus:ring-fuchsia-200/15"
            />
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-300">
              Sending starts the level. Moniker works in the background before names return.
            </p>
            <button
              type="button"
              onClick={sendToMoniker}
              disabled={!canSend}
              className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-md border border-fuchsia-100/25 bg-fuchsia-300 px-3 text-sm font-semibold text-stone-950 transition hover:bg-fuchsia-200 disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
            >
              <Search className="h-4 w-4" />
              Send to Moniker
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <div className="rounded-md border border-fuchsia-100/20 bg-black/28 p-3">
            <p className="text-sm font-semibold text-white">
              Moniker is checking fit, sound, and usable URL direction.
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-300">
              Domain status here is direction only. Actual ownership or purchase would require a
              later approved registrar action.
            </p>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.16em] text-fuchsia-100">
              {showReserve ? "Reserve names" : "Primary shortlist"} · {keptCount} still visible
            </p>
            <button
              type="button"
              onClick={() => setShowReserve((current) => !current)}
              className="rounded-md border border-white/12 bg-black/30 px-3 py-2 text-xs font-semibold text-white/85 transition hover:bg-white/10"
            >
              {showReserve ? "Back to primary" : "Show reserve names"}
            </button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {visibleNames.map((name) => {
              const removed = removedNames[name.id];
              return (
                <div
                  key={name.id}
                  className={`rounded-md border p-3 ${
                    removed
                      ? "border-white/8 bg-black/18 opacity-45"
                      : "border-white/10 bg-black/28"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{name.label}</p>
                      <p className="mt-1 text-xs text-fuchsia-100">{name.status}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setRemovedNames((current) => ({ ...current, [name.id]: !removed }))
                      }
                      className="inline-flex min-h-7 items-center justify-center gap-1 rounded-md border border-white/12 bg-white/8 px-2 py-1 text-xs text-white/85 transition hover:bg-white/14"
                      aria-label={removed ? `Restore ${name.label}` : `Remove ${name.label}`}
                    >
                      {removed ? (
                        "Restore"
                      ) : (
                        <>
                          <X className="h-3.5 w-3.5" />
                          <span className="sr-only">Remove</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-300">
                    Meaning, vibe, URL direction, and availability check will appear here when
                    Moniker returns the real list.
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-3 rounded-md border border-white/10 bg-black/24 p-3">
            <p className="text-sm font-semibold text-white">If none of these feel right</p>
            <p className="mt-1 text-xs leading-5 text-slate-300">
              Ask what missed: too plain, too weird, too corporate, too cute, too long, not clear
              enough, not unique enough, or the wrong feeling. Moniker can then use the reserve set
              or create a tighter round.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function MudPitMiniCrossfirePanel({
  project,
  rootRoomNotes,
}: {
  project: LocalTreehouseProject | null;
  rootRoomNotes: string;
}) {
  const questions = useMemo(
    () => buildMudPitQuestions(project, rootRoomNotes),
    [project, rootRoomNotes],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const currentQuestion = questions[activeIndex] ?? questions[0];
  const answeredCount = Object.values(answers).filter((answer) => answer.trim()).length;
  const essentialCount = questions.filter((question) => question.round === "essential").length;
  const isLastQuestion = activeIndex >= questions.length - 1;
  const roundLabel = currentQuestion?.round === "bonus" ? "Bonus" : "Essential";

  const persistAnswers = (nextAnswers: Record<string, string>) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        MUD_PIT_ANSWERS_KEY,
        JSON.stringify({
          completedAt: new Date().toISOString(),
          projectId: project?.projectId ?? null,
          answers: nextAnswers,
        }),
      );
    } catch {
      // The live panel can continue even when local storage is unavailable.
    }
  };

  const finishCurrent = (answer?: string) => {
    if (!currentQuestion) return;
    const trimmed = answer?.trim() ?? "";
    const nextAnswers = trimmed ? { ...answers, [currentQuestion.id]: trimmed } : answers;
    if (trimmed) {
      setAnswers(nextAnswers);
      persistAnswers(nextAnswers);
    }
    setDraft("");
    if (!isLastQuestion) {
      setActiveIndex((index) => index + 1);
    } else {
      persistAnswers(nextAnswers);
    }
  };

  if (!currentQuestion) return null;

  return (
    <div className="mt-4 rounded-md border border-red-200/22 bg-red-300/10 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-red-100">Mini Crossfire</p>
          <h4 className="mt-1 text-lg font-semibold text-white">Mud Pit pressure questions</h4>
          <p className="mt-1 text-sm leading-6 text-slate-200">
            Mini Crossfire reads the idea and Root Room notes, then asks for weak spots instead of
            repeating basics the user already gave.
          </p>
        </div>
        <div className="rounded-md border border-red-100/20 bg-black/24 px-3 py-2 text-right">
          <p className="text-xs text-red-100">
            {roundLabel} {activeIndex + 1}/{questions.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-300">
            First {essentialCount} matter most · {answeredCount} saved
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-white/10 bg-black/28 p-3">
        <p className="text-[11px] uppercase tracking-[0.16em] text-red-100">
          {currentQuestion.label}
        </p>
        <p className="mt-2 text-sm leading-6 text-white">{currentQuestion.prompt}</p>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Answer Mini Crossfire, or skip if this pressure point is not a concern yet..."
          className="mt-3 min-h-[86px] w-full resize-none rounded-md border border-red-100/20 bg-stone-950/75 px-3 py-2 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-red-100/45 focus:ring-2 focus:ring-red-200/15"
        />
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-300">
          Bonus questions help if the idea still has weak buckets after the first five.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => finishCurrent()}
            className="rounded-md border border-white/12 bg-black/30 px-3 py-2 text-xs font-semibold text-white/85 transition hover:bg-white/10"
          >
            Not a concern yet
          </button>
          <button
            type="button"
            onClick={() => finishCurrent(draft)}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-100/25 bg-red-300 px-3 py-2 text-xs font-semibold text-stone-950 transition hover:bg-red-200"
          >
            {isLastQuestion ? "Save pressure pass" : draft.trim() ? "Save and next" : "Next"}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PartPage({
  chapter,
  onGo,
  part,
  partNumber,
  project,
}: {
  chapter: TreehouseChapter;
  onGo: () => void;
  part: TreehousePart;
  partNumber: number;
  project: LocalTreehouseProject | null;
}) {
  const heroAlignment = heroAlignmentFor(`${chapter.id}:${part.id}`);
  const canonSaying = canonSayingFor(part.actor);
  const n8nConnection = n8nConnectionFor(chapter.id);
  const heroImage = (
    <aside className="flex min-h-48 w-full max-w-[220px] flex-col items-center justify-between gap-4 rounded-md border border-white/10 bg-black/24 p-3">
      <img
        src={genericBotAsset.url}
        alt=""
        className="h-40 w-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)]"
        draggable={false}
      />
      <button
        type="button"
        onClick={onGo}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-amber-300 px-4 text-sm font-semibold text-stone-950 transition hover:bg-amber-200"
      >
        Go
      </button>
    </aside>
  );
  const heroText = (
    <div
      className={`min-w-0 ${
        heroAlignment === "center"
          ? "mx-auto max-w-2xl text-center"
          : heroAlignment === "right"
            ? "lg:text-right"
            : ""
      }`}
    >
      <div
        className={`flex flex-wrap items-center gap-2 text-sm text-amber-100 ${
          heroAlignment === "center"
            ? "justify-center"
            : heroAlignment === "right"
              ? "lg:justify-end"
              : ""
        }`}
      >
        <FileText className="h-4 w-4" />
        Chapter {chapter.chapter} · Pt {partNumber}
      </div>
      <h3 className="mt-3 text-3xl font-semibold leading-tight text-white">{part.title}</h3>
      <p className="mt-1 text-sm text-amber-200">{part.actor}</p>
      <p
        className={`mt-3 text-sm leading-6 ${
          canonSaying ? "text-amber-50/95" : "text-amber-200/75"
        }`}
      >
        {canonSaying ? `"${canonSaying}"` : "Canon saying needed"}
      </p>
      <p className="mt-4 text-base leading-7 text-slate-100">{part.story}</p>
    </div>
  );
  const heroClass =
    heroAlignment === "center"
      ? "flex flex-col items-center justify-center gap-5"
      : "grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_176px]";

  return (
    <div className="relative z-10 flex min-h-[460px] flex-col gap-4 p-5 sm:p-6">
      <section className={heroClass}>
        {heroAlignment === "right" ? (
          <>
            {heroImage}
            {heroText}
          </>
        ) : (
          <>
            {heroText}
            {heroImage}
          </>
        )}
      </section>

      {part.userAction ? (
        <div className="rounded-md border border-amber-200/22 bg-amber-300/10 p-3">
          <p className="text-sm font-semibold text-amber-100">User checkpoint</p>
          <p className="mt-1 text-sm leading-6 text-slate-200">{part.userAction}</p>
        </div>
      ) : null}

      <div className="rounded-md border border-sky-200/18 bg-sky-300/10 p-3">
        <p className="text-sm font-semibold text-sky-100">n8n anchor</p>
        <p className="mt-1 text-xs text-slate-400">Local task packet bridge</p>
        {n8nConnection ? (
          <>
            <p className="mt-1 text-sm leading-6 text-slate-200">{n8nConnection.anchor}</p>
            <p className="mt-1 text-xs text-slate-400">
              {n8nConnection.reportSourceKey ?? "Report source not mapped yet"} ·{" "}
              {n8nConnection.status ?? "status unknown"}
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm leading-6 text-slate-200">
            No local n8n level anchor is mapped for this chapter yet.
          </p>
        )}
      </div>

      <div className="rounded-md border border-white/10 bg-black/28 p-3">
        <p className="text-sm font-semibold text-white">Task section starters</p>
        <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-200">
          {part.taskIdeas.map((task) => (
            <li key={task} className="flex gap-2">
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-amber-200" />
              <span>{task}</span>
            </li>
          ))}
        </ul>
        <TreehouseActionButtons
          chapter={chapter}
          n8nConnection={n8nConnection}
          part={part}
          project={project}
        />
      </div>
    </div>
  );
}
