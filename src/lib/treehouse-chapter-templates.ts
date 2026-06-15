export type TreehouseChapterTemplate = {
  id: string;
  chapter: number;
  title: string;
  purpose: string;
  parts: string[];
  checkpoints: string[];
  boundary: string;
};

export const TREEHOUSE_CHAPTER_TEMPLATES: TreehouseChapterTemplate[] = [
  {
    id: "clarity",
    chapter: 1,
    title: "Clarity",
    purpose: "Turn the first messy idea into a clear starting packet for the Treehouse path.",
    parts: ["Clarity"],
    checkpoints: [
      "Raw idea is captured",
      "First useful questions are answered",
      "Idea is ready for the Root Room",
    ],
    boundary: "Intake shell only. It does not approve research, spending, launch, or automation.",
  },
  {
    id: "root-room",
    chapter: 2,
    title: "The Root Room",
    purpose:
      "Set the project baseline before deeper research, design, money, or build work begins.",
    parts: ["Echo", "Shield", "Ledger", "Chief"],
    checkpoints: [
      "Original idea is preserved",
      "Safety flags are named",
      "Baseline record is ready",
    ],
    boundary:
      "Template only. No bot flow, notebook report, deployment, or outside action runs from here yet.",
  },
  {
    id: "mud-pit",
    chapter: 3,
    title: "The Mud Pit",
    purpose:
      "Pressure-test the idea after Root Room captures the baseline and before Trunk research begins.",
    parts: ["Crossfire", "Hard Questions", "Weak Spots", "Proof Needed", "Stronger Version"],
    checkpoints: [
      "Weak assumptions are named",
      "Proof needs are visible",
      "The idea is sharper before Trunk starts",
    ],
    boundary:
      "Challenge shell only. It does not reject ideas, override the user, approve spending, or make final decisions.",
  },
  {
    id: "trunk-ascent",
    chapter: 4,
    title: "Trunk Ascent",
    purpose: "Turn the baseline into a deeper research and direction packet.",
    parts: ["Luma", "Bloom", "Vault", "Compass"],
    checkpoints: [
      "Design questions are visible",
      "Audience and growth notes are parked",
      "Money risk is named",
    ],
    boundary: "Research shell only. It does not approve building, spending, launch, or automation.",
  },
  {
    id: "the-name",
    chapter: 5,
    title: "The Name",
    purpose:
      "Find the best working name for the project without making the creator feel like they have to be clever.",
    parts: ["Moniker"],
    checkpoints: [
      "Working name is captured",
      "Plain-English promise is drafted",
      "Confusing labels are parked",
    ],
    boundary: "Naming shell only. It does not lock the final brand, public copy, or launch name.",
  },
  {
    id: "canopy-foundation",
    chapter: 6,
    title: "Canopy Foundation",
    purpose: "Build the clean foundation packet before experiments or prototype work begin.",
    parts: [
      "Rook opens Canopy",
      "Bones",
      "Squirrel Session",
      "Individual Lantern Pages",
      "Ledger",
      "Rook closes Canopy",
    ],
    checkpoints: [
      "Foundation packet is readable",
      "Missing structure is listed",
      "Closeout handoff is ready",
    ],
    boundary:
      "Foundation shell only. It does not approve prototype work, deployment, spending, or public launch.",
  },
  {
    id: "wind-tunnel",
    chapter: 7,
    title: "Wind Tunnel",
    purpose: "Stress-test whether the project is strong enough to move forward.",
    parts: ["Gauge", "Shield", "Stagehand"],
    checkpoints: [
      "Weak points are named",
      "Safety pass is visible",
      "Next-stage recommendation is clear",
    ],
    boundary:
      "Validation shell only. It does not run tests, submit prompts, deploy, or make final decisions.",
  },
  {
    id: "branchworks-level",
    chapter: 8,
    title: "Branchworks Level",
    purpose:
      "Shape experiment directions and early build rails without turning them into a live product yet.",
    parts: [
      "Tinker opens Branchworks",
      "Squirrel Build Rails",
      "Individual Lantern Build Passes",
      "Echo",
      "Momma Bear",
      "Ace / Bolt / Craft working scene",
      "Momma Bear collection",
      "Tinker closes Branchworks",
    ],
    checkpoints: [
      "Experiment paths are separated",
      "Build rails are named",
      "Collection notes are ready",
    ],
    boundary:
      "Experiment shell only. It does not execute builds, connect accounts, spend, or launch.",
  },
  {
    id: "heavy-crown",
    chapter: 9,
    title: "Heavy Crown",
    purpose: "Prepare final prototype packaging, review, and handoff materials.",
    parts: [
      "Weaver opens Crown",
      "Grandpa Bears: Byte, Bubba, Boomer",
      "Bones returns / on-call skeleton check",
      "Squirrel QA Session",
      "Individual Lantern Final Reviews",
      "Anteater / Ant Gate",
      "Weaver Final Package",
      "Shield Final Boundary Pass",
      "Weaver closes Crown",
    ],
    checkpoints: [
      "Final package slots exist",
      "Review lanes are listed",
      "Shield boundary pass is parked",
    ],
    boundary:
      "Final-review shell only. It does not approve production release, public launch, or support.",
  },
  {
    id: "clean-sweep",
    chapter: 10,
    title: "Clean Sweep",
    purpose: "Run the Ghost-style cleanup and scenario review before operations.",
    parts: ["Ghost"],
    checkpoints: [
      "Scenario review slot is ready",
      "Loose risks are captured",
      "Pass or hold decision can be added",
    ],
    boundary:
      "Simulation shell only. It does not run browser automation, fix code, deploy, or approve release.",
  },
  {
    id: "nest-level",
    chapter: 11,
    title: "Nest Level",
    purpose: "Create the project home and readiness view for live operations.",
    parts: [
      "Ward opens Nest",
      "Ward Health Profile",
      "Boomer",
      "Helper Routes",
      "Ward closes Nest",
    ],
    checkpoints: [
      "Health profile slot exists",
      "Helper routes are parked",
      "Operations handoff can be written",
    ],
    boundary:
      "Operations-readiness shell only. It does not activate support, monitoring, cron, or customer promises.",
  },
  {
    id: "seed-level",
    chapter: 12,
    title: "Seed Level",
    purpose: "Prepare launch, growth, and planting decisions without taking public action.",
    parts: [
      "Bloom opens Seed",
      "Seed Sorting",
      "Senior Seeds",
      "Seed Admin Page",
      "Owner Planting Decision",
      "Bloom closes Seed",
    ],
    checkpoints: [
      "Launch paths are parked",
      "Owner planting decision is visible",
      "Seed admin slot is ready",
    ],
    boundary:
      "Launch-planning shell only. It does not post, advertise, spend, email, deploy, or promise customers anything.",
  },
  {
    id: "future-13",
    chapter: 13,
    title: "Future Chapter 13",
    purpose: "Reserved for the next chapter once Boss defines the final role and content.",
    parts: ["Future chapter owner"],
    checkpoints: ["Chapter name is defined", "Chapter owner is named", "Exit check is approved"],
    boundary:
      "Placeholder shell only. It does not invent final canon, activate bots, or approve launch action.",
  },
];

