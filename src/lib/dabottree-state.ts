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
  signals?: {
    shape?: string;
    whoItHelps?: string;
    supportNeed?: string;
    riskWatch?: string;
  };
};

export const stageLabels: Record<IdeaStage, string> = {
  lightbulb: "New Idea",
  "pre-clarity": "Building",
  "paid-creation": "Paid Creation",
  "clean-packet": "Clean Packet",
  "operating-path": "Operating Path",
};

export const seedIdeas: LightbulbIdea[] = [
  {
    id: "idea-1",
    title: "Neighborhood tool library",
    messy:
      "everyone on my block has the same drill collecting dust… could we share? maybe an app or just a shed?",
    shelfReadiness: 28,
    updatedAt: Date.now() - 1000 * 60 * 60 * 6,
    stage: "lightbulb",
    nextAction: "Add more notes & start building",
  },
  {
    id: "idea-2",
    title: "Voice notes -> weekly review",
    messy:
      "I ramble into my phone. want something that listens all week and hands me a clean monday plan.",
    shelfReadiness: 54,
    updatedAt: Date.now() - 1000 * 60 * 60 * 26,
    stage: "pre-clarity",
    nextAction: "Gather info, then move to Clarity",

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
    updatedAt: Date.now() - 1000 * 60 * 60 * 50,
    stage: "lightbulb",
    nextAction: "Add more notes & start building",
  },
  {
    id: "idea-4",
    title: "Calm-down corner for classrooms",
    messy:
      "teachers need a tiny kit / playlist / cards for kids who get overwhelmed mid-lesson.",
    shelfReadiness: 22,
    updatedAt: Date.now() - 1000 * 60 * 60 * 72,
    stage: "lightbulb",
    nextAction: "Add more notes & start building",
  },
];

