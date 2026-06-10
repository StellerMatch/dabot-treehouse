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
  const [reportOpen, setReportOpen] = useState(false);
  const [packageTier, setPackageTier] = useState<"good" | "better" | "best">("good");
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    // Source order: URL ?package=... overrides sessionStorage selection.
    const params = new URLSearchParams(window.location.search);
    const urlTier = params.get("package");
    if (urlTier === "good" || urlTier === "better" || urlTier === "best") {
      setPackageTier(urlTier);
    } else {
      try {
        const stored = sessionStorage.getItem("dabottree:packageTier");
        if (stored === "good" || stored === "better" || stored === "best") {
          setPackageTier(stored);
        }
      } catch {}
    }

  }, []);

  useEffect(() => {
    if (!ascending) return;
    const dur = reducedMotion ? 500 : 2000;
    const t = window.setTimeout(() => navigate({ to: "/trunk" }), dur);
    return () => window.clearTimeout(t);
  }, [ascending, navigate, reducedMotion]);

  const handleAscend = () => {
    setReportOpen(false);
    setAscending(true);
  };


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
                  height: "33.334vh",
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
                  height: "33.334vh",
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
                  bottom: "15%",
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
                  bottom: "36%",
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

        {/* Room dim + ceiling spotlight on the podium when Root Room is complete */}
        <div
          className="pointer-events-none absolute inset-0 z-[15] rr-complete-dim"
          style={{ opacity: rootRoomComplete ? 1 : 0 }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-[16] rr-complete-spotlight"
          style={{ opacity: rootRoomComplete ? 1 : 0 }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-[17] rr-sun-beam"
          style={{ opacity: rootRoomComplete ? 1 : 0 }}
          aria-hidden
        />
      </div>


      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 pt-5 sm:px-8 sm:pt-6">
        <Link
          to="/dashboard"
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-amber-200/40 bg-black/35 px-3.5 py-1.5 text-xs text-amber-50/90 backdrop-blur-md transition hover:bg-black/55"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Idea Shelf
        </Link>
        <RootRoomNextButton
          unlocked={rootRoomComplete}
          label={rootRoomComplete ? "View Report" : "Next Step"}
          onClick={rootRoomComplete ? () => setReportOpen(true) : undefined}
        />

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

          {/* Organic root tendrils — apply to every panel state */}
          <div className="rr-root-deco" aria-hidden="true">
            <svg viewBox="0 0 460 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="rr-root-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e9c089" stopOpacity="0.85" />
                  <stop offset="60%" stopColor="#a06a32" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#3a2208" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              {/* top-left root tendrils wrapping the corner */}
              <path d="M2,30 C 20,18 38,14 60,22 C 78,28 88,42 110,40" strokeWidth="1.6" />
              <path d="M8,8 C 22,22 30,40 28,62 C 26,80 14,92 4,96" strokeWidth="1.4" />
              <path d="M30,4 C 44,10 54,22 60,36" strokeWidth="1" opacity="0.5" />
              {/* top-right */}
              <path d="M458,28 C 440,16 420,14 398,24 C 380,32 372,46 352,42" strokeWidth="1.6" />
              <path d="M452,6 C 438,22 432,42 436,64 C 440,82 452,92 458,96" strokeWidth="1.3" />
              {/* bottom-left wrapping lower edge */}
              <path d="M2,170 C 24,178 50,180 78,176 C 110,172 140,182 170,184 C 210,186 250,178 290,182 C 330,186 370,184 410,176 C 436,172 452,178 458,190" strokeWidth="1.8" />
              <path d="M14,196 C 40,188 70,194 96,190" strokeWidth="1.1" opacity="0.55" />
              {/* bottom corners curl-up */}
              <path d="M6,198 C 18,180 22,160 18,140" strokeWidth="1.3" />
              <path d="M454,198 C 442,180 438,160 444,138" strokeWidth="1.3" />
              {/* a few small leaves */}
              <ellipse className="rr-leaf" cx="58" cy="22" rx="4" ry="2.2" transform="rotate(-25 58 22)" />
              <ellipse className="rr-leaf" cx="402" cy="24" rx="4" ry="2.2" transform="rotate(25 402 24)" />
              <ellipse className="rr-leaf" cx="170" cy="184" rx="3.5" ry="2" />
              <ellipse className="rr-leaf" cx="300" cy="182" rx="3.5" ry="2" />
            </svg>
          </div>

          {showActiveStepText ? (
            <>
              <h2 className="rr-intro-title relative text-center text-[22px] leading-tight">
                {activeStepCopy.panelTitle}
              </h2>
              <p className="relative mt-2 text-center text-[13px] leading-relaxed text-amber-50/95">
                <span className="rr-bot-name">{activeStepCopy.character}</span>{" "}
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
              <h2 className="rr-intro-title relative mt-1 text-center text-[22px] leading-tight">
                Root Room Complete
              </h2>
              <p className="relative mt-2 text-center text-[13px] leading-relaxed text-amber-50/95">
                Every root check is complete. The packet is ready to rise toward the Trunk.
              </p>
            </>
          ) : (
            <>
              <h2 className="rr-intro-title relative text-center text-[28px] leading-tight">
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
          0%   { bottom: 36%; transform: translateX(-50%) scale(1); opacity: 1; filter: drop-shadow(0 0 20px rgba(255,200,120,0.6)); }
          70%  { bottom: 72%; transform: translateX(-50%) scale(1.4); opacity: 1; filter: drop-shadow(0 0 50px rgba(255,220,140,1)); }
          100% { bottom: 115%; transform: translateX(-50%) scale(2); opacity: 0; filter: drop-shadow(0 0 80px rgba(255,235,180,1)); }
        }
        .rr-book-ascend {
          height: 15.4vh; width: auto; bottom: 36%;
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

        /* Root Room complete — dim ambience + ceiling spotlight onto podium */
        .rr-complete-dim {
          background:
            radial-gradient(ellipse 32% 46% at 50% 68%, transparent 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.88) 100%);
          transition: opacity 1400ms ease-in-out;
          mix-blend-mode: multiply;
        }
        .rr-complete-spotlight {
          background:
            radial-gradient(ellipse 14% 8% at 50% 56%, rgba(255,235,180,0.55) 0%, rgba(255,210,130,0.25) 45%, transparent 75%),
            radial-gradient(ellipse 22% 30% at 50% 64%, rgba(255,225,160,0.35) 0%, rgba(255,200,120,0.12) 45%, transparent 75%),
            linear-gradient(to bottom, transparent 0%, transparent 6%, rgba(255,225,165,0.10) 18%, rgba(255,210,135,0.05) 45%, transparent 70%);
          -webkit-mask-image: radial-gradient(ellipse 28% 60% at 50% 50%, #000 0%, #000 55%, transparent 90%);
                  mask-image: radial-gradient(ellipse 28% 60% at 50% 50%, #000 0%, #000 55%, transparent 90%);
          mix-blend-mode: screen;
          filter: blur(2px);
          transition: opacity 1600ms ease-in-out;
          animation: rr-spotlight-breathe 5.5s ease-in-out infinite;
        }
        @keyframes rr-spotlight-breathe {
          0%, 100% { filter: blur(2px) brightness(1); }
          50%      { filter: blur(2.5px) brightness(1.12); }
        }

        /* Sunroof glow — soft, natural sunlight diffusing in from the skylight */
        .rr-sun-beam {
          background:
            /* bright skylight bloom at top — taller than wide */
            radial-gradient(ellipse 10% 18% at 50% -2%, rgba(255,225,150,0.88) 0%, rgba(255,205,120,0.5) 45%, transparent 80%),
            /* warm golden shaft spilling downward */
            radial-gradient(ellipse 22% 55% at 50% 22%, rgba(255,210,130,0.38) 0%, rgba(255,190,100,0.18) 45%, transparent 80%),
            /* gentle elongated ambient wash */
            radial-gradient(ellipse 36% 75% at 50% 32%, rgba(255,200,115,0.16) 0%, transparent 72%);
          mix-blend-mode: screen;
          filter: blur(14px);
          transition: opacity 1800ms ease-in-out;
          animation: rr-sun-beam-breathe 7s ease-in-out infinite;
        }
        @keyframes rr-sun-beam-breathe {
          0%, 100% { filter: blur(14px) brightness(1); }
          50%      { filter: blur(16px) brightness(1.10); }
        }

      `}</style>

      {reportOpen && (
        <RootRoomReport
          tier={packageTier}
          onTierChange={setPackageTier}
          onClose={() => setReportOpen(false)}
          onComplete={handleAscend}
        />
      )}
    </main>

  );
}

function RootRoomNextButton({
  unlocked,
  label = "Next Step",
  onClick,
}: {
  unlocked: boolean;
  label?: string;
  onClick?: () => void;
}) {
  const palette = unlocked ? ROOT_ROOM_NEXT_PALETTE.gold : ROOT_ROOM_NEXT_PALETTE.leather;
  const content = (
    <span
      className={`group relative inline-flex h-[40px] w-[188px] shrink-0 items-center font-serif transition-transform ${
        unlocked ? "hover:-translate-y-[1px]" : "cursor-not-allowed opacity-60 saturate-[0.55]"
      }`}
      title={unlocked ? "Open the Library report" : "Complete the Root Room first"}
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
          <span className="truncate">{label}</span>
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
      <button type="button" className="pointer-events-auto" onClick={onClick}>
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

// ============= Root Room — Completion Report Modal =============

type PackageTier = "good" | "better" | "best";

const ROOT_ROOM_REPORT_SUMMARY =
  "Your packet completed all five root checks — Foundation, Possibilities, Safety, Record, and Da Stamp. Below are the opportunity doors the roots surfaced before the packet rises to the Trunk.";

const DOOR_QUESTIONS: { door1: string[]; door2: string[] } = {
  door1: [
    "Is the core problem stated in one clear sentence?",
    "Who is the very first person this serves?",
    "What single outcome do they get on day one?",
    "What is the cleanest first action you offer them?",
    "What can be removed without losing the point?",
    "Is the language plain enough for a first-time reader?",
    "Where does the packet quietly repeat itself?",
    "Which promise should be tested before anything else?",
    "Where does the packet still feel too big?",
    "What is the smallest version you could ship this week?",
  ],
  door2: [
    "Who else could quietly benefit from this idea?",
    "What adjacent need keeps showing up nearby?",
    "Which partner could carry this further than you alone?",
    "What channel hasn't been tried yet?",
    "What would a 10× version of this look like?",
    "Where could a small tool become a product line?",
    "What seasonal or recurring moment fits this idea?",
    "What price would feel obvious to your first buyer?",
    "What feedback loop is missing today?",
    "Which signal would tell you to invest more here?",
  ],
};

function RootRoomReport({
  tier,
  onTierChange,
  onClose,
  onComplete,
}: {
  tier: PackageTier;
  onTierChange: (t: PackageTier) => void;
  onClose: () => void;
  onComplete: () => void;
}) {
  // Cap to 20 questions total (10 per door). Filter empty/whitespace to honor "no filler".
  const door1Qs = DOOR_QUESTIONS.door1.filter((q) => q.trim().length > 0).slice(0, 10);
  const door2Qs = DOOR_QUESTIONS.door2.filter((q) => q.trim().length > 0).slice(0, 10);

  // Per-tier door behavior
  // good: both locked
  // better: one key — user picks which door to unlock; the other stays locked
  // best: both cracked open, both can open fully
  const [openedDoors, setOpenedDoors] = useState<Record<"door1" | "door2", boolean>>({
    door1: tier === "best",
    door2: tier === "best",
  });
  const [keyUsedOn, setKeyUsedOn] = useState<"door1" | "door2" | null>(null);

  useEffect(() => {
    setOpenedDoors({ door1: tier === "best", door2: tier === "best" });
    setKeyUsedOn(null);
  }, [tier]);

  const canOpen = (id: "door1" | "door2") => {
    if (tier === "best") return true;
    if (tier === "better") return keyUsedOn === null || keyUsedOn === id;
    return false;
  };

  const handleDoorClick = (id: "door1" | "door2") => {
    if (tier === "good") return;
    if (tier === "better") {
      if (keyUsedOn && keyUsedOn !== id) return;
      setKeyUsedOn(id);
      setOpenedDoors((prev) => ({ ...prev, [id]: !prev[id] }));
      return;
    }
    setOpenedDoors((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-label="Root Room completion report"
    >
      <button
        type="button"
        aria-label="Close report"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(20,10,2,0.7) 0%, rgba(5,2,0,0.92) 70%)",
          backdropFilter: "blur(4px)",
        }}
      />
      <div
        className="relative w-full max-w-[820px] max-h-[90vh] overflow-y-auto rounded-[18px] px-6 py-7 sm:px-9 sm:py-8 text-amber-50 rr-report-modal"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(150,100,30,0.92) 0%, rgba(85,52,12,0.96) 60%, rgba(45,26,6,0.98) 100%)",
          border: "1px solid rgba(240,195,110,0.65)",
          boxShadow:
            "0 30px 90px -20px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,225,160,0.28), 0 0 70px -10px rgba(255,190,90,0.5)",
        }}
      >
        {/* corner root tendrils — match library style */}
        <div className="pointer-events-none absolute inset-0 rounded-[18px] opacity-50">
          <svg viewBox="0 0 460 200" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" fill="none" stroke="url(#rr-report-grad)">
            <defs>
              <linearGradient id="rr-report-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e9c089" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#3a2208" stopOpacity="0.5" />
              </linearGradient>
            </defs>
            <path d="M2,30 C 20,18 38,14 60,22 C 78,28 88,42 110,40" strokeWidth="1.4" />
            <path d="M458,28 C 440,16 420,14 398,24 C 380,32 372,46 352,42" strokeWidth="1.4" />
            <path d="M6,198 C 18,180 22,160 18,140" strokeWidth="1.2" />
            <path d="M454,198 C 442,180 438,160 444,138" strokeWidth="1.2" />
          </svg>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full border border-amber-200/40 bg-black/40 px-2.5 py-1 text-[11px] text-amber-50/80 transition hover:bg-black/60"
        >
          ✕
        </button>

        <div className="relative flex items-center justify-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-200" />
          <span className="text-[11px] uppercase tracking-[0.34em] text-amber-100/90">
            Library Report
          </span>
        </div>
        <h2 className="rr-intro-title relative mt-1 text-center text-[26px] leading-tight">
          Root Room Complete
        </h2>
        <p className="relative mx-auto mt-3 max-w-[560px] text-center text-[13px] leading-relaxed text-amber-50/95">
          {ROOT_ROOM_REPORT_SUMMARY}
        </p>

        {/* Tier indicator (small, on-brand) */}
        <div className="relative mt-4 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-amber-100/80">
          <span>Package:</span>
          {(["good", "better", "best"] as PackageTier[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTierChange(t)}
              className={`rounded-full border px-2 py-0.5 transition ${
                tier === t
                  ? "border-amber-200/80 bg-amber-200/15 text-amber-50"
                  : "border-amber-200/25 text-amber-100/60 hover:border-amber-200/50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tier === "better" && (
          <div className="relative mt-3 flex items-center justify-center gap-2 text-[11px] text-amber-100/90">
            <span aria-hidden>🗝️</span>
            <span>
              {keyUsedOn
                ? "You used your key. The other door stays sealed."
                : "You hold one key — pick a door to unlock."}
            </span>
          </div>
        )}

        {/* Two doors */}
        <div className="relative mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {(["door1", "door2"] as const).map((doorId) => {
            const open = openedDoors[doorId];
            const enabled = canOpen(doorId);
            const cracked = tier === "best" && !open;
            const questions = doorId === "door1" ? door1Qs : door2Qs;
            return (
              <div key={doorId} className="rr-door-wrap">
                <button
                  type="button"
                  onClick={() => handleDoorClick(doorId)}
                  disabled={!enabled}
                  className={`rr-door ${open ? "is-open" : ""} ${cracked ? "is-cracked" : ""} ${
                    enabled ? "is-enabled" : "is-locked"
                  }`}
                  aria-pressed={open}
                  aria-label={`${doorId === "door1" ? "Door 1" : "Door 2"} — ${
                    enabled ? (open ? "opened" : "tap to open") : "locked"
                  }`}
                >
                  <span className="rr-door-frame" aria-hidden />
                  <span className="rr-door-leaf rr-door-leaf-left" aria-hidden />
                  <span className="rr-door-leaf rr-door-leaf-right" aria-hidden />
                  <span className="rr-door-light" aria-hidden />
                  <span className="rr-door-label">
                    {doorId === "door1" ? "Door 1" : "Door 2"}
                  </span>
                  {!enabled && (
                    <span className="rr-door-lock" aria-hidden>
                      🔒
                    </span>
                  )}
                </button>

                {open && questions.length > 0 && (
                  <ul className="mt-3 space-y-1.5 rounded-[10px] border border-amber-200/30 bg-black/30 p-3 text-[12.5px] leading-snug text-amber-50/95">
                    {questions.map((q, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-[2px] text-amber-200/80">•</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <div className="relative mt-7 flex justify-center">
          <button
            type="button"
            onClick={onComplete}
            className="inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-gradient-to-b from-amber-300 to-amber-500 px-6 py-2.5 text-sm font-semibold text-amber-950 shadow-[0_4px_22px_-4px_rgba(255,180,80,0.8)] transition hover:from-amber-200 hover:to-amber-400"
          >
            <Sparkles className="h-4 w-4" />
            Report Complete — Move to Next Step
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <style>{`
        .rr-door-wrap { display: flex; flex-direction: column; }
        .rr-door {
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 4.2;
          border-radius: 14px 14px 6px 6px;
          overflow: hidden;
          background:
            radial-gradient(ellipse at top, rgba(120,75,20,0.85) 0%, rgba(60,32,8,0.95) 65%, rgba(30,16,4,1) 100%);
          border: 1px solid rgba(240,195,110,0.55);
          box-shadow:
            inset 0 1px 0 rgba(255,220,160,0.18),
            inset 0 -3px 0 rgba(0,0,0,0.55),
            0 12px 30px -10px rgba(0,0,0,0.7);
          cursor: pointer;
          transition: transform 220ms ease, box-shadow 220ms ease, filter 220ms ease;
        }
        .rr-door.is-locked { cursor: not-allowed; filter: saturate(0.55) brightness(0.7); }
        .rr-door.is-enabled:hover { transform: translateY(-2px); box-shadow: 0 18px 40px -14px rgba(0,0,0,0.85), 0 0 24px rgba(255,200,110,0.35); }
        .rr-door-frame {
          position: absolute; inset: 6px;
          border-radius: 10px 10px 4px 4px;
          border: 1px solid rgba(240,200,120,0.45);
          background: linear-gradient(180deg, rgba(80,45,12,0.6), rgba(40,22,6,0.7));
        }
        .rr-door-leaf {
          position: absolute;
          top: 10px;
          bottom: 10px;
          width: calc(50% - 12px);
          background:
            linear-gradient(180deg, rgba(110,68,20,0.95) 0%, rgba(70,40,12,0.95) 60%, rgba(40,22,6,1) 100%);
          border: 1px solid rgba(0,0,0,0.55);
          box-shadow: inset 0 0 0 1px rgba(255,210,140,0.12);
          transition: transform 600ms cubic-bezier(.2,.7,.2,1), opacity 400ms ease;
          transform-style: preserve-3d;
        }
        .rr-door-leaf::before, .rr-door-leaf::after {
          content: ""; position: absolute; left: 10%; right: 10%; height: 22%;
          border: 1px solid rgba(240,200,120,0.35); border-radius: 3px;
        }
        .rr-door-leaf::before { top: 8%; }
        .rr-door-leaf::after { bottom: 8%; }
        .rr-door-leaf-left { left: 10px; transform-origin: left center; }
        .rr-door-leaf-right { right: 10px; transform-origin: right center; }
        .rr-door.is-open .rr-door-leaf-left { transform: perspective(700px) rotateY(-72deg); }
        .rr-door.is-open .rr-door-leaf-right { transform: perspective(700px) rotateY(72deg); }
        .rr-door.is-cracked .rr-door-leaf-left { transform: perspective(700px) rotateY(-14deg); }
        .rr-door.is-cracked .rr-door-leaf-right { transform: perspective(700px) rotateY(14deg); }
        .rr-door-light {
          position: absolute; left: 50%; top: 50%;
          width: 70%; height: 70%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background:
            radial-gradient(ellipse at center, rgba(255,225,150,0.95) 0%, rgba(255,190,90,0.55) 35%, transparent 70%);
          filter: blur(8px);
          opacity: 0;
          transition: opacity 500ms ease;
          pointer-events: none;
        }
        .rr-door.is-cracked .rr-door-light { opacity: 0.55; }
        .rr-door.is-open .rr-door-light { opacity: 0.95; }
        .rr-door-label {
          position: absolute; left: 0; right: 0; bottom: 10px;
          text-align: center;
          font-family: ui-serif, Georgia, "Times New Roman", serif;
          font-size: 14px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #fde7b6;
          text-shadow: 0 1px 0 rgba(0,0,0,0.7), 0 0 8px rgba(255,200,110,0.45);
          z-index: 2;
        }
        .rr-door-lock {
          position: absolute; right: 10px; top: 10px;
          font-size: 14px;
          opacity: 0.85;
          z-index: 2;
        }
      `}</style>
    </div>
  );
}
