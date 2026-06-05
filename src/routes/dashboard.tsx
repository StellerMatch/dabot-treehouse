import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  seedIdeas,
  stageLabels,
  type LightbulbIdea,
} from "@/lib/dabottree-state";
import libraryBg from "@/assets/dabottree-library.jpg";
import logo from "@/assets/dabottree-logo.png";

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
type IdeaExtras = { notes: CategoryNotes; attachments: Attachment[] };

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
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
    ? extras[selected.id] ?? { notes: {}, attachments: [] }
    : { notes: {}, attachments: [] };

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
      const current = prev[selected.id] ?? { notes: {}, attachments: [] };
      return {
        ...prev,
        [selected.id]: {
          notes: { ...current.notes, ...(patch.notes ?? {}) },
          attachments: patch.attachments ?? current.attachments,
        },
      };
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
    if (key === "lightbulb") return selected.messy;
    if (key === "pre-clarity")
      return selectedExtras.notes["pre-clarity"] ?? formatSignals(selected);
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
          {ideaShelves.map((row, rIdx) => (
            <Shelf key={rIdx}>
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
          <Shelf>
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
            categoryShelves.map((row, rIdx) => (
              <Shelf key={rIdx}>
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


function Shelf({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
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
  // color by progress
  const palette: [string, string, string] =
    pct === 0
      ? ["#3a2614", "#5c3d1f", "#8a6a3a"]
      : pct < 50
        ? ["#5a1a14", "#8a2e22", "#e0a85a"]
        : pct < 100
          ? ["#4a3a05", "#9a7820", "#f5d27a"]
          : ["#1c3a2a", "#2e6045", "#f5d27a"];
  const [a, b, gold] = palette;
  const height = 138;
  return (
    <button
      onClick={onClick}
      title={`${label} — ${hint}`}
      className={
        "group relative flex shrink-0 flex-col items-stretch overflow-hidden rounded-t-[4px] border border-black/50 transition-transform " +
        (active ? "-translate-y-1.5 ring-2 ring-amber-200/90" : "hover:-translate-y-1")
      }
      style={{
        width: 78,
        height,
        background: `linear-gradient(90deg, ${a} 0%, ${b} 50%, ${a} 100%)`,
        boxShadow:
          "inset 2px 0 0 rgba(255,255,255,0.12), inset -2px 0 0 rgba(0,0,0,0.5), 0 6px 10px -3px rgba(0,0,0,0.65)",
      }}
    >
      {/* top gilt band */}
      <span
        aria-hidden
        className="block w-full"
        style={{ height: 10, background: gold, opacity: 0.9 }}
      />
      {/* embossed label plate */}
      <span
        className="mx-1.5 mt-1 flex flex-1 items-center justify-center rounded-sm px-1 text-center font-serif text-[12px] font-semibold leading-tight text-amber-50"
        style={{
          background: "rgba(0,0,0,0.18)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
          textShadow: "0 1px 0 rgba(0,0,0,0.4)",
        }}
      >
        {label}
      </span>
      {/* progress ink at bottom */}
      <div
        className="relative mt-1 w-full"
        style={{ height: 20, background: "rgba(0,0,0,0.32)" }}
      >
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: `${pct}%`,
            background: gold,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold uppercase tracking-wider text-amber-50">
          {statusLabel}
        </span>
      </div>
    </button>

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

  return (
    <div className="relative mx-auto max-w-xl">
      {/* desk shadow under journal */}
      <div
        aria-hidden
        className="absolute -inset-x-6 -bottom-8 h-16 rounded-full opacity-70 blur-2xl"
        style={{ background: "rgba(20,10,2,0.7)" }}
      />
      {/* journal book */}
      <div
        className="relative overflow-hidden rounded-md border border-amber-950/60 shadow-2xl"
        style={{
          background:
            "linear-gradient(180deg, #f8ecc8 0%, #f1dfae 100%), radial-gradient(circle at 20% 10%, rgba(255,255,255,0.5), transparent 60%)",
          backgroundBlendMode: "overlay",
        }}
      >
        {/* leather binding edges */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-3"
          style={{
            background:
              "linear-gradient(90deg, #3a1d08, #6b3f1a 60%, rgba(60,30,8,0))",
            boxShadow: "inset -1px 0 0 rgba(255,210,150,0.2)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-3"
          style={{
            background:
              "linear-gradient(270deg, #3a1d08, #6b3f1a 60%, rgba(60,30,8,0))",
          }}
        />
        {/* parchment grain */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(rgba(120,72,20,0.18) 1px, transparent 1px)",
            backgroundSize: "12px 12px",
          }}
        />
        {/* deckle/torn page edges via subtle inset */}
        <div className="relative px-7 py-6">
          {/* top: title & stage */}
          <div className="flex items-start justify-between gap-3 border-b border-amber-900/25 pb-4">
            <div className="min-w-0 flex-1">
              <div className="font-serif text-[11px] uppercase tracking-[0.25em] text-amber-900/60">
                Open Journal · Vol. {selected.id.slice(-3)}
              </div>
              <input
                value={selected.title}
                onChange={(e) => updateSelected({ title: e.target.value })}
                className="mt-1 w-full bg-transparent font-serif text-2xl font-semibold text-amber-950 focus:outline-none"
                placeholder="Name this idea…"
              />
              <div className="mt-1 flex flex-wrap items-center gap-2 font-serif text-xs italic text-amber-900/70">
                <span className="rounded-sm border border-amber-900/30 bg-amber-200/60 px-2 py-0.5 not-italic uppercase tracking-wider text-amber-900">
                  {stageLabels[selected.stage]}
                </span>
                <span>·</span>
                <span>Updated {timeAgo(selected.updatedAt)}</span>
                <span>·</span>
                <span>Next: {selected.nextAction}</span>
              </div>
            </div>
            {selected.stage === "lightbulb" && (
              <button
                onClick={() => moveToPreClarity(selected.id)}
                className="shrink-0 rounded-sm border border-emerald-900/60 px-3 py-2 font-serif text-xs font-medium text-emerald-50 shadow"
                style={{
                  background:
                    "linear-gradient(180deg, #3f9c63 0%, #1f6a3a 60%, #0f3a20 100%)",
                }}
              >
                Organize This Idea →
              </button>
            )}
          </div>

          {/* tiny breadcrumb — main switching lives on the right shelf */}
          <div className="mt-2 font-serif text-[11px] italic text-amber-900/60">
            Now working on: <span className="not-italic font-semibold text-amber-900">{activeDef.label}</span>
          </div>


          {/* writing area */}
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <h3 className="font-serif text-lg font-semibold text-amber-950">
                {activeDef.label}
              </h3>
              <span className="font-serif text-xs italic text-amber-900/70">
                {activeDef.hint}
              </span>
            </div>
            <textarea
              value={getCategoryValue(activeCategory)}
              onChange={(e) => setCategoryValue(activeCategory, e.target.value)}
              rows={10}
              placeholder="Write into the journal. Type, paste, ramble — every word grows the idea."
              className="mt-3 w-full resize-none rounded-sm border-0 bg-transparent p-2 font-serif text-[15px] leading-7 text-amber-950 placeholder:text-amber-900/40 focus:outline-none"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(180deg, transparent 0 27px, rgba(120,72,20,0.18) 27px 28px)",
                lineHeight: "28px",
              }}
            />

            {/* desk tools */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
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
              <DeskButton
                onClick={() => fileInputRef.current?.click()}
                label="📎 Files / Photos"
              />
              <DeskButton
                onClick={() => {
                  const url = window.prompt("Paste a link to attach");
                  if (url) addAttachment("link", url);
                }}
                label="🔗 Link"
              />
              <DeskButton
                onClick={() => {
                  const note = window.prompt("Quick note");
                  if (note) addAttachment("note", note);
                }}
                label="📝 Note"
              />
            </div>

            {extras.attachments.length > 0 && (
              <div className="mt-4 rounded-sm border border-amber-900/25 bg-amber-100/60 p-3">
                <div className="font-serif text-[11px] uppercase tracking-widest text-amber-900/70">
                  Pinned to this page
                </div>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {extras.attachments.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-1.5 rounded-sm border border-amber-900/30 bg-amber-50 px-2 py-1 font-serif text-[11px] text-amber-900 shadow-sm"
                    >
                      <span className="uppercase tracking-wider text-amber-700/80">
                        {a.kind}
                      </span>
                      <span className="max-w-[220px] truncate">{a.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
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
