import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mic } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import logoImage from "@/assets/dabottree-logo.png";
import { AccountBadge, CreditsPill } from "@/components/AccountBadge";
import { BackgroundMedia } from "@/components/BackgroundMedia";
import { IDEA_SHELF_NEXT_ACTION, seedIdeas, type LightbulbIdea } from "@/lib/dabottree-state";
import { buildIntakeFolderPosts } from "@/lib/intake-folder-breakdown";
import { generateWorkingProjectTitle } from "@/lib/project-naming";

const IDEAS_STORAGE_KEY = "dabottree:ideas";
const EXTRAS_STORAGE_KEY = "dabottree:ideaExtras";

function cleanIdeaText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function summaryFromIdea(text: string): string {
  const clean = cleanIdeaText(text);
  if (clean.length <= 180) return clean;
  return `${clean.slice(0, 177).trim()}...`;
}

function createLibraryIdea(text: string, ideaType?: string): LightbulbIdea {
  const ts = Date.now();
  const isStrongIntake = cleanIdeaText(text).length >= 650;
  return {
    id: `idea-${ts}`,
    title: generateWorkingProjectTitle(text, ideaType),
    messy: summaryFromIdea(text),
    shelfReadiness: isStrongIntake ? 82 : 32,
    updatedAt: ts,
    stage: "lightbulb",
    nextAction: IDEA_SHELF_NEXT_ACTION,
    ideaType: ideaType || undefined,
    description: cleanIdeaText(text),
  };
}

function createIntakeExtras(text: string, ts: number) {
  return {
    sourceText: text,
    notes: {},
    attachments: [],
    posts: buildIntakeFolderPosts(cleanIdeaText(text), ts),
    answeredQuestions: [],
    skippedQuestions: [],
    clarityFollowupCount: 0,
  };
}

