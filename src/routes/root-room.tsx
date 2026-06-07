import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import rootRoomBgAsset from "@/assets/root-room-bg-v2.png.asset.json";
import rootRoomPodiumAsset from "@/assets/root-room-podium.png.asset.json";
import rootRoomPodiumBookAsset from "@/assets/root-room-podium-book.png.asset.json";
import rootRoomFinalPodiumAsset from "@/assets/root-room-podium-v2.png.asset.json";
import rootRoomFinalBookAsset from "@/assets/podium-book-v2.png.asset.json";
import floatingBookAsset from "@/assets/floating-book.png.asset.json";
import clarityFlyingAsset from "@/assets/clarity-flying.png.asset.json";
import clarityPresentingAsset from "@/assets/clarity-presenting.png.asset.json";
import echoFlyingAsset from "@/assets/echo-flying.png.asset.json";
import echoPresentingAsset from "@/assets/echo-presenting.png.asset.json";
import shieldFlyingAsset from "@/assets/shield-flying.png.asset.json";
import shieldPresentingAsset from "@/assets/shield-presenting.png.asset.json";
import ledgerFlyingAsset from "@/assets/ledger-flying.png.asset.json";
import ledgerPresentingAsset from "@/assets/ledger-presenting.png.asset.json";
import stampFlyingAsset from "@/assets/stamp-flying.png.asset.json";
import stampPresentingAsset from "@/assets/stamp-presenting.png.asset.json";
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

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
  { id: "foundation", label: "Foundation", x: 10, accent: "rgba(255,200,110,0.9)" },
  { id: "safety", label: "Safety", x: 30, accent: "rgba(140,210,255,0.9)" },
  { id: "da-stamp", label: "Da Stamp", x: 50, accent: "rgba(255,170,90,0.9)" },
  { id: "record", label: "Record", x: 70, accent: "rgba(180,255,170,0.9)" },
  { id: "possibilities", label: "Possibilities", x: 90, accent: "rgba(220,180,255,0.9)" },
];

const PROCESS_ORDER: StepId[] = ["foundation", "possibilities", "safety", "record", "da-stamp"];

const TUNNEL_BY_ID = Object.fromEntries(TUNNELS.map((tunnel) => [tunnel.id, tunnel])) as Record<
  StepId,
  Tunnel
>;

const STEP_COPY: Record<StepId, { character: string; panelTitle: string; message: string }> = {
  foundation: {
    character: "CLARITY",
    panelTitle: "Clean Packet Foundation",
    message:
      "is checking whether the idea has a clean starting shape: core purpose, basic audience, and the first useful direction before the packet moves deeper into the roots.",
  },
  possibilities: {
    character: "ECHO",
    panelTitle: "Perspective Pass",
    message:
      "is widening the view around the idea, looking for useful directions, missing angles, and the possibilities that could shape the next layer.",
  },
  safety: {
    character: "SHIELD",
    panelTitle: "Boundary Check",
    message:
      "is checking for sharp edges before the idea travels further, smoothing concerns, risks, and gaps so nothing trips up the journey ahead.",
  },
  record: {
    character: "LEDGER",
    panelTitle: "Baseline Record",
    message:
      "is writing down what the roots have learned so far, keeping the choices and refinements clear so the idea remembers where it came from.",
  },
  "da-stamp": {
    character: "CHIEF",
    panelTitle: "Stamp of Approval",
    message:
      "is giving the final Root Room readiness mark. When this glows, the packet has earned its stamp and is ready to rise toward the Trunk.",
  },
};

const ROOT_ROOM_NEXT_PALETTE = {
  leather: {
    cover: "linear-gradient(180deg, #6b3a14 0%, #4a230a 55%, #2d1405 100%)",
    edge: "linear-gradient(180deg, #f5d99a 0%, #c89a52 100%)",
    stroke: "rgba(20,10,2,0.85)",
    text: "#fbe6b8",
  },
  gold: {
    cover: "linear-gradient(180deg, #8b5a18 0%, #5a3208 55%, #2d1605 100%)",
    edge: "linear-gradient(180deg, #ffe9a3 0%, #f0c050 60%, #b07a18 100%)",
    stroke: "rgba(20,10,2,0.85)",
    text: "#ffe9b8",
  },
};

