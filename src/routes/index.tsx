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
    posts: buildIntakeFolderPosts(text, ts),
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
