type NamingRule = {
  match: RegExp;
  name: string | ((text: string, functionName: string) => string);
};

const SUBJECT_RULES: NamingRule[] = [
  {
    match:
      /\b(real\s*estate|realtor|realty|property|properties|home\s+listing|house\s+listing|listing\s+agent|homebuyer|home\s+buyer)\b/i,
    name: "Real Estate",
  },
  {
    match:
      /\b(robotic\s+(?:lawn\s+)?mower|robot\s+mower|lawn\s+robot|robotic\s+lawn|mow(?:ing|er)?|lawn\s+care)\b/i,
    name: (_text, functionName) => {
      if (/booking/i.test(functionName)) return "Mower";
      if (/dispatch/i.test(functionName)) return "Lawn Robot";
      if (/scheduler/i.test(functionName)) return "Robotic Lawn";
      return "Lawn Mower";
    },
  },
  { match: /\bappointment|booking|reservation\b/i, name: "Appointment" },
  { match: /\bmeal|menu|dinner|lunch|breakfast\b/i, name: "Meal" },
  { match: /\bclient\s+intake|customer\s+intake|intake\s+form\b/i, name: "Client Intake" },
  { match: /\b(recipe|cookbook|kitchen|family recipe|recipe shelf)\b/i, name: "Recipe Shelf" },
  {
    match:
      /\b(construction|jobsite|job site|crew|contractor|foreman|worker manager|construction worker|job address|job location|schedule update)\b/i,
    name: "Construction Crew",
  },
  { match: /\b(pet|pets|dog|dogs|cat|cats|animal|animals)\b/i, name: "Pet Care" },
  { match: /\bwedding\b/i, name: "Wedding" },
  {
    match: /\b(photo|photos|photographer|photography|camera|photoshop|editing|raw-vs-edited)\b/i,
    name: "Photo",
  },
  { match: /\bclassroom|teacher|student|school\b/i, name: "Classroom" },
  { match: /\bplant|garden\b/i, name: "Garden" },
  { match: /\bworkout|fitness|gym\b/i, name: "Fitness" },
  { match: /\bstory|bedtime\b/i, name: "Storybook" },
  { match: /\bneighborhood|community\b/i, name: "Neighborhood" },
];

const FUNCTION_RULES: NamingRule[] = [
  {
    match:
      /(?=.*\b(real\s*estate|realtor|realty|property|properties|home\s+listing|house\s+listing|listing\s+agent|homebuyer|home\s+buyer)\b)(?=.*\b(virtual\s+staging|staging|360|three\s*sixty|photo|photos|photographer|photography|video|tour|walkthrough|media|listing\s+visuals)\b)/i,
    name: "Media Tool",
  },
  { match: /\bbooking\s+service\b/i, name: "Booking Service" },
  { match: /\b(book|booking|reservation|appointment)\b/i, name: "Booking App" },
  {
    match:
      /\b(dispatch|send\s+(?:out|to)|route|assign|assignment|give(?:s)? (?:them )?(?:the )?job|job address|job location|crew location)\b/i,
    name: "Dispatch",
  },
  { match: /\bschedul/i, name: "Scheduler" },
  { match: /\btrack|tracking\b/i, name: "Tracker" },
  { match: /\b(plan|planning|planner)\b/i, name: "Planner" },
  { match: /\bmarketplace|market\b/i, name: "Marketplace" },
  { match: /\bbuilder|build\b/i, name: "Builder" },
  { match: /\bjournal|diary\b/i, name: "Journal" },
  { match: /\bdashboard|reporting|analytics\b/i, name: "Dashboard" },
  { match: /\bproof|approval|approve|review\b/i, name: "Approval App" },
  { match: /\blearn|training|course|teach|lesson\b/i, name: "Learning Site" },
  { match: /\breminder|remind\b/i, name: "Reminders" },
  { match: /\bboard\b/i, name: "Board" },
  { match: /\bsite|website\b/i, name: "Site" },
  { match: /\btool\b/i, name: "Tool" },
  { match: /\bapp\b/i, name: "App" },
];

const DIRECT_TITLE_RULES: NamingRule[] = [
  {
    match: /\b(ai\s+)?bot(?:s)?\b/i,
    name: (text) => {
      if (/\b(workflow|workflows|organize|organizing|library|ideas?)\b/i.test(text)) {
        return "Bot Workflow Hub";
      }
      return "Bot Idea Hub";
    },
  },
  {
    match:
      /\b(save|saved|saving|capture|capturing|store|storing|organize|organizing)\b(?=.*\bideas?\b)/i,
    name: "Idea Shelf",
  },
  {
    match: /\bcharacter(?:s)?\b(?=.*\b(workflow|workflows|map|system)\b)/i,
    name: "Character Workflow Map",
  },
  {
    match: /\bcharacter(?:s)?\b(?=.*\b(story|stories|game|games)\b)/i,
    name: "Character Story Game",
  },
];