function saveIdeaToLibraryStorage(text: string, ideaType?: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const rawIdeas = localStorage.getItem(IDEAS_STORAGE_KEY);
    const parsedIdeas = rawIdeas ? JSON.parse(rawIdeas) : null;
    const existingIdeas = Array.isArray(parsedIdeas) ? (parsedIdeas as LightbulbIdea[]) : seedIdeas;
    const newIdea = createLibraryIdea(text, ideaType);
    const ts = Number(newIdea.id.replace("idea-", "")) || Date.now();
    localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify([newIdea, ...existingIdeas]));

    const rawExtras = localStorage.getItem(EXTRAS_STORAGE_KEY);
    const parsedExtras = rawExtras ? JSON.parse(rawExtras) : null;
    const existingExtras =
      parsedExtras && typeof parsedExtras === "object" && !Array.isArray(parsedExtras)
        ? parsedExtras
        : {};
    localStorage.setItem(
      EXTRAS_STORAGE_KEY,
      JSON.stringify({
        ...existingExtras,
        [newIdea.id]: createIntakeExtras(text, ts),
      }),
    );
    return true;
  } catch {
    return false;
  }
}

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
  const navigate = useNavigate();
  const [idea, setIdea] = useState("");
  const [ideaType, setIdeaType] = useState<string>(type ?? "");
  const [isAuthed, setIsAuthed] = useState(false);
  const [pathOpen, setPathOpen] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "processing">("idle");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (type) setIdeaType(type);
  }, [type]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setVoiceSupported(
      Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition),
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncAuth = () => {
      try {
        setIsAuthed(localStorage.getItem("dabottree:authed") === "1");
      } catch {
        setIsAuthed(false);
      }
    };

    syncAuth();
    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  const startVoice = useCallback(() => {
    if (!voiceSupported) return;

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";

    const baseText = idea ? idea.replace(/\s+$/, "") + " " : "";
    let finalText = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interim += result[0].transcript;
      }

      setIdea(baseText + finalText + interim);
    };
    rec.onerror = () => setVoiceState("idle");
    rec.onend = () => {
      setVoiceState((state) => (state === "listening" ? "processing" : state));
      setTimeout(() => setVoiceState("idle"), 350);
    };

    recognitionRef.current = rec;
    setVoiceState("listening");
    try {
      rec.start();
    } catch {
      setVoiceState("idle");
    }
  }, [idea, voiceSupported]);

  const stopVoice = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setVoiceState("processing");
  }, []);

  useEffect(
    () => () => {
      try {
        recognitionRef.current?.stop();
      } catch {}
    },
    [],
  );

  const words = useMemo(() => idea.trim().split(/\s+/).filter(Boolean).length, [idea]);
  const ready = words >= 5;
  const listening = voiceState === "listening";
  const processingVoice = voiceState === "processing";

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
          {isAuthed && (
            <>
              <Link
                to="/library"
                className="rounded-full border border-amber-200/25 bg-white/[0.06] px-3.5 py-1.5 text-white/85 shadow-[0_0_18px_-6px_rgba(255,170,80,0.45)] backdrop-blur-md transition hover:border-amber-200/50 hover:bg-white/[0.12] hover:text-white"
              >
                Library
              </Link>
              <Link
                to="/levels"
                className="rounded-full border border-amber-200/25 bg-white/[0.06] px-3.5 py-1.5 text-white/85 shadow-[0_0_18px_-6px_rgba(255,170,80,0.45)] backdrop-blur-md transition hover:border-amber-200/50 hover:bg-white/[0.12] hover:text-white"
              >
                Levels
              </Link>
              <CreditsPill />
            </>
          )}
          <AccountBadge placement="inline" prominence={isAuthed ? "normal" : "large"} />
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
          <p className="text-[10px] uppercase tracking-[0.4em] text-amber-100/85">Step in</p>
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
            boxShadow: "0 0 60px -10px rgba(255,160,70,0.35), inset 0 1px 0 rgba(255,220,180,0.08)",
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
              {listening
                ? "Listening... speak your idea."
                : processingVoice
                  ? "Adding your spoken idea..."
                  : idea.length === 0
                    ? "Listening when you're ready."
                    : `${words} words · ${idea.length} chars${
                        ready ? " · listening" : " · keep going"
                      }`}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={listening ? stopVoice : startVoice}
                disabled={!voiceSupported || processingVoice}
                title={
                  !voiceSupported
                    ? "Voice input is not supported in this browser"
                    : listening
                      ? "Stop recording"
                      : "Speak your idea"
                }
                aria-pressed={listening}
                className={
                  "inline-flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-md transition " +
                  (listening
                    ? "border-red-300/70 bg-red-500/25 text-red-50 shadow-[0_0_20px_-4px_rgba(248,113,113,0.8)]"
                    : "border-amber-200/40 bg-amber-100/10 text-amber-100 hover:border-amber-200/60 hover:bg-amber-100/20") +
                  (!voiceSupported || processingVoice ? " cursor-not-allowed opacity-50" : "")
                }
              >
                <Mic className="h-4 w-4" aria-hidden />
                <span className="sr-only">{listening ? "Stop recording" : "Speak your idea"}</span>
              </button>
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
                  let authed = false;
                  if (typeof window !== "undefined") {
                    try {
                      localStorage.removeItem("dabottree:selectedIdeaId");
                      authed = localStorage.getItem("dabottree:authed") === "1";
                    } catch {}
                  }
                  setPathOpen(false);
                  if (!authed) {
                    try {
                      sessionStorage.setItem("dabottree:draftIdea", idea);
                      if (ideaType) sessionStorage.setItem("dabottree:draftIdeaType", ideaType);
                      else sessionStorage.removeItem("dabottree:draftIdeaType");
                      sessionStorage.removeItem("dabottree:packageTier");
                      sessionStorage.removeItem("dabottree:reportPath");
                    } catch {}
                    // Prototype gate: send to login/sign-up first. The draft idea is
                    // preserved in sessionStorage and saved to the Idea Shelf after sign-in.
                    navigate({ to: "/signin", search: { next: "/library" } as any });
                    return;
                  }
                  const saved = saveIdeaToLibraryStorage(idea, ideaType);
                  try {
                    sessionStorage.removeItem("dabottree:draftIdea");
                    sessionStorage.removeItem("dabottree:draftIdeaType");
                    sessionStorage.removeItem("dabottree:packageTier");
                    sessionStorage.removeItem("dabottree:reportPath");
                    if (!saved) {
                      sessionStorage.setItem("dabottree:draftIdea", idea);
                      if (ideaType) sessionStorage.setItem("dabottree:draftIdeaType", ideaType);
                    }
                  } catch {}
                  setConfirmationMessage(
                    "Idea saved to your Idea Shelf. Open it from your profile when you're ready to move forward.",
                  );
                  window.setTimeout(() => {
                    navigate({ to: "/library" });
                  }, 1400);
                }}
                className={
                  "rounded-full border px-4 py-1.5 text-sm font-medium backdrop-blur-md transition " +
                  (ready
                    ? "border-amber-200/60 bg-gradient-to-b from-amber-200/90 to-amber-400/80 text-neutral-900 shadow-[0_0_28px_-4px_rgba(255,180,80,0.85)] hover:from-amber-100 hover:to-amber-300"
                    : "cursor-not-allowed border-amber-200/15 bg-white/[0.05] text-white/40")
                }
              >
                Save to my library →
              </button>
            </div>
          </div>
        </div>
      </section>

      {confirmationMessage && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 px-4 backdrop-blur-sm">
          <div className="max-w-lg rounded-2xl border border-amber-200/30 bg-[rgba(24,13,7,0.95)] p-6 text-center shadow-[0_0_60px_-10px_rgba(255,178,92,0.75)]">
            <p className="text-[10px] uppercase tracking-[0.32em] text-amber-100/70">
              Idea saved
            </p>
            <p className="mt-3 text-lg leading-relaxed text-amber-50">{confirmationMessage}</p>
          </div>
        </div>
      )}
    </main>
  );
}

