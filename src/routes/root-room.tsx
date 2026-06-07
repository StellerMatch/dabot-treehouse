import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import rootRoomBgAsset from "@/assets/root-room-bg.png.asset.json";
import clarityFlyingAsset from "@/assets/clarity-flying.png.asset.json";
import clarityPresentingAsset from "@/assets/clarity-presenting.png.asset.json";
import { ArrowLeft, Sparkles } from "lucide-react";

export const Route = createFileRoute("/root-room")({
  head: () => ({
    meta: [
      { title: "Root Room — DaBotTree" },
      {
        name: "description",
        content:
          "Step inside the Root Room. Your clean packet moves through the five tunnels to take shape.",
      },
    ],
  }),
  component: RootRoom,
});

type StepId = "foundation" | "possibilities" | "safety" | "record" | "da-stamp";

type Tunnel = {
  id: StepId;
  label: string;
  x: number;
  accent: string;
};

const TUNNELS: Tunnel[] = [
  { id: "foundation",    label: "Foundation",    x: 10, accent: "rgba(255,200,110,0.9)" },
  { id: "safety",        label: "Safety",        x: 30, accent: "rgba(140,210,255,0.9)" },
  { id: "da-stamp",      label: "Da Stamp",      x: 50, accent: "rgba(255,170,90,0.9)"  },
  { id: "record",        label: "Record",        x: 70, accent: "rgba(180,255,170,0.9)" },
  { id: "possibilities", label: "Possibilities", x: 90, accent: "rgba(220,180,255,0.9)" },
];

const PROCESS_ORDER: StepId[] = [
  "foundation",
  "possibilities",
  "safety",
  "record",
  "da-stamp",
];

const STEP_MESSAGES: Record<StepId, string> = {
  foundation:
    "Foundation is checking whether the idea has a clean starting shape. This step looks for the core purpose, the basic audience, and the first useful direction before the packet moves deeper into the roots.",
  possibilities:
    "Possibilities is exploring the directions this idea could grow. The roots are sketching out the shapes it might take so the best path forward becomes clear.",
  safety:
    "Safety is checking for sharp edges before the idea travels further. Concerns, risks, and gaps are quietly being smoothed so nothing trips up the journey ahead.",
  record:
    "Record is gently writing the story of what the roots have learned so far. Every choice and refinement is being kept so this idea always remembers where it came from.",
  "da-stamp":
    "Da Stamp is the final blessing of the roots. When this glows, the packet has earned its mark and is ready to rise back into the light.",
};

// Phases: intro -> smoke (smoke only, 2s) -> clarity (clarity flying in) -> dropoff (presenting at podium)
type Phase = "intro" | "smoke" | "clarity" | "dropoff";

