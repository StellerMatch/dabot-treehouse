export const INTAKE_FOLDER_ORDER = [
  "core-idea",
  "clarity",
  "problem",
  "audience",
  "features",
  "workflow",
  "design",
  "business",
  "concerns",
] as const;

export type IntakeFolderKey = (typeof INTAKE_FOLDER_ORDER)[number];

export const intakeFolderLabels: Record<IntakeFolderKey, string> = {
  "core-idea": "Core Idea",
  clarity: "Clarity",
  problem: "Problem",
  audience: "Audience",
  features: "Features",
  workflow: "Workflow",
  design: "Design",
  business: "Business",
  concerns: "Concerns",
};

export const intakeFolderMissing: Record<IntakeFolderKey, string> = {
  "core-idea": "Missing: a one-line summary of what this is and its main purpose.",
  clarity: "Missing: an overall readout of what's understood and where it's still fuzzy.",
  problem: "Missing: the pain point, need, or opportunity this exists to address.",
  audience: "Missing: who exactly this is for and the role they play.",
  features: "Missing: tools, screens, actions, and capabilities this needs.",
  workflow: "Missing: how the process moves from step to step.",
  design: "Missing: layout, visual feel, and interaction style.",
  business: "Missing: pricing, buyer logic, and revenue model.",
  concerns: "Missing: things to watch, validate, or revisit later.",
};

const SORTABLE_FOLDERS: IntakeFolderKey[] = [
  "core-idea",
  "problem",
  "audience",
  "features",
  "workflow",
  "design",
  "business",
  "concerns",
];

