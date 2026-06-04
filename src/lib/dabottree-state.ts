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
  lightbulb: "Lightbulb",
  "pre-clarity": "Pre-Clarity",
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
    nextAction: "Move to pre-Clarity",
  },
  {
    id: "idea-2",
    title: "Voice notes -> weekly review",
    messy:
      "I ramble into my phone. want something that listens all week and hands me a clean monday plan.",
    shelfReadiness: 54,
    updatedAt: Date.now() - 1000 * 60 * 60 * 26,
    stage: "pre-clarity",
    nextAction: "Open preview",
    signals: {
      shape: "weekly digest tool",
      whoItHelps: "busy solo operators",
      supportNeed: "light hosting",
      riskWatch: "privacy of recordings",
    },
  },
];
