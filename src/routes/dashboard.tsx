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
          "Your living tree library: ideas on the left shelf, workspace in the middle, progress shelf on the right.",
      },
    ],
  }),
  component: Dashboard,
});

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ——— Category shelves on the right side ———
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
  { key: "lightbulb", label: "Lightbulb", hint: "The messy spark" },
  { key: "pre-clarity", label: "Pre-Clarity", hint: "Shape & signals" },
  { key: "clarity", label: "Clarity", hint: "What it really is" },
  { key: "market", label: "Market / Audience", hint: "Who it helps" },
  { key: "build", label: "Build Notes", hint: "How it gets made" },
  { key: "design", label: "Design Notes", hint: "How it feels" },
  { key: "money", label: "Money Notes", hint: "How it sustains" },
  { key: "risks", label: "Risks / Questions", hint: "What to watch" },
  { key: "ready", label: "Ready for Project", hint: "Greenlight gate" },
];

type CategoryNotes = Partial<Record<CategoryKey, string>>;

function categoryStatus(value: string | undefined): {
  pct: number;
  label: string;
} {
  const v = (value ?? "").trim();
  if (!v) return { pct: 0, label: "empty" };
  if (v.length < 40) return { pct: 35, label: "sapling" };
  if (v.length < 140) return { pct: 65, label: "growing" };
  return { pct: 100, label: "rooted" };
}

type Attachment = { id: string; kind: "file" | "link" | "note"; label: string };

type IdeaExtras = {
  notes: CategoryNotes;
  attachments: Attachment[];
};

