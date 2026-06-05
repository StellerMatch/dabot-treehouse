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
      className="flex w-screen flex-col bg-neutral-50 text-neutral-900"
      style={{ minHeight: "100dvh" }}
    >
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-[6px] bg-neutral-900" />
            <span className="text-sm font-semibold">DaBotTree</span>
          </Link>
          <span className="hidden text-xs text-neutral-400 sm:inline">/</span>
          <span className="hidden text-sm text-neutral-600 sm:inline">
            Creator Dashboard
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Link
            to="/"
            className="rounded-md border border-neutral-200 px-3 py-1.5 hover:bg-neutral-100"
          >
            Doorway
          </Link>
          <Link
            to="/signin"
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-white hover:bg-neutral-800"
          >
            Account
          </Link>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_1.2fr]">
        {/* Ideas list */}
        <section className="rounded-lg border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-200 p-3">
            <div>
              <h2 className="text-sm font-semibold">Lightbulb Ideas</h2>
              <p className="text-xs text-neutral-500">
                Messy sparks live here before they grow up.
              </p>
            </div>
            <button
              onClick={addIdea}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
            >
              + New Lightbulb
            </button>
          </div>
          <ul className="divide-y divide-neutral-100">
            {ideas.map((i) => (
              <li key={i.id}>
                <button
                  onClick={() => setSelectedId(i.id)}
                  className={
                    "block w-full px-3 py-3 text-left transition " +
                    (i.id === selected?.id
                      ? "bg-neutral-50"
                      : "hover:bg-neutral-50")
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium">
                      {i.title || "Untitled"}
                    </span>
                    <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] uppercase tracking-wider text-neutral-600">
                      {stageLabels[i.stage]}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
                    {i.messy || "No messy text yet."}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-neutral-500">
                    <div className="flex items-center gap-2">
                      <span>Shelf readiness</span>
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-neutral-200">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${i.shelfReadiness}%` }}
                        />
                      </div>
                      <span>{i.shelfReadiness}%</span>
                    </div>
                    <span>{timeAgo(i.updatedAt)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-neutral-500">
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
                        className="rounded-md border border-neutral-200 px-2 py-1 text-[11px] hover:bg-white"
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
        <section className="rounded-lg border border-neutral-200 bg-white">
          {!selected ? (
            <div className="p-6 text-sm text-neutral-500">
              Select an idea to shape it.
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="border-b border-neutral-200 p-4">
                <input
                  value={selected.title}
                  onChange={(e) => updateSelected({ title: e.target.value })}
                  className="w-full bg-transparent text-lg font-semibold focus:outline-none"
                />
                <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 uppercase tracking-wider">
                    {stageLabels[selected.stage]}
                  </span>
                  <span>·</span>
                  <span>Updated {timeAgo(selected.updatedAt)}</span>
                </div>
              </div>

              <div className="grid flex-1 grid-cols-1 gap-4 p-4 md:grid-cols-[1.4fr_1fr]">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Your messy idea
                  </label>
                  <textarea
                    value={selected.messy}
                    onChange={(e) => updateSelected({ messy: e.target.value })}
                    rows={8}
                    placeholder="Type, rant, ramble. We will shape it."
                    className="mt-2 w-full resize-none rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-300"
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs hover:bg-neutral-100">
                      Add files or notes
                    </button>
                    {selected.stage === "lightbulb" && (
                      <button
                        onClick={() => moveToPreClarity(selected.id)}
                        className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
                      >
                        Move to Pre-Clarity
                      </button>
                    )}
                    {selected.stage === "pre-clarity" && (
                      <button
                        onClick={() => setShowGate((v) => !v)}
                        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                      >
                        {showGate ? "Hide" : "Show"} creation options
                      </button>
                    )}
                  </div>
                </div>

                <aside className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Pre-Clarity preview
                  </p>
                  {selected.stage === "lightbulb" ? (
                    <p className="mt-2 text-sm text-neutral-600">
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
                <div className="border-t border-neutral-200 bg-neutral-50 p-4">
                  <h3 className="text-sm font-semibold">
                    Choose how deep to go
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    The paid path unlocks deeper creation and Clarity — not just
                    an app skin. Prices and payment are not connected yet.
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {(["Good", "Better", "Best"] as const).map((tier) => (
                      <button
                        key={tier}
                        className="rounded-md border border-neutral-200 bg-white p-3 text-left transition hover:border-neutral-900"
                      >
                        <div className="text-sm font-semibold">{tier}</div>
                        <div className="mt-1 text-[11px] text-neutral-500">
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
      <span className="text-xs uppercase tracking-wider text-neutral-500">
        {label}
      </span>
      <span className="text-right text-sm text-neutral-800">{value}</span>
    </li>
  );
}