// ============= Choose Your Path Modal =============

type PackageTier = "good" | "better" | "best";

type PathOption = {
  id: PackageTier;
  name: string;
  credits: number;
  tagline: string;
  perks: string[];
  accent: string; // outer glow
  ring: string; // border
};

const PATH_OPTIONS: PathOption[] = [
  {
    id: "good",
    name: "Good",
    credits: 20,
    tagline: "A clean report path — steady roots, sealed doors.",
    perks: [
      "Project report with main findings",
      "Level review summaries included",
      "Opportunity doors visible but locked",
      "Upgrade anytime when deeper options appear",
    ],
    accent: "rgba(180,140,80,0.55)",
    ring: "rgba(220,180,110,0.55)",
  },
  {
    id: "better",
    name: "Better",
    credits: 40,
    tagline: "A deeper report path — one key at every level.",
    perks: [
      "Deeper project report",
      "1 key per level",
      "Unlock one opportunity door per level",
      "More answers help the bots go deeper",
    ],
    accent: "rgba(255,190,90,0.7)",
    ring: "rgba(255,210,130,0.75)",
  },
  {
    id: "best",
    name: "Best",
    credits: 60,
    tagline: "The fullest report path — both doors open.",
    perks: [
      "Most detailed project report",
      "Both opportunity doors open per level",
      "Full opportunity question access",
      "Best report before any build decision",
    ],
    accent: "rgba(255,225,150,0.95)",
    ring: "rgba(255,235,180,0.95)",
  },
];

function getPathConfirmation(tier: PackageTier) {
  if (tier === "good") {
    return "Thank you for your idea. We're starting your project report on the Good path. You can keep moving forward, and upgrade anytime when you want to unlock deeper opportunities.";
  }
  if (tier === "better") {
    return "Thank you for your idea. We're excited to grow it with you on the Better report path.";
  }
  return "Thank you for your idea. We're opening the full Best report path for this project.";
}

