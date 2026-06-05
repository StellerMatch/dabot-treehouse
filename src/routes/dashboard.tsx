import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  seedIdeas,
  stageLabels,
  type LightbulbIdea,
} from "@/lib/dabottree-state";
import libraryBgAsset from "@/assets/dabottree-library-bg.png.asset.json";
import claritySquirrelAsset from "@/assets/clarity-squirrel.png.asset.json";
const libraryBg = libraryBgAsset.url;
const claritySquirrel = claritySquirrelAsset.url;
import logo from "@/assets/dabottree-logo.png";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BookOpen, Paperclip, Link2, Plus, Lightbulb, ArrowRight, Pencil, User } from "lucide-react";


export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Creator Library — DaBotTree" },
      {
        name: "description",
        content:
          "Your living tree library: ideas as books on the left shelf, an open journal in the middle, a progress shelf on the right.",
      },
    ],
  }),
  component: Dashboard,
});

// ——— types ———
type CategoryKey =
  | "lightbulb"
  | "pre-clarity"
  | "clarity"
  | "market"
  | "build"
  | "design"
  | "money"
  | "risks"
  | "ready";

const categoryDefs: { key: CategoryKey; label: string; hint: string; guidance: string }[] = [
  {
    key: "lightbulb",
    label: "Idea Notes",
    hint: "Dump everything you know",
    guidance: "Add any loose thoughts, reminders, or pieces of the idea.",
  },
  {
    key: "pre-clarity",
    label: "Info Gathered",
    hint: "Files, links, context",
    guidance: "Add useful facts, details, links, examples, or background for this idea.",
  },
  {
    key: "clarity",
    label: "Clarity",
    hint: "Turn messy notes into a clear plan",
    guidance: "Talk about what is still confusing, missing, or not fully decided.",
  },
  {
    key: "market",
    label: "Audience",
    hint: "Who it's for",
    guidance: "Talk about who this idea is for and what problem it helps them with.",
  },
  {
    key: "design",
    label: "Design",
    hint: "How it looks & feels",
    guidance: "Talk about how this idea should look, feel, or be easy to use.",
  },
  {
    key: "money",
    label: "Money",
    hint: "How it sustains",
    guidance: "Talk about how this idea could make money, save money, or become worth paying for.",
  },
  {
    key: "risks",
    label: "Risks",
    hint: "What to watch out for",
    guidance: "Talk about what could go wrong, what might be hard, or what needs protection.",
  },
  {
    key: "build",
    label: "Build Plan",
    hint: "How it gets made",
    guidance: "Talk about the first steps needed to build or test this idea.",
  },
  {
    key: "ready",
    label: "Ready",
    hint: "Greenlight for project",
    guidance: "Talk about what would make this idea ready for the next stage.",
  },
];

// Soft, post-it-friendly palette keyed to each Idea Progress category.
const postItCategoryPalette: Record<
  CategoryKey | "mixed",
  { bg: string; edge: string; tape: string; chip: string; label: string }
> = {
  lightbulb:    { bg: "linear-gradient(180deg,#fef3b5 0%,#f4dd86 100%)", edge: "#b08a2a", tape: "rgba(120,80,30,0.55)", chip: "#fff6c2", label: "Idea Notes" },
  "pre-clarity":{ bg: "linear-gradient(180deg,#f6e3c0 0%,#e6c98c 100%)", edge: "#9a7128", tape: "rgba(120,80,30,0.55)", chip: "#f7e6c2", label: "Info Gathered" },
  clarity:      { bg: "linear-gradient(180deg,#e6f0d4 0%,#cfe0a8 100%)", edge: "#6f8a3a", tape: "rgba(60,80,30,0.55)",  chip: "#eaf3d6", label: "Clarity" },
  market:       { bg: "linear-gradient(180deg,#fcd9c2 0%,#f3b793 100%)", edge: "#b56738", tape: "rgba(120,60,30,0.55)", chip: "#fde0cc", label: "Audience" },
  design:       { bg: "linear-gradient(180deg,#dfe5fb 0%,#b8c4f0 100%)", edge: "#4f5fa3", tape: "rgba(40,40,90,0.5)",   chip: "#e3e8fb", label: "Design" },
  money:        { bg: "linear-gradient(180deg,#d6efd6 0%,#a8d8a8 100%)", edge: "#3f7a3f", tape: "rgba(30,80,30,0.55)",  chip: "#dcefdc", label: "Money" },
  risks:        { bg: "linear-gradient(180deg,#fbd2cf 0%,#f0a39c 100%)", edge: "#9c3a32", tape: "rgba(100,30,20,0.55)", chip: "#fcdad6", label: "Risks" },
  build:        { bg: "linear-gradient(180deg,#e0d6f0 0%,#c0adde 100%)", edge: "#6a4f9a", tape: "rgba(70,40,110,0.55)", chip: "#e6dcf2", label: "Build Plan" },
  ready:        { bg: "linear-gradient(180deg,#d2efe6 0%,#9ed6c1 100%)", edge: "#317a64", tape: "rgba(20,80,60,0.55)",  chip: "#dbf2e9", label: "Ready" },
  mixed:        { bg: "linear-gradient(180deg,#f0e6d4 0%,#d7c5a0 100%)", edge: "#7a6238", tape: "rgba(80,60,20,0.55)",  chip: "#efe4c8", label: "Mixed" },
};

