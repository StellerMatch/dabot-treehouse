import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { BackgroundMedia } from "@/components/BackgroundMedia";
import logoImage from "@/assets/dabottree-logo.png";

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
  validateSearch: (s: Record<string, unknown>) => ({
    type: typeof s.type === "string" ? (s.type as string) : undefined,
  }),
  component: Index,
});

function Index() {
  const { type } = Route.useSearch();
  const [idea, setIdea] = useState("");
  const [ideaType, setIdeaType] = useState<string>(type ?? "");
  const [pathOpen, setPathOpen] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    if (type) setIdeaType(type);
  }, [type]);


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

      {/* Hero logo — centered, aligned with top nav */}
      <div className="pointer-events-none absolute inset-x-0 -top-16 z-10 flex justify-center px-4 sm:-top-20">
        <img
          src={logoImage}
          alt="DaBotTree"
          className="h-auto w-[min(67vw,615px)]"
          style={{
            filter:
              "drop-shadow(0 6px 18px rgba(0,0,0,0.55)) drop-shadow(0 2px 6px rgba(0,0,0,0.45)) drop-shadow(0 0 30px rgba(255,170,70,0.35))",
          }}
        />
      </div>

      {/* Top bar */}
      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-end px-5 pt-5 sm:px-8 sm:pt-6">

        <nav className="pointer-events-auto flex items-center gap-2 text-xs">
          <Link
            to="/dashboard"
            className="rounded-full border border-amber-200/25 bg-white/[0.06] px-3.5 py-1.5 text-white/85 shadow-[0_0_18px_-6px_rgba(255,170,80,0.45)] backdrop-blur-md transition hover:border-amber-200/50 hover:bg-white/[0.12] hover:text-white"
          >
            Dashboard
          </Link>
          <Link
            to="/signin"
            className="rounded-full border border-amber-200/40 bg-gradient-to-b from-amber-100/15 to-amber-200/5 px-3.5 py-1.5 text-amber-50 shadow-[0_0_22px_-4px_rgba(255,180,90,0.55)] backdrop-blur-md transition hover:from-amber-100/25 hover:to-amber-200/10 hover:text-white"
          >
            Sign in
          </Link>
        </nav>

      </header>

      {/* Intake panel */}
      <section className="relative z-10 mx-4 mb-8 w-full max-w-2xl sm:mb-14">
        {/* Soft warm light spill behind the panel */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[140%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-[50%]"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255,180,90,0.32) 0%, rgba(255,140,40,0.12) 40%, rgba(0,0,0,0) 70%)",
            filter: "blur(8px)",
          }}
        />

        <div className="mb-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-amber-100/85">
            Step in
          </p>
          <h1
            className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl"
            style={{ textShadow: "0 1px 24px rgba(255,170,80,0.35)" }}
          >
            Tell us the idea in your own words.
          </h1>
          <p className="mt-1.5 text-sm text-white/85">
            Start messy. DaBotTree will help shape the path.
          </p>
          {ideaType && (
            <p className="mt-2 inline-block rounded-full border border-amber-200/40 bg-amber-100/10 px-3 py-0.5 text-[11px] uppercase tracking-[0.2em] text-amber-100/90">
              Starting a {ideaType}
            </p>
          )}
        </div>


        <div
          className="relative rounded-2xl border border-amber-200/20 bg-[rgba(28,16,8,0.45)] p-4 backdrop-blur-xl"
          style={{
            boxShadow:
              "0 0 60px -10px rgba(255,160,70,0.35), inset 0 1px 0 rgba(255,220,180,0.08)",
          }}
        >
          <label htmlFor="idea" className="sr-only">
            Your idea
          </label>
          <textarea
            id="idea"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="A drill, a shed, a neighborhood that shares… start anywhere."
            rows={4}
            className="block w-full resize-none bg-transparent text-[15px] leading-relaxed text-white placeholder:text-amber-100/50 focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-amber-200/10 pt-3">
            <div className="text-[11px] text-amber-100/70">
              {idea.length === 0
                ? "Listening when you're ready."
                : `${words} words · ${idea.length} chars${
                    ready ? " · listening" : " · keep going"
                  }`}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIdea(
                    "A subscription box for busy parents that delivers a curated weekly activity kit for kids ages 4-8. Each box has a hands-on craft, a short story, and a simple science experiment with all the materials included. Goal: give parents a no-prep, screen-free hour with their kid every weekend.",
                  );
                }}
                className="rounded-full border border-amber-200/40 bg-amber-100/10 px-3 py-1.5 text-xs text-amber-100 backdrop-blur-md transition hover:border-amber-200/60 hover:bg-amber-100/20"
              >
                Demo
              </button>
              <button
                type="button"
                className="rounded-full border border-amber-200/20 bg-white/[0.04] px-3 py-1.5 text-xs text-white/75 backdrop-blur-md transition hover:border-amber-200/40 hover:bg-white/[0.08] hover:text-white"
              >
                Add files or notes
              </button>
              <button
                type="button"
                disabled={!ready}
                onClick={() => {
                  if (!ready) return;
                  if (typeof window !== "undefined") {
                    try {
                      sessionStorage.setItem("dabottree:draftIdea", idea);
                      if (ideaType) sessionStorage.setItem("dabottree:draftIdeaType", ideaType);
                      else sessionStorage.removeItem("dabottree:draftIdeaType");
                    } catch {}
                  }
                  setPathOpen(true);
                }}
                className={
                  "rounded-full border px-4 py-1.5 text-sm font-medium backdrop-blur-md transition " +
                  (ready
                    ? "border-amber-200/60 bg-gradient-to-b from-amber-200/90 to-amber-400/80 text-neutral-900 shadow-[0_0_28px_-4px_rgba(255,180,80,0.85)] hover:from-amber-100 hover:to-amber-300"
                    : "cursor-not-allowed border-amber-200/15 bg-white/[0.05] text-white/40")
                }
              >
                Start shaping →
              </button>

            </div>
          </div>
        </div>

        <p className="mt-3 text-center text-[11px] text-amber-100/60">
          No payment, no commitments. This is the doorway.
        </p>
      </section>

    </main>
  );
}