function Dashboard() {
  const [ideas, setIdeas] = useState<LightbulbIdea[]>(seedIdeas);
  const [selectedId, setSelectedId] = useState<string>(seedIdeas[0]?.id ?? "");
  const [extras, setExtras] = useState<Record<string, IdeaExtras>>({});
  const [activeCategory, setActiveCategory] =
    useState<CategoryKey>("lightbulb");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pull draft from front-page intake if present
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
        title: draft.split(/\s+/).slice(0, 6).join(" ") || "Untitled spark",
        messy: draft,
        shelfReadiness: 18,
        updatedAt: Date.now(),
        stage: "lightbulb",
        nextAction: "Move to pre-Clarity",
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
      nextAction: "Write the messy version",
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
              nextAction: "Fill Clarity shelf",
              updatedAt: Date.now(),
            }
          : i,
      ),
    );
    setSelectedId(id);
    setActiveCategory("pre-clarity");
  };

  // Map textarea content per active category
  const getCategoryValue = (key: CategoryKey): string => {
    if (!selected) return "";
    if (key === "lightbulb") return selected.messy;
    if (key === "pre-clarity")
      return selectedExtras.notes["pre-clarity"] ?? formatSignals(selected);
    return selectedExtras.notes[key] ?? "";
  };

  const setCategoryValue = (key: CategoryKey, value: string) => {
    if (!selected) return;
    if (key === "lightbulb") {
      updateSelected({ messy: value });
    } else {
      updateExtras({ notes: { [key]: value } });
    }
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

  return (
    <main
      className="relative flex w-screen flex-col text-amber-950"
      style={{ minHeight: "100dvh" }}
    >
      {/* Living tree library background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${libraryBg})` }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 50% -10%, rgba(255,236,189,0.55), rgba(255,221,160,0.18) 40%, rgba(70,38,12,0.35) 100%)",
        }}
      />

      <header className="flex items-center justify-between border-b border-amber-900/20 bg-amber-50/60 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="DaBotTree" className="h-7 w-7 object-contain" />
            <span className="text-sm font-semibold tracking-wide text-amber-900">
              DaBotTree
            </span>
          </Link>
          <span className="hidden text-xs text-amber-700/60 sm:inline">/</span>
          <span className="hidden text-sm text-amber-800/80 sm:inline">
            Creator Library
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Link
            to="/"
            className="rounded-md border border-amber-900/25 bg-amber-50/70 px-3 py-1.5 text-amber-900 hover:bg-amber-100"
          >
            Doorway
          </Link>
          <Link
            to="/signin"
            className="rounded-md bg-amber-900 px-3 py-1.5 font-medium text-amber-50 shadow-sm hover:bg-amber-800"
          >
            Account
          </Link>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[300px_1fr_320px]">
        {/* Left bookshelf — ideas as books */}
        <Bookshelf title="Your Ideas" subtitle="Books on the shelf">
          <div className="px-3 pb-2 pt-1">
            <button
              onClick={addIdea}
              className="w-full rounded-md bg-amber-900 px-3 py-2 text-xs font-medium text-amber-50 shadow hover:bg-amber-800"
            >
              + New Lightbulb
            </button>
          </div>
          <ul className="flex flex-col gap-2 px-3 pb-4">
            {ideas.map((idea, idx) => (
              <li key={idea.id}>
                <BookSpine
                  title={idea.title}
                  stage={stageLabels[idea.stage]}
                  active={idea.id === selected?.id}
                  hue={idx}
                  onClick={() => setSelectedId(idea.id)}
                />
              </li>
            ))}
          </ul>
        </Bookshelf>

        {/* Center workspace — parchment desk */}
        <section className="relative overflow-hidden rounded-2xl border border-amber-900/25 shadow-[0_20px_60px_-20px_rgba(60,30,5,0.5)]">
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,247,224,0.96), rgba(248,232,198,0.94))",
            }}
          />
          {/* parchment grain */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(rgba(120,72,20,0.18) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          />
          {!selected ? (
            <div className="p-8 text-sm text-amber-900/70">
              Pull a book from the shelf to open it on the desk.
            </div>
          ) : (
            <div className="flex h-full flex-col">
              {/* Desk header */}
              <div className="flex items-start justify-between gap-3 border-b border-amber-900/15 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <input
                    value={selected.title}
                    onChange={(e) => updateSelected({ title: e.target.value })}
                    className="w-full bg-transparent text-xl font-semibold text-amber-950 focus:outline-none"
                    placeholder="Name this idea…"
                  />
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-amber-900/70">
                    <span className="rounded-full bg-amber-200/80 px-2 py-0.5 uppercase tracking-wider text-amber-900">
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
                    className="shrink-0 rounded-md bg-emerald-700 px-3 py-2 text-xs font-medium text-emerald-50 shadow hover:bg-emerald-800"
                  >
                    Move to Pre-Clarity →
                  </button>
                )}
              </div>

              {/* Category tabs (which "page" of the book) */}
              <div className="flex flex-wrap gap-1 border-b border-amber-900/10 bg-amber-50/40 px-3 py-2">
                {categoryDefs.map((c) => {
                  const status = categoryStatus(getCategoryValue(c.key));
                  const isActive = activeCategory === c.key;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setActiveCategory(c.key)}
                      className={
                        "flex items-center gap-2 rounded-t-md border border-b-0 px-2.5 py-1.5 text-[11px] font-medium transition " +
                        (isActive
                          ? "border-amber-900/30 bg-amber-50 text-amber-950 shadow-sm"
                          : "border-transparent text-amber-900/70 hover:bg-amber-100/60 hover:text-amber-900")
                      }
                    >
                      <Dot pct={status.pct} />
                      {c.label}
                    </button>
                  );
                })}
              </div>

              {/* Active category editor */}
              <div className="flex flex-1 flex-col gap-3 px-5 py-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium uppercase tracking-wider text-amber-900/80">
                    {categoryDefs.find((c) => c.key === activeCategory)?.label}
                    <span className="ml-2 text-amber-800/60 normal-case">
                      ·{" "}
                      {
                        categoryDefs.find((c) => c.key === activeCategory)
                          ?.hint
                      }
                    </span>
                  </label>
                </div>
                <textarea
                  value={getCategoryValue(activeCategory)}
                  onChange={(e) =>
                    setCategoryValue(activeCategory, e.target.value)
                  }
                  rows={9}
                  placeholder="Add to this shelf. Type, paste, ramble — every word grows the idea."
                  className="w-full flex-1 resize-none rounded-md border border-amber-900/20 bg-amber-50/80 p-3 text-sm leading-relaxed text-amber-950 placeholder:text-amber-900/40 focus:outline-none focus:ring-1 focus:ring-amber-700/50"
                />

                {/* Add-things row */}
                <div className="flex flex-wrap items-center gap-2">
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
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-md border border-amber-900/25 bg-amber-50/80 px-3 py-1.5 text-xs text-amber-900 hover:bg-amber-100"
                  >
                    + Files / Photos
                  </button>
                  <button
                    onClick={() => {
                      const url = window.prompt("Paste a link to attach");
                      if (url) addAttachment("link", url);
                    }}
                    className="rounded-md border border-amber-900/25 bg-amber-50/80 px-3 py-1.5 text-xs text-amber-900 hover:bg-amber-100"
                  >
                    + Link
                  </button>
                  <button
                    onClick={() => {
                      const note = window.prompt("Quick note");
                      if (note) addAttachment("note", note);
                    }}
                    className="rounded-md border border-amber-900/25 bg-amber-50/80 px-3 py-1.5 text-xs text-amber-900 hover:bg-amber-100"
                  >
                    + Note
                  </button>
                </div>

                {/* Attachments list */}
                {selectedExtras.attachments.length > 0 && (
                  <ul className="flex flex-wrap gap-2 pt-1">
                    {selectedExtras.attachments.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center gap-1.5 rounded-md border border-amber-900/20 bg-amber-100/60 px-2 py-1 text-[11px] text-amber-900"
                      >
                        <span className="uppercase tracking-wider text-amber-700/80">
                          {a.kind}
                        </span>
                        <span className="max-w-[180px] truncate">
                          {a.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Right bookshelf — progress / category status */}
        <Bookshelf title="Progress Shelf" subtitle="What this idea still needs">
          {!selected ? (
            <div className="px-4 py-6 text-xs text-amber-100/80">
              Open an idea to see its shelves.
            </div>
          ) : (
            <ul className="flex flex-col gap-2 px-3 pb-4">
              {categoryDefs.map((c) => {
                const status = categoryStatus(getCategoryValue(c.key));
                const isActive = activeCategory === c.key;
                return (
                  <li key={c.key}>
                    <button
                      onClick={() => setActiveCategory(c.key)}
                      className={
                        "group flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition " +
                        (isActive
                          ? "border-amber-300/60 bg-amber-50/95 text-amber-950 shadow"
                          : "border-amber-900/30 bg-amber-50/70 text-amber-900 hover:bg-amber-100/90")
                      }
                    >
                      {/* mini book spine indicator */}
                      <span
                        className="h-7 w-2 shrink-0 rounded-sm shadow-inner"
                        style={{
                          background:
                            status.pct === 0
                              ? "linear-gradient(180deg,#caa472,#9a6a36)"
                              : status.pct < 50
                                ? "linear-gradient(180deg,#d97a3b,#8b3f12)"
                                : status.pct < 100
                                  ? "linear-gradient(180deg,#caa14a,#7a5410)"
                                  : "linear-gradient(180deg,#2f7a4e,#16432a)",
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[12px] font-medium">
                            {c.label}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-amber-800/70">
                            {status.label}
                          </span>
                        </div>
                        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-amber-900/15">
                          <div
                            className="h-full"
                            style={{
                              width: `${status.pct}%`,
                              background:
                                status.pct === 100
                                  ? "linear-gradient(90deg,#3f9c63,#1f6a3a)"
                                  : "linear-gradient(90deg,#caa14a,#a3661a)",
                            }}
                          />
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Bookshelf>
      </div>
    </main>
  );
}

// ——— Bookshelf chrome: wooden frame with shelf lines ———
function Bookshelf({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-amber-950/40 shadow-[0_20px_60px_-20px_rgba(40,18,2,0.6)]"
      style={{
        background:
          "linear-gradient(180deg, #4a2a10 0%, #5c361a 12%, #6b3f1f 100%)",
      }}
    >
      {/* wood grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(180deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 7px), repeating-linear-gradient(90deg, rgba(255,220,170,0.06) 0 2px, transparent 2px 11px)",
        }}
      />
      {/* top lantern glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,196,110,0.55), transparent 70%)",
        }}
      />
      <header className="relative border-b border-amber-950/40 bg-amber-950/30 px-4 py-3">
        <h2 className="text-sm font-semibold text-amber-50">{title}</h2>
        {subtitle && (
          <p className="text-[11px] text-amber-100/70">{subtitle}</p>
        )}
      </header>
      <div className="relative">{children}</div>
      {/* bottom shelf edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.05))",
        }}
      />
    </section>
  );
}

// ——— A single idea rendered as a book on the shelf ———
function BookSpine({
  title,
  stage,
  active,
  hue,
  onClick,
}: {
  title: string;
  stage: string;
  active: boolean;
  hue: number;
  onClick: () => void;
}) {
  const palettes = [
    ["#7a2a1f", "#a8463a"], // burgundy
    ["#1f4d3a", "#356b53"], // forest
    ["#5a3a12", "#8a6028"], // tobacco
    ["#274060", "#3e5f86"], // ink blue
    ["#6a4a1a", "#a37a30"], // ochre
    ["#3d2454", "#5e3a7a"], // plum
  ];
  const [a, b] = palettes[hue % palettes.length];
  return (
    <button
      onClick={onClick}
      className={
        "group flex w-full items-stretch overflow-hidden rounded-md border text-left shadow-sm transition " +
        (active
          ? "border-amber-200 ring-2 ring-amber-200/70"
          : "border-amber-950/50 hover:translate-x-0.5")
      }
      style={{
        background: `linear-gradient(90deg, ${a} 0%, ${b} 70%, ${a} 100%)`,
      }}
    >
      {/* spine ridge */}
      <div
        aria-hidden
        className="w-1.5 shrink-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,220,160,0.6), rgba(0,0,0,0.2))",
        }}
      />
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-2.5">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold tracking-wide text-amber-50">
            {title || "Untitled"}
          </div>
          <div className="text-[10px] uppercase tracking-[0.15em] text-amber-100/75">
            {stage}
          </div>
        </div>
        <span
          className="shrink-0 rounded-sm border border-amber-100/40 bg-amber-50/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-amber-50/90"
          aria-hidden
        >
          vol.
        </span>
      </div>
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