function RootRoom() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
  }, []);

  // Sequence after Start
  useEffect(() => {
    if (phase === "smoke") {
      const t = window.setTimeout(() => setPhase("clarity"), 2000);
      return () => window.clearTimeout(t);
    }
    if (phase === "clarity") {
      // Clarity flies from tunnel to behind podium (~3.2s), then switches to dropoff
      const t = window.setTimeout(() => setPhase("dropoff"), 3200);
      return () => window.clearTimeout(t);
    }
  }, [phase]);

  const activeStepId: StepId = "foundation";
  const activeTunnel = useMemo(
    () => TUNNELS.find((t) => t.id === activeStepId)!,
    [],
  );

  const showFoundationGlow = phase !== "intro";
  const showFoundationText = phase === "clarity" || phase === "dropoff";

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-black text-amber-50">
      <div className="absolute inset-0">
        <img
          src={rootRoomBgAsset.url}
          alt="The Root Room — a circular underground chamber with five tree-root tunnels."
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />

        {!reducedMotion && (
          <div
            className="pointer-events-none absolute inset-0 animate-[rr-fade_900ms_ease-out_forwards]"
            style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)" }}
          />
        )}

        {/* Foundation tunnel smoke (only after Start) */}
        {showFoundationGlow && (
          <div
            className="pointer-events-none absolute"
            style={{
              left: `${activeTunnel.x}%`,
              top: "42%",
              width: "10%",
              height: "45%",
              transform: "translate(-50%, 0)",
            }}
          >
            {!reducedMotion && Array.from({ length: 10 }).map((_, i) => {
              const drift = (i % 2 === 0 ? 1 : -1) * (12 + (i * 5) % 20);
              const size = 42 + (i * 11) % 32;
              return (
                <span
                  key={i}
                  className="rr-smoke"
                  style={{
                    left: `${30 + (i * 13) % 40}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    animationDelay: `${(i * 0.55) % 4}s`,
                    animationDuration: `${6.5 + (i % 4) * 1.1}s`,
                    ['--drift' as never]: `${drift}px`,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Clarity flying from Foundation tunnel to podium */}
        {phase === "clarity" && (
          <img
            src={clarityFlyingAsset.url}
            alt=""
            className="pointer-events-none absolute z-[5] rr-clarity-fly"
            draggable={false}
          />
        )}

        {/* Clarity presenting the book at the podium */}
        {phase === "dropoff" && (
          <img
            src={clarityPresentingAsset.url}
            alt=""
            className="pointer-events-none absolute z-[5] rr-clarity-present"
            draggable={false}
          />
        )}
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 pt-5 sm:px-8 sm:pt-6">
        <Link
          to="/dashboard"
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-amber-200/40 bg-black/35 px-3.5 py-1.5 text-xs text-amber-50/90 backdrop-blur-md transition hover:bg-black/55"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Library
        </Link>
        <div className="pointer-events-auto rounded-full border border-amber-200/40 bg-black/35 px-3.5 py-1.5 text-[11px] uppercase tracking-[0.3em] text-amber-100/90 backdrop-blur-md">
          Root Room
        </div>
      </header>

      {/* Parchment status panel */}
      <div
        className="pointer-events-none absolute left-1/2 z-10 w-[min(460px,88vw)] -translate-x-1/2 px-4"
        style={{ bottom: "6%" }}
      >
        <div
          className="pointer-events-auto relative overflow-hidden rounded-[14px] px-6 py-5 text-amber-50"
          style={{
            background:
              "radial-gradient(ellipse at top, rgba(150,100,30,0.82) 0%, rgba(95,60,15,0.86) 60%, rgba(55,32,8,0.92) 100%)",
            border: "1px solid rgba(240,195,110,0.55)",
            boxShadow:
              "0 14px 44px -10px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,225,160,0.25), 0 0 36px -8px rgba(255,190,90,0.55)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(circle at 20% 10%, rgba(255,230,170,0.22), transparent 55%), radial-gradient(circle at 80% 90%, rgba(255,190,100,0.16), transparent 60%)",
            }}
          />

          {showFoundationText ? (
            <>
              <div className="relative flex items-center justify-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                <span className="text-[11px] uppercase tracking-[0.34em] text-amber-100/90">
                  Active Step
                </span>
              </div>
              <h2 className="relative mt-1 text-center text-[22px] font-bold tracking-wide text-amber-50">
                Foundation
              </h2>
              <p className="relative mt-2 text-center text-[13px] leading-relaxed text-amber-50/95">
                {STEP_MESSAGES.foundation}
              </p>
            </>
          ) : (
            <>
              <h2 className="relative text-center text-[24px] font-bold tracking-wide text-amber-50">
                Root Room
              </h2>
              <p className="relative mt-2 text-center text-[13px] leading-relaxed text-amber-50/95">
                This is where the clean packet enters DaBotTree's roots. Each guide will review one part of the idea before the packet is ready to move forward.
              </p>
              {phase === "intro" && (
                <div className="relative mt-4 flex justify-center">
                  <button
                    onClick={() => setPhase("smoke")}
                    className="inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-gradient-to-b from-amber-300 to-amber-500 px-6 py-2 text-sm font-semibold text-amber-950 shadow-[0_4px_18px_-4px_rgba(255,180,80,0.7)] transition hover:from-amber-200 hover:to-amber-400"
                  >
                    <Sparkles className="h-4 w-4" />
                    Start
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes rr-fade {
          from { opacity: 1; }
          to   { opacity: 0.35; }
        }
        @keyframes rr-smoke-rise {
          0%   { transform: translate(-50%, 20%) scale(0.4); opacity: 0; }
          20%  { opacity: 0.75; }
          60%  { transform: translate(calc(-50% + (var(--drift) * 0.5)), -100%) scale(1.3); opacity: 0.55; }
          100% { transform: translate(calc(-50% + var(--drift)), -210%) scale(2); opacity: 0; }
        }
        .rr-smoke {
          position: absolute;
          top: 0;
          border-radius: 50%;
          background:
            radial-gradient(circle at 35% 35%, rgba(240,233,220,0.65) 0%, rgba(200,190,175,0.45) 38%, rgba(150,140,125,0.22) 65%, transparent 82%),
            radial-gradient(circle at 70% 60%, rgba(225,215,200,0.35) 0%, transparent 55%);
          filter: blur(6px);
          mix-blend-mode: screen;
          transform: translate(-50%, 0);
          animation: rr-smoke-rise ease-out infinite;
          will-change: transform, opacity;
        }

        /* Clarity flying from Foundation tunnel (~10% left, ~55% top) toward podium (~50% left, ~70% top) */
        @keyframes rr-clarity-fly-kf {
          0%   { left: 10%; top: 58%; transform: translate(-50%, -50%) scale(0.35) rotate(-4deg); opacity: 0; filter: drop-shadow(0 0 20px rgba(255,200,120,0.6)); }
          15%  { opacity: 1; }
          100% { left: 50%; top: 72%; transform: translate(-50%, -50%) scale(0.85) rotate(2deg);  opacity: 1; filter: drop-shadow(0 0 28px rgba(255,210,140,0.85)); }
        }
        .rr-clarity-fly {
          height: 42vh; width: auto;
          animation: rr-clarity-fly-kf 3.2s cubic-bezier(0.4, 0.05, 0.4, 1) forwards;
          will-change: left, top, transform, opacity;
        }
        @keyframes rr-clarity-present-kf {
          0%   { opacity: 0; transform: translate(-50%, -48%) scale(0.85); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(0.9);  }
        }
        .rr-clarity-present {
          left: 50%; top: 70%;
          height: 46vh; width: auto;
          transform: translate(-50%, -50%);
          animation: rr-clarity-present-kf 0.5s ease-out forwards;
          filter: drop-shadow(0 0 32px rgba(255,210,140,0.9));
        }
      `}</style>
    </main>
  );
}