const FILLER_WORDS = new Set([
  "a",
  "an",
  "the",
  "to",
  "for",
  "of",
  "and",
  "or",
  "with",
  "this",
  "that",
  "where",
  "own",
  "my",
  "our",
  "we",
  "you",
  "they",
  "it",
  "is",
  "are",
  "have",
  "has",
  "having",
  "want",
  "wants",
  "need",
  "needs",
  "new",
  "project",
  "program",
  "site",
  "website",
  "app",
  "tool",
  "build",
  "make",
  "using",
  "help",
  "helps",
  "user",
  "users",
  "someone",
  "people",
  "person",
  "about",
  "business",
  "create",
  "created",
  "making",
  "thing",
  "things",
  "kind",
  "sort",
]);

function cleanText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function stripPromptLead(text: string): string {
  return text
    .replace(
      /^(?:i\s+)?(?:want|wanna|would like|need|am trying)\s+to\s+(?:make|build|create|start|design)\s+/i,
      "",
    )
    .replace(
      /^(?:an?|the)?\s*(?:app|tool|website|platform|business|idea|project)\s+(?:that|for|about)\s+/i,
      "",
    )
    .replace(/^(?:business\s+)?idea\s+(?:that|for|about)\s+/i, "")
    .trim();
}

function titleCase(s: string) {
  return s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

function pickRuleName(rules: NamingRule[], text: string, functionName: string): string | undefined {
  const rule = rules.find((candidate) => candidate.match.test(text));
  if (!rule) return undefined;
  return typeof rule.name === "function" ? rule.name(text, functionName) : rule.name;
}

function isUsableIdeaType(value: string | undefined): boolean {
  return !!value && !/^(undecided|unknown|new idea|project type|idea type)$/i.test(value.trim());
}

function fallbackSubject(text: string): string {
  const usefulText = stripPromptLead(text) || text;
  const words = usefulText
    .split(/\s+/)
    .map((word) => word.replace(/^[^\w]+|[^\w]+$/g, "").toLowerCase())
    .filter((word) => word.length > 2 && !FILLER_WORDS.has(word));

  const scored = new Map<string, number>();
  for (let i = 0; i < words.length; i += 1) {
    for (let size = 1; size <= 3; size += 1) {
      const phraseWords = words.slice(i, i + size);
      if (phraseWords.length !== size) continue;
      if (phraseWords.every((word) => FILLER_WORDS.has(word))) continue;

      const phrase = phraseWords.join(" ");
      const phraseScore = size * 2 + (words.length - i) / Math.max(words.length, 1);
      scored.set(phrase, (scored.get(phrase) ?? 0) + phraseScore);
    }
  }

  const best = Array.from(scored.entries())
    .filter(([phrase]) => phrase.split(/\s+/).length <= 3)
    .sort((a, b) => b[1] - a[1] || b[0].split(/\s+/).length - a[0].split(/\s+/).length)[0]?.[0];

  return best ? titleCase(best) : "Working";
}

function trimToFourWords(title: string): string {
  return title.split(/\s+/).filter(Boolean).slice(0, 4).join(" ");
}

export function generateWorkingProjectTitle(text: string, ideaType?: string): string {
  const clean = cleanText(text);
  if (!clean) return isUsableIdeaType(ideaType) ? `${ideaType} idea` : "Untitled idea";

  if (
    /\b(qr|code|scan)\b/i.test(clean) &&
    /\b(t-?shirt|tee|shirt)\b/i.test(clean) &&
    /\b(coupon|reward|credit|discount)\b/i.test(clean)
  ) {
    return "QR Tee Rewards";
  }

  const directTitle = pickRuleName(DIRECT_TITLE_RULES, clean, "");
  if (directTitle) return trimToFourWords(directTitle);

  if (
    /\bwedding\b/i.test(clean) &&
    /\b(photo|photos|photographer|photography|editing|approval|proof)\b/i.test(clean)
  ) {
    if (/\blearn|training|course|teach|lesson\b/i.test(clean)) {
      return "Wedding Photographer Learning Site";
    }
    if (/\bproof|approval|approve|review\b/i.test(clean)) return "Wedding Photo Approval App";
    return "Wedding Photo App";
  }

  const functionName =
    pickRuleName(FUNCTION_RULES, clean, "") ??
    (isUsableIdeaType(ideaType) ? titleCase(ideaType!.trim()) : "Tool");
  const subject = pickRuleName(SUBJECT_RULES, clean, functionName) ?? fallbackSubject(clean);
  return trimToFourWords(`${subject} ${functionName}`);
}

export function shouldCleanWorkingProjectTitle(title: string): boolean {
  const t = title.trim();
  const fillerStart = /^(?:where|own|my|our|we|new|have|might|could|program\s*\/\s*site)\b/i;
  const placeholder =
    /^a\s+(program|site|website|app|tool)\b/i.test(t) ||
    /^an\s+(app|tool|website)\b/i.test(t) ||
    /^(?:have\s+)?new (?:app|tool|idea|project|idea app)\b/i.test(t) ||
    /^untitled idea$/i.test(t);
  const qrFragments =
    /\b(shirt|tee|tshirt|t-shirt)\b/i.test(t) && /\b(qr|code|scan|coupon|credit)\b/i.test(t);
  return fillerStart.test(t) || placeholder || qrFragments || t.length > 54;
}
