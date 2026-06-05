import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  seedIdeas,
  stageLabels,
  type LightbulbIdea,
} from "@/lib/dabottree-state";
import libraryBgAsset from "@/assets/dabottree-library-bg.png.asset.json";
const libraryBg = libraryBgAsset.url;
import logo from "@/assets/dabottree-logo.png";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Menu, BookOpen, Paperclip, Link2, Plus } from "lucide-react";


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

const categoryDefs: { key: CategoryKey; label: string; hint: string }[] = [
  { key: "lightbulb", label: "Idea Notes", hint: "Dump everything you know" },
  { key: "pre-clarity", label: "Info Gathered", hint: "Files, links, context" },
  {
    key: "clarity",
    label: "Clarity",
    hint: "Turn messy notes into a clear plan",
  },
  { key: "market", label: "Audience", hint: "Who it's for" },
  { key: "design", label: "Design", hint: "How it looks & feels" },
  { key: "money", label: "Money", hint: "How it sustains" },
  { key: "risks", label: "Risks", hint: "What to watch out for" },
  { key: "build", label: "Build Plan", hint: "How it gets made" },
  { key: "ready", label: "Ready", hint: "Greenlight for project" },
];



type CategoryNotes = Partial<Record<CategoryKey, string>>;
type Attachment = { id: string; kind: "file" | "link" | "note"; label: string };
type PostIt = {
  id: string;
  kind: "idea-notes" | "info-gathered";
  text: string;
  ts: number;
};
type IdeaExtras = {
  notes: CategoryNotes;
  attachments: Attachment[];
  posts: PostIt[];
};