const CATEGORY_KEYWORDS: Record<CategoryKey, RegExp[]> = {
  lightbulb:    [/\bidea\b/i, /\bspark\b/i, /\bthought\b/i],
  "pre-clarity":[/https?:\/\//i, /\blink\b/i, /\barticle\b/i, /\bsource\b/i, /\bfound\b/i, /\breference\b/i],
  clarity:      [/\bconfus/i, /\bunclear\b/i, /\bdecide\b/i, /\bstill\b/i, /\bmissing\b/i, /\bnot sure\b/i],
  market:       [/\baudience\b/i, /\buser/i, /\bcustomer/i, /\bpeople\b/i, /\bneighbor/i, /\bcommunit/i],
  design:       [/\bdesign\b/i, /\blook\b/i, /\bfeel\b/i, /\bui\b/i, /\bcolor\b/i, /\bstyle\b/i, /\blayout\b/i],
  money:        [/\bmoney\b/i, /\bcost/i, /\bprice/i, /\bpay/i, /\brevenue\b/i, /\bsell\b/i, /\bdonat/i, /\$\d/],
  risks:        [/\brisk/i, /\bworry\b/i, /\bconcern/i, /\bwrong\b/i, /\bfail/i, /\bhard\b/i, /\btheft\b/i, /\bdamage\b/i],
  build:        [/\bbuild\b/i, /\bstep\b/i, /\bprototype\b/i, /\btest\b/i, /\bmake\b/i, /\bplan\b/i],
  ready:        [/\bready\b/i, /\blaunch\b/i, /\bship\b/i, /\bgreenlight\b/i, /\bgo live\b/i],
};

function detectCategories(text: string, kind: PostIt["kind"]): CategoryKey[] {
  const found = new Set<CategoryKey>();
  for (const [k, regs] of Object.entries(CATEGORY_KEYWORDS) as [CategoryKey, RegExp[]][]) {
    if (regs.some((r) => r.test(text))) found.add(k);
  }
  if (found.size === 0) found.add(kind === "info-gathered" ? "pre-clarity" : "lightbulb");
  return Array.from(found);
}

function postItPaletteFor(categories: CategoryKey[] | undefined, fallback: CategoryKey) {
  const cats = categories && categories.length ? categories : [fallback];
  const key: CategoryKey | "mixed" = cats.length > 1 ? "mixed" : cats[0];
  return { palette: postItCategoryPalette[key], label: postItCategoryPalette[key].label, isMixed: cats.length > 1 };
}






type CategoryNotes = Partial<Record<CategoryKey, string>>;
type Attachment = { id: string; kind: "file" | "link" | "note"; label: string };
type PostIt = {
  id: string;
  kind: "idea-notes" | "info-gathered";
  text: string;
  ts: number;
  categories?: CategoryKey[];
};
type IdeaExtras = {
  notes: CategoryNotes;
  attachments: Attachment[];
  posts: PostIt[];
  answeredQuestions: string[];
  skippedQuestions: string[];
};

function emptyExtras(): IdeaExtras {
  return {
    notes: {},
    attachments: [],
    posts: [],
    answeredQuestions: [],
    skippedQuestions: [],
  };
}

// ——— Clarity's clarifying questions ———
type ClarityQuestion = {
  id: string;
  prompt: string;
  keywords: string[];
};
const CLARITY_QUESTIONS: ClarityQuestion[] = [
  {
    id: "problem",
    prompt: "What problem is this idea trying to solve?",
    keywords: ["problem", "solve", "pain", "struggle", "issue", "frustrat", "because", "hours", "faster than", "spend"],
  },
  {
    id: "who",
    prompt: "Who is this for? Picture one real person.",
    keywords: [" for ", "who", "people", "user", "kid", "parent", "creator", "person", "audience", "they", "manager", "worker", "employee", "crew", "team", "owner", "supervisor"],
  },
  {
    id: "why-now",
    prompt: "Why does this matter to you right now?",
    keywords: ["because", "matter", "why", "now", "want", "need", "passion", "care", "wants", "needs"],
  },
  {
    id: "look-like",
    prompt: "If it existed today, what would it look or feel like?",
    keywords: ["look", "feel", "like", "app", "site", "tool", "page", "screen", "card", "visual", "board", "dashboard", "draft", "published"],
  },
  {
    id: "first-step",
    prompt: "What's one tiny first step you could take this week?",
    keywords: ["step", "start", "first", "try", "build", "sketch", "draft", "make", "first version", "v1"],
  },
  {
    id: "first-paying-user",
    prompt: "Who is the first paying user — a small construction company owner, office manager, field supervisor, or crew lead?",
    keywords: [],
  },
  {
    id: "smallest-workflow",
    prompt: "What's the smallest first workflow — one day's schedule, one week's schedule, or assigning workers to one jobsite?",
    keywords: [],
  },
  {
    id: "v1-fields",
    prompt: "What employee information is required for version one, and what should be left out for now?",
    keywords: [],
  },
  {
    id: "auto-vs-suggest",
    prompt: "What should the app recommend automatically, and what should only be a suggestion the manager approves?",
    keywords: [],
  },
  {
    id: "publish-channel",
    prompt: "When a schedule is published, what does each employee receive — SMS, app notification, email, or a simple link?",
    keywords: [],
  },
  {
    id: "pickup-detail",
    prompt: "What pickup coordination detail matters most first — who needs a ride, who can drive, the pickup location, or the timing?",
    keywords: [],
  },
];

// Premade Clarity questions per category — used when a user clicks a category book
const CATEGORY_QUESTIONS: Record<CategoryKey, string> = {
  lightbulb: "What loose thought, reminder, or example should we save for this idea?",
  "pre-clarity": "What fact, link, example, or background detail would help explain this idea better?",
  clarity: "What part of this idea still feels unclear or undecided?",
  market: "Who is this idea mainly for, and what problem does it help them solve?",
  design: "How should this idea look, feel, or behave so people understand it quickly?",
  money: "How could this idea make money, save money, or become worth paying for?",
  risks: "What could go wrong, what might be hard, or what needs protection?",
  build: "What is the first small step to build, test, or prove this idea?",
  ready: "What would need to be true before this idea is ready for the next stage?",
};

const IDEA_TYPE_OPTIONS = [
  "Tool",
  "Service",
  "Show",
  "Game",
  "Product",
  "Community",
  "Business",
  "Story",
  "App",
  "Undecided",
] as const;

function detectAnswered(text: string, q: ClarityQuestion | undefined): boolean {
  if (!q) return false;
  const t = ` ${text.toLowerCase()} `;
  if (t.trim().length < 12) return false;
  return q.keywords.some((k) => t.includes(k));
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function pctFromCount(count: number, weights: number[] = [25, 45, 65, 80, 92, 100]) {
  if (count <= 0) return 0;
  return weights[Math.min(count - 1, weights.length - 1)];
}

function categoryStatus(value: string | undefined) {
  const v = (value ?? "").trim();
  if (!v) return { pct: 0, label: "Empty" };
  if (v.length < 30) return { pct: 25, label: "Started" };
  if (v.length < 120) return { pct: 55, label: "Growing" };
  if (v.length < 280) return { pct: 80, label: "Needs Review" };
  return { pct: 100, label: "Ready" };
}


// ——— Title generator ———
const TITLE_DOMAINS: Array<{ match: RegExp; name: string }> = [
  { match: /\b(construction|jobsite|job site|crew|contractor)\b/i, name: "Construction Crew" },
  { match: /\brecipe|cook|kitchen\b/i, name: "Family Recipe" },
  { match: /\bpet|dog|cat\b/i, name: "Pet Care" },
  { match: /\bplant|garden\b/i, name: "Garden" },
  { match: /\bworkout|fitness|gym\b/i, name: "Fitness" },
  { match: /\bclassroom|teacher|student|school\b/i, name: "Classroom" },
  { match: /\bstory|bedtime\b/i, name: "Storybook" },
  { match: /\bneighborhood|community\b/i, name: "Neighborhood" },
];
const TITLE_SUFFIXES: Array<{ match: RegExp; name: string }> = [
  { match: /\bschedul/i, name: "Scheduler" },
  { match: /\b(plan|planning)\b/i, name: "Planner" },
  { match: /\btrack/i, name: "Tracker" },
  { match: /\breminder/i, name: "Reminders" },
  { match: /\bjournal|diary\b/i, name: "Journal" },
  { match: /\bboard\b/i, name: "Board" },
  { match: /\bapp\b/i, name: "App" },
  { match: /\btool\b/i, name: "Tool" },
];
function titleCase(s: string) {
  return s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}
function generateTitle(text: string, ideaType?: string): string {
  const t = text.trim();
  if (!t) return "Untitled Idea";
  const domain = TITLE_DOMAINS.find((d) => d.match.test(t))?.name;
  const suffix =
    TITLE_SUFFIXES.find((p) => p.match.test(t))?.name ??
    (ideaType && ideaType !== "Undecided" ? ideaType : "App");
  if (domain) return `${domain} ${suffix}`;
  const stop = new Set([
    "a","an","the","to","for","of","and","or","with","this","that","want","wants","need","needs",
    "i","we","you","they","it","is","are","my","new","app","tool","build","make","using","help","helps",
  ]);
  const firstSentence = t.split(/[.!?]/)[0] ?? t;
  const words = firstSentence
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stop.has(w.toLowerCase()))
    .slice(0, 3)
    .join(" ");
  return titleCase(`${words || "New"} ${suffix}`);
}

// ——— Idea analyzer: split a first idea into category-tagged summaries ———
const ANALYZE_RULES: Array<[CategoryKey, RegExp]> = [
  ["risks", /\b(not\s+(payroll|timeclock|hr|route|autonomous)|guardrail|avoid|should\s+not|risk|worry|concern|protect|privacy|theft|damage|fail|hard)\b/i],
  ["money", /\b(price|pricing|paid|subscri|revenue|cost|charge|free|\$\d)\b/i],
  ["market", /\b(manager|worker|employee|crew|supervisor|customer|user|audience|kids?|parent|team|owner|field team|operator)\b/i],
  ["design", /\b(draft|published|board|ui|ux|interface|clean|simple|practical|look|feel|easy|control|notification|updates? to (employees|workers))\b/i],
  ["build", /\b(schedule|address|skill|availability|hours?|notif|recommend|backup|workflow|feature|version|input|enter|pickup|jobsite|build|prototype|step|plan)\b/i],
  ["clarity", /\b(helps?|so that|because|why|first version|smallest|the idea|the app|the tool)\b/i],
];
function summarizeSentences(sents: string[], maxLen = 160): string {
  if (!sents.length) return "";
  const joined = sents.join(" ").replace(/\s+/g, " ").trim();
  if (joined.length <= maxLen) return joined;
  return joined.slice(0, maxLen - 1).replace(/\s+\S*$/, "") + "…";
}
function analyzeIdea(text: string): {
  buckets: Partial<Record<CategoryKey, string[]>>;
  summaries: Array<{ category: CategoryKey; summary: string }>;
  answered: string[];
} {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
  const buckets: Partial<Record<CategoryKey, string[]>> = {};
  for (const s of sentences) {
    let added = false;
    for (const [cat, re] of ANALYZE_RULES) {
      if (re.test(s)) {
        (buckets[cat] ||= []).push(s);
        added = true;
      }
    }
    if (!added) (buckets["lightbulb"] ||= []).push(s);
  }
  // Always keep a lightbulb summary of the whole idea
  if (!buckets["lightbulb"] || buckets["lightbulb"].length === 0) {
    buckets["lightbulb"] = [sentences[0] ?? cleaned];
  }
  const order: CategoryKey[] = ["lightbulb", "clarity", "market", "build", "design", "money", "risks"];
  const summaries = order
    .filter((k) => buckets[k] && buckets[k]!.length)
    .map((k) => ({ category: k, summary: summarizeSentences(buckets[k]!) }));
  // Mark stock Clarity questions answered when the source text plainly contains them
  const lower = ` ${cleaned.toLowerCase()} `;
  const answered = CLARITY_QUESTIONS.filter(
    (q) => q.keywords.length && q.keywords.some((k) => lower.includes(k.toLowerCase())),
  ).map((q) => q.id);
  return { buckets, summaries, answered };
}





// ——— book spine palettes (rich leather tones) ———
const spinePalettes: Array<[string, string, string]> = [
  ["#5a1a14", "#8a2e22", "#c7975a"], // burgundy + gold
  ["#1c3a2a", "#2e6045", "#c7975a"], // forest + gold
  ["#3a230a", "#6b3f1a", "#d8b06a"], // tobacco + gold
  ["#1b2f4a", "#3a5c84", "#c7975a"], // ink blue + gold
  ["#4a2a05", "#7a4a12", "#e3c275"], // ochre + gold
  ["#2a1338", "#502572", "#c7975a"], // plum + gold
  ["#3d0f0a", "#7a1f10", "#d8b06a"], // oxblood + gold
];

function Dashboard() {
  const [ideas, setIdeas] = useState<LightbulbIdea[]>(seedIdeas);
  const [selectedId, setSelectedId] = useState<string>(seedIdeas[0]?.id ?? "");
  const [extras, setExtras] = useState<Record<string, IdeaExtras>>({});
  const [activeCategory, setActiveCategory] =
    useState<CategoryKey>("lightbulb");
  const [categoryAsk, setCategoryAsk] = useState<CategoryKey | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pull draft from front-page intake
  useEffect(() => {
    if (typeof window === "undefined") return;
    let draft = "";
    let draftType = "";
    try {
      draft = sessionStorage.getItem("dabottree:draftIdea") ?? "";
      draftType = sessionStorage.getItem("dabottree:draftIdeaType") ?? "";
    } catch {}
    if (draft.trim().length > 0) {
      const id = `idea-${Date.now()}`;
      const newIdea: LightbulbIdea = {
        id,
        title: draft.split(/\s+/).slice(0, 5).join(" ") || "Untitled spark",
        messy: draft,
        shelfReadiness: 18,
        updatedAt: Date.now(),
        stage: "lightbulb",
        nextAction: "Add more notes & start building",
        ideaType: draftType || undefined,
      };
      setIdeas((prev) => [newIdea, ...prev]);
      setSelectedId(id);
      try {
        sessionStorage.removeItem("dabottree:draftIdea");
        sessionStorage.removeItem("dabottree:draftIdeaType");
      } catch {}
    }
  }, []);

  const selected = useMemo(
    () => ideas.find((i) => i.id === selectedId) ?? ideas[0],
    [ideas, selectedId],
  );

  const selectedExtras: IdeaExtras = selected
    ? extras[selected.id] ?? emptyExtras()
    : emptyExtras();

  const updateSelected = (patch: Partial<LightbulbIdea>) => {
    if (!selected) return;
    setIdeas((prev) =>
      prev.map((i) =>
        i.id === selected.id ? { ...i, ...patch, updatedAt: Date.now() } : i,
      ),
    );
  };

  const updateExtras = (patch: Partial<IdeaExtras>) => {
    if (!selected) return;
    setExtras((prev) => {
      const current = prev[selected.id] ?? emptyExtras();
      return {
        ...prev,
        [selected.id]: {
          notes: { ...current.notes, ...(patch.notes ?? {}) },
          attachments: patch.attachments ?? current.attachments,
          posts: patch.posts ?? current.posts,
          answeredQuestions:
            patch.answeredQuestions ?? current.answeredQuestions,
          skippedQuestions:
            patch.skippedQuestions ?? current.skippedQuestions,
        },
      };
    });
  };

  const currentQuestion = useMemo<ClarityQuestion>(() => {
    if (categoryAsk) {
      return {
        id: `cat-${categoryAsk}`,
        prompt: CATEGORY_QUESTIONS[categoryAsk],
        keywords: [],
      };
    }
    const answered = new Set(selectedExtras.answeredQuestions);
    const next = CLARITY_QUESTIONS.find((q) => !answered.has(q.id));
    return next ?? CLARITY_QUESTIONS[0];
  }, [selectedExtras.answeredQuestions, categoryAsk]);

  const addPostIt = (text: string, kind: PostIt["kind"]) => {
    if (!selected || !text.trim()) return;
    const cleaned = text.trim();
    const p: PostIt = {
      id: `post-${Date.now()}`,
      kind,
      text: cleaned,
      ts: Date.now(),
      categories: detectCategories(cleaned, kind),
    };
    const nextPosts = [p, ...selectedExtras.posts];
    const answeredCurrent = detectAnswered(p.text, currentQuestion);
    updateExtras({
      posts: nextPosts,
      answeredQuestions:
        answeredCurrent && currentQuestion
          ? [...selectedExtras.answeredQuestions, currentQuestion.id]
          : selectedExtras.answeredQuestions,
    });
    updateSelected({
      shelfReadiness: Math.min(
        100,
        selected.shelfReadiness + (answeredCurrent ? 7 : 4),
      ),
    });
    if (categoryAsk) setCategoryAsk(null);
  };

  const skipClarityQuestion = () => {
    if (!selected || !currentQuestion) return;
    if (categoryAsk) {
      setCategoryAsk(null);
      return;
    }
    if (selectedExtras.answeredQuestions.includes(currentQuestion.id)) return;
    updateExtras({
      answeredQuestions: [
        ...selectedExtras.answeredQuestions,
        currentQuestion.id,
      ],
    });
  };



  const addIdea = () => {
    const id = `idea-${Date.now()}`;
    const fresh: LightbulbIdea = {
      id,
      title: "New lightbulb",
      messy: "",
      shelfReadiness: 5,
      updatedAt: Date.now(),
      stage: "lightbulb",
      nextAction: "Dump your messy idea",
    };
    setIdeas((prev) => [fresh, ...prev]);
    setSelectedId(id);
    setActiveCategory("lightbulb");
  };

  const moveToPreClarity = (id: string) => {
    setIdeas((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              stage: "pre-clarity",
              shelfReadiness: Math.max(i.shelfReadiness, 45),
              nextAction: "Gather info, then move to Clarity",
              updatedAt: Date.now(),
            }
          : i,
      ),
    );
    setSelectedId(id);
    setActiveCategory("pre-clarity");
  };

  const getCategoryValue = (key: CategoryKey): string => {
    if (!selected) return "";
    const ideaPosts = selectedExtras.posts
      .filter((p) => p.kind === "idea-notes")
      .map((p) => p.text)
      .join("\n");
    const infoPosts = selectedExtras.posts
      .filter((p) => p.kind === "info-gathered")
      .map((p) => p.text)
      .join("\n");
    const attachBlob = selectedExtras.attachments.map((a) => a.label).join("\n");
    if (key === "lightbulb")
      return [selected.messy, ideaPosts].filter(Boolean).join("\n");
    if (key === "pre-clarity")
      return [
        selectedExtras.notes["pre-clarity"] ?? formatSignals(selected),
        infoPosts,
        attachBlob,
      ]
        .filter(Boolean)
        .join("\n");
    return selectedExtras.notes[key] ?? "";
  };


  const setCategoryValue = (key: CategoryKey, value: string) => {
    if (!selected) return;
    if (key === "lightbulb") updateSelected({ messy: value });
    else updateExtras({ notes: { [key]: value } });
  };

  const addAttachment = (kind: Attachment["kind"], label: string) => {
    if (!selected || !label.trim()) return;
    const a: Attachment = {
      id: `att-${Date.now()}`,
      kind,
      label: label.trim(),
    };
    updateExtras({ attachments: [a, ...selectedExtras.attachments] });
  };

  // chunk ideas into shelves of 3
  const ideaShelves = chunk(ideas, 3);
  // chunk categories into shelves of 3
  const categoryShelves = chunk(categoryDefs, 3);

  // overall progress = average category status across all categories
  const overallPct = useMemo(() => {
    if (!selected) return 0;
    const sum = categoryDefs.reduce(
      (acc, c) => acc + categoryStatus(getCategoryValue(c.key)).pct,
      0,
    );
    return Math.round(sum / categoryDefs.length);
  }, [selected, selectedExtras, categoryDefs]);

  const leftWidths = [60, 70, 90];
  const rightWidths = [60, 70, 85];

  const renderLeftShelfContent = () => (
    <>
      {ideaShelves.map((row, rIdx) => (
        <Shelf key={rIdx} widthPct={leftWidths[rIdx] ?? 90} align="left">
          {row.map((idea, idx) => (
            <BookSpine
              key={idea.id}
              title={idea.title}
              meta={stageLabels[idea.stage]}
              active={idea.id === selected?.id}
              hue={rIdx * 3 + idx}
              onClick={() => setSelectedId(idea.id)}
            />
          ))}
          {row.length < 3 &&
            Array.from({ length: 3 - row.length }).map((_, i) => (
              <BookGhost key={`g-${i}`} />
            ))}
        </Shelf>
      ))}




      <div className="relative flex justify-center pt-2">
        <button
          onClick={addIdea}
          title="Add a new idea book"
          className="flex items-center gap-1.5 rounded-sm border border-amber-200/40 bg-amber-950/40 px-3 py-1 font-serif text-[11px] text-amber-100 shadow-sm hover:bg-amber-900/60"
        >
          <Plus className="h-3 w-3" /> New Idea
        </button>
      </div>
    </>
  );

  const renderRightShelfContent = () =>
    !selected ? (
      <div className="px-4 py-8 text-center font-serif italic text-amber-100/80">
        Open an idea to see its progress.
      </div>
    ) : (
      categoryShelves.map((row, rIdx) => (
        <Shelf key={rIdx} widthPct={rightWidths[rIdx] ?? 85} align="right">
          {row.map((c) => {
            const status = categoryStatus(getCategoryValue(c.key));
            return (
              <CategoryBook
                key={c.key}
                label={c.label}
                hint={c.hint}
                pct={status.pct}
                statusLabel={status.label}
                active={activeCategory === c.key}
                onClick={() => setActiveCategory(c.key)}
              />
            );
          })}
        </Shelf>
      ))
    );

  return (
    <main
      className="relative flex w-full max-w-[100vw] flex-col overflow-x-hidden text-amber-950"
      style={{ minHeight: "100dvh" }}
    >
      {/* living tree library background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-30 bg-cover bg-center"
        style={{ backgroundImage: `url(${libraryBg})` }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-20"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255,225,160,0.35), transparent 70%), linear-gradient(180deg, rgba(60,30,8,0.05), rgba(40,18,2,0.15))",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,230,170,0.6) 1px, transparent 1.5px)",
          backgroundSize: "120px 120px",
          backgroundPosition: "0 0, 60px 60px",
        }}
      />

      {/* Clarity the squirrel — transparent PNG overlay, follows viewport */}
      <img
        src={claritySquirrel}
        alt="Clarity"
        aria-hidden
        className="pointer-events-none fixed z-10 select-none right-[-60px] bottom-[140px] h-[320px] sm:right-2 sm:bottom-[220px] sm:h-[320px] lg:right-8 lg:bottom-32 lg:h-[640px]"
        style={{
          width: "auto",
          filter: "drop-shadow(0 22px 28px rgba(20,10,2,0.55))",
          animation: "clarity-float 6s ease-in-out infinite",
        }}
      />




      {/* Header — laid-down book controls floating over the library scene */}
      <header className="relative z-30 flex flex-wrap items-center justify-center gap-2 px-3 pt-4 sm:gap-3 sm:px-6 sm:pt-5 lg:flex-nowrap lg:justify-between">
        {/* LEFT: Logo + Progress book */}
        <div className="order-1 flex items-center gap-2 sm:gap-3">
          <Link to="/" className="flex shrink-0 items-center gap-1.5" title="Home">
            <img src={logo} alt="DaBotTree" className="h-8 w-8 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] sm:h-9 sm:w-9" />
          </Link>
          <ProgressPopover
            disabled={!selected}
            categories={categoryDefs}
            getValue={getCategoryValue}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            onAskCategory={(k) => setCategoryAsk(k)}
            overall={overallPct}
          />
        </div>

        {/* CENTER: My Library + New Idea — absolutely centered on desktop, wraps on smaller screens */}
        <div className="order-3 flex w-full basis-full items-center justify-center gap-3 lg:absolute lg:left-1/2 lg:top-1/2 lg:order-2 lg:w-auto lg:basis-auto lg:-translate-x-1/2 lg:-translate-y-1/2">
          <LibraryPopover
            ideas={ideas}
            selectedId={selected?.id ?? ""}
            onSelect={(id) => setSelectedId(id)}
          />
          <NewLightbulbPopover />

        </div>

        {/* RIGHT: Avatar + Organize / Next Stage */}
        <div className="order-2 flex items-center justify-end gap-2 sm:gap-3 lg:order-3">
          <ProfileAvatarButton />
          <OrganizeButton
            overall={overallPct}
            stage={selected?.stage ?? "lightbulb"}
            onClick={() => selected && moveToPreClarity(selected.id)}
          />
        </div>
      </header>



      {/* Active idea bookplate — compact carved label, centered */}
      {selected && (
        <div className="relative z-20 mx-auto mt-3 flex w-full justify-center px-3">
          <IdeaBookplate
            idea={selected}
            onUpdate={(patch) => updateSelected(patch)}
          />
        </div>
      )}

      {/* Center stage — full width, the library room breathes */}
      <div className="relative flex flex-1 flex-col px-3 pb-4 pt-3 lg:px-6">
        {!selected ? (
          <div className="relative mx-auto mt-12 max-w-md rounded-md border border-amber-950/50 bg-amber-50/85 p-8 text-center font-serif italic text-amber-900 shadow-2xl">
            Open My Library and pick an idea to begin.
          </div>
        ) : (
          <NoteDesk
            selected={selected}
            extras={selectedExtras}
            addPostIt={addPostIt}
            addAttachment={addAttachment}
            updateSelected={updateSelected}
            moveToPreClarity={moveToPreClarity}
            fileInputRef={fileInputRef}
            currentQuestion={currentQuestion}
            answeredCount={selectedExtras.answeredQuestions.length}
            totalQuestions={CLARITY_QUESTIONS.length}
            onSkipClarityQuestion={skipClarityQuestion}
          />
        )}
      </div>

      {/* floor shadow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 h-24 -z-10"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(20,10,2,0.55))",
        }}
      />
    </main>
  );
}


// ============================================================
// Top bar controls — popovers & organize button
// ============================================================

// ============================================================
// Laid-down book button — horizontal book with left→right glowing fill
// ============================================================
type LaidBookVariant = "leather" | "gold" | "emerald" | "ember";

const laidBookPalette: Record<
  LaidBookVariant,
  { cover: string; edge: string; stroke: string; text: string; spine: string }
> = {
  leather: {
    cover:
      "linear-gradient(180deg, #6b3a14 0%, #4a230a 55%, #2d1405 100%)",
    edge: "linear-gradient(180deg, #f5d99a 0%, #c89a52 100%)",
    stroke: "rgba(20,10,2,0.85)",
    text: "#fbe6b8",
    spine: "#3a1f08",
  },
  gold: {
    cover:
      "linear-gradient(180deg, #8b5a18 0%, #5a3208 55%, #2d1605 100%)",
    edge: "linear-gradient(180deg, #ffe9a3 0%, #f0c050 60%, #b07a18 100%)",
    stroke: "rgba(20,10,2,0.85)",
    text: "#ffe9b8",
    spine: "#4a280a",
  },
  emerald: {
    cover:
      "linear-gradient(180deg, #1f5a3a 0%, #133a25 55%, #061f10 100%)",
    edge: "linear-gradient(180deg, #c8f5d4 0%, #5fc27a 100%)",
    stroke: "rgba(5,20,10,0.85)",
    text: "#dff5e2",
    spine: "#0c2e1a",
  },
  ember: {
    cover:
      "linear-gradient(180deg, #7a2a14 0%, #4a1408 55%, #2a0805 100%)",
    edge: "linear-gradient(180deg, #ffd2a3 0%, #e88040 100%)",
    stroke: "rgba(20,5,2,0.85)",
    text: "#fde0c8",
    spine: "#3a1008",
  },
};

function LaidBook({
  label,
  sublabel,
  pct,
  variant = "leather",
  open,
  glow,
  size = "md",
  disabled,
  trailing,
  onClick,
  title,
}: {
  label: string;
  sublabel?: string;
  pct?: number; // 0..100, optional fill
  variant?: LaidBookVariant;
  open?: boolean;
  glow?: boolean;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  trailing?: React.ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  const pal = laidBookPalette[variant];
  const dims = {
    sm: { h: 30, w: 130, pad: "px-2.5", font: "text-[10px]", sub: "text-[8px]" },
    md: { h: 40, w: 188, pad: "px-3.5", font: "text-[12px]", sub: "text-[9px]" },
    lg: { h: 46, w: 230, pad: "px-4", font: "text-[13px]", sub: "text-[9px]" },
  }[size];
  const fillPct = typeof pct === "number" ? Math.max(0, Math.min(100, pct)) : null;
  const lifted = open ? "translate-y-[1px] rotate-[-0.4deg]" : "hover:-translate-y-[1px]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`group relative inline-flex shrink-0 items-center font-serif transition-transform disabled:opacity-50 ${lifted}`}
      style={{ height: dims.h, width: dims.w }}
    >
      {/* shelf shadow under book */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-1 left-1.5 right-1.5 h-2 rounded-full blur-[3px]"
        style={{ background: "rgba(10,5,0,0.55)" }}
      />
      {/* glow halo */}
      {glow && !disabled && (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1 -z-10 rounded-md blur-md"
          style={{ background: "rgba(255,210,120,0.45)" }}
        />
      )}

      {/* book body */}
      <span
        className="relative flex h-full w-full items-center overflow-hidden rounded-[3px]"
        style={{
          background: pal.cover,
          border: `1px solid ${pal.stroke}`,
          boxShadow:
            "inset 0 1px 0 rgba(255,220,170,0.18), inset 0 -2px 0 rgba(0,0,0,0.45), 0 3px 6px rgba(0,0,0,0.45)",
        }}
      >
        {/* page edges showing along the bottom (the side of a laid book) */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[5px]"
          style={{
            background:
              "repeating-linear-gradient(90deg, rgba(245,220,170,0.85) 0 1px, rgba(200,170,120,0.6) 1px 2px)",
            borderTop: "1px solid rgba(0,0,0,0.5)",
          }}
        />

        {/* left-to-right magical fill (page edge glowing) */}
        {fillPct !== null && (
          <>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0"
              style={{
                width: `${fillPct}%`,
                background:
                  "linear-gradient(90deg, rgba(255,220,140,0.22), rgba(255,235,170,0.10) 70%, transparent)",
                transition: "width 600ms ease",
              }}
            />
            {/* glowing page-edge fill at the bottom */}
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-0 left-0 h-[5px]"
              style={{
                width: `${fillPct}%`,
                background: pal.edge,
                boxShadow:
                  "0 0 10px 2px rgba(255,220,140,0.7), 0 0 2px rgba(255,255,200,0.9)",
                transition: "width 600ms ease",
              }}
            />
            {/* leading edge sparkle */}
            {fillPct > 0 && fillPct < 100 && (
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-[1px] h-[7px] w-[3px] rounded-full"
                style={{
                  left: `calc(${fillPct}% - 1.5px)`,
                  background: "rgba(255,250,210,0.95)",
                  boxShadow: "0 0 8px 2px rgba(255,230,150,0.9)",
                  transition: "left 600ms ease",
                }}
              />
            )}
          </>
        )}

        {/* gold spine band on the left */}
        <span
          aria-hidden
          className="absolute inset-y-1 left-1 w-[3px] rounded-sm"
          style={{
            background:
              "linear-gradient(180deg, #f0d28a 0%, #a87420 100%)",
            boxShadow: "0 0 4px rgba(255,210,130,0.5)",
          }}
        />
        {/* gold spine band on the right */}
        <span
          aria-hidden
          className="absolute inset-y-1 right-1 w-[3px] rounded-sm"
          style={{
            background:
              "linear-gradient(180deg, #f0d28a 0%, #a87420 100%)",
            boxShadow: "0 0 4px rgba(255,210,130,0.5)",
          }}
        />

        {/* label */}
        <span
          className={`relative z-10 flex w-full items-center justify-center gap-1.5 ${dims.pad} ${dims.font} font-semibold uppercase tracking-[0.18em]`}
          style={{
            color: pal.text,
            textShadow: "0 1px 0 rgba(0,0,0,0.7), 0 0 6px rgba(0,0,0,0.4)",
          }}
        >
          <span className="truncate">{label}</span>
          {trailing}
        </span>
        {sublabel && (
          <span
            className={`pointer-events-none absolute right-2 top-1 ${dims.sub} italic`}
            style={{ color: pal.text, opacity: 0.8 }}
          >
            {sublabel}
          </span>
        )}
      </span>
    </button>
  );
}

function overallProgress(
  cats: { key: CategoryKey }[],
  getValue: (k: CategoryKey) => string,
) {
  if (cats.length === 0) return 0;
  const sum = cats.reduce((acc, c) => acc + categoryStatus(getValue(c.key)).pct, 0);
  return Math.round(sum / cats.length);
}

function MiniLaidBook({
  label,
  pct,
  active,
  onClick,
  guidance,
  categoryKey,
}: {
  label: string;
  pct: number;
  active: boolean;
  onClick: () => void;
  guidance?: string;
  categoryKey?: CategoryKey;
}) {
  const palette = categoryKey ? postItCategoryPalette[categoryKey] : undefined;
  const bookBg = palette
    ? `linear-gradient(180deg, ${palette.edge} 0%, color-mix(in srgb, ${palette.edge} 55%, #1a0a02) 100%)`
    : "linear-gradient(180deg, #5a3110 0%, #361a06 100%)";
  const btn = (
    <button
      onClick={onClick}
      title={`${label} — ${pct}%`}
      className={
        "relative flex h-[26px] w-full items-center overflow-hidden rounded-[3px] border font-serif transition-transform " +
        (active
          ? "-translate-y-[1px] border-amber-200/90"
          : "border-amber-950/80 hover:-translate-y-[1px]")
      }
      style={{
        background: bookBg,
        boxShadow:
          "inset 0 1px 0 rgba(255,220,170,0.18), inset 0 -2px 0 rgba(0,0,0,0.45), 0 2px 4px rgba(0,0,0,0.5)",
      }}
    >
      {/* page edges */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px]"
        style={{
          background:
            "repeating-linear-gradient(90deg, rgba(245,220,170,0.8) 0 1px, rgba(200,170,120,0.55) 1px 2px)",
          borderTop: "1px solid rgba(0,0,0,0.5)",
        }}
      />
      {/* glowing fill */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0"
        style={{
          width: `${pct}%`,
          background:
            "linear-gradient(90deg, rgba(255,220,140,0.22), transparent)",
          transition: "width 600ms ease",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-[3px]"
        style={{
          width: `${pct}%`,
          background:
            pct >= 100
              ? "linear-gradient(90deg, #ffe9a3, #f0c050)"
              : pct >= 50
                ? "linear-gradient(90deg, #c8f5d4, #5fc27a)"
                : pct > 0
                  ? "linear-gradient(90deg, #c8f5d4, #5fc27a)"
                  : "transparent",
          boxShadow:
            pct > 0
              ? "0 0 8px 1px rgba(180,240,140,0.7)"
              : "none",
          transition: "width 600ms ease",
        }}
      />
      {/* gold caps */}
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 w-[2px] rounded-sm"
        style={{ background: "linear-gradient(180deg,#f0d28a,#a87420)" }}
      />
      <span
        aria-hidden
        className="absolute inset-y-1 right-1 w-[2px] rounded-sm"
        style={{ background: "linear-gradient(180deg,#f0d28a,#a87420)" }}
      />
      <span
        className="relative z-10 flex w-full items-center justify-between gap-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em]"
        style={{
          color: "#fbe6b8",
          textShadow: "0 1px 0 rgba(0,0,0,0.7)",
        }}
      >
        <span className="truncate">{label}</span>
        <span className="shrink-0 text-[9px] italic opacity-75">{pct}%</span>
      </span>
    </button>
  );
  if (!guidance) return btn;
  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>{btn}</HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={8}
        className="z-50 w-[240px] border-amber-950/70 p-3 font-serif text-[12px] italic text-amber-950 shadow-[0_12px_28px_-12px_rgba(20,8,2,0.7)]"
        style={{
          background: "linear-gradient(180deg, #f6e6bd 0%, #e2c98a 100%)",
          borderRadius: 6,
        }}
      >
        <div className="mb-1 text-[10px] font-semibold uppercase not-italic tracking-[0.2em] text-amber-900/80">
          {label}
        </div>
        {guidance}
      </HoverCardContent>
    </HoverCard>
  );
}

function ProgressPopover({
  disabled,
  categories,
  getValue,
  activeCategory,
  setActiveCategory,
  onAskCategory,
  overall,
}: {
  disabled: boolean;
  categories: { key: CategoryKey; label: string; hint: string; guidance?: string }[];
  getValue: (k: CategoryKey) => string;
  activeCategory: CategoryKey;
  setActiveCategory: (k: CategoryKey) => void;
  onAskCategory: (k: CategoryKey) => void;
  overall: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="bg-transparent p-0 disabled:opacity-50"
          title={`Idea Progress — ${overall}% ready`}
        >
          <ProgressBook pct={overall} open={open} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={10}
        className="z-40 w-[min(92vw,420px)] border-amber-950/80 p-3 text-amber-50 shadow-[0_22px_44px_-18px_rgba(20,8,2,0.9)]"
        style={{
          background:
            "linear-gradient(180deg, #efe0bf 0%, #d8c08a 100%)",
          borderRadius: 6,
        }}
      >
        <div className="mb-2 flex items-center justify-between font-serif">
          <span className="text-[11px] uppercase tracking-[0.25em] text-amber-950/80">
            Category Books
          </span>
          <span className="text-[10px] italic text-amber-900/70">
            Click a book to steer Clarity's question
          </span>
        </div>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {categories.map((c) => {
            const status = categoryStatus(getValue(c.key));
            return (
              <MiniLaidBook
                key={c.key}
                label={c.label}
                pct={status.pct}
                guidance={c.guidance}
                categoryKey={c.key}
                active={activeCategory === c.key}
                onClick={() => {
                  setActiveCategory(c.key);
                  onAskCategory(c.key);
                  setOpen(false);
                }}
              />
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ProfileAvatarButton() {
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem("dabottree.profile.photo");
      const n = localStorage.getItem("dabottree.profile.name") ?? "";
      if (p) setPhoto(p);
      if (n) setName(n);
    } catch {}
  }, []);

  const initials = (name.trim() ? name.trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join("") : "").toUpperCase();

  const onPick = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || "");
      setPhoto(url);
      try { localStorage.setItem("dabottree.profile.photo", url); } catch {}
    };
    reader.readAsDataURL(file);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Profile"
          aria-label="Open profile"
          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-amber-950/70 bg-gradient-to-br from-amber-100 to-amber-300 text-amber-950 shadow-[0_4px_10px_-3px_rgba(20,8,2,0.7),inset_0_1px_0_rgba(255,250,235,0.6)] transition hover:scale-[1.04]"
        >
          {photo ? (
            <img src={photo} alt="Profile" className="h-full w-full object-cover" />
          ) : initials ? (
            <span className="flex h-full w-full items-center justify-center font-serif text-[13px] font-bold tracking-wide">
              {initials}
            </span>
          ) : (
            <User className="mx-auto h-5 w-5" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={10}
        className="z-40 w-[260px] border-amber-950/80 p-3 text-amber-950 shadow-[0_22px_44px_-18px_rgba(20,8,2,0.9)]"
        style={{ background: "linear-gradient(180deg, #efe0bf 0%, #d8c08a 100%)", borderRadius: 6 }}
      >
        <div className="mb-2 font-serif text-[11px] uppercase tracking-[0.25em] text-amber-950/80">
          Profile
        </div>
        <div className="mb-3 flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-full border border-amber-950/60 bg-amber-100">
            {photo ? (
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-6 w-6 text-amber-900/70" />
              </div>
            )}
          </div>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              try { localStorage.setItem("dabottree.profile.name", e.target.value); } catch {}
            }}
            placeholder="Your name"
            className="flex-1 rounded-sm border border-amber-900/40 bg-amber-50/70 px-2 py-1 font-serif text-[12px] text-amber-950 outline-none focus:border-amber-950"
          />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex-1 rounded-sm border border-amber-950/60 bg-amber-50/70 px-2 py-1 font-serif text-[12px] hover:bg-amber-100"
          >
            {photo ? "Change photo" : "Upload photo"}
          </button>
          {photo && (
            <button
              type="button"
              onClick={() => {
                setPhoto(null);
                try { localStorage.removeItem("dabottree.profile.photo"); } catch {}
              }}
              className="rounded-sm border border-amber-950/60 bg-amber-50/70 px-2 py-1 font-serif text-[12px] hover:bg-amber-100"
            >
              Remove
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}


function LibraryPopover({
  ideas,
  selectedId,
  onSelect,
}: {
  ideas: LightbulbIdea[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="bg-transparent p-0">
          <LaidBook
            label="My Library"
            variant="leather"
            open={open}
            size="md"
            trailing={<BookOpen className="h-3 w-3 opacity-80" />}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        sideOffset={10}
        className="z-40 w-[min(92vw,420px)] border-amber-950/80 p-3 text-amber-50 shadow-[0_22px_44px_-18px_rgba(20,8,2,0.9)]"
        style={{
          background:
            "linear-gradient(180deg, #efe0bf 0%, #d8c08a 100%)",
          borderRadius: 6,
        }}
      >
        <div className="mb-2 font-serif text-[11px] uppercase tracking-[0.25em] text-amber-950/80">
          Saved Ideas
        </div>
        <ul className="max-h-[60vh] space-y-1 overflow-y-auto pr-1">
          {ideas.map((idea) => {
            const active = idea.id === selectedId;
            return (
              <li key={idea.id}>
                <button
                  onClick={() => {
                    onSelect(idea.id);
                    setOpen(false);
                  }}
                  className={
                    "group flex w-full items-center gap-2 rounded-sm border px-2 py-1.5 text-left font-serif text-[12px] transition " +
                    (active
                      ? "border-amber-950/80 bg-amber-100/80 text-amber-950"
                      : "border-amber-900/40 bg-amber-50/40 text-amber-950 hover:bg-amber-100/70")
                  }
                >
                  <span
                    className="block h-6 w-1.5 shrink-0 rounded-sm"
                    style={{
                      background:
                        spinePalettes[
                          (idea.title.length + idea.id.length) %
                            spinePalettes.length
                        ][1],
                    }}
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {idea.title || "Untitled"}
                  </span>
                  <span className="shrink-0 text-[10px] italic text-amber-900/70">
                    {stageLabels[idea.stage]}
                  </span>
                </button>
              </li>
            );
          })}
          {ideas.length === 0 && (
            <li className="px-2 py-3 font-serif text-[11px] italic text-amber-900/80">
              No ideas yet. Tap New Idea to begin.
            </li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

const NEW_IDEA_CATEGORIES: { id: string; label: string; type: string }[] = [
  { id: "app", label: "Create an App", type: "App" },
  { id: "tool", label: "Create a Tool", type: "Tool" },
  { id: "service", label: "Create a Service", type: "Service" },
  { id: "product", label: "Create a Product", type: "Product" },
  { id: "community", label: "Start a Community", type: "Community" },
  { id: "business", label: "Start a Business", type: "Business" },
  { id: "story", label: "Tell a Story", type: "Story" },
];

function NewLightbulbPopover() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const goToDoor = (type?: string) => {
    setOpen(false);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("dabottree:draftIdea");
        if (type) sessionStorage.setItem("dabottree:draftIdeaType", type);
        else sessionStorage.removeItem("dabottree:draftIdeaType");
      } catch {}
    }
    navigate({ to: "/", search: type ? { type } : undefined as never });
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="bg-transparent p-0">
          <LaidBook
            label="New Idea"
            variant="ember"
            open={open}
            size="md"
            glow
            trailing={<Lightbulb className="h-3 w-3 opacity-90" />}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        sideOffset={10}
        className="z-40 w-[min(92vw,320px)] border-amber-950/80 p-3 text-amber-50 shadow-[0_22px_44px_-18px_rgba(20,8,2,0.9)]"
        style={{
          background: "linear-gradient(180deg, #efe0bf 0%, #d8c08a 100%)",
          borderRadius: 6,
        }}
      >
        <button
          onClick={() => goToDoor()}
          className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-sm border border-amber-300/60 px-3 py-2 font-serif text-[12px] font-semibold text-amber-950 shadow-md transition hover:brightness-110"
          style={{
            background:
              "linear-gradient(180deg, #f5d27a 0%, #d99a32 60%, #a86614 100%)",
          }}
        >
          <Plus className="h-3.5 w-3.5" /> Blank Idea
        </button>
        <div className="mb-1 font-serif text-[10px] uppercase tracking-[0.25em] text-amber-950/70">
          · Categories ·
        </div>
        <ul className="space-y-1">
          {NEW_IDEA_CATEGORIES.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => goToDoor(c.type)}
                className="flex w-full items-center gap-2 rounded-sm border border-amber-900/40 bg-amber-50/40 px-2 py-1.5 text-left font-serif text-[12px] text-amber-950 transition hover:bg-amber-100/70"
              >
                <Lightbulb className="h-3 w-3 text-amber-700" />
                <span className="truncate">{c.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}


function OrganizeButton({
  overall,
  stage,
  onClick,
}: {
  overall: number;
  stage: LightbulbIdea["stage"];
  onClick: () => void;
}) {
  const unlocked = overall >= 90;
  const stageAdvanced = stage !== "lightbulb";
  const label = "Next Step";
  const [showLockMsg, setShowLockMsg] = useState(false);

  const handleClick = () => {
    if (stageAdvanced) return;
    if (!unlocked) {
      setShowLockMsg(true);
      window.setTimeout(() => setShowLockMsg(false), 2400);
      return;
    }
    onClick();
  };

  const variant: LaidBookVariant = unlocked ? "gold" : "leather";
  const size = unlocked ? "lg" : "md";

  return (
    <div className="relative">
      <div className={unlocked ? "" : "opacity-60 saturate-[0.55]"}>
        <LaidBook
          label={label}
          sublabel={unlocked ? "Ready" : "Not Yet"}
          pct={unlocked ? overall : undefined}
          variant={variant}
          glow={unlocked}
          size={size}
          disabled={stageAdvanced}
          onClick={handleClick}
          title={
            stageAdvanced
              ? "Already organized"
              : unlocked
                ? `Ready! Move forward (${overall}%)`
                : `Asleep — unlocks at 90% (currently ${overall}%)`
          }
          trailing={
            unlocked ? (
              <ArrowRight className="h-3 w-3 opacity-90" />
            ) : null
          }
        />
      </div>
      {showLockMsg && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[240px] rounded-md border border-amber-950/70 px-3 py-2 font-serif text-[11px] italic text-amber-950 shadow-[0_12px_28px_-12px_rgba(20,8,2,0.7)] animate-fade-in"
          style={{
            background:
              "linear-gradient(180deg, #f6e6bd 0%, #e2c98a 100%)",
          }}
        >
          Gather a little more first. Ideas unlock at <strong>90% ready</strong>.
        </div>
      )}
    </div>
  );
}

// ProgressBook — laid-down book with engraved oversized percent number
function ProgressBook({ pct, open }: { pct: number; open: boolean }) {
  const fillPct = Math.max(0, Math.min(100, pct));
  const lifted = open ? "translate-y-[1px] rotate-[-0.4deg]" : "hover:-translate-y-[1px]";
  return (
    <span
      className={`group relative inline-flex shrink-0 items-center font-serif transition-transform ${lifted}`}
      style={{ height: 56, width: 268 }}
    >
      {/* shelf shadow */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-1 left-1.5 right-1.5 h-2 rounded-full blur-[3px]"
        style={{ background: "rgba(10,5,0,0.55)" }}
      />
      {/* book body */}
      <span
        className="relative flex h-full w-full items-center overflow-hidden rounded-[3px]"
        style={{
          background:
            "linear-gradient(180deg, #6b3a14 0%, #4a230a 55%, #2d1405 100%)",
          border: "1px solid rgba(20,10,2,0.85)",
          boxShadow:
            "inset 0 1px 0 rgba(255,220,170,0.18), inset 0 -2px 0 rgba(0,0,0,0.45), 0 3px 6px rgba(0,0,0,0.45)",
        }}
      >
        {/* page edges along the bottom */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[6px]"
          style={{
            background:
              "repeating-linear-gradient(90deg, rgba(245,220,170,0.85) 0 1px, rgba(200,170,120,0.6) 1px 2px)",
            borderTop: "1px solid rgba(0,0,0,0.5)",
          }}
        />
        {/* magical glow fill rising from bottom-left */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0"
          style={{
            width: `${fillPct}%`,
            background:
              "linear-gradient(90deg, rgba(255,220,140,0.28), rgba(255,235,170,0.12) 70%, transparent)",
            transition: "width 700ms ease",
          }}
        />
        {/* glowing gold page-edge fill */}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-[6px]"
          style={{
            width: `${fillPct}%`,
            background:
              "linear-gradient(90deg, #ffe9a3 0%, #f0c050 60%, #b07a18 100%)",
            boxShadow:
              "0 0 14px 3px rgba(255,220,140,0.85), 0 0 4px rgba(255,255,200,0.95)",
            transition: "width 700ms ease",
          }}
        />
        {fillPct > 0 && fillPct < 100 && (
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-[1px] h-[9px] w-[3px] rounded-full"
            style={{
              left: `calc(${fillPct}% - 1.5px)`,
              background: "rgba(255,250,210,0.95)",
              boxShadow: "0 0 10px 3px rgba(255,230,150,0.95)",
              transition: "left 700ms ease",
            }}
          />
        )}

        {/* gold spine caps */}
        <span
          aria-hidden
          className="absolute inset-y-1 left-1 w-[3px] rounded-sm"
          style={{
            background: "linear-gradient(180deg, #f0d28a 0%, #a87420 100%)",
            boxShadow: "0 0 4px rgba(255,210,130,0.5)",
          }}
        />
        <span
          aria-hidden
          className="absolute inset-y-1 right-1 w-[3px] rounded-sm"
          style={{
            background: "linear-gradient(180deg, #f0d28a 0%, #a87420 100%)",
            boxShadow: "0 0 4px rgba(255,210,130,0.5)",
          }}
        />

        {/* engraved content: big percent + label */}
        <span className="relative z-10 flex w-full items-center justify-between gap-3 px-4">
          <span
            className="font-serif text-[28px] font-bold leading-none tracking-tight"
            style={{
              color: "#ffe9a3",
              textShadow:
                "0 1px 0 rgba(0,0,0,0.8), 0 0 14px rgba(255,210,120,0.7), 0 0 2px rgba(255,240,180,0.9)",
            }}
          >
            {fillPct}%
          </span>
          <span className="flex flex-col items-end">
            <span
              className="font-serif text-[11px] font-semibold uppercase tracking-[0.25em]"
              style={{
                color: "#fbe6b8",
                textShadow: "0 1px 0 rgba(0,0,0,0.7)",
              }}
            >
              Idea Progress
            </span>
            <span
              className="font-serif text-[10px] italic"
              style={{ color: "rgba(251,230,184,0.75)" }}
            >
              {fillPct >= 90 ? "Ready" : fillPct >= 50 ? "Growing" : fillPct > 0 ? "Started" : "Empty"}
            </span>
          </span>
        </span>
      </span>
    </span>
  );
}

// Compact idea bookplate — short centered carved label with edit dialog
function IdeaBookplate({
  idea,
  onUpdate,
}: {
  idea: LightbulbIdea;
  onUpdate: (patch: Partial<LightbulbIdea>) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const display = (idea.title || "Untitled Idea").trim();
  return (
    <>
      <button
        type="button"
        onClick={() => setEditOpen(true)}
        title="Edit idea details"
        className="group relative inline-flex max-w-[min(94vw,520px)] items-center gap-2.5 rounded-[4px] border px-5 py-2 font-serif shadow-[0_10px_26px_-12px_rgba(20,8,2,0.8)] transition hover:-translate-y-[1px]"
        style={{
          background:
            "linear-gradient(180deg, #fbf6e7 0%, #efe3c4 100%)",
          borderColor: "rgba(60,30,8,0.7)",
          boxShadow:
            "inset 0 1px 0 rgba(255,250,235,0.95), inset 0 -2px 0 rgba(120,70,20,0.28), 0 8px 18px -8px rgba(20,8,2,0.6)",
        }}
      >
        {/* tiny brass screws */}
        <span
          aria-hidden
          className="absolute left-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(circle at 30% 30%, #f5d27a, #6b3a08)" }}
        />
        <span
          aria-hidden
          className="absolute right-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(circle at 30% 30%, #f5d27a, #6b3a08)" }}
        />
        <Lightbulb className="h-4 w-4 shrink-0 text-amber-700" />
        <span
          className="truncate font-serif text-[20px] font-bold leading-tight text-amber-950"
          style={{ textShadow: "0 1px 0 rgba(255,250,235,0.85)", letterSpacing: "0.015em" }}
        >
          {display}
        </span>
        <span
          className="hidden shrink-0 rounded-sm border border-amber-900/40 bg-amber-50/70 px-2 py-0.5 font-serif text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-900/80 sm:inline"
          title="Idea type — edit in the idea details"
        >
          {idea.ideaType?.trim() || "Idea Type"}
        </span>
        <Pencil className="h-3.5 w-3.5 shrink-0 text-amber-800 opacity-60 transition group-hover:opacity-100" />
      </button>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent
          className="max-w-md border-amber-950/70 p-5 text-amber-950"
          style={{
            background:
              "linear-gradient(180deg, #f6e6bd 0%, #e2c98a 100%)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-[18px] font-bold text-amber-950">
              Edit Idea
            </DialogTitle>
            <DialogDescription className="font-serif text-[11px] italic text-amber-900/70">
              A few simple notes to give this idea shape.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-3">
            <BookplateField
              label="Idea name"
              value={idea.title}
              onChange={(v) => onUpdate({ title: v })}
              placeholder="Name this idea…"
            />
            <BookplateField
              label="Who does this serve?"
              value={idea.audience ?? ""}
              onChange={(v) => onUpdate({ audience: v })}
              placeholder="e.g. busy parents, indie devs"
            />
            <BookplateField
              label="Industry or category"
              value={idea.industry ?? ""}
              onChange={(v) => onUpdate({ industry: v })}
              placeholder="e.g. education, wellness"
            />
            <BookplateField
              label="Idea type"
              value={idea.ideaType ?? ""}
              onChange={(v) => onUpdate({ ideaType: v })}
              placeholder="e.g. app, service, course"
            />
            <BookplateField
              label="Short description"
              value={idea.description ?? ""}
              onChange={(v) => onUpdate({ description: v })}
              placeholder="One sentence about the idea"
              multiline
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setEditOpen(false)}
              className="rounded-sm border border-amber-950/60 px-4 py-1.5 font-serif text-[12px] font-semibold text-amber-950 shadow-sm transition hover:brightness-105"
              style={{
                background:
                  "linear-gradient(180deg, #f5d27a 0%, #d99a32 60%, #a86614 100%)",
              }}
            >
              Done
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BookplateField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const Comp = multiline ? "textarea" : "input";
  return (
    <label className="block">
      <span className="mb-1 block font-serif text-[10px] uppercase tracking-[0.22em] text-amber-900/75">
        {label}
      </span>
      <Comp
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        rows={multiline ? 2 : undefined}
        className="w-full rounded-sm border border-amber-950/40 bg-amber-50/60 px-2.5 py-1.5 font-serif text-[13px] text-amber-950 placeholder:text-amber-900/40 focus:border-amber-950/80 focus:outline-none"
      />
    </label>
  );
}





// Wood / shelf primitives
// ============================================================

function WoodGrain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-50 mix-blend-overlay"
      style={{
        backgroundImage:
          "repeating-linear-gradient(180deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 6px), repeating-linear-gradient(90deg, rgba(255,210,150,0.07) 0 2px, transparent 2px 13px)",
      }}
    />
  );
}

function ShelfWall({
  side,
  title,
  subtitle,
  children,
  className,
}: {
  side: "left" | "right";
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <aside className={`relative ${className ?? ""}`}>

      {/* hanging lantern */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1 z-10 -translate-x-1/2"
      >
        <div className="mx-auto h-4 w-px bg-amber-950/70" />
        <div
          className="mx-auto h-3.5 w-3.5 rounded-full"
          style={{
            background:
              "radial-gradient(circle, #ffe6a3 0%, #e09a32 55%, #6b2f08 100%)",
            boxShadow: "0 0 22px 8px rgba(255,196,110,0.55)",
          }}
        />
      </div>

      {/* small ivy at top corner */}
      <Ivy side={side} />

      {/* carved wooden header plaque (floating, no full wall) */}
      <header className="relative px-3 pb-4 pt-10">
        <div
          className="relative mx-auto rounded-[2px] border border-amber-950/60 px-3 py-2 text-center shadow-[0_6px_14px_-6px_rgba(0,0,0,0.7)]"
          style={{
            background:
              "linear-gradient(180deg, #6b3f1a 0%, #4a2810 60%, #2a1505 100%)",
          }}
        >
          <WoodGrain />
          <h2 className="relative font-serif text-sm font-semibold tracking-wide text-amber-100">
            {title}
          </h2>
          {subtitle && (
            <p className="relative font-serif text-[11px] italic text-amber-100/75">
              {subtitle}
            </p>
          )}
        </div>
      </header>

      {/* floating shelves — background shows through */}
      <div className="relative space-y-8 px-2 pb-8">{children}</div>
    </aside>
  );
}

function Ivy({ side }: { side: "left" | "right" }) {
  // simple decorative SVG vine at top of shelf wall
  const flip = side === "right" ? -1 : 1;
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute top-0 z-10 h-24 w-24 opacity-90"
      style={{ [side]: 0, transform: `scaleX(${flip})` }}
      viewBox="0 0 100 100"
      fill="none"
    >
      <path
        d="M5,5 C25,20 35,45 30,75 C28,85 35,92 45,90"
        stroke="#3a5c2e"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse cx="18" cy="22" rx="6" ry="3" fill="#4a7a3a" transform="rotate(-30 18 22)" />
      <ellipse cx="28" cy="38" rx="6" ry="3" fill="#5a8a4a" transform="rotate(20 28 38)" />
      <ellipse cx="32" cy="55" rx="7" ry="3.5" fill="#3a6a2a" transform="rotate(-15 32 55)" />
      <ellipse cx="30" cy="72" rx="6" ry="3" fill="#5a8a4a" transform="rotate(30 30 72)" />
      <ellipse cx="40" cy="86" rx="5" ry="2.5" fill="#4a7a3a" transform="rotate(-10 40 86)" />
    </svg>
  );
}


function Shelf({
  children,
  widthPct = 100,
  align = "center",
}: {
  children: React.ReactNode;
  widthPct?: number;
  align?: "left" | "right" | "center";
}) {
  const marginClass =
    align === "left" ? "mr-auto" : align === "right" ? "ml-auto" : "mx-auto";
  return (
    <div
      className={`relative ${marginClass}`}
      style={{ width: `${widthPct}%` }}
    >
      {/* books sitting on the plank */}
      <div className="flex items-end justify-center gap-1.5 px-2">
        {children}
      </div>
      {/* plank */}
      <div
        aria-hidden
        className="relative mt-0 h-3 rounded-sm"
        style={{
          background:
            "linear-gradient(180deg, #6b3f1a 0%, #4a2810 60%, #2a1505 100%)",
          boxShadow:
            "0 6px 12px -4px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,210,150,0.25)",
        }}
      >
        <div
          className="absolute inset-0 opacity-40 mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(0,0,0,0.25) 0 1px, transparent 1px 9px)",
          }}
        />
      </div>
      {/* under-shelf shadow */}
      <div
        aria-hidden
        className="h-2 -mt-1 rounded-b-sm opacity-70"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55), transparent)",
        }}
      />
    </div>
  );
}

function ShelfAction({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="relative px-2 pb-1">
      <button
        onClick={onClick}
        className="w-full rounded-sm border border-amber-300/60 px-3 py-2 font-serif text-xs font-medium text-amber-950 shadow-md transition hover:brightness-110"
        style={{
          background:
            "linear-gradient(180deg, #f5d27a 0%, #d99a32 60%, #a86614 100%)",
        }}
      >
        {label}
      </button>
    </div>
  );
}

// ============================================================
// Books
// ============================================================

function BookSpine({
  title,
  meta,
  active,
  hue,
  onClick,
}: {
  title: string;
  meta: string;
  active: boolean;
  hue: number;
  onClick: () => void;
}) {
  const [a, b, gold] = spinePalettes[hue % spinePalettes.length];
  const height = 110 + ((hue * 13) % 22); // vary heights for organic look
  const width = 36 + ((hue * 7) % 10);
  return (
    <button
      onClick={onClick}
      title={title}
      className={
        "group relative flex shrink-0 flex-col items-center justify-between overflow-hidden rounded-t-[3px] border border-black/40 text-center transition-transform " +
        (active ? "-translate-y-1 ring-2 ring-amber-200/80" : "hover:-translate-y-1")
      }
      style={{
        width,
        height,
        background: `linear-gradient(90deg, ${a} 0%, ${b} 50%, ${a} 100%)`,
        boxShadow:
          "inset 2px 0 0 rgba(255,255,255,0.08), inset -2px 0 0 rgba(0,0,0,0.45), 0 4px 8px -2px rgba(0,0,0,0.6)",
      }}
    >
      {/* top gilt band */}
      <span
        aria-hidden
        className="block w-full"
        style={{ height: 6, background: gold, opacity: 0.85 }}
      />
      {/* vertical title */}
      <span
        className="flex flex-1 items-center justify-center px-1 font-serif text-[10px] font-semibold leading-tight tracking-wider text-amber-50"
        style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
      >
        <span className="line-clamp-3 max-h-full">{title || "Untitled"}</span>
      </span>
      {/* meta dot */}
      <span
        className="block w-full text-[7px] uppercase tracking-widest text-amber-100/70"
        style={{ paddingBottom: 2 }}
        aria-hidden
      >
        ·
      </span>
      {/* bottom gilt band */}
      <span
        aria-hidden
        className="block w-full"
        style={{ height: 6, background: gold, opacity: 0.85 }}
      />
      <span className="sr-only">{meta}</span>
    </button>
  );
}

function BookGhost() {
  return (
    <div
      aria-hidden
      className="shrink-0 rounded-t-sm border border-dashed border-amber-200/15 opacity-40"
      style={{
        width: 30,
        height: 95,
        background:
          "repeating-linear-gradient(180deg, rgba(255,220,170,0.04) 0 4px, transparent 4px 8px)",
      }}
    />
  );
}

type ObjectKind =
  | "ink-bottle"
  | "book-stack"
  | "vial"
  | "lantern"
  | "paint-vial"
  | "coin-gauge"
  | "warning-marker"
  | "blueprint-spine"
  | "ready-tome";

function objectKindFor(label: string): ObjectKind {
  switch (label) {
    case "Idea Notes": return "ink-bottle";
    case "Info Gathered": return "book-stack";
    case "Clarity": return "vial";
    case "Audience": return "lantern";
    case "Design": return "paint-vial";
    case "Money": return "coin-gauge";
    case "Risks": return "warning-marker";
    case "Build Plan": return "blueprint-spine";
    case "Ready": return "ready-tome";
    default: return "vial";
  }
}

function CategoryBook({
  label,
  hint,
  pct,
  statusLabel,
  active,
  onClick,
}: {
  label: string;
  hint: string;
  pct: number;
  statusLabel: string;
  active: boolean;
  onClick: () => void;
}) {
  const kind = objectKindFor(label);
  const full = pct >= 100;
  // glow palette: empty parchment-amber, growing green, full gold
  const fill =
    pct === 0
      ? { core: "rgba(180,140,80,0.25)", glow: "rgba(220,180,110,0.35)", top: "rgba(255,230,170,0.4)" }
      : full
        ? { core: "#f5d27a", glow: "rgba(255,210,120,0.85)", top: "#fff4c0" }
        : pct < 50
          ? { core: "#5fc27a", glow: "rgba(110,220,140,0.7)", top: "#c8f5d4" }
          : { core: "#9be07f", glow: "rgba(180,240,140,0.8)", top: "#e8ffd0" };

  const height = 150;
  const width = 82;

  return (
    <button
      onClick={onClick}
      title={`${label} — ${hint} · ${statusLabel}`}
      className={
        "group relative flex shrink-0 flex-col items-center justify-end bg-transparent transition-transform " +
        (active ? "-translate-y-1.5" : "hover:-translate-y-1")
      }
      style={{ width, height }}
    >
      {/* active warm glow halo */}
      {active && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-full blur-xl"
          style={{ background: "radial-gradient(circle at 50% 60%, rgba(255,220,150,0.55), transparent 70%)" }}
        />
      )}
      {/* underglow puddle on the shelf */}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-2 left-1/2 h-3 w-[70%] -translate-x-1/2 rounded-full blur-md"
        style={{ background: pct === 0 ? "rgba(0,0,0,0.45)" : fill.glow, opacity: 0.7 }}
      />

      <ShelfObject kind={kind} pct={pct} fill={fill} />

      {/* small carved label plate beneath object */}
      <span
        className="relative mt-1 max-w-full truncate rounded-sm border border-amber-950/70 px-1.5 py-0.5 font-serif text-[10px] font-semibold uppercase tracking-wider text-amber-50"
        style={{
          background: "linear-gradient(180deg, #5a3a18 0%, #3a230d 100%)",
          textShadow: "0 1px 0 rgba(0,0,0,0.55)",
          boxShadow: "inset 0 1px 0 rgba(255,210,150,0.25), 0 2px 4px rgba(0,0,0,0.5)",
        }}
      >
        {label}
      </span>
      <span className="font-serif text-[9px] italic text-amber-100/70">{statusLabel}</span>
    </button>
  );
}

type FillPalette = { core: string; glow: string; top: string };

function ShelfObject({ kind, pct, fill }: { kind: ObjectKind; pct: number; fill: FillPalette }) {
  // shared sizing
  const W = 64;
  const H = 110;
  const fillH = Math.max(0, Math.min(100, pct)) / 100;

  // Build a vessel-shaped clip using SVG. The fill rises from bottom.
  const vesselId = `vessel-${kind}-${Math.round(pct)}-${Math.random().toString(36).slice(2, 7)}`;

  // Outline path per kind
  const paths: Record<ObjectKind, string> = {
    "ink-bottle": "M18 6 H46 V14 C46 16 48 16 48 20 V30 C56 34 58 44 58 56 V92 C58 100 52 104 44 104 H20 C12 104 6 100 6 92 V56 C6 44 8 34 16 30 V20 C16 16 18 16 18 14 Z",
    "book-stack": "M6 14 H58 V28 H6 Z M4 30 H60 V46 H4 Z M6 48 H58 V64 H6 Z M4 66 H60 V84 H4 Z M6 86 H58 V102 H6 Z",
    "vial": "M22 6 H42 V12 H40 V28 L52 92 C53 100 47 104 40 104 H24 C17 104 11 100 12 92 L24 28 V12 H22 Z",
    "lantern": "M20 6 H44 V12 H46 L52 18 V24 H12 V18 L18 12 H20 Z M14 26 H50 V90 H14 Z M16 92 H48 V100 H16 Z",
    "paint-vial": "M16 6 H48 V14 H44 V26 C52 30 56 38 56 50 V94 C56 100 52 104 46 104 H18 C12 104 8 100 8 94 V50 C8 38 12 30 20 26 V14 H16 Z",
    "coin-gauge": "M10 14 C10 8 18 6 32 6 C46 6 54 8 54 14 V94 C54 100 46 104 32 104 C18 104 10 100 10 94 Z",
    "warning-marker": "M32 4 L60 100 H4 Z",
    "blueprint-spine": "M10 6 H54 C56 6 58 8 58 10 V100 C58 102 56 104 54 104 H10 C8 104 6 102 6 100 V10 C6 8 8 6 10 6 Z",
    "ready-tome": "M8 8 H56 C58 8 60 10 60 12 V100 C60 102 58 104 56 104 H8 C6 104 4 102 4 100 V12 C4 10 6 8 8 8 Z",
  };

  return (
    <svg width={W} height={H} viewBox="0 0 64 110" className="relative drop-shadow-[0_4px_6px_rgba(0,0,0,0.55)]">
      <defs>
        {/* clip to vessel shape so fill stays inside */}
        <clipPath id={vesselId}>
          <path d={paths[kind]} />
        </clipPath>
        {/* glass body gradient */}
        <linearGradient id={`glass-${vesselId}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="45%" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
        </linearGradient>
        {/* liquid fill gradient */}
        <linearGradient id={`liquid-${vesselId}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={fill.core} />
          <stop offset="80%" stopColor={fill.core} stopOpacity="0.95" />
          <stop offset="100%" stopColor={fill.top} />
        </linearGradient>
        {/* wood for book-style kinds */}
        <linearGradient id={`wood-${vesselId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a3a18" />
          <stop offset="100%" stopColor="#2a1606" />
        </linearGradient>
      </defs>

      {/* vessel body (back) */}
      <path
        d={paths[kind]}
        fill={
          kind === "book-stack" || kind === "blueprint-spine" || kind === "ready-tome"
            ? `url(#wood-${vesselId})`
            : "rgba(20,12,4,0.55)"
        }
        stroke="rgba(20,10,2,0.9)"
        strokeWidth="1.2"
      />

      {/* rising fill, clipped to vessel */}
      <g clipPath={`url(#${vesselId})`}>
        <rect
          x="0"
          y={110 - 110 * fillH}
          width="64"
          height={110 * fillH}
          fill={`url(#liquid-${vesselId})`}
        />
        {/* shimmering surface line */}
        {pct > 0 && (
          <rect
            x="0"
            y={Math.max(0, 110 - 110 * fillH - 1)}
            width="64"
            height="2"
            fill={fill.top}
            opacity="0.9"
          />
        )}
        {/* inner highlight for glass kinds */}
        {(kind === "vial" || kind === "paint-vial" || kind === "ink-bottle" || kind === "lantern") && (
          <rect x="0" y="0" width="64" height="110" fill={`url(#glass-${vesselId})`} />
        )}
      </g>

      {/* outline / glass rim re-stroked on top */}
      <path
        d={paths[kind]}
        fill="none"
        stroke="rgba(0,0,0,0.85)"
        strokeWidth="1.3"
      />
      {/* shine streak */}
      <path
        d="M14 26 Q18 60 16 92"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity={kind === "book-stack" || kind === "blueprint-spine" || kind === "ready-tome" ? 0 : 0.5}
      />

      {/* kind-specific accents */}
      {kind === "lantern" && (
        <>
          <circle cx="32" cy="14" r="2" fill="#caa14a" />
          <line x1="14" y1="26" x2="50" y2="26" stroke="#3a230d" strokeWidth="1.2" />
        </>
      )}
      {kind === "coin-gauge" && pct > 0 && (
        <g opacity="0.9">
          <circle cx="32" cy={104 - 14 - 110 * fillH * 0.7} r="3" fill="#caa14a" stroke="#7a4e1a" />
        </g>
      )}
      {kind === "warning-marker" && (
        <text x="32" y="78" textAnchor="middle" fontSize="22" fontWeight="800" fill={pct < 50 ? "#fff" : "#fff8dc"} opacity="0.85">!</text>
      )}
      {kind === "blueprint-spine" && (
        <g stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" fill="none">
          <line x1="12" y1="22" x2="52" y2="22" />
          <line x1="12" y1="40" x2="52" y2="40" />
          <line x1="12" y1="60" x2="52" y2="60" />
          <line x1="12" y1="80" x2="52" y2="80" />
        </g>
      )}
      {kind === "ready-tome" && pct >= 100 && (
        <text x="32" y="62" textAnchor="middle" fontSize="22" fill="#fff4c0" opacity="0.95">★</text>
      )}
    </svg>
  );
}


// ============================================================
// Journal (center)
// ============================================================

function Journal(props: {
  selected: LightbulbIdea;
  activeCategory: CategoryKey;
  setActiveCategory: (k: CategoryKey) => void;
  getCategoryValue: (k: CategoryKey) => string;
  setCategoryValue: (k: CategoryKey, v: string) => void;
  updateSelected: (p: Partial<LightbulbIdea>) => void;
  moveToPreClarity: (id: string) => void;
  extras: IdeaExtras;
  addAttachment: (kind: Attachment["kind"], label: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const {
    selected,
    activeCategory,
    setActiveCategory,
    getCategoryValue,
    setCategoryValue,
    updateSelected,
    moveToPreClarity,
    extras,
    addAttachment,
    fileInputRef,
  } = props;

  const activeDef = categoryDefs.find((c) => c.key === activeCategory)!;
  const value = getCategoryValue(activeCategory);

  // Voice dictation
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "processing">("idle");
  const recognitionRef = useRef<any>(null);
  const voiceSupported = useMemo(() => {
    if (typeof window === "undefined") return false;
    return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }, []);

  const startVoice = useCallback(() => {
    if (!voiceSupported) {
      window.alert("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";
    let finalText = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      const base = value ? value.replace(/\s+$/, "") + " " : "";
      setCategoryValue(activeCategory, base + finalText + interim);
    };
    rec.onerror = () => setVoiceState("idle");
    rec.onend = () => {
      setVoiceState((s) => (s === "listening" ? "processing" : s));
      setTimeout(() => setVoiceState("idle"), 350);
    };
    recognitionRef.current = rec;
    setVoiceState("listening");
    try { rec.start(); } catch { setVoiceState("idle"); }
  }, [voiceSupported, value, activeCategory, setCategoryValue]);

  const stopVoice = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch {}
    setVoiceState("processing");
  }, []);

  useEffect(() => () => { try { recognitionRef.current?.stop(); } catch {} }, []);

  return (
    <div className="relative mx-auto w-full max-w-[760px]">
      {/* warm desk pool of light behind the desk */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-16 -inset-y-8 -z-10 rounded-[40%] opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(255,220,150,0.55), rgba(255,180,90,0.15) 55%, transparent 75%)",
        }}
      />
      {/* desk shadow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 -bottom-6 h-12 rounded-full opacity-70 blur-2xl"
        style={{ background: "rgba(20,10,2,0.7)" }}
      />
      {/* wooden writing tray under scroll */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-4 -bottom-2 h-4 rounded-sm"
        style={{
          background: "linear-gradient(180deg, #6b3f1a 0%, #4a2810 60%, #2a1505 100%)",
          boxShadow: "0 6px 12px -6px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,210,150,0.25)",
        }}
      />

      {/* open low journal / scroll */}
      <div
        className="relative overflow-hidden rounded-[10px] border border-amber-950/70 shadow-[0_18px_40px_-18px_rgba(20,8,2,0.75)]"
        style={{
          background:
            "linear-gradient(180deg, #fbf0cb 0%, #f0dca5 100%), radial-gradient(circle at 20% 10%, rgba(255,255,255,0.5), transparent 60%)",
          backgroundBlendMode: "overlay",
        }}
      >
        <CornerOrnament position="tl" />
        <CornerOrnament position="tr" />
        <CornerOrnament position="bl" />
        <CornerOrnament position="br" />

        {/* leather edges left/right (thin) */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-2"
          style={{ background: "linear-gradient(90deg, #3a1d08, rgba(60,30,8,0))" }} />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-2"
          style={{ background: "linear-gradient(270deg, #3a1d08, rgba(60,30,8,0))" }} />
        {/* parchment grain */}
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage: "radial-gradient(rgba(120,72,20,0.18) 1px, transparent 1px)",
            backgroundSize: "12px 12px",
          }} />

        <div className="relative px-5 py-3">
          {/* compact header row */}
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-serif text-[10px] uppercase tracking-[0.25em] text-amber-900/60">
                Open Desk · {activeDef.label}
              </div>
              <input
                value={selected.title}
                onChange={(e) => updateSelected({ title: e.target.value })}
                className="w-full bg-transparent font-serif text-xl font-semibold leading-tight text-amber-950 focus:outline-none"
                placeholder="Name this idea…"
              />
            </div>
            <span className="hidden shrink-0 rounded-sm border border-amber-900/30 bg-amber-200/60 px-2 py-0.5 font-serif text-[10px] uppercase tracking-wider text-amber-900 sm:inline">
              {stageLabels[selected.stage]}
            </span>
            {selected.stage === "lightbulb" && (
              <button
                onClick={() => moveToPreClarity(selected.id)}
                className="shrink-0 rounded-sm border border-emerald-900/60 px-3 py-1.5 font-serif text-[11px] font-medium text-emerald-50 shadow"
                style={{ background: "linear-gradient(180deg, #3f9c63 0%, #1f6a3a 60%, #0f3a20 100%)" }}
              >
                Organize This Idea →
              </button>
            )}
          </div>

          {/* horizontal writing tray */}
          <div className="mt-2 rounded-md border border-amber-900/25 bg-amber-50/60 p-2 shadow-inner">
            <textarea
              value={value}
              onChange={(e) => setCategoryValue(activeCategory, e.target.value)}
              rows={3}
              placeholder={`Add a thought to ${activeDef.label.toLowerCase()}… type or tap the mic to speak.`}
              className="block w-full resize-none bg-transparent px-1 font-serif text-[14px] leading-6 text-amber-950 placeholder:text-amber-900/40 focus:outline-none"
            />
            {/* tool row */}
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-amber-900/15 pt-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    files.forEach((f) => addAttachment("file", f.name));
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                />
                <MicButton
                  state={voiceState}
                  onStart={startVoice}
                  onStop={stopVoice}
                  supported={voiceSupported}
                />
                <DeskIconButton
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach File / Photo"
                  icon="📎"
                  label="Attach"
                />
                <DeskIconButton
                  onClick={() => {
                    const url = window.prompt("Paste a link to attach");
                    if (url) addAttachment("link", url);
                  }}
                  title="Add Link"
                  icon="🔗"
                  label="Link"
                />
                <DeskIconButton
                  onClick={() => {
                    const note = window.prompt("Quick note");
                    if (note) addAttachment("note", note);
                  }}
                  title="Add Note"
                  icon="📝"
                  label="Note"
                />
              </div>
              <span className="font-serif text-[10px] italic text-amber-900/60">
                {voiceState === "listening"
                  ? "Listening…"
                  : voiceState === "processing"
                    ? "Transcribing…"
                    : activeDef.hint}
              </span>
            </div>
          </div>

          {extras.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="font-serif text-[10px] uppercase tracking-widest text-amber-900/60">
                Pinned:
              </span>
              {extras.attachments.slice(0, 6).map((a) => (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-1 rounded-sm border border-amber-900/30 bg-amber-50 px-1.5 py-0.5 font-serif text-[10px] text-amber-900 shadow-sm"
                >
                  <span className="uppercase tracking-wider text-amber-700/80">{a.kind}</span>
                  <span className="max-w-[140px] truncate">{a.label}</span>
                </span>
              ))}
              {extras.attachments.length > 6 && (
                <span className="font-serif text-[10px] text-amber-900/60">
                  +{extras.attachments.length - 6} more
                </span>
              )}
            </div>
          )}

          <div className="mt-2 font-serif text-[10px] italic text-amber-900/55">
            Updated {timeAgo(selected.updatedAt)} · Next: {selected.nextAction}
          </div>
        </div>
      </div>
    </div>
  );
}

function MicButton({
  state,
  onStart,
  onStop,
  supported,
}: {
  state: "idle" | "listening" | "processing";
  onStart: () => void;
  onStop: () => void;
  supported: boolean;
}) {
  const listening = state === "listening";
  const processing = state === "processing";
  return (
    <button
      onClick={listening ? onStop : onStart}
      disabled={processing || !supported}
      title={
        !supported
          ? "Voice not supported in this browser"
          : listening
            ? "Stop recording"
            : "Speak note"
      }
      className={
        "relative inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 font-serif text-[11px] shadow-sm transition " +
        (listening
          ? "border-red-900/60 text-red-50"
          : "border-amber-900/40 text-amber-950 hover:brightness-105")
      }
      style={{
        background: listening
          ? "linear-gradient(180deg, #d23a2a 0%, #8a1a10 100%)"
          : "linear-gradient(180deg, #f3dca3 0%, #d8b06a 60%, #a87a2a 100%)",
        opacity: !supported ? 0.5 : 1,
      }}
    >
      {listening && (
        <span
          aria-hidden
          className="absolute -inset-0.5 rounded-sm border border-red-400/70"
          style={{ animation: "pulse 1.2s ease-in-out infinite" }}
        />
      )}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0" />
        <line x1="12" y1="18" x2="12" y2="22" />
      </svg>
      <span>
        {listening ? "Stop" : processing ? "…" : "Speak Note"}
      </span>
      {listening && (
        <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-red-200" style={{ animation: "pulse 0.9s ease-in-out infinite" }} />
      )}
    </button>
  );
}

function DeskIconButton({
  onClick,
  title,
  icon,
  label,
}: {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="inline-flex items-center gap-1 rounded-sm border border-amber-900/40 px-2 py-1.5 font-serif text-[11px] text-amber-950 shadow-sm transition hover:brightness-105"
      style={{ background: "linear-gradient(180deg, #f3dca3 0%, #d8b06a 60%, #a87a2a 100%)" }}
    >
      <span>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function DeskButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-sm border border-amber-900/40 px-3 py-1.5 font-serif text-xs text-amber-950 shadow-sm transition hover:brightness-105"
      style={{
        background:
          "linear-gradient(180deg, #f3dca3 0%, #d8b06a 60%, #a87a2a 100%)",
      }}
    >
      {label}
    </button>
  );
}

function CornerOrnament({
  position,
}: {
  position: "tl" | "tr" | "bl" | "br";
}) {
  const pos: Record<string, string> = {
    tl: "top-1 left-1",
    tr: "top-1 right-1 rotate-90",
    bl: "bottom-1 left-1 -rotate-90",
    br: "bottom-1 right-1 rotate-180",
  };
  return (
    <svg
      aria-hidden
      className={`pointer-events-none absolute ${pos[position]} h-6 w-6 opacity-60`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M2 2 H10 M2 2 V10 M2 2 C6 2 10 6 10 10"
        stroke="#7a4e1a"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="1.2" fill="#7a4e1a" />
    </svg>
  );
}

function Dot({ pct }: { pct: number }) {

  const color =
    pct === 0
      ? "#c9b18a"
      : pct < 50
        ? "#d97a3b"
        : pct < 100
          ? "#caa14a"
          : "#3f9c63";
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full"
      style={{ background: color, boxShadow: `0 0 6px ${color}` }}
    />
  );
}

// ============================================================
// helpers
// ============================================================

// ============================================================
// Clarity — guide presence
// ============================================================

function ClarityGuide({
  selected,
  currentQuestion,
  answeredCount,
  totalQuestions,
  onSkip,
}: {
  selected: LightbulbIdea | undefined;
  currentQuestion: ClarityQuestion | undefined;
  answeredCount: number;
  totalQuestions: number;
  onSkip: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [minimized, setMinimized] = useState(false);

  const fallbackTip = useMemo(() => {
    if (!selected)
      return "Welcome to the Creator Library. Open My Library and choose a spark to begin.";
    if (!currentQuestion)
      return "You've answered every question I had. This idea is glowing — try Next Stage.";
    return null;
  }, [selected, currentQuestion]);

  const bubbleText = fallbackTip ?? currentQuestion!.prompt;
  const showQuestionControls = !!selected && !!currentQuestion;

  // Speech bubble anchored to Clarity (the squirrel) in the background art.
  // Desktop: floats above the squirrel's head on the right side of the scene,
  // with a tail pointing down-right toward her. Mobile: tucked bottom-right
  // above the composer with a downward tail.
  return (
    <div
      className={[
        "pointer-events-none absolute z-30",
        "right-0 bottom-[calc(100%-2px)] sm:right-0 lg:right-0",
      ].join(" ")}
    >
      <div className="pointer-events-auto relative flex flex-col items-end gap-1.5">
        {open && !minimized ? (
          <div
            className="relative w-[min(76vw,18rem)] rounded-2xl border border-amber-950/60 p-3 shadow-2xl lg:w-72"
            style={{
              background:
                "linear-gradient(180deg, #fbf0cb 0%, #f0dca5 100%)",
              animation: "clarity-float 5s ease-in-out infinite",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="font-serif text-[11px] uppercase tracking-[0.2em] text-amber-900/70">
                Clarity asks
              </div>
            </div>
            <p className="mt-1.5 font-serif text-sm leading-snug text-amber-950">
              {showQuestionControls ? `“${bubbleText}”` : bubbleText}
            </p>
            <p className="mt-1.5 font-serif text-[10.5px] italic leading-snug text-amber-900/70">
              Answer below by typing or speaking a note.
            </p>
            {showQuestionControls && (
              <div className="mt-2 flex items-center justify-between gap-2">
                <button
                  onClick={onSkip}
                  className="font-serif text-[11px] italic text-amber-900/70 underline-offset-2 hover:underline"
                >
                  Next Question
                </button>
                <button
                  onClick={() => setMinimized(true)}
                  className="font-serif text-[11px] text-amber-900/70 hover:text-amber-950"
                >
                  Hide
                </button>
              </div>
            )}

            {/* Desktop tail — points down-right toward the squirrel */}
            <div
              aria-hidden
              className="absolute"
              style={{
                right: "0.75rem",
                bottom: "-10px",
                width: 0,
                height: 0,
                borderLeft: "10px solid transparent",
                borderRight: "16px solid transparent",
                borderTop: "16px solid #f0dca5",
                filter: "drop-shadow(0 1px 0 rgba(60,30,8,0.5))",
              }}
            />
          </div>
        ) : (
          <button
            onClick={() => {
              setOpen(true);
              setMinimized(false);
            }}
            aria-label="Show Clarity's question"
            className="rounded-full border border-amber-950/60 px-3 py-1.5 font-serif text-[11px] uppercase tracking-[0.18em] text-amber-950 shadow-lg transition hover:brightness-105"
            style={{
              background:
                "linear-gradient(180deg, #fbf0cb 0%, #f0dca5 100%)",
              animation: "clarity-float 5s ease-in-out infinite",
            }}
          >
            Clarity asks{showQuestionControls ? " ?" : "…"}
          </button>
        )}
      </div>
    </div>
  );
}


function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function formatSignals(idea: LightbulbIdea): string {
  const s = idea.signals;
  if (!s) return "";
  const lines: string[] = [];
  if (s.shape) lines.push(`Shape: ${s.shape}`);
  if (s.whoItHelps) lines.push(`Who it helps: ${s.whoItHelps}`);
  if (s.supportNeed) lines.push(`Support: ${s.supportNeed}`);
  if (s.riskWatch) lines.push(`Risk watch: ${s.riskWatch}`);
  return lines.join("\n");
}

// ============================================================
// NoteDesk — Post-it note capture
// ============================================================

const postItPalettes: Array<{ bg: string; edge: string; tape: string }> = [
  { bg: "linear-gradient(180deg, #f8e8c2 0%, #ecd29a 100%)", edge: "#b08840", tape: "rgba(120,80,30,0.55)" },
  { bg: "linear-gradient(180deg, #f4dcae 0%, #e2c084 100%)", edge: "#9c6b28", tape: "rgba(120,80,30,0.55)" },
  { bg: "linear-gradient(180deg, #efe1c0 0%, #d8c290 100%)", edge: "#8a6020", tape: "rgba(120,80,30,0.55)" },
  { bg: "linear-gradient(180deg, #e8d3a0 0%, #c9ad6e 100%)", edge: "#7a5018", tape: "rgba(120,80,30,0.55)" },
  { bg: "linear-gradient(180deg, #ead7ab 0%, #cdb47a 100%)", edge: "#8a5e22", tape: "rgba(120,80,30,0.55)" },
];


function NoteDesk(props: {
  selected: LightbulbIdea;
  extras: IdeaExtras;
  addPostIt: (text: string, kind: PostIt["kind"]) => void;
  addAttachment: (kind: Attachment["kind"], label: string) => void;
  updateSelected: (p: Partial<LightbulbIdea>) => void;
  moveToPreClarity: (id: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  currentQuestion: ClarityQuestion | undefined;
  answeredCount: number;
  totalQuestions: number;
  onSkipClarityQuestion: () => void;
}) {
  const {
    selected,
    extras,
    addPostIt,
    addAttachment,
    updateSelected,
    moveToPreClarity,
    fileInputRef,
    currentQuestion,
    answeredCount,
    totalQuestions,
    onSkipClarityQuestion,
  } = props;

  const [draft, setDraft] = useState("");
  const [kind, setKind] = useState<PostIt["kind"]>("idea-notes");

  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "processing">("idle");
  const recognitionRef = useRef<any>(null);
  const voiceSupported = useMemo(() => {
    if (typeof window === "undefined") return false;
    return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }, []);

  const startVoice = useCallback(() => {
    if (!voiceSupported) {
      window.alert("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";
    let finalText = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      setDraft((d) => {
        const base = d ? d.replace(/\s+$/, "") + " " : "";
        return base + finalText + interim;
      });
    };
    rec.onerror = () => setVoiceState("idle");
    rec.onend = () => {
      setVoiceState((s) => (s === "listening" ? "processing" : s));
      setTimeout(() => setVoiceState("idle"), 350);
    };
    recognitionRef.current = rec;
    setVoiceState("listening");
    try { rec.start(); } catch { setVoiceState("idle"); }
  }, [voiceSupported]);

  const stopVoice = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch {}
    setVoiceState("processing");
  }, []);

  useEffect(() => () => { try { recognitionRef.current?.stop(); } catch {} }, []);

  const submit = () => {
    if (!draft.trim()) return;
    addPostIt(draft, kind);
    setDraft("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="relative flex w-full flex-1 flex-col">
      {/* Notes collection — parchment slips on the desk */}
      <div className="relative mx-auto w-full max-w-[920px] flex-1">
        {extras.posts.length === 0 && !selected.messy && (
          <div
            className="relative mx-auto max-w-md rounded-md border border-amber-950/40 px-5 py-4 text-center font-serif italic text-amber-950 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.7)]"
            style={{
              background:
                "linear-gradient(180deg, rgba(252,236,197,0.92) 0%, rgba(238,214,160,0.92) 100%)",
            }}
          >
            No notes yet. Jot one thought below and tap Add — each slip strengthens this idea.
          </div>
        )}
        <div className="flex flex-wrap items-start justify-center gap-3 pb-44 lg:pb-36">
          {selected.messy && (
            <PostItCard
              text={selected.messy}
              kind="idea-notes"
              ts={selected.updatedAt}
              hue={0}
              pinned
              categories={["lightbulb"]}
            />
          )}
          {extras.posts.map((p, i) => (
            <PostItCard
              key={p.id}
              text={p.text}
              kind={p.kind}
              ts={p.ts}
              hue={i + 1}
              categories={p.categories}
            />
          ))}
        </div>
      </div>

      {/* Quick capture — parchment slip on a carved wood tray */}
      <div className="sticky bottom-0 left-0 right-0 z-20 mt-2">
        <div
          className="mx-auto w-full max-w-[760px] px-2 pb-3"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          {/* wood tray under the parchment */}
          <div className="relative">
            <ClarityGuide
              selected={selected}
              currentQuestion={currentQuestion}
              answeredCount={answeredCount}
              totalQuestions={totalQuestions}
              onSkip={onSkipClarityQuestion}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-2 -inset-y-1 rounded-[14px]"
              style={{
                background:
                  "linear-gradient(180deg, #6b3f1a 0%, #4a2810 60%, #2a1505 100%)",
                boxShadow:
                  "0 14px 30px -12px rgba(20,8,2,0.8), inset 0 1px 0 rgba(255,210,150,0.2)",
              }}
            />
            <div
              className="relative overflow-hidden rounded-[10px] border border-amber-950/70 shadow-inner"
              style={{
                background:
                  "linear-gradient(180deg, #f8e8c2 0%, #ecd29a 100%)",
              }}
            >
              {/* parchment grain */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "radial-gradient(rgba(120,72,20,0.18) 1px, transparent 1px)",
                  backgroundSize: "12px 12px",
                }}
              />
              <div className="relative flex items-center gap-1 border-b border-amber-900/20 px-3 py-1 font-serif text-[10px] uppercase tracking-wider text-amber-900/70">
                <button
                  onClick={() => setKind("idea-notes")}
                  className={
                    "rounded-sm px-2 py-0.5 transition " +
                    (kind === "idea-notes"
                      ? "bg-amber-900 text-amber-50 shadow"
                      : "hover:bg-amber-900/10")
                  }
                >
                  Idea Notes
                </button>
                <button
                  onClick={() => setKind("info-gathered")}
                  className={
                    "rounded-sm px-2 py-0.5 transition " +
                    (kind === "info-gathered"
                      ? "bg-amber-900 text-amber-50 shadow"
                      : "hover:bg-amber-900/10")
                  }
                >
                  Info Gathered
                </button>
                <span className="ml-auto italic normal-case tracking-normal">
                  {voiceState === "listening"
                    ? "Listening…"
                    : voiceState === "processing"
                      ? "Transcribing…"
                      : `${extras.posts.length} ${extras.posts.length === 1 ? "note" : "notes"}`}
                </span>
              </div>
              <div className="relative flex items-end gap-2 px-3 py-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onKeyDown}
                  rows={2}
                  placeholder="Add one thought… type or tap the mic to speak. (⌘/Ctrl + Enter to add)"
                  className="block min-h-[44px] flex-1 resize-none bg-transparent px-1 font-serif text-[14px] leading-snug text-amber-950 placeholder:text-amber-900/50 focus:outline-none"
                />
                <button
                  onClick={submit}
                  disabled={!draft.trim()}
                  className="shrink-0 rounded-md border border-amber-900/60 px-3 py-2 font-serif text-[12px] font-semibold text-amber-50 shadow transition disabled:opacity-50"
                  style={{
                    background:
                      "linear-gradient(180deg, #5a3a18 0%, #3a230d 100%)",
                  }}
                >
                  Add
                </button>
              </div>
              <div className="relative flex flex-wrap items-center gap-1.5 border-t border-amber-900/15 px-3 py-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    files.forEach((f) => addAttachment("file", f.name));
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                />
                <MicButton
                  state={voiceState}
                  onStart={startVoice}
                  onStop={stopVoice}
                  supported={voiceSupported}
                />
                <DeskIconButton
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach File / Photo"
                  icon={<Paperclip className="h-3.5 w-3.5" />}
                  label="Attach"
                />
                <DeskIconButton
                  onClick={() => {
                    const url = window.prompt("Paste a link to attach");
                    if (url) addAttachment("link", url);
                  }}
                  title="Add Link"
                  icon={<Link2 className="h-3.5 w-3.5" />}
                  label="Link"
                />
                {extras.attachments.length > 0 && (
                  <span className="ml-auto font-serif text-[10px] italic text-amber-900/65">
                    {extras.attachments.length} attachment
                    {extras.attachments.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function PostItCard({
  text,
  kind,
  ts,
  hue,
  pinned,
  categories,
}: {
  text: string;
  kind: PostIt["kind"];
  ts: number;
  hue: number;
  pinned?: boolean;
  categories?: CategoryKey[];
}) {
  const [open, setOpen] = useState(false);
  const fallback: CategoryKey = kind === "info-gathered" ? "pre-clarity" : "lightbulb";
  const { palette, label, isMixed } = postItPaletteFor(categories, fallback);
  const rot = ((hue * 37) % 7) - 3;
  const preview = (() => {
    const firstLine = text.split(/\n/)[0]?.trim() ?? "";
    const base = firstLine || text.trim();
    return base.length > 64 ? base.slice(0, 62).replace(/\s+\S*$/, "") + "…" : base;
  })();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative w-[150px] cursor-pointer rounded-sm border text-left shadow-[0_10px_18px_-10px_rgba(20,8,2,0.7)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_22px_-10px_rgba(20,8,2,0.75)] sm:w-[170px]"
        style={{
          background: palette.bg,
          borderColor: palette.edge,
          transform: `rotate(${rot}deg)`,
        }}
        title="Open full note"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -top-2 left-1/2 h-3 w-12 -translate-x-1/2 -rotate-3 rounded-sm"
          style={{ background: palette.tape, boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }}
        />
        <div className="px-2.5 pt-3 pb-2">
          <div className="mb-1 flex items-center justify-between gap-1 font-serif text-[9px] uppercase tracking-widest text-amber-900/80">
            <span
              className="truncate rounded-sm border px-1 py-[1px]"
              style={{ background: palette.chip, borderColor: palette.edge }}
              title={isMixed ? "Covers multiple categories" : label}
            >
              {isMixed ? "Mixed" : label}
            </span>
            {pinned ? <span>· seed</span> : <span className="shrink-0">{timeAgo(ts)}</span>}
          </div>
          <p className="line-clamp-2 break-words font-serif text-[12.5px] leading-snug text-amber-950">
            {preview}
          </p>
        </div>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md border-amber-950/80 text-amber-950" style={{ background: palette.bg }}>
          <DialogHeader>
            <DialogTitle className="font-serif text-amber-950">
              {isMixed ? "Mixed note" : label}
            </DialogTitle>
            <DialogDescription className="font-serif text-[11px] uppercase tracking-widest text-amber-900/80">
              {pinned ? "Seed note" : timeAgo(ts)}
              {categories && categories.length > 0 && (
                <> · {categories.map((c) => postItCategoryPalette[c].label).join(", ")}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <p className="whitespace-pre-wrap break-words font-serif text-[14px] leading-relaxed text-amber-950">
            {text}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}