const LEGACY_CHAPTER_ID_ALIASES: Record<string, string> = {
  "future-chapter-12": "future-13",
  "trunk-level": "trunk-ascent",
  "the-clearing": "the-name",
  "canopy-level": "canopy-foundation",
  "crown-level": "heavy-crown",
  "the-sweep": "clean-sweep",
};

export function chapterTemplateById(id: string) {
  const canonicalId = LEGACY_CHAPTER_ID_ALIASES[id] ?? id;
  return TREEHOUSE_CHAPTER_TEMPLATES.find((chapter) => chapter.id === canonicalId);
}

function normalizeChapterText(value: string) {
  return value
    .toLowerCase()
    .replace(/^the\s+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function chapterTemplateFromText(value?: string) {
  const input = value?.trim();
  if (!input) return undefined;

  const normalizedInput = normalizeChapterText(input);
  const slugInput = normalizedInput.replaceAll(" ", "-");
  const aliasedTemplate = chapterTemplateById(LEGACY_CHAPTER_ID_ALIASES[input] ?? slugInput);
  if (aliasedTemplate) return aliasedTemplate;

  return TREEHOUSE_CHAPTER_TEMPLATES.find((chapter) => {
    const normalizedTitle = normalizeChapterText(chapter.title);
    const normalizedLabel = normalizeChapterText(chapterTemplateLabel(chapter.id));
    const normalizedId = normalizeChapterText(chapter.id);

    return (
      input === chapter.id ||
      slugInput === chapter.id ||
      normalizedInput === normalizedId ||
      normalizedInput.includes(normalizedTitle) ||
      normalizedInput.includes(normalizedLabel) ||
      new RegExp(`\\bchapter\\s*${chapter.chapter}\\b`, "i").test(input)
    );
  });
}

export function currentChapterTemplateForIdea(input: {
  stage?: string;
  nextAction?: string;
  currentChapterId?: string;
}) {
  return (
    chapterTemplateFromText(input.currentChapterId) ??
    chapterTemplateFromText(input.nextAction) ??
    (input.stage === "paid-creation" ? TREEHOUSE_CHAPTER_TEMPLATES[0] : undefined)
  );
}

export function nextChapterTemplate(id: string) {
  const canonicalId = LEGACY_CHAPTER_ID_ALIASES[id] ?? id;
  const index = TREEHOUSE_CHAPTER_TEMPLATES.findIndex((chapter) => chapter.id === canonicalId);
  if (index < 0) return TREEHOUSE_CHAPTER_TEMPLATES[0];
  return TREEHOUSE_CHAPTER_TEMPLATES[index + 1];
}

export function chapterTemplateLabel(id: string) {
  const chapter = chapterTemplateById(id) ?? TREEHOUSE_CHAPTER_TEMPLATES[0];
  return `Chapter ${chapter.chapter}: ${chapter.title}`;
}

export function chapterTemplateNextAction(id: string) {
  return `Open ${chapterTemplateLabel(id)}.`;
}

export function canonicalChapterNextActionForIdea(input: {
  stage?: string;
  nextAction?: string;
  currentChapterId?: string;
}) {
  const chapter = currentChapterTemplateForIdea(input);
  return chapter ? chapterTemplateNextAction(chapter.id) : undefined;
}

export function primaryChapterGuideName(chapter: TreehouseChapterTemplate) {
  const firstPart = chapter.parts[0] ?? "Demo Guide";
  return firstPart
    .replace(/\s+(opens|returns|collection)\b.*$/i, "")
    .split(":")[0]
    .trim();
}

export function isRootRoomTemplateIdea(input: {
  stage?: string;
  nextAction?: string;
  currentChapterId?: string;
}) {
  return Boolean(currentChapterTemplateForIdea(input));
}