const FOLDER_PATTERNS: Record<IntakeFolderKey, RegExp> = {
  "core-idea":
    /\b(this (?:app|tool|product|project|platform|idea|system)|is an? (?:app|tool|platform|product|system)|i want to (?:build|make|create)|main purpose|concept is|core idea|idea is|in short|basically|essentially|the goal is)\b/i,
  clarity: /\b(clarity|readout|understood|direction|fuzzy|90%|so far|overall|summary)\b/i,
  problem:
    /\b(problem|pain|painful|need|opportunity|solve[sd]?|struggle|frustrat|because|wastes? (?:time|hours)|takes? too long|messy|hard to|difficult to|confusing|broken|missing tool|gap|currently (?:no|nothing|hard)|don't have|doesn't exist|can't)\b/i,
  audience:
    /\b(creator|maker|manager|crew|worker|employee|user|users|customer|buyer|audience|people|team|role|supervisor|owner|client|contractor|operator|staff|lead|foreman|persona|target|built for|designed for|who (?:it'?s|this is) for)\b/i,
  features:
    /\b(feature|function|ability|capabilit|screen|button|form|field|input|output|allows?|lets? (?:you|them|users?|me)|should (?:have|include|show|ask|save|sort|create|generate|track)|needs? to (?:have|include|show|ask|save|sort|create|generate|track)|tracks?|notif|integrat|api|drag|drop|export|import|tagging|search|filter|folder(?:s|-based)?|organize|automation|reminder|dashboard|template|question(?:s)?|upload|photo|camera)\b/i,
  workflow:
    /\b(workflow|process|step(?:s)?|flow|stage|schedul|assign|sequence|pipeline|handoff|next step|then|after|before|once|first .* then|move(?:s)? (?:to|through)|journey|onboard|approval|approve|human review|automatically)\b/i,
  design:
    /\b(design|layout|ui|ux|look|feel|color|style|interface|interaction|tap|swipe|view|visual|board|usabilit|simple|clean|tone|aesthetic|responsive|mobile|desktop|header|logo|sticky note|post-it|desired feeling)\b/i,
  business:
    /\b(price|pricing|cost|revenue|subscri|payment|monetiz|sell|\$|buyer|business model|free tier|tier|charge|paid|willingness to pay|market value|margin|saves? (?:time|money|hours)|valuable|worth (?:paying|money)|commercial|package)\b/i,
  concerns:
    /\b(avoid|risk|fail|legal|compli|privacy|out of scope|boundary|guardrail|concern|worry|danger|liabil|not sure|don't know|should not|must not|do not|watch|validate|fix later|assumption|weak spot|edge case|later phase|might break|unclear|fuzzy)\b/i,
};

function splitMeaningfulLines(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/(?<=[.!?])\s+|\n+|(?:^|\s)[•·]\s+|(?:^|\s)-\s+/g)
    .map((line) => line.replace(/^[-•·\s]+/, "").trim())
    .filter((line) => line.length >= 6);
}

function splitClauses(line: string): string[] {
  return line
    .split(
      /\s*(?:;|,(?=\s+(?:and|but|so|then|after|before|once)\b)|\s+(?:so that|so|because|but|and then|and also|while|whereas|in order to)\s+)\s*/i,
    )
    .map((clause) => clause.replace(/^[,;\s]+|[,;\s]+$/g, "").trim())
    .filter((clause) => clause.length >= 6);
}

function pushUnique(out: Record<IntakeFolderKey, string[]>, folder: IntakeFolderKey, value: string) {
  const cleaned = value.replace(/^[-•·\s]+/, "").trim();
  if (cleaned.length < 3) return;
  if (!out[folder].some((existing) => existing.toLowerCase() === cleaned.toLowerCase())) {
    out[folder].push(cleaned);
  }
}

function bestFolderFor(value: string): IntakeFolderKey | null {
  const matches = SORTABLE_FOLDERS.filter((folder) => FOLDER_PATTERNS[folder].test(value));
  if (matches.length === 0) return null;
  const priority: IntakeFolderKey[] = [
    "problem",
    "audience",
    "features",
    "workflow",
    "design",
    "business",
    "concerns",
    "core-idea",
  ];
  return priority.find((folder) => matches.includes(folder)) ?? matches[0];
}

export function parseIntakeIntoFolderBuckets(text: string): Record<IntakeFolderKey, string[]> {
  const out = INTAKE_FOLDER_ORDER.reduce(
    (acc, folder) => ({ ...acc, [folder]: [] }),
    {} as Record<IntakeFolderKey, string[]>,
  );
  const lines = splitMeaningfulLines(text);
  const firstLine = lines[0];
  if (firstLine) pushUnique(out, "core-idea", firstLine);

  for (const line of lines) {
    const clauses = splitClauses(line);
    const units = clauses.length > 1 ? clauses : [line];
    for (const unit of units) {
      const folder = bestFolderFor(unit);
      if (folder) pushUnique(out, folder, unit);
    }
  }

  const covered = SORTABLE_FOLDERS.filter((folder) => out[folder].length > 0);
  const missing = SORTABLE_FOLDERS.filter((folder) => out[folder].length === 0);
  out.clarity = [
    `Captured ${lines.length || 1} intake note${lines.length === 1 ? "" : "s"} and sorted each useful piece into its strongest folder.`,
    covered.length
      ? `Starting signals in: ${covered.map((folder) => intakeFolderLabels[folder]).join(", ")}.`
      : "No folder has a strong signal yet.",
    missing.length
      ? `Still fuzzy on: ${missing.map((folder) => intakeFolderLabels[folder]).join(", ")}.`
      : "Every main folder has at least one starting note.",
  ];

  return out;
}

export function bodyForIntakeFolder(folder: IntakeFolderKey, items: string[]): string {
  if (!items.length) return intakeFolderMissing[folder];
  const heading =
    folder === "clarity"
      ? "Clarity readout:"
      : "Best-matched intake notes Clarity found for this folder:";
  return [heading, items.map((item) => (folder === "clarity" ? item : `• ${item}`)).join("\n")].join(
    "\n",
  );
}

function coreIdeaBody(rawIntake: string, items: string[]): string {
  const sections = [`Raw intake archive:\n${rawIntake.trim()}`];
  if (items.length) {
    sections.push(
      [
        "Best-matched core idea signals:",
        items.map((item) => `• ${item}`).join("\n"),
      ].join("\n"),
    );
  }
  return sections.join("\n\n");
}

export function buildIntakeFolderPosts(text: string, ts: number) {
  const buckets = parseIntakeIntoFolderBuckets(text);
  return INTAKE_FOLDER_ORDER.map((folder, index) => ({
    id: `post-${ts}-${folder}`,
    kind: "idea-notes",
    text: intakeFolderLabels[folder],
    fullText:
      folder === "core-idea"
        ? coreIdeaBody(text, buckets[folder])
        : bodyForIntakeFolder(folder, buckets[folder]),
    ts: ts - index,
    categories: [folder],
    source: "generated-folder" as const,
  }));
}
