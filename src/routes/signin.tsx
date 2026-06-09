import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BackgroundMedia } from "@/components/BackgroundMedia";

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: "Sign in — DaBotTree" },
      { name: "description", content: "Enter your creator space." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? (s.next as string) : undefined,
  }),
  component: SignIn,
});

function SignIn() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("dabottree:authed", "1");
        if (email) localStorage.setItem("dabottree:accountEmail", email);
      } catch {}
    }
    const dest = next && next.startsWith("/") ? next : "/library";
    navigate({ to: dest });
  };

  const [hasDraft, setHasDraft] = useState(false);
  useEffect(() => {
    try {
      setHasDraft((sessionStorage.getItem("dabottree:draftIdea") ?? "").trim().length > 0);
    } catch {}
  }, []);

  return (
    <main
      className="relative flex w-screen items-center justify-center overflow-hidden text-white"
      style={{ height: "100dvh" }}
    >
      <BackgroundMedia />
      <div
        className="relative z-10 mx-4 w-full max-w-sm rounded-2xl border border-amber-200/30 bg-[rgba(24,13,7,0.85)] p-6 backdrop-blur-xl"
        style={{
          boxShadow:
            "0 0 60px -10px rgba(255,160,70,0.4), inset 0 1px 0 rgba(255,220,180,0.08)",
        }}
      >
        <p className="text-[10px] uppercase tracking-[0.4em] text-amber-100/85">
          My Account
        </p>
        <h1 className="mt-2 text-xl font-semibold text-amber-50">
          {mode === "signin" ? "Sign in" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-white/65">
          {hasDraft
            ? "Sign in to save your idea to your library."
            : "Enter your creator space."}
        </p>

        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Your name"
              className="w-full rounded-md border border-amber-200/20 bg-white/5 px-3 py-2 text-sm placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-amber-200/50"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@studio.com"
            className="w-full rounded-md border border-amber-200/20 bg-white/5 px-3 py-2 text-sm placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-amber-200/50"
          />
          <input
            type="password"
            required
            placeholder="••••••••"
            className="w-full rounded-md border border-amber-200/20 bg-white/5 px-3 py-2 text-sm placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-amber-200/50"
          />
          <button
            type="submit"
            className="w-full rounded-full border border-amber-200/60 bg-gradient-to-b from-amber-200/90 to-amber-400/80 py-2 text-sm font-medium text-neutral-900 shadow-[0_0_22px_-4px_rgba(255,180,80,0.7)] transition hover:from-amber-100 hover:to-amber-300"
          >
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-3 w-full text-center text-xs text-amber-100/80 hover:text-amber-50"
        >
          {mode === "signin"
            ? "New here? Create an account"
            : "Already have an account? Sign in"}
        </button>

        <div className="mt-4 flex items-center justify-between text-xs text-white/60">
          <Link to="/" className="hover:text-white">
            ← Back
          </Link>
        </div>
      </div>
    </main>
  );
}