export function ChoosePathModal({
  onClose,
  onChoose,
}: {
  onClose: () => void;
  onChoose: (tier: PackageTier) => void;
}) {
  const [hovered, setHovered] = useState<PackageTier | null>("better");
  const [availableCredits, setAvailableCredits] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      const v = Number(localStorage.getItem("dabottree:credits") ?? "0");
      return Number.isFinite(v) ? v : 0;
    } catch {
      return 0;
    }
  });
  const [addOpen, setAddOpen] = useState(false);

  const addCredits = (amount: number) => {
    setAvailableCredits((prev) => {
      const next = Math.max(0, prev + Math.floor(amount));
      try {
        localStorage.setItem("dabottree:credits", String(next));
      } catch {}
      return next;
    });
    setAddOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-label="Choose your path"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(20,10,2,0.78) 0%, rgba(2,1,0,0.95) 70%)",
          backdropFilter: "blur(6px)",
        }}
      />

      <div
        className="relative w-full max-w-[920px] max-h-[92vh] overflow-y-auto rounded-[20px] px-6 py-7 sm:px-9 sm:py-9 text-amber-50"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(150,100,30,0.92) 0%, rgba(85,52,12,0.96) 60%, rgba(40,22,5,0.98) 100%)",
          border: "1px solid rgba(240,195,110,0.6)",
          boxShadow:
            "0 30px 90px -20px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,225,160,0.28), 0 0 80px -10px rgba(255,190,90,0.55)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full border border-amber-200/40 bg-black/40 px-2.5 py-1 text-[11px] text-amber-50/80 transition hover:bg-black/60"
        >
          ✕
        </button>

        <div className="relative flex items-center justify-center gap-2">
          <span className="text-amber-200/90">✦</span>
          <span className="text-[11px] uppercase tracking-[0.36em] text-amber-100/90">
            Choose Report Depth
          </span>
          <span className="text-amber-200/90">✦</span>
        </div>
        <h2
          className="relative mt-2 text-center text-[26px] font-semibold leading-tight sm:text-[30px]"
          style={{
            fontFamily: 'ui-serif, Georgia, "Times New Roman", serif',
            textShadow: "0 1px 24px rgba(255,170,80,0.4)",
          }}
        >
          Three report paths into the tree.
        </h2>
        <p className="relative mx-auto mt-2 max-w-[560px] text-center text-[13px] leading-relaxed text-amber-50/90">
          Credits shape the project report experience. Better and Best let you answer more
          opportunity questions, so the bots can go deeper before the final report. Build, hosting,
          maintenance, and subscriptions come after the report.
        </p>

        <div className="relative mt-3 flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/40 bg-black/35 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-amber-100/90">
            <span aria-hidden>✦</span>
            <span>Available credits: {availableCredits}</span>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/70 bg-gradient-to-b from-amber-300 to-amber-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-950 shadow-[0_4px_14px_-4px_rgba(255,180,80,0.7)] transition hover:from-amber-200 hover:to-amber-400"
          >
            <span aria-hidden>+</span> Add Credits
          </button>
        </div>

        <div className="relative mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
          {PATH_OPTIONS.map((opt) => {
            const isHover = hovered === opt.id;
            const canAfford = availableCredits >= opt.credits;
            return (
              <button
                key={opt.id}
                type="button"
                onMouseEnter={() => setHovered(opt.id)}
                onFocus={() => setHovered(opt.id)}
                onClick={() => (canAfford ? onChoose(opt.id) : setAddOpen(true))}
                aria-disabled={!canAfford}
                className="group relative flex flex-col items-stretch text-left transition-transform hover:-translate-y-1 focus:outline-none focus:-translate-y-1"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -inset-2 -z-10 rounded-[22px] blur-xl transition-opacity"
                  style={{
                    background: opt.accent,
                    opacity: isHover ? 0.7 : 0.35,
                  }}
                />
                <span
                  className="relative flex h-full flex-col overflow-hidden rounded-[16px] p-5"
                  style={{
                    background:
                      "radial-gradient(ellipse at top, rgba(120,75,20,0.85) 0%, rgba(60,32,8,0.95) 65%, rgba(30,16,4,1) 100%)",
                    border: `1px solid ${opt.ring}`,
                    boxShadow:
                      "inset 0 1px 0 rgba(255,225,170,0.22), inset 0 -3px 0 rgba(0,0,0,0.55), 0 12px 30px -10px rgba(0,0,0,0.7)",
                  }}
                >
                  {/* corner tendrils */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-40"
                    style={{
                      background:
                        "radial-gradient(circle at 15% 10%, rgba(255,220,160,0.28), transparent 45%), radial-gradient(circle at 85% 90%, rgba(255,180,90,0.22), transparent 50%)",
                    }}
                  />

                  <div className="relative flex items-center justify-between">
                    <span
                      className="text-[11px] uppercase tracking-[0.32em] text-amber-100/85"
                      style={{ fontFamily: "ui-serif, Georgia, serif" }}
                    >
                      Path
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/50 bg-amber-200/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-100">
                      <span aria-hidden>✦</span>
                      {opt.credits} credits
                    </span>
                  </div>

                  <h3
                    className="relative mt-3 text-[24px] leading-tight"
                    style={{
                      fontFamily: 'ui-serif, Georgia, "Times New Roman", serif',
                      textShadow: "0 1px 0 rgba(0,0,0,0.6), 0 0 10px rgba(255,200,110,0.35)",
                    }}
                  >
                    {opt.name}
                  </h3>
                  <p className="relative mt-1.5 text-[12.5px] italic text-amber-100/85">
                    {opt.tagline}
                  </p>

                  <ul className="relative mt-4 space-y-1.5 text-[12.5px] leading-snug text-amber-50/95">
                    {opt.perks.map((p, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-[2px] text-amber-200/85">✦</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Door preview — keep the same vertical footprint for every tier */}
                  <div className="relative mt-5 flex h-[140px] items-end justify-center gap-3">
                    {opt.id === "good" && (
                      <span className="flex h-full items-center">
                        <KeyIcon disabled />
                      </span>
                    )}
                    {opt.id === "better" && (
                      <>
                        <FantasyDoor state="locked" />
                        <span className="flex h-full items-center">
                          <KeyIcon />
                        </span>
                      </>
                    )}
                    {opt.id === "best" && (
                      <>
                        <FantasyDoor state="cracked" unlocked />
                        <FantasyDoor state="cracked" unlocked />
                      </>
                    )}
                  </div>

                  <span
                    className={
                      "relative mt-5 inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold transition " +
                      (canAfford
                        ? "border-amber-200/70 bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 shadow-[0_4px_18px_-4px_rgba(255,180,80,0.7)] group-hover:from-amber-200 group-hover:to-amber-400"
                        : "border-amber-200/25 bg-black/40 text-amber-100/70 group-hover:bg-black/55")
                    }
                  >
                    {canAfford ? `Choose ${opt.name}` : "Add Credits to Choose"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <p className="relative mt-5 text-center text-[11px] text-amber-100/65">
          You can upgrade later — every step keeps your project report packet.
        </p>
      </div>

      {addOpen && (
        <AddCreditsPanel
          onClose={() => setAddOpen(false)}
          onAdd={addCredits}
          currentCredits={availableCredits}
        />
      )}
    </div>
  );
}

function AddCreditsPanel({
  onClose,
  onAdd,
  currentCredits,
}: {
  onClose: () => void;
  onAdd: (amount: number) => void;
  currentCredits: number;
}) {
  const [custom, setCustom] = useState<string>("");
  const presets = [20, 40, 60];
  const customNum = Math.max(0, Math.floor(Number(custom) || 0));

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Add credits"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(10,5,0,0.6) 0%, rgba(0,0,0,0.85) 80%)",
          backdropFilter: "blur(4px)",
        }}
      />
      <div
        className="relative w-full max-w-[420px] rounded-[18px] px-6 py-6 text-amber-50"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(150,100,30,0.95) 0%, rgba(60,32,8,0.98) 70%, rgba(30,16,4,1) 100%)",
          border: "1px solid rgba(240,195,110,0.7)",
          boxShadow:
            "0 30px 80px -20px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,225,160,0.3), 0 0 60px -10px rgba(255,190,90,0.55)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full border border-amber-200/40 bg-black/40 px-2 py-0.5 text-[11px] text-amber-50/80 hover:bg-black/60"
        >
          ✕
        </button>

        <div className="flex items-center justify-center gap-2">
          <span className="text-amber-200/90">✦</span>
          <span className="text-[11px] uppercase tracking-[0.32em] text-amber-100/90">
            Add Credits
          </span>
          <span className="text-amber-200/90">✦</span>
        </div>
        <h3
          className="mt-2 text-center text-[20px] leading-tight"
          style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}
        >
          Forge more credits
        </h3>
        <p className="mt-1 text-center text-[12px] text-amber-100/80">
          Current balance: <span className="font-semibold text-amber-100">{currentCredits}</span>{" "}
          credits
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {presets.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onAdd(n)}
              className="rounded-xl border border-amber-200/50 bg-black/35 px-3 py-3 text-center transition hover:-translate-y-0.5 hover:border-amber-200/80 hover:bg-black/50"
            >
              <div className="text-[18px] font-semibold text-amber-100">+{n}</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-amber-100/70">
                credits
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-amber-200/30 bg-black/30 p-3">
          <label className="block text-[11px] uppercase tracking-[0.2em] text-amber-100/80">
            Custom amount
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="e.g. 100"
              className="w-full rounded-lg border border-amber-200/30 bg-black/40 px-3 py-2 text-sm text-amber-50 placeholder:text-amber-100/40 focus:border-amber-200/70 focus:outline-none"
            />
            <button
              type="button"
              disabled={customNum <= 0}
              onClick={() => onAdd(customNum)}
              className={
                "rounded-lg border px-3 py-2 text-[12px] font-semibold transition " +
                (customNum > 0
                  ? "border-amber-200/70 bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 hover:from-amber-200 hover:to-amber-400"
                  : "cursor-not-allowed border-amber-200/20 bg-black/40 text-amber-100/40")
              }
            >
              Add
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-[10.5px] text-amber-100/60">
          Credits are used for project report depth here. Build subscriptions are separate.
        </p>
      </div>
    </div>
  );
}

function FantasyDoor({
  state,
  unlocked = false,
}: {
  state: "cracked" | "open" | "locked";
  unlocked?: boolean;
}) {
  const opened = state === "open";
  // "cracked" should look almost-closed, barely ajar
  const leafAngle = state === "locked" ? 0 : opened ? 72 : 10;
  const glowOpacity = state === "locked" ? 0 : opened ? 0.9 : 0.35;
  const glowSize = opened ? 140 : 70;

  return (
    <span className="relative inline-block" style={{ width: 92, height: 140 }} aria-hidden>
      {/* warm glow spill behind the door */}
      <span
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: glowSize,
          height: glowSize,
          background:
            "radial-gradient(ellipse at center, rgba(255,225,150,0.95) 0%, rgba(255,180,80,0.55) 35%, transparent 72%)",
          filter: "blur(10px)",
          opacity: glowOpacity,

          transition: "all 400ms ease",
        }}
      />

      {/* stone arch frame */}
      <span
        className="absolute inset-0 overflow-hidden"
        style={{
          borderRadius: "46px 46px 6px 6px",
          background: "linear-gradient(180deg, #4a3318 0%, #2a1c0a 60%, #15100a 100%)",
          border: "1px solid rgba(240,200,120,0.55)",
          boxShadow:
            "inset 0 1px 0 rgba(255,225,170,0.25), inset 0 -3px 0 rgba(0,0,0,0.55), 0 10px 24px -8px rgba(0,0,0,0.7)",
        }}
      >
        {/* stone block highlights along the arch */}
        <svg
          viewBox="0 0 92 140"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          fill="none"
          stroke="rgba(255,220,160,0.18)"
          strokeWidth="0.8"
        >
          <path d="M2,46 Q46,2 90,46" />
          <path d="M6,40 Q46,6 86,40" />
          <line x1="46" y1="2" x2="46" y2="40" />
          <line x1="22" y1="14" x2="30" y2="40" />
          <line x1="70" y1="14" x2="62" y2="40" />
        </svg>

        {/* keystone */}
        <span
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: 2,
            width: 14,
            height: 12,
            background: "linear-gradient(180deg, #8b6628 0%, #4d3410 100%)",
            border: "1px solid rgba(0,0,0,0.55)",
            borderRadius: "3px 3px 1px 1px",
            boxShadow: "inset 0 1px 0 rgba(255,225,160,0.4)",
          }}
        />

        {/* doorway opening (dark hole behind the leaves) */}
        <span
          className="absolute"
          style={{
            left: 10,
            right: 10,
            top: 16,
            bottom: 8,
            borderRadius: "40px 40px 3px 3px",
            background:
              "radial-gradient(ellipse at 50% 60%, rgba(255,210,130,0.55) 0%, rgba(120,60,10,0.35) 35%, rgba(10,5,0,0.95) 80%)",
            boxShadow: "inset 0 0 18px rgba(0,0,0,0.85)",
          }}
        />

        {/* door leaves */}
        {(["left", "right"] as const).map((side) => {
          const isLeft = side === "left";
          return (
            <span
              key={side}
              className="absolute"
              style={{
                top: 18,
                bottom: 10,
                [isLeft ? "left" : "right"]: 12,
                width: "calc(50% - 14px)",
                borderRadius: isLeft ? "34px 2px 1px 2px" : "2px 34px 2px 1px",
                background:
                  "repeating-linear-gradient(90deg, rgba(95,55,18,1) 0 4px, rgba(70,38,10,1) 4px 5px), linear-gradient(180deg, rgba(120,72,22,1) 0%, rgba(60,32,8,1) 100%)",
                backgroundBlendMode: "multiply",
                border: "1px solid rgba(0,0,0,0.6)",
                boxShadow: "inset 0 1px 0 rgba(255,210,140,0.18), inset 0 -2px 0 rgba(0,0,0,0.55)",
                transform: `perspective(420px) rotateY(${isLeft ? -leafAngle : leafAngle}deg)`,
                transformOrigin: isLeft ? "left center" : "right center",
                transition: "transform 600ms cubic-bezier(.2,.7,.2,1)",
              }}
            >
              {/* iron strap top */}
              <span
                className="absolute left-0 right-0"
                style={{
                  top: "18%",
                  height: 4,
                  background: "linear-gradient(180deg, #5a4525 0%, #1d140a 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,220,160,0.25)",
                }}
              />
              {/* iron strap bottom */}
              <span
                className="absolute left-0 right-0"
                style={{
                  bottom: "18%",
                  height: 4,
                  background: "linear-gradient(180deg, #5a4525 0%, #1d140a 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,220,160,0.25)",
                }}
              />
              {/* rivets */}
              <span
                className="absolute"
                style={{
                  [isLeft ? "right" : "left"]: 3,
                  top: "calc(18% - 3px)",
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 35% 30%, #d8b878 0%, #3a2a10 80%)",
                }}
              />
              <span
                className="absolute"
                style={{
                  [isLeft ? "right" : "left"]: 3,
                  bottom: "calc(18% - 3px)",
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 35% 30%, #d8b878 0%, #3a2a10 80%)",
                }}
              />
              {/* handle ring */}
              <span
                className="absolute"
                style={{
                  [isLeft ? "right" : "left"]: 4,
                  top: "50%",
                  width: 6,
                  height: 6,
                  marginTop: -3,
                  borderRadius: "50%",
                  border: "1.4px solid #e0c07a",
                  background: "rgba(0,0,0,0.4)",
                  boxShadow: "0 0 4px rgba(255,210,130,0.55)",
                }}
              />
            </span>
          );
        })}
      </span>

      {/* lock badge: only on locked doors */}
      {state === "locked" && (
        <span
          className="pointer-events-none absolute left-1/2 -translate-x-1/2"
          style={{
            top: "50%",
            width: 20,
            height: 24,
          }}
          aria-hidden
        >
          {/* shackle */}
          <span
            className="absolute"
            style={{
              left: "50%",
              top: 0,
              transform: "translateX(-50%)",
              width: 12,
              height: 11,
              borderRadius: "6px 6px 0 0",
              border: "2.2px solid #f0d28a",
              borderBottom: "none",
              background: "transparent",
              boxShadow: "0 0 4px rgba(255,210,130,0.55)",
            }}
          />
          {/* body */}
          <span
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: 9,
              width: 18,
              height: 14,
              borderRadius: 3,
              background: "linear-gradient(180deg, #e6c585 0%, #8b6628 60%, #4d3410 100%)",
              border: "1px solid rgba(0,0,0,0.6)",
              boxShadow: "inset 0 1px 0 rgba(255,235,180,0.55), 0 1px 3px rgba(0,0,0,0.6)",
            }}
          />
          {/* keyhole */}
          <span
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: 13,
              width: 3,
              height: 6,
              borderRadius: "50% 50% 30% 30%",
              background: "#1a0f04",
            }}
          />
        </span>
      )}

      {/* threshold shadow */}
      <span
        className="pointer-events-none absolute -bottom-1 left-1 right-1 h-2 rounded-full blur-[3px]"
        style={{ background: "rgba(0,0,0,0.55)" }}
      />
    </span>
  );
}