function emptyExtras(): IdeaExtras {
  return { notes: {}, attachments: [], posts: [] };
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


// suggested idea seeds based on a creator field
const suggestedSeeds = [
  { id: "seed-1", title: "Kids' bedtime story app" },
  { id: "seed-2", title: "Local skill swap board" },
  { id: "seed-3", title: "Plant care reminder game" },
  { id: "seed-4", title: "Neighborhood pet help loop" },
];



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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pull draft from front-page intake
  useEffect(() => {
    if (typeof window === "undefined") return;
    let draft = "";
    try {
      draft = sessionStorage.getItem("dabottree:draftIdea") ?? "";
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
      };
      setIdeas((prev) => [newIdea, ...prev]);
      setSelectedId(id);
      try {
        sessionStorage.removeItem("dabottree:draftIdea");
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
        },
      };
    });
  };

  const addPostIt = (text: string, kind: PostIt["kind"]) => {
    if (!selected || !text.trim()) return;
    const p: PostIt = {
      id: `post-${Date.now()}`,
      kind,
      text: text.trim(),
      ts: Date.now(),
    };
    const nextPosts = [p, ...selectedExtras.posts];
    updateExtras({ posts: nextPosts });
    // bump idea readiness a little for each captured thought
    updateSelected({
      shelfReadiness: Math.min(100, selected.shelfReadiness + 4),
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

  return (
    <main
      className="relative flex w-screen flex-col text-amber-950"
      style={{ minHeight: "100dvh" }}
    >
      {/* living tree library background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-30 bg-cover bg-center"
        style={{ backgroundImage: `url(${libraryBg})` }}
      />
      {/* gentle sun wash — keep background visible */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-20"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255,225,160,0.35), transparent 70%), linear-gradient(180deg, rgba(60,30,8,0.05), rgba(40,18,2,0.15))",
        }}
      />

      {/* floating dust motes */}
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

      {/* Header — carved wood beam */}
      <header
        className="relative flex items-center justify-between px-5 py-3 shadow-[0_8px_20px_-10px_rgba(20,10,2,0.7)]"
        style={{
          background:
            "linear-gradient(180deg, #3b1f0a 0%, #5a3210 60%, #3b1f0a 100%)",
        }}
      >
        <WoodGrain />
        <div className="relative flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="DaBotTree" className="h-7 w-7 object-contain" />
            <span className="font-serif text-base font-semibold tracking-wide text-amber-100">
              DaBotTree
            </span>
          </Link>
          <span className="hidden text-xs text-amber-200/60 sm:inline">·</span>
          <span className="hidden font-serif text-sm italic text-amber-100/80 sm:inline">
            Creator Library
          </span>
        </div>
        <div className="relative flex items-center gap-2 text-xs">
          <Link
            to="/"
            className="rounded-sm border border-amber-200/30 bg-amber-950/40 px-3 py-1.5 text-amber-100 hover:bg-amber-900/60"
          >
            Doorway
          </Link>
          <Link
            to="/signin"
            className="rounded-sm border border-amber-300/50 bg-gradient-to-b from-amber-300 to-amber-600 px-3 py-1.5 font-medium text-amber-950 shadow-sm hover:from-amber-200"
          >
            Account
          </Link>
        </div>
      </header>

      {/* Three-column tree-library interior */}
      <div className="relative grid flex-1 grid-cols-1 gap-0 lg:grid-cols-[320px_minmax(0,1fr)_340px]">
        {/* ============ LEFT BOOKSHELF WALL — My Ideas ============ */}
        <ShelfWall side="left" title="My Ideas" subtitle="Pull a book to open it">
          {(() => {
            const leftWidths = [60, 70, 90];
            return (
              <>
                {ideaShelves.map((row, rIdx) => (
                  <Shelf
                    key={rIdx}
                    widthPct={leftWidths[rIdx] ?? 90}
                    align="left"
                  >
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

                {/* Suggested Seeds sub-section */}
                <div className="relative px-2 pt-4">
                  <div className="mb-2 text-center font-serif text-[11px] uppercase tracking-[0.25em] text-amber-100/70">
                    · Idea Sparks ·
                  </div>
                </div>
                <Shelf
                  widthPct={leftWidths[ideaShelves.length] ?? 90}
                  align="left"
                >
                  {suggestedSeeds.map((seed, i) => (
                    <BookSpine
                      key={seed.id}
                      title={seed.title}
                      meta="Spark"
                      active={false}
                      hue={i + 4}
                      onClick={() => {
                        const id = `idea-${Date.now()}`;
                        setIdeas((prev) => [
                          {
                            id,
                            title: seed.title,
                            messy: "",
                            shelfReadiness: 5,
                            updatedAt: Date.now(),
                            stage: "lightbulb",
                            nextAction: "Dump your messy idea",
                          },
                          ...prev,
                        ]);
                        setSelectedId(id);
                        setActiveCategory("lightbulb");
                      }}
                    />
                  ))}
                </Shelf>
              </>
            );
          })()}

          {/* tiny + new idea marker at the very bottom */}
          <div className="relative flex justify-center pt-2">
            <button
              onClick={addIdea}
              title="Add a new idea book"
              className="flex items-center gap-1.5 rounded-sm border border-amber-200/40 bg-amber-950/40 px-3 py-1 font-serif text-[11px] text-amber-100 shadow-sm hover:bg-amber-900/60"
            >
              <span className="text-base leading-none">+</span> New Idea
            </button>
          </div>
        </ShelfWall>


        {/* ============ CENTER — open journal on writing desk ============ */}
        <section className="relative px-4 py-6 lg:px-8 lg:py-8">
          {/* sunbeam */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-10 top-0 h-40 -z-0 opacity-60"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(255,220,150,0.6), transparent 70%)",
            }}
          />
          {!selected ? (
            <div className="relative mx-auto max-w-2xl rounded-md border border-amber-900/40 bg-amber-50/85 p-10 text-center font-serif italic text-amber-900 shadow-2xl">
              Pull a book from the shelf to open it on the desk.
            </div>
          ) : (
            <Journal
              selected={selected}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              getCategoryValue={getCategoryValue}
              setCategoryValue={setCategoryValue}
              updateSelected={updateSelected}
              moveToPreClarity={moveToPreClarity}
              extras={selectedExtras}
              addAttachment={addAttachment}
              fileInputRef={fileInputRef}
            />
          )}
        </section>

        {/* ============ RIGHT BOOKSHELF WALL ============ */}
        <ShelfWall
          side="right"
          title="Idea Progress"
          subtitle="Tap a shelf book to work on it"

        >
          {!selected ? (
            <div className="px-4 py-8 text-center font-serif italic text-amber-100/80">
              Open an idea to see its shelves.
            </div>
          ) : (
            (() => {
              const rightWidths = [60, 70, 85];
              return categoryShelves.map((row, rIdx) => (
                <Shelf
                  key={rIdx}
                  widthPct={rightWidths[rIdx] ?? 85}
                  align="right"
                >
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
              ));
            })()
          )}
        </ShelfWall>
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
}: {
  side: "left" | "right";
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <aside className="relative">
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
  icon: string;
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
