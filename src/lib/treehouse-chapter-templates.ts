export type TreehouseChapterTemplate = {
  id: string;
  chapter: number;
  title: string;
  parts: string[];
};

export const TREEHOUSE_CHAPTER_TEMPLATES: TreehouseChapterTemplate[] = [
  {
    id: "root-room",
    chapter: 2,
    title: "The Root Room",
    parts: ["Echo", "Shield", "Ledger", "Chief"],
  },
  {
    id: "trunk-level",
    chapter: 3,
    title: "Trunk Level",
    parts: ["Luma", "Bloom", "Vault", "Compass"],
  },
  {
    id: "the-clearing",
    chapter: 4,
    title: "The Clearing",
    parts: ["Moniker"],
  },
  {
    id: "canopy-level",
    chapter: 5,
    title: "Canopy Level",
    parts: [
      "Rook opens Canopy",
      "Bones",
      "Squirrel Session",
      "Individual Lantern Pages",
      "Ledger",
      "Rook closes Canopy",
    ],
  },
  {
    id: "wind-tunnel",
    chapter: 6,
    title: "Wind Tunnel",
    parts: ["Gauge", "Shield", "Stagehand"],
  },
  {
    id: "branchworks-level",
    chapter: 7,
    title: "Branchworks Level",
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
  },
  {
    id: "crown-level",
    chapter: 8,
    title: "Crown Level",
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
  },
  {
    id: "the-sweep",
    chapter: 9,
    title: "The Sweep",
    parts: ["Ghost"],
  },
  {
    id: "nest-level",
    chapter: 10,
    title: "Nest Level",
    parts: ["Ward opens Nest", "Ward Health Profile", "Boomer", "Helper Routes", "Ward closes Nest"],
  },
  {
    id: "seed-level",
    chapter: 11,
    title: "Seed Level",
    parts: [
      "Bloom opens Seed",
      "Seed Sorting",
      "Senior Seeds",
      "Seed Admin Page",
      "Owner Planting Decision",
      "Bloom closes Seed",
    ],
  },
];

export function chapterTemplateById(id: string) {
  return TREEHOUSE_CHAPTER_TEMPLATES.find((chapter) => chapter.id === id);
}

export function isRootRoomTemplateIdea(input: { stage?: string; nextAction?: string }) {
  return input.stage === "paid-creation" || /root room/i.test(input.nextAction ?? "");
}
