import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
      { title: "Creator Dashboard — DaBotTree" },
      {
        name: "description",
        content: "Your Lightbulb Ideas, ready to shape.",
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

function Dashboard() {
  const [ideas, setIdeas] = useState<LightbulbIdea[]>(seedIdeas);
  const [selectedId, setSelectedId] = useState<string>(seedIdeas[0]?.id ?? "");
  const [showGate, setShowGate] = useState(false);

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

  const updateSelected = (patch: Partial<LightbulbIdea>) => {
    if (!selected) return;
    setIdeas((prev) =>
      prev.map((i) =>
        i.id === selected.id ? { ...i, ...patch, updatedAt: Date.now() } : i,
      ),
    );
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
    setShowGate(false);
  };

  const moveToPreClarity = (id: string) => {
    setIdeas((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              stage: "pre-clarity",
              shelfReadiness: Math.max(i.shelfReadiness, 45),
              nextAction: "Open preview",
              updatedAt: Date.now(),
            }
          : i,
      ),
    );
    setSelectedId(id);
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
      {/* Warm daylight wash — brighten and soften the scene */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(255,236,189,0.55), rgba(255,221,160,0.25) 40%, rgba(255,247,224,0.55) 100%)",
        }}
      />

      <header className="flex items-center justify-between border-b border-amber-900/15 bg-amber-50/70 px-5 py-3 backdrop-blur-md">
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
            className="rounded-md border border-amber-900/20 bg-amber-50/60 px-3 py-1.5 text-amber-900 hover:bg-amber-100/80"
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

      <div className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_1.2fr]">
        {/* Ideas list */}
        <section className="rounded-2xl border border-amber-900/15 bg-amber-50/80 shadow-[0_10px_40px_-15px_rgba(120,72,20,0.35)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-amber-900/10 p-3">
            <div>
              <h2 className="text-sm font-semibold text-amber-900">
                Lightbulb Ideas
              </h2>
              <p className="text-xs text-amber-800/70">
                Messy sparks live here before they grow up.
              </p>
            </div>
            <button
              onClick={addIdea}
              className="rounded-md bg-amber-900 px-3 py-1.5 text-xs font-medium text-amber-50 shadow-sm hover:bg-amber-800"
            >
              + New Lightbulb
            </button>
          </div>
          <ul className="divide-y divide-amber-900/10">
            {ideas.map((i) => (
              <li key={i.id}>
                <button
                  onClick={() => setSelectedId(i.id)}
                  className={
                    "block w-full px-3 py-3 text-left transition " +
                    (i.id === selected?.id
                      ? "bg-amber-100/70"
                      : "hover:bg-amber-100/40")
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium text-amber-950">
                      {i.title || "Untitled"}
                    </span>
                    <span className="shrink-0 rounded-full bg-amber-200/70 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-900">
                      {stageLabels[i.stage]}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-amber-900/70">
                    {i.messy || "No messy text yet."}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-amber-900/70">
                    <div className="flex items-center gap-2">
                      <span>Shelf readiness</span>
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-amber-900/15">
                        <div
                          className="h-full bg-emerald-600"
                          style={{ width: `${i.shelfReadiness}%` }}
                        />
                      </div>
                      <span>{i.shelfReadiness}%</span>
                    </div>
                    <span>{timeAgo(i.updatedAt)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-amber-900/70">
                      Next: {i.nextAction}
                    </span>
                    {i.stage === "lightbulb" && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveToPreClarity(i.id);
                        }}
                        className="rounded-md border border-amber-900/20 bg-amber-50/70 px-2 py-1 text-[11px] text-amber-900 hover:bg-amber-100"
                      >
                        → Pre-Clarity
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Detail */}
        <section className="rounded-2xl border border-amber-900/15 bg-amber-50/80 shadow-[0_10px_40px_-15px_rgba(120,72,20,0.35)] backdrop-blur-xl">
          {!selected ? (
            <div className="p-6 text-sm text-amber-900/70">
              Select an idea to shape it.
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="border-b border-amber-900/10 p-4">
                <input
                  value={selected.title}
                  onChange={(e) => updateSelected({ title: e.target.value })}
                  className="w-full bg-transparent text-lg font-semibold text-amber-950 focus:outline-none"
                />
                <div className="mt-1 flex items-center gap-2 text-xs text-amber-900/70">
                  <span className="rounded-full bg-amber-200/70 px-2 py-0.5 uppercase tracking-wider text-amber-900">
                    {stageLabels[selected.stage]}
                  </span>
                  <span>·</span>
                  <span>Updated {timeAgo(selected.updatedAt)}</span>
                </div>
              </div>

              <div className="grid flex-1 grid-cols-1 gap-4 p-4 md:grid-cols-[1.4fr_1fr]">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-amber-900/80">
                    Your messy idea
                  </label>
                  <textarea
                    value={selected.messy}
                    onChange={(e) => updateSelected({ messy: e.target.value })}
                    rows={8}
                    placeholder="Type, rant, ramble. We will shape it."
                    className="mt-2 w-full resize-none rounded-md border border-amber-900/20 bg-amber-50/90 p-3 text-sm text-amber-950 placeholder:text-amber-900/40 focus:outline-none focus:ring-1 focus:ring-amber-700/40"
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button className="rounded-md border border-amber-900/20 bg-amber-50/70 px-3 py-1.5 text-xs text-amber-900 hover:bg-amber-100">
                      Add files or notes
                    </button>
                    {selected.stage === "lightbulb" && (
                      <button
                        onClick={() => moveToPreClarity(selected.id)}
                        className="rounded-md bg-amber-900 px-3 py-1.5 text-xs font-medium text-amber-50 shadow-sm hover:bg-amber-800"
                      >
                        Move to Pre-Clarity
                      </button>
                    )}
                    {selected.stage === "pre-clarity" && (
                      <button
                        onClick={() => setShowGate((v) => !v)}
                        className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-emerald-50 shadow-sm hover:bg-emerald-800"
                      >
                        {showGate ? "Hide" : "Show"} creation options
                      </button>
                    )}
                  </div>
                </div>

                <aside className="rounded-md border border-amber-900/15 bg-amber-100/60 p-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-amber-900/80">
                    Pre-Clarity preview
                  </p>
                  {selected.stage === "lightbulb" ? (
                    <p className="mt-2 text-sm text-amber-900/80">
                      Move this lightbulb to Pre-Clarity to see what it might
                      become.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-2 text-sm">
                      <Signal
                        label="Shape"
                        value={selected.signals?.shape ?? "—"}
                      />
                      <Signal
                        label="Who it helps"
                        value={selected.signals?.whoItHelps ?? "—"}
                      />
                      <Signal
                        label="Support / hosting"
                        value={selected.signals?.supportNeed ?? "—"}
                      />
                      <Signal
                        label="Risk watch"
                        value={selected.signals?.riskWatch ?? "—"}
                      />
                    </ul>
                  )}
                </aside>
              </div>

              {showGate && selected.stage === "pre-clarity" && (
                <div className="border-t border-amber-900/10 bg-amber-100/50 p-4">
                  <h3 className="text-sm font-semibold text-amber-900">
                    Choose how deep to go
                  </h3>
                  <p className="mt-1 text-xs text-amber-900/70">
                    The paid path unlocks deeper creation and Clarity — not just
                    an app skin. Prices and payment are not connected yet.
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {(["Good", "Better", "Best"] as const).map((tier) => (
                      <button
                        key={tier}
                        className="rounded-md border border-amber-900/20 bg-amber-50/90 p-3 text-left transition hover:border-amber-900"
                      >
                        <div className="text-sm font-semibold text-amber-950">
                          {tier}
                        </div>
                        <div className="mt-1 text-[11px] text-amber-900/70">
                          {tier === "Good"
                            ? "Shape the core path."
                            : tier === "Better"
                              ? "Deeper Clarity + support map."
                              : "Full clean packet + operating path."}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-start justify-between gap-3">
      <span className="text-xs uppercase tracking-wider text-amber-900/70">
        {label}
      </span>
      <span className="text-right text-sm text-amber-950">{value}</span>
    </li>
  );
}

