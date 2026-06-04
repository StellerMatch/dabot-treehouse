import { createFileRoute, Link } from "@tanstack/react-router";
import { BackgroundMedia } from "@/components/BackgroundMedia";

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: "Sign in — DaBotTree" },
      { name: "description", content: "Enter your creator space." },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  return (
    <main
      className="relative flex w-screen items-center justify-center overflow-hidden text-white"
      style={{ height: "100dvh" }}
    >
      <BackgroundMedia />
      <div className="relative z-10 mx-4 w-full max-w-sm rounded-lg border border-white/15 bg-black/50 p-6 backdrop-blur-md">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-white/60">
          Account shell only — no auth wired up yet.
        </p>
        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <input
            type="email"
            placeholder="you@studio.com"
            className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/40"
          />
          <input
            type="password"
            placeholder="••••••••"
            className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/40"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-white py-2 text-sm font-medium text-neutral-900 hover:bg-white/90"
          >
            Continue
          </button>
        </form>
        <div className="mt-4 flex items-center justify-between text-xs text-white/60">
          <Link to="/" className="hover:text-white">
            ← Back
          </Link>
          <Link to="/dashboard" className="hover:text-white">
            Skip to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
