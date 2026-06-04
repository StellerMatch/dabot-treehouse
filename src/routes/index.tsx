import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BackgroundMedia } from "@/components/BackgroundMedia";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DaBotTree — Step into your idea" },
      {
        name: "description",
        content:
          "Start messy. DaBotTree will help shape the path from a lightbulb idea into something real.",
      },
      { property: "og:title", content: "DaBotTree" },
      {
        property: "og:description",
        content: "A doorway into your next project.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [idea, setIdea] = useState("");

  const words = useMemo(
    () => idea.trim().split(/\s+/).filter(Boolean).length,
    [idea],
  );
  const ready = words >= 5;

  return (
    <main
      className="relative flex w-screen items-end justify-center overflow-hidden text-white"
      style={{ height: "100dvh" }}
    >
      <BackgroundMedia />

      {/* Top bar */}
      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-5 sm:px-8 sm:pt-6">
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="h-6 w-6 rounded-[6px] bg-white/90" />
          <span className="text-sm font-medium tracking-wide text-white/90">
            DaBotTree
          </span>
        </div>
        <nav className="pointer-events-auto flex items-center gap-2 text-xs">
          <Link
            to="/dashboard"
            className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-white/90 backdrop-blur-md transition hover:bg-white/20"
          >
            Dashboard
          </Link>
          <Link
            to="/signin"
            className="rounded-md bg-white px-3 py-1.5 text-neutral-900 transition hover:bg-white/90"
          >
            Sign in
          </Link>
        </nav>
      </header>

      {/* Intake panel */}
      <section className="relative z-10 mx-4 mb-8 w-full max-w-2xl sm:mb-14">
        <div className="mb-3 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">
            Step in
          </p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
            Tell us the idea in your own words.
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Start messy. DaBotTree will help shape the path.
          </p>
        </div>

        <div className="rounded-lg border border-white/15 bg-black/40 p-3 shadow-2xl backdrop-blur-md">
          <label htmlFor="idea" className="sr-only">
            Your idea
          </label>
          <textarea
            id="idea"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="A drill, a shed, a neighborhood that shares… start anywhere."
            rows={4}
            className="block w-full resize-none bg-transparent text-[15px] leading-relaxed text-white placeholder:text-white/40 focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="text-[11px] text-white/50">
              {idea.length === 0
                ? "Listening when you're ready."
                : `${words} words · ${idea.length} chars${
                    ready ? " · listening" : " · keep going"
                  }`}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/10"
              >
                Add files or notes
              </button>
              <Link
                to="/dashboard"
                aria-disabled={!ready}
                onClick={(e) => {
                  if (!ready) e.preventDefault();
                  if (typeof window !== "undefined") {
                    try {
                      sessionStorage.setItem("dabottree:draftIdea", idea);
                    } catch {}
                  }
                }}
                className={
                  "rounded-md px-4 py-1.5 text-sm font-medium transition " +
                  (ready
                    ? "bg-white text-neutral-900 hover:bg-white/90"
                    : "cursor-not-allowed bg-white/30 text-white/60")
                }
              >
                Start shaping →
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-3 text-center text-[11px] text-white/50">
          No payment, no commitments. This is the doorway.
        </p>
      </section>
    </main>
  );
}
