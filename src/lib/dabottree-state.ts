// Local mock state for Lightbulb Ideas. Replace with real persistence later.
export type IdeaStage =
  | "lightbulb"
  | "pre-clarity"
  | "paid-creation"
  | "clean-packet"
  | "operating-path";

export type LightbulbIdea = {
  id: string;
  title: string;
  messy: string;
  shelfReadiness: number; // 0-100 organic readiness
  updatedAt: number;
  stage: IdeaStage;
  nextAction: string;
  audience?: string;
  industry?: string;
  ideaType?: string;
  description?: string;
  signals?: {
    shape?: string;
    whoItHelps?: string;
    supportNeed?: string;
    riskWatch?: string;
  };
};

export const stageLabels: Record<IdeaStage, string> = {
  lightbulb: "Idea Shelf",
  "pre-clarity": "Library",
  "paid-creation": "Paid Creation",
  "clean-packet": "Clean Packet",
  "operating-path": "Operating Path",
};

export const IDEA_SHELF_NEXT_ACTION =
  "Right now is a great opportunity to add as many notes as possible. Click Add More Notes below and collect as much information as you can before you move this idea to the next step and press Let's Build.";

export const LIBRARY_STAGE_NEXT_ACTION =
  "Answer personalized Clarity questions before creating the project brief.";

const STABLE_SEED_NOW = Date.UTC(2026, 5, 7, 12, 0, 0);

export const seedIdeas: LightbulbIdea[] = [
  {
    id: "idea-1",
    title: "Neighborhood tool library",
    messy:
      "everyone on my block has the same drill collecting dust… could we share? maybe a simple tool, shared shelf, or shed?",
    shelfReadiness: 28,
    updatedAt: STABLE_SEED_NOW - 1000 * 60 * 60 * 6,
    stage: "lightbulb",
    nextAction: IDEA_SHELF_NEXT_ACTION,
    audience: "Local community members",
    industry: "Community tool sharing",
    ideaType: "App",
    description:
      "A neighborhood tool library for sharing underused tools among people on the same block.",
  },
  {
    id: "idea-2",
    title: "Voice notes -> weekly review",
    messy:
      "I ramble into my phone. want something that listens all week and hands me a clean monday plan.",
    shelfReadiness: 54,
    updatedAt: STABLE_SEED_NOW - 1000 * 60 * 60 * 26,
    stage: "pre-clarity",
    nextAction: LIBRARY_STAGE_NEXT_ACTION,

    signals: {
      shape: "weekly digest tool",
      whoItHelps: "busy solo operators",
      supportNeed: "light hosting",
      riskWatch: "privacy of recordings",
    },
  },
  {
    id: "idea-3",
    title: "Sunday family recipe box",
    messy:
      "want a place to keep grandma's recipes with photos and audio of her telling the stories.",
    shelfReadiness: 15,
    updatedAt: STABLE_SEED_NOW - 1000 * 60 * 60 * 50,
    stage: "lightbulb",
    nextAction: IDEA_SHELF_NEXT_ACTION,
  },
  {
    id: "idea-4",
    title: "Calm-down corner for classrooms",
    messy: "teachers need a tiny kit / playlist / cards for kids who get overwhelmed mid-lesson.",
    shelfReadiness: 22,
    updatedAt: STABLE_SEED_NOW - 1000 * 60 * 60 * 72,
    stage: "lightbulb",
    nextAction: IDEA_SHELF_NEXT_ACTION,
  },
];
