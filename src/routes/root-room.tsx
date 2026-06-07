import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import rootRoomBgAsset from "@/assets/root-room-bg.png.asset.json";
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

// Process order (NOT visual left-to-right order)
type StepId = "foundation" | "possibilities" | "safety" | "record" | "da-stamp";

type Tunnel = {
  id: StepId;
  label: string;
  /** approximate horizontal center on the background image, as % */
  x: number;
  /** color tint for the tunnel highlight */
  accent: string;
};

// Visual left-to-right positions on the background (Foundation, Safety, Da Stamp, Record, Possibilities)
const TUNNELS: Tunnel[] = [
  { id: "foundation",    label: "Foundation",    x: 10, accent: "rgba(255,200,110,0.9)" },
  { id: "safety",        label: "Safety",        x: 30, accent: "rgba(140,210,255,0.9)" },
  { id: "da-stamp",      label: "Da Stamp",      x: 50, accent: "rgba(255,170,90,0.9)"  },
  { id: "record",        label: "Record",        x: 70, accent: "rgba(180,255,170,0.9)" },
  { id: "possibilities", label: "Possibilities", x: 90, accent: "rgba(220,180,255,0.9)" },
];

// Process order — what we walk through, regardless of visual position
const PROCESS_ORDER: StepId[] = [
  "foundation",
  "possibilities",
  "safety",
  "record",
  "da-stamp",
];

const STEP_MESSAGES: Record<StepId, string> = {
  foundation:
    "Foundation is preparing the clean starting packet. This step checks that the idea has enough shape to move deeper into the roots. Once the foundation is clear, the next guide can continue the process.",
  possibilities:
    "Possibilities is exploring the directions this idea could grow. The roots are sketching out the shapes it might take so the best path forward becomes clear.",
  safety:
    "Safety is checking for sharp edges before the idea travels further. Concerns, risks, and gaps are quietly being smoothed so nothing trips up the journey ahead.",
  record:
    "Record is gently writing the story of what the roots have learned so far. Every choice and refinement is being kept so this idea always remembers where it came from.",
  "da-stamp":
    "Da Stamp is the final blessing of the roots. When this glows, the packet has earned its mark and is ready to rise back into the light.",
};

function RootRoom() {
  const [activeIndex] = useState(0); // index into PROCESS_ORDER — advances only via guided flow
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
  }, []);

  const activeStepId = PROCESS_ORDER[activeIndex];
  const activeTunnel = useMemo(
    () => TUNNELS.find((t) => t.id === activeStepId)!,
    [activeStepId],
  );
  const activeMessage = STEP_MESSAGES[activeStepId];

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-black text-amber-50">
      {/* Static full-screen scene (no camera pan/zoom) */}
      <div className="absolute inset-0">
        {/* Background */}
        <img
          src={rootRoomBgAsset.url}
          alt="The Root Room — a circular underground chamber with five tree-root tunnels."
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />

        {/* Soft entry fade-in overlay */}
        {!reducedMotion && (
          <div
            className="pointer-events-none absolute inset-0 animate-[rr-fade_900ms_ease-out_forwards]"
            style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)" }}
          />
        )}

        {/* Tunnel highlights */}
        {TUNNELS.map((t) => {
          const isActive = t.id === activeStepId;
          if (!isActive) return null;
          return (
            <div
              key={t.id}
              className="pointer-events-none absolute"
              style={{
                left: `${t.x}%`,
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
          );
        })}


      </div>

      {/* UI chrome */}
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

      {/* Parchment status panel near the podium */}
      <div
        className="pointer-events-none absolute left-1/2 z-10 w-[min(440px,86vw)] -translate-x-1/2 px-4"
        style={{ bottom: "6%" }}
      >
        <div
          className="pointer-events-auto relative overflow-hidden rounded-[14px] px-5 py-4 text-amber-50"
          style={{
            background:
              "radial-gradient(ellipse at top, rgba(80,45,15,0.78) 0%, rgba(45,22,6,0.82) 70%, rgba(30,14,4,0.88) 100%)",
            border: "1px solid rgba(210,160,80,0.45)",
            boxShadow:
              "0 12px 40px -10px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,210,140,0.18), 0 0 30px -10px rgba(255,180,80,0.45)",
            backdropFilter: "blur(6px)",
          }}
        >
          {/* subtle inner parchment grain */}
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background:
                "radial-gradient(circle at 20% 10%, rgba(255,220,160,0.18), transparent 55%), radial-gradient(circle at 80% 90%, rgba(255,180,90,0.12), transparent 60%)",
            }}
          />
          <div className="relative flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span className="text-[10px] uppercase tracking-[0.32em] text-amber-200/80">
              {activeTunnel.label}
            </span>
          </div>
          <p className="relative mt-2 text-[13px] leading-relaxed text-amber-50/90">
            {activeMessage}
          </p>
        </div>
      </div>


      <style>{`
        @keyframes rr-fade {
          from { opacity: 1; }
          to   { opacity: 0.35; }
        }
        @keyframes rr-pulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.08); }
        }
        @keyframes rr-packet-land {
          0%   { transform: translateY(-160%) scale(1.6) rotate(-6deg); opacity: 0; }
          60%  { transform: translateY(10%)   scale(0.95) rotate(2deg);  opacity: 1; }
          80%  { transform: translateY(-4%)   scale(1.02) rotate(-1deg); }
          100% { transform: translateY(0)     scale(1)    rotate(0deg);  opacity: 1; }
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
      `}</style>
    </main>
  );
}