// Phases: intro -> smoke -> flying -> working -> complete, then repeat for each tunnel.
type Phase = "intro" | "smoke" | "flying" | "working" | "complete" | "finished";

function RootRoom() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [ascending, setAscending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
  }, []);

  useEffect(() => {
    if (!ascending) return;
    const dur = reducedMotion ? 500 : 2000;
    const t = window.setTimeout(() => navigate({ to: "/trunk" }), dur);
    return () => window.clearTimeout(t);
  }, [ascending, navigate, reducedMotion]);

  const handleAscend = () => setAscending(true);

  // Sequence after Start
  useEffect(() => {
    if (phase === "smoke") {
      const t = window.setTimeout(() => setPhase("flying"), 1400);
      return () => window.clearTimeout(t);
    }
    if (phase === "flying") {
      const t = window.setTimeout(() => setPhase("working"), 3200);
      return () => window.clearTimeout(t);
    }
    if (phase === "working") {
      const t = window.setTimeout(() => setPhase("complete"), 6000);
      return () => window.clearTimeout(t);
    }
    if (phase === "complete") {
      const t = window.setTimeout(() => {
        if (activeStepIndex >= PROCESS_ORDER.length - 1) {
          setPhase("finished");
          return;
        }
        setActiveStepIndex((index) => index + 1);
        setPhase("smoke");
      }, 1400);
      return () => window.clearTimeout(t);
    }
  }, [activeStepIndex, phase]);

  const activeStepId = PROCESS_ORDER[activeStepIndex] ?? "foundation";
  const activeTunnel = useMemo(() => TUNNEL_BY_ID[activeStepId], [activeStepId]);
  const activeStepCopy = STEP_COPY[activeStepId];

  const showTunnelGlow = phase !== "intro" && phase !== "finished";
  const showActiveStepText = phase !== "intro" && phase !== "finished";
  const rootRoomComplete = phase === "finished";

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-black text-amber-50">
      <div className="absolute inset-0">
        <img
          src={rootRoomBgAsset.url}
          alt="The Root Room — a circular underground chamber with five tree-root tunnels."
          className="rr-room-bg absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />

        {!reducedMotion && (
          <div
            className="pointer-events-none absolute inset-0 animate-[rr-fade_900ms_ease-out_forwards]"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)",
            }}
          />
        )}

        <div className="rr-desktop-tunnels pointer-events-none absolute inset-0">
          {TUNNELS.map((tunnel) => (
            <TunnelMarker
              key={tunnel.id}
              tunnel={tunnel}
              active={phase !== "intro" && tunnel.id === activeStepId}
            />
          ))}
        </div>

        <div className="rr-mobile-stage pointer-events-none absolute inset-0">
          <MobileActiveTunnel tunnel={activeTunnel} active={phase !== "intro"} />
        </div>

        {/* Active tunnel smoke (only after Start) */}
        {showTunnelGlow && (
          <>
            <SmokeColumn
              className="rr-desktop-smoke"
              x={activeTunnel.x}
              reducedMotion={reducedMotion}
            />
            <SmokeColumn className="rr-mobile-smoke" x={50} reducedMotion={reducedMotion} />
          </>
        )}

        {/* Podium centered on the cavern floor — original podium during the journey, swaps to final podium+book when root room is complete */}
        {(() => {
          const showInterimBook =
            activeStepIndex > 0 || (activeStepId === "foundation" && phase === "complete");
          const showFinalPodium = rootRoomComplete;
          const showRestingBook = rootRoomComplete && !ascending;
          return (
            <>
              {/* Original podium (empty) */}
              <img
                src={rootRoomPodiumAsset.url}
                alt=""
                className="pointer-events-none absolute left-1/2 z-[10] -translate-x-1/2 select-none rr-podium"
                style={{
                  bottom: "19%",
                  height: "34.723vh",
                  width: "auto",
                  opacity: showFinalPodium || showInterimBook ? 0 : 1,
                }}
                draggable={false}
              />
              {/* Original podium with book (during steps) */}
              <img
                src={rootRoomPodiumBookAsset.url}
                alt=""
                className="pointer-events-none absolute left-1/2 z-[10] -translate-x-1/2 select-none rr-podium"
                style={{
                  bottom: "19%",
                  height: "34.723vh",
                  width: "auto",
                  opacity: !showFinalPodium && showInterimBook ? 1 : 0,
                }}
                draggable={false}
              />
              {/* Final podium shown only when root room is complete (stays during ascent) */}
              <img
                src={rootRoomFinalPodiumAsset.url}
                alt=""
                className="pointer-events-none absolute left-1/2 z-[10] -translate-x-1/2 select-none rr-podium"
                style={{
                  bottom: "17%",
                  height: "39.787vh",
                  width: "auto",
                  opacity: showFinalPodium ? 1 : 0,
                  transition: "opacity 600ms ease",
                }}
                draggable={false}
              />
              {/* Final book resting on the final podium, ready to float */}
              <img
                src={rootRoomFinalBookAsset.url}
                alt=""
                className="pointer-events-none absolute left-1/2 z-[11] -translate-x-1/2 select-none rr-podium-book"
                style={{
                  bottom: "38%",
                  height: "15.4vh",
                  width: "auto",
                  opacity: showRestingBook ? 1 : 0,
                  transition: "opacity 600ms ease",
                }}
                draggable={false}
              />
              {/* Ascending book — same container, same coordinates as resting book */}
              {ascending && (
                <img
                  src={rootRoomFinalBookAsset.url}
                  alt=""
                  className="rr-book-ascend pointer-events-none absolute left-1/2 z-[12] select-none"
                  draggable={false}
                />
              )}
            </>
          );
        })()}

        {/* Character flying from the active tunnel to the podium */}
        {phase === "flying" && (
          <img
            src={
              activeStepId === "da-stamp"
                ? stampFlyingAsset.url
                : activeStepId === "record"
                  ? ledgerFlyingAsset.url
                  : activeStepId === "safety"
                    ? shieldFlyingAsset.url
                    : activeStepId === "possibilities"
                      ? echoFlyingAsset.url
                      : clarityFlyingAsset.url
            }
            alt=""
            className={`pointer-events-none absolute z-[5] rr-clarity-fly ${activeStepId !== "foundation" ? "rr-char-large" : "rr-char-clarity"} ${activeStepId === "da-stamp" ? "rr-char-xl" : ""} ${activeStepId === "safety" ? "rr-char-shield" : ""}`}
            style={
              {
                "--rr-fly-start-x": `${activeTunnel.x}%`,
                "--rr-fly-start-y":
                  activeStepId === "safety" ||
                  activeStepId === "record" ||
                  activeStepId === "da-stamp"
                    ? "38%"
                    : "53%",
                "--rr-fly-start-y-mobile":
                  activeStepId === "safety" ||
                  activeStepId === "record" ||
                  activeStepId === "da-stamp"
                    ? "25%"
                    : "42%",
              } as React.CSSProperties
            }
            draggable={false}
          />
        )}

        {/* Character working at the podium — hidden during foundation's complete phase so Clarity disappears as the book appears */}
        {(phase === "working" || (phase === "complete" && activeStepId !== "foundation")) && (
          <img
            src={
              activeStepId === "da-stamp"
                ? stampPresentingAsset.url
                : activeStepId === "record"
                  ? ledgerPresentingAsset.url
                  : activeStepId === "safety"
                    ? shieldPresentingAsset.url
                    : activeStepId === "possibilities"
                      ? echoPresentingAsset.url
                      : clarityPresentingAsset.url
            }
            alt=""
            className={`pointer-events-none absolute z-[5] rr-clarity-present ${activeStepId !== "foundation" ? "rr-char-large" : "rr-char-clarity"} ${activeStepId === "da-stamp" ? "rr-char-xl" : ""} ${activeStepId === "safety" ? "rr-char-shield" : ""}`}
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
        <RootRoomNextButton unlocked={rootRoomComplete} onAscend={handleAscend} />
      </header>

      {ascending && (
        <div className="pointer-events-none fixed inset-0 z-[80]">
          <div className="rr-ascent-glow absolute left-1/2 top-0 -translate-x-1/2" />
          <div className="rr-ascent-flash absolute inset-0" />
        </div>
      )}

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

          {showActiveStepText ? (
            <>
              <h2 className="relative text-center text-[22px] font-bold tracking-wide text-amber-50">
                {activeStepCopy.panelTitle}
              </h2>
              <p className="relative mt-2 text-center text-[13px] leading-relaxed text-amber-50/95">
                <span className="font-bold tracking-[0.12em] text-amber-100">
                  {activeStepCopy.character}
                </span>{" "}
                {activeStepCopy.message}
              </p>
              <StepActivity phase={phase} />
            </>
          ) : phase === "finished" ? (
            <>
              <div className="relative flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                <span className="text-[11px] uppercase tracking-[0.34em] text-amber-100/90">
                  Complete
                </span>
              </div>
              <h2 className="relative mt-1 text-center text-[22px] font-bold tracking-wide text-amber-50">
                Root Room Complete
              </h2>
              <p className="relative mt-2 text-center text-[13px] leading-relaxed text-amber-50/95">
                Every root check is complete. The packet is ready to rise back into the library.
              </p>
            </>
          ) : (
            <>
              <h2 className="relative text-center text-[24px] font-bold tracking-wide text-amber-50">
                Root Room
              </h2>
              <p className="relative mt-2 text-center text-[13px] leading-relaxed text-amber-50/95">
                This is where the clean packet enters DaBotTree's roots. Each guide will review one
                part of the idea before the packet is ready to move forward.
              </p>
              {phase === "intro" && (
                <div className="relative mt-4 flex justify-center">
                  <button
                    onClick={() => {
                      setActiveStepIndex(0);
                      setPhase("smoke");
                    }}
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

        .rr-desktop-tunnels,
        .rr-desktop-smoke {
          display: none;
        }
        .rr-mobile-stage,
        .rr-mobile-smoke {
          display: block;
        }
        .rr-podium {
          transition: opacity 900ms ease-in-out;
        }
        .rr-room-bg {
          object-position: center center;
        }
        .rr-desktop-tunnel-marker {
          position: absolute;
          top: 26%;
          width: clamp(72px, 8.4vw, 132px);
          height: 38%;
          transform: translateX(-50%);
        }
        .rr-tunnel-aura {
          position: absolute;
          left: 50%;
          top: 42%;
          width: 88%;
          aspect-ratio: 1 / 1.2;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          background:
            radial-gradient(ellipse at center, var(--tunnel-accent) 0%, rgba(255,220,140,0.38) 32%, transparent 72%);
          filter: blur(16px);
          opacity: 0.16;
          transition: opacity 450ms ease, transform 450ms ease;
        }
        .rr-desktop-tunnel-marker[data-active="true"] .rr-tunnel-aura {
          opacity: 0.9;
          transform: translate(-50%, -50%) scale(1.16);
          animation: rr-tunnel-breathe 3.4s ease-in-out infinite;
        }
        .rr-mobile-tunnel-focus {
          position: absolute;
          left: 50%;
          top: 30%;
          width: min(68vw, 18rem);
          height: 38vh;
          transform: translateX(-50%);
        }
        .rr-mobile-portal {
          position: absolute;
          left: 50%;
          top: 43%;
          width: min(54vw, 15rem);
          aspect-ratio: 1 / 1.18;
          border-radius: 50% 50% 42% 42%;
          transform: translate(-50%, -50%);
          background:
            radial-gradient(ellipse at center, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.08) 38%, transparent 70%),
            radial-gradient(ellipse at center, var(--tunnel-accent) 0%, rgba(255, 205, 119, 0.28) 36%, transparent 74%);
          filter: blur(0.5px);
          opacity: 0.5;
        }
        .rr-mobile-tunnel-focus[data-active="true"] .rr-mobile-portal {
          opacity: 0.95;
          animation: rr-tunnel-breathe 3.4s ease-in-out infinite;
        }
        .rr-desktop-smoke,
        .rr-mobile-smoke {
          pointer-events: none;
          position: absolute;
          top: 42%;
          width: 10%;
          height: 45%;
          transform: translate(-50%, 0);
        }
        .rr-mobile-smoke {
          top: 37%;
          width: 34%;
          height: 42%;
        }
        @keyframes rr-tunnel-breathe {
          0%, 100% { filter: blur(16px); transform: translate(-50%, -50%) scale(1); }
          50% { filter: blur(20px); transform: translate(-50%, -50%) scale(1.12); }
        }

        .rr-step-activity {
          position: relative;
          margin-top: 0.9rem;
          min-height: 1.55rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .rr-progress-dots {
          display: inline-flex;
          align-items: center;
          gap: 0.52rem;
          border: 1px solid rgba(255, 216, 139, 0.6);
          border-radius: 999px;
          background: rgba(35, 17, 5, 0.62);
          padding: 0.44rem 0.78rem;
          box-shadow:
            inset 0 1px 0 rgba(255, 226, 170, 0.18),
            0 0 22px rgba(255, 184, 76, 0.18);
        }
        .rr-progress-label {
          color: rgba(255, 238, 202, 0.94);
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .rr-dot-track {
          display: inline-flex;
          align-items: center;
          gap: 0.42rem;
        }
        .rr-progress-dot {
          width: 0.54rem;
          height: 0.54rem;
          border-radius: 999px;
          background: rgba(255, 221, 157, 0.38);
          box-shadow: 0 0 0 rgba(255, 202, 105, 0);
          animation: rr-progress-dot 1.35s ease-in-out infinite;
        }
        .rr-progress-dot:nth-child(2) { animation-delay: 0.18s; }
        .rr-progress-dot:nth-child(3) { animation-delay: 0.36s; }
        .rr-progress-dot:nth-child(4) { animation-delay: 0.54s; }
        .rr-progress-dot:nth-child(5) { animation-delay: 0.72s; }
        .rr-step-complete {
          display: inline-flex;
          align-items: center;
          gap: 0.42rem;
          border: 1px solid rgba(167, 243, 208, 0.46);
          border-radius: 999px;
          background: rgba(6, 49, 32, 0.36);
          padding: 0.32rem 0.68rem;
          color: rgba(219, 255, 236, 0.96);
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          box-shadow: 0 0 20px rgba(52, 211, 153, 0.16);
        }
        @keyframes rr-progress-dot {
          0%, 100% {
            transform: scale(0.78);
            opacity: 0.42;
            background: rgba(255, 221, 157, 0.38);
          }
          45% {
            transform: scale(1.26);
            opacity: 1;
            background: rgba(255, 232, 178, 0.98);
            box-shadow: 0 0 12px rgba(255, 202, 105, 0.8);
          }
        }

        /* Character flying from the active tunnel toward the podium. */
        @keyframes rr-clarity-fly-kf {
          0%   { left: var(--rr-fly-start-x, 10%); top: var(--rr-fly-start-y, 58%); transform: translate(-50%, -50%) scale(0.368) rotate(-4deg); opacity: 0; filter: drop-shadow(0 0 20px rgba(255,200,120,0.6)); }
          15%  { opacity: 1; }
          100% { left: 50%; top: 48%; transform: translate(-50%, -50%) scale(0.893) rotate(2deg);  opacity: 1; filter: drop-shadow(0 0 28px rgba(255,210,140,0.85)); }
        }
        .rr-clarity-fly {
          height: 44.1vh; width: auto;
          animation: rr-clarity-fly-kf 3.2s cubic-bezier(0.4, 0.05, 0.4, 1) forwards;
          will-change: left, top, transform, opacity;
        }
        @keyframes rr-clarity-present-kf {
          0%   { opacity: 0; transform: translate(-50%, -48%) scale(0.893); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(0.945);  }
        }
        .rr-clarity-present {
          left: 50%; top: 48%;
          height: 48.3vh; width: auto;
          transform: translate(-50%, -50%);
          animation: rr-clarity-present-kf 0.5s ease-out forwards;
          filter: drop-shadow(0 0 32px rgba(255,210,140,0.9));
        }
        .rr-char-large.rr-clarity-fly {
          height: 57.33vh;
        }
        .rr-char-large.rr-clarity-present {
          height: 72.21vh;
          top: 52%;
        }
        .rr-char-shield.rr-clarity-fly {
          height: 65.93vh;
        }
        .rr-char-shield.rr-clarity-present {
          height: 79.431vh;
        }
        .rr-char-xl.rr-clarity-fly {
          height: 71.66vh;
        }
        .rr-char-xl.rr-clarity-present {
          height: 78.49vh;
          top: 52%;
        }
        .rr-char-clarity.rr-clarity-fly {
          height: 55.05vh;
          margin-left: -3vw;
        }
        .rr-char-clarity.rr-clarity-present {
          height: 49.66vh;
          margin-left: -1vw;
          top: 45%;
        }
        /* Tablet and phone layout: every character enters through the centered middle tunnel. */
        @media (max-width: 1199px) {
          .rr-clarity-fly {
            height: min(46.2vh, 24.15rem);
          }
          .rr-clarity-present {
            top: 56%;
            height: min(44.1vh, 23.1rem);
          }
          .rr-char-large.rr-clarity-fly {
            height: min(60.06vh, 31.395rem);
          }
          .rr-char-large.rr-clarity-present {
            height: min(65.93vh, 34.53rem);
            top: 60%;
          }
          .rr-char-xl.rr-clarity-fly {
            height: min(75.08vh, 39.24rem);
          }
          .rr-char-xl.rr-clarity-present {
            height: min(71.66vh, 37.54rem);
          }
          .rr-char-clarity.rr-clarity-fly {
            height: min(33.38vh, 17.45rem);
            margin-left: 0;
          }
          .rr-char-clarity.rr-clarity-present {
            height: min(26.24vh, 13.74rem);
            margin-left: 0;
          }
          @keyframes rr-clarity-fly-kf {
            0%   { left: 50%; top: var(--rr-fly-start-y-mobile, 42%); transform: translate(-50%, -50%) scale(0.357) rotate(-3deg); opacity: 0; filter: drop-shadow(0 0 20px rgba(255,200,120,0.6)); }
            15%  { opacity: 1; }
            100% { left: 50%; top: 57%; transform: translate(-50%, -50%) scale(0.819) rotate(1deg);  opacity: 1; filter: drop-shadow(0 0 28px rgba(255,210,140,0.85)); }
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .rr-progress-dot {
            animation: none;
            opacity: 0.85;
          }
        }
        @media (min-width: 1200px) {
          .rr-desktop-tunnels,
          .rr-desktop-smoke {
            display: block;
          }
          .rr-mobile-stage,
          .rr-mobile-smoke {
            display: none;
          }
          .rr-room-bg {
            object-position: center center;
          }
        }
        @keyframes rr-book-ascend-kf {
          0%   { bottom: 38%; transform: translateX(-50%) scale(1); opacity: 1; filter: drop-shadow(0 0 20px rgba(255,200,120,0.6)); }
          70%  { bottom: 72%; transform: translateX(-50%) scale(1.4); opacity: 1; filter: drop-shadow(0 0 50px rgba(255,220,140,1)); }
          100% { bottom: 115%; transform: translateX(-50%) scale(2); opacity: 0; filter: drop-shadow(0 0 80px rgba(255,235,180,1)); }
        }
        .rr-book-ascend {
          height: 15.4vh; width: auto; bottom: 38%;
          transform-origin: center center;
          animation: rr-book-ascend-kf 2s cubic-bezier(0.5, 0.05, 0.5, 1) forwards;
          will-change: bottom, transform, opacity;
        }
        @keyframes rr-ascent-glow-kf {
          0%   { opacity: 0; transform: translateX(-50%) scaleY(0.4); }
          40%  { opacity: 0.95; transform: translateX(-50%) scaleY(1); }
          100% { opacity: 0; transform: translateX(-50%) scaleY(1.2); }
        }
        .rr-ascent-glow {
          width: 18vmin; height: 100vh; transform-origin: top center;
          background: radial-gradient(ellipse at top, rgba(255,240,200,0.95) 0%, rgba(255,210,130,0.55) 30%, rgba(255,170,60,0.18) 60%, transparent 80%);
          filter: blur(8px);
          mix-blend-mode: screen;
          animation: rr-ascent-glow-kf 2s ease-out forwards;
        }
        @keyframes rr-ascent-flash-kf {
          0%, 70% { opacity: 0; }
          100%    { opacity: 1; background: rgba(255,245,215,0.95); }
        }
        .rr-ascent-flash {
          background: rgba(255,245,215,0);
          animation: rr-ascent-flash-kf 2s ease-in forwards;
        }
      `}</style>
    </main>
  );
}

function RootRoomNextButton({ unlocked, onAscend }: { unlocked: boolean; onAscend?: () => void }) {
  const palette = unlocked ? ROOT_ROOM_NEXT_PALETTE.gold : ROOT_ROOM_NEXT_PALETTE.leather;
  const content = (
    <span
      className={`group relative inline-flex h-[40px] w-[188px] shrink-0 items-center font-serif transition-transform ${
        unlocked ? "hover:-translate-y-[1px]" : "cursor-not-allowed opacity-60 saturate-[0.55]"
      }`}
      title={unlocked ? "Ready! Return to the Library" : "Complete the Root Room first"}
      aria-disabled={!unlocked}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-1 left-1.5 right-1.5 h-2 rounded-full blur-[3px]"
        style={{ background: "rgba(10,5,0,0.55)" }}
      />
      {unlocked && (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1 -z-10 rounded-md blur-md"
          style={{ background: "rgba(255,210,120,0.45)" }}
        />
      )}
      <span
        className="relative flex h-full w-full items-center overflow-hidden rounded-[3px]"
        style={{
          background: palette.cover,
          border: `1px solid ${palette.stroke}`,
          boxShadow:
            "inset 0 1px 0 rgba(255,220,170,0.18), inset 0 -2px 0 rgba(0,0,0,0.45), 0 3px 6px rgba(0,0,0,0.45)",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[5px]"
          style={{
            background:
              "repeating-linear-gradient(90deg, rgba(245,220,170,0.85) 0 1px, rgba(200,170,120,0.6) 1px 2px)",
            borderTop: "1px solid rgba(0,0,0,0.5)",
          }}
        />
        {unlocked && (
          <>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0"
              style={{
                width: "100%",
                background:
                  "linear-gradient(90deg, rgba(255,220,140,0.22), rgba(255,235,170,0.10) 70%, transparent)",
              }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-0 left-0 h-[5px]"
              style={{
                width: "100%",
                background: palette.edge,
                boxShadow: "0 0 10px 2px rgba(255,220,140,0.7), 0 0 2px rgba(255,255,200,0.9)",
              }}
            />
          </>
        )}
        <span
          aria-hidden
          className="absolute inset-y-1 left-1 w-[3px] rounded-sm"
          style={{
            background: "linear-gradient(180deg, #f0d28a 0%, #a87420 100%)",
            boxShadow: "0 0 4px rgba(255,210,130,0.5)",
          }}
        />
        <span
          aria-hidden
          className="absolute inset-y-1 right-1 w-[3px] rounded-sm"
          style={{
            background: "linear-gradient(180deg, #f0d28a 0%, #a87420 100%)",
            boxShadow: "0 0 4px rgba(255,210,130,0.5)",
          }}
        />
        <span
          className="relative z-10 flex w-full items-center justify-center gap-1.5 px-3.5 text-[12px] font-semibold uppercase tracking-[0.18em]"
          style={{
            color: palette.text,
            textShadow: "0 1px 0 rgba(0,0,0,0.7), 0 0 6px rgba(0,0,0,0.4)",
          }}
        >
          <span className="truncate">Next Step</span>
          {unlocked && <ArrowRight className="h-3 w-3 opacity-90" />}
        </span>
        <span
          className="pointer-events-none absolute right-2 top-1 text-[9px] italic"
          style={{ color: palette.text, opacity: 0.8 }}
        >
          {unlocked ? "Ready" : "Not Yet"}
        </span>
      </span>
    </span>
  );

  if (unlocked) {
    return (
      <button type="button" className="pointer-events-auto" onClick={onAscend}>
        {content}
      </button>
    );
  }

  return (
    <button type="button" className="pointer-events-auto" disabled>
      {content}
    </button>
  );
}

function StepActivity({ phase }: { phase: Phase }) {
  if (phase === "smoke" || phase === "flying" || phase === "working") {
    return (
      <div className="rr-step-activity" aria-label="Working">
        <div className="rr-progress-dots">
          <span className="rr-progress-label">Working</span>
          <span className="rr-dot-track" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <span key={index} className="rr-progress-dot" />
            ))}
          </span>
        </div>
      </div>
    );
  }

  if (phase === "complete") {
    return (
      <div className="rr-step-activity">
        <div className="rr-step-complete">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Complete
        </div>
      </div>
    );
  }

  return <div className="rr-step-activity" />;
}

function TunnelMarker({ tunnel, active }: { tunnel: Tunnel; active: boolean }) {
  return (
    <div
      className="rr-desktop-tunnel-marker"
      data-active={active}
      style={
        {
          left: `${tunnel.x}%`,
          "--tunnel-accent": tunnel.accent,
        } as React.CSSProperties
      }
    >
      <div className="rr-tunnel-aura" />
    </div>
  );
}

function MobileActiveTunnel({ tunnel, active }: { tunnel: Tunnel; active: boolean }) {
  return (
    <div
      className="rr-mobile-tunnel-focus"
      data-active={active}
      style={{ "--tunnel-accent": tunnel.accent } as React.CSSProperties}
    >
      <div className="rr-mobile-portal" />
    </div>
  );
}

function SmokeColumn({
  className,
  x,
  reducedMotion,
}: {
  className: string;
  x: number;
  reducedMotion: boolean;
}) {
  return (
    <div className={className} style={{ left: `${x}%` }}>
      {!reducedMotion &&
        Array.from({ length: 10 }).map((_, i) => {
          const drift = (i % 2 === 0 ? 1 : -1) * (12 + ((i * 5) % 20));
          const size = 42 + ((i * 11) % 32);
          return (
            <span
              key={i}
              className="rr-smoke"
              style={
                {
                  left: `${30 + ((i * 13) % 40)}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  animationDelay: `${(i * 0.55) % 4}s`,
                  animationDuration: `${6.5 + (i % 4) * 1.1}s`,
                  "--drift": `${drift}px`,
                } as React.CSSProperties
              }
            />
          );
        })}
    </div>
  );
}
