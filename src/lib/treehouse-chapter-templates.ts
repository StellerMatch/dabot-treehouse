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
    id: "root-room",
    chapter: 2,
    title: "The Root Room",
    purpose: "Set the project baseline before deeper research, design, money, or build work begins.",
    parts: ["Echo", "Shield", "Ledger", "Chief"],
    checkpoints: ["Original idea is preserved", "Safety flags are named", "Baseline record is ready"],
    boundary: "Template only. No bot flow, notebook report, deployment, or outside action runs from here yet.",
  },
  {
    id: "trunk-level",
    chapter: 3,
    title: "Trunk Level",
    purpose: "Turn the baseline into a deeper research and direction packet.",
    parts: ["Luma", "Bloom", "Vault", "Compass"],
    checkpoints: ["Design questions are visible", "Audience and growth notes are parked", "Money risk is named"],
    boundary: "Research shell only. It does not approve building, spending, launch, or automation.",
  },
  {
    id: "the-clearing",
    chapter: 4,
    title: "The Clearing",
    purpose: "Name and frame the project clearly enough that later chapters know what they are building.",
    parts: ["Moniker"],
    checkpoints: ["Working name is captured", "Plain-English promise is drafted", "Confusing labels are parked"],
    boundary: "Naming shell only. It does not lock the final brand, public copy, or launch name.",
  },
  {
    id: "canopy-level",
    chapter: 5,
    title: "Canopy Level",
    purpose: "Build the clean foundation packet before experiments or prototype work begin.",
    parts: [
      "Rook opens Canopy",
      "Bones",
      "Squirrel Session",
      "Individual Lantern Pages",
      "Ledger",
      "Rook closes Canopy",
    ],
    checkpoints: ["Foundation packet is readable", "Missing structure is listed", "Closeout handoff is ready"],
    boundary: "Foundation shell only. It does not approve prototype work, deployment, spending, or public launch.",
  },
  {
    id: "wind-tunnel",
    chapter: 6,
    title: "Wind Tunnel",
    purpose: "Stress-test whether the project is strong enough to move forward.",
    parts: ["Gauge", "Shield", "Stagehand"],
    checkpoints: ["Weak points are named", "Safety pass is visible", "Next-stage recommendation is clear"],
    boundary: "Validation shell only. It does not run tests, submit prompts, deploy, or make final decisions.",
  },
  {
    id: "branchworks-level",
    chapter: 7,
    title: "Branchworks Level",
    purpose: "Shape experiment directions and early build rails without turning them into a live product yet.",
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
    checkpoints: ["Experiment paths are separated", "Build rails are named", "Collection notes are ready"],
    boundary: "Experiment shell only. It does not execute builds, connect accounts, spend, or launch.",
  },
  {
    id: "crown-level",
    chapter: 8,
    title: "Crown Level",
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
    checkpoints: ["Final package slots exist", "Review lanes are listed", "Shield boundary pass is parked"],
    boundary: "Final-review shell only. It does not approve production release, public launch, or support.",
  },
  {
    id: "the-sweep",
    chapter: 9,
    title: "The Sweep",
    purpose: "Run the Ghost-style cleanup and scenario review before operations.",
    parts: ["Ghost"],
    checkpoints: ["Scenario review slot is ready", "Loose risks are captured", "Pass or hold decision can be added"],
    boundary: "Simulation shell only. It does not run browser automation, fix code, deploy, or approve release.",
  },
  {
    id: "nest-level",
    chapter: 10,
    title: "Nest Level",
    purpose: "Create the project home and readiness view for live operations.",
    parts: ["Ward opens Nest", "Ward Health Profile", "Boomer", "Helper Routes", "Ward closes Nest"],
    checkpoints: ["Health profile slot exists", "Helper routes are parked", "Operations handoff can be written"],
    boundary: "Operations-readiness shell only. It does not activate support, monitoring, cron, or customer promises.",
  },
  {
    id: "seed-level",
    chapter: 11,
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
    checkpoints: ["Launch paths are parked", "Owner planting decision is visible", "Seed admin slot is ready"],
    boundary: "Launch-planning shell only. It does not post, advertise, spend, email, deploy, or promise customers anything.",
  },
  {
    id: "future-chapter-12",
    chapter: 12,
    title: "Future Chapter 12",
    purpose: "Reserved for the next chapter once Boss defines the final role and content.",
    parts: ["Future chapter owner"],
    checkpoints: ["Chapter name is defined", "Chapter owner is named", "Exit check is approved"],
    boundary: "Placeholder shell only. It does not invent final canon, activate bots, or approve launch action.",
  },
];

export function chapterTemplateById(id: string) {
  return TREEHOUSE_CHAPTER_TEMPLATES.find((chapter) => chapter.id === id);
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
  const index = TREEHOUSE_CHAPTER_TEMPLATES.findIndex((chapter) => chapter.id === id);
  if (index < 0) return TREEHOUSE_CHAPTER_TEMPLATES[0];
  return TREEHOUSE_CHAPTER_TEMPLATES[index + 1];
}

export function chapterTemplateLabel(id: string) {
  const chapter = chapterTemplateById(id) ?? TREEHOUSE_CHAPTER_TEMPLATES[0];
  return `Chapter ${chapter.chapter}: ${chapter.title}`;
}

export function primaryChapterGuideName(chapter: TreehouseChapterTemplate) {
  const firstPart = chapter.parts[0] ?? "Demo Guide";
  return firstPart.replace(/\s+(opens|returns|collection)\b.*$/i, "").split(":")[0].trim();
}

export function isRootRoomTemplateIdea(input: {
  stage?: string;
  nextAction?: string;
  currentChapterId?: string;
}) {
  return Boolean(currentChapterTemplateForIdea(input));
}
