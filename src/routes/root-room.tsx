import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import rootRoomBgAsset from "@/assets/root-room-bg.png.asset.json";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

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

function RootRoom() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0); // index into PROCESS_ORDER
  const [packetLanded, setPacketLanded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
  }, []);

  // Let the packet "land" on the podium after entry
  useEffect(() => {
    const t = window.setTimeout(() => setPacketLanded(true), reducedMotion ? 100 : 900);
    return () => window.clearTimeout(t);
  }, [reducedMotion]);

  const activeStepId = PROCESS_ORDER[activeIndex];
  const activeTunnel = useMemo(
    () => TUNNELS.find((t) => t.id === activeStepId)!,
    [activeStepId],
  );

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
                top: "52%",
                width: "16%",
                height: "55%",
                transform: "translate(-50%, -100%)",
              }}
            >
              {!reducedMotion && Array.from({ length: 7 }).map((_, i) => (
                <span
                  key={i}
                  className="rr-smoke"
                  style={{
                    left: `${15 + i * 11}%`,
                    animationDelay: `${i * 0.55}s`,
                    animationDuration: `${5 + (i % 3) * 0.8}s`,
                  }}
                />
              ))}
            </div>
          );
        })}


        {/* Packet on the podium */}
        <div
          className="pointer-events-none absolute"
          style={{
            left: "50%",
            top: "72%",
            transform: "translate(-50%, -50%)",
            width: "5.5%",
            aspectRatio: "3 / 4",
          }}
        >
          <div
            className={
              "relative h-full w-full rounded-[4px] " +
              (reducedMotion ? "" : "animate-[rr-packet-land_900ms_ease-out_forwards]")
            }
            style={{
              background: "linear-gradient(135deg,#f5e0a8 0%,#d9b86a 60%,#a8842e 100%)",
              border: "1px solid rgba(60,30,5,0.85)",
              boxShadow: "0 10px 28px rgba(0,0,0,0.6), 0 0 30px rgba(255,200,120,0.65)",
            }}
          >
            <div
              className="absolute inset-0 rounded-[3px]"
              style={{
                background: "radial-gradient(circle at 50% 40%, rgba(255,250,220,0.55) 0%, transparent 65%)",
              }}
            />
          </div>
          {/* Glow underneath */}
          {!reducedMotion && (
            <div
              className="absolute -inset-4 -z-10 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(255,210,130,0.7) 0%, transparent 70%)",
                animation: "rr-pulse 2.4s ease-in-out infinite",
              }}
            />
          )}
        </div>
      </div>

      {/* UI chrome — outside camera layer so it doesn't pan */}
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

      {/* Active step pill + advance */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-3 px-4 pb-6 sm:pb-10">
        <div
          className="pointer-events-auto flex items-center gap-2 rounded-full border border-amber-200/40 bg-black/45 px-4 py-2 text-amber-50 backdrop-blur-md"
          style={{ boxShadow: "0 0 30px -8px rgba(255,180,80,0.55)" }}
        >
          <Sparkles className="h-4 w-4 text-amber-300" />
          <span className="text-[11px] uppercase tracking-[0.3em] text-amber-100/80">
            Step {activeIndex + 1} of {PROCESS_ORDER.length}
          </span>
          <span className="text-sm font-medium">{activeTunnel.label}</span>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
            disabled={activeIndex === 0}
            className="rounded-full border border-amber-200/30 bg-white/[0.06] px-3 py-1.5 text-xs text-white/80 backdrop-blur-md transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={() =>
              setActiveIndex((i) => Math.min(PROCESS_ORDER.length - 1, i + 1))
            }
            disabled={activeIndex === PROCESS_ORDER.length - 1}
            className="inline-flex items-center gap-1 rounded-full border border-amber-200/60 bg-gradient-to-b from-amber-200/90 to-amber-400/80 px-4 py-1.5 text-xs font-semibold text-neutral-900 shadow-[0_0_24px_-4px_rgba(255,180,80,0.75)] transition hover:from-amber-100 hover:to-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next tunnel <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Tiny order legend */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-amber-100/70">
          {PROCESS_ORDER.map((id, i) => {
            const t = TUNNELS.find((x) => x.id === id)!;
            const done = i < activeIndex;
            const active = i === activeIndex;
            return (
              <span
                key={id}
                className={
                  "rounded-full border px-2 py-0.5 " +
                  (active
                    ? "border-amber-200/80 bg-amber-200/20 text-amber-50"
                    : done
                      ? "border-amber-200/30 bg-white/[0.04] text-amber-100/60 line-through"
                      : "border-amber-200/20 bg-white/[0.02] text-amber-100/50")
                }
              >
                {i + 1}. {t.label}
              </span>
            );
          })}
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
          0%   { transform: translate(-50%, 0) scale(0.6); opacity: 0; }
          20%  { opacity: 0.45; }
          70%  { opacity: 0.3; }
          100% { transform: translate(calc(-50% + 14px), -180%) scale(2.2); opacity: 0; }
        }
        .rr-smoke {
          position: absolute;
          bottom: 0;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(220,210,200,0.55) 0%, rgba(180,170,160,0.3) 45%, transparent 75%);
          filter: blur(8px);
          transform: translate(-50%, 0);
          animation: rr-smoke-rise linear infinite;
          will-change: transform, opacity;
        }
      `}</style>
    </main>
  );
}