function KeyIcon({ disabled = false }: { disabled?: boolean }) {
  return (
    <span
      className="relative inline-block self-center"
      style={{
        width: 52,
        height: 22,
        transform: "rotate(-12deg)",
        filter: disabled ? undefined : undefined,
        opacity: 1,
      }}
      aria-hidden
    >
      {/* faint warm aura */}
      <span
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,220,150,0.55) 0%, transparent 70%)",
          filter: "blur(6px)",
          opacity: 0.85,
        }}
      />
      {/* bow (head ring) */}
      <span
        className="absolute"
        style={{
          left: 0,
          top: 1,
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: "3px solid #e9c684",
          background:
            "radial-gradient(circle at 35% 30%, rgba(255,235,180,0.4) 0%, transparent 60%)",
          boxShadow: "0 0 6px rgba(255,210,130,0.6), inset 0 0 4px rgba(0,0,0,0.45)",
        }}
      />
      {/* bow inner gem */}
      <span
        className="absolute"
        style={{
          left: 7,
          top: 8,
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 30%, #fff4c8 0%, #c98a1c 80%)",
          boxShadow: "0 0 4px rgba(255,210,130,0.85)",
        }}
      />
      {/* shaft */}
      <span
        className="absolute"
        style={{
          left: 18,
          top: 9,
          width: 30,
          height: 4,
          background: "linear-gradient(180deg, #f1d290 0%, #b0822c 55%, #5a3f12 100%)",
          borderRadius: 1,
          boxShadow: "inset 0 1px 0 rgba(255,240,200,0.55)",
        }}
      />
      {/* teeth */}
      <span
        className="absolute"
        style={{
          left: 40,
          top: 13,
          width: 4,
          height: 7,
          background: "linear-gradient(180deg, #d8a85a 0%, #6a4a14 100%)",
          borderRadius: "0 0 1px 1px",
        }}
      />
      <span
        className="absolute"
        style={{
          left: 46,
          top: 13,
          width: 4,
          height: 5,
          background: "linear-gradient(180deg, #d8a85a 0%, #6a4a14 100%)",
          borderRadius: "0 0 1px 1px",
        }}
      />
      {disabled && (
        <>
          {/* "no" circle */}
          <span
            className="pointer-events-none absolute"
            style={{
              left: 6,
              top: -8,
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: "2.5px solid #e85a4a",
              boxShadow: "0 0 6px rgba(232,90,74,0.55)",
              transform: "rotate(12deg)",
            }}
            aria-hidden
          />
          {/* diagonal slash */}
          <span
            className="pointer-events-none absolute"
            style={{
              left: 4,
              top: 9,
              width: 42,
              height: 3,
              background: "#e85a4a",
              borderRadius: 2,
              boxShadow: "0 0 6px rgba(232,90,74,0.55)",
              transform: "rotate(-33deg)",
              transformOrigin: "center",
            }}
            aria-hidden
          />
        </>
      )}
    </span>
  );
}
