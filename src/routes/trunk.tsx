import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import trunkBgAsset from "@/assets/trunk-room-bg-v2.png.asset.json";
import packetBookAsset from "@/assets/trunk-packet-book.png.asset.json";
import pinkGuideAsset from "@/assets/trunk-pink-guide-cutout.png.asset.json";
import greenGuideAsset from "@/assets/trunk-green-guide-cutout.png.asset.json";
import goldGuardianAsset from "@/assets/trunk-gold-guardian-cutout.png.asset.json";
import compassStagAsset from "@/assets/compass-stag.png.asset.json";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleDashed, Sparkles } from "lucide-react";

export const Route = createFileRoute("/trunk")({
  head: () => ({
    meta: [
      { title: "The Trunk — DaBotTree" },
      {
        name: "description",
        content:
          "The Trunk Layer — the lantern guides prepare to receive your packet on the central reading table.",
      },
    ],
  }),
  component: TrunkPage,
});

const TRUNK_NEXT_PALETTE = {
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

type TrunkStageId = "arrival" | "luma" | "bloom" | "vault" | "compass" | "ready";

const TRUNK_STAGES: Array<{
  id: TrunkStageId;
  label: string;
  title: string;
  body: string;
}> = [
  {
    id: "arrival",
    label: "Packet",
    title: "The Packet Has Arrived",
    body: "The packet rests on the trunk table. Luma, Bloom, and Vault will each review the project's past, present, and future before Compass brings their findings together.",
  },
  {
    id: "luma",
    label: "Luma",
    title: "Luma Design Review",
    body: "Luma is searching the design past, present, and future of projects like this, checking what has worked before, what feels right now, and what the finished experience should become.",
  },
  {
    id: "bloom",
    label: "Bloom",
    title: "Bloom Growth Review",
    body: "Bloom is studying the past, present, and future of audience growth, social media, advertising, launch paths, and how this project can reach the right people.",
  },
  {
    id: "vault",
    label: "Vault",
    title: "Vault Money Review",
    body: "Vault is reviewing the past, present, and future of the money side: costs, funding, revenue paths, risk, and how the project can stay financially grounded.",
  },
  {
    id: "compass",
    label: "Compass",
    title: "Compass Synthesis",
    body: "Compass is taking the work from Luma, Bloom, and Vault, keeping the project pointed north, and shaping their findings into one true source of information.",
  },
  {
    id: "ready",
    label: "Ready",
    title: "Trunk Report Ready",
    body: "The Trunk source is ready. The design, growth, and money reviews have been gathered into one direction, and the packet can move to the next layer.",
  },
];

function TrunkPage() {
  const [bookArrived, setBookArrived] = useState(false);
  const [reviewStarted, setReviewStarted] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const t1 = window.setTimeout(() => setBookArrived(true), 1800);
    return () => {
      window.clearTimeout(t1);
    };
  }, []);

  useEffect(() => {
    if (!bookArrived || !reviewStarted || stageIndex >= TRUNK_STAGES.length - 1) return;
    const t = window.setTimeout(() => {
      setStageIndex((current) => Math.min(current + 1, TRUNK_STAGES.length - 1));
    }, 3400);
    return () => window.clearTimeout(t);
  }, [bookArrived, reviewStarted, stageIndex]);

  const handleStartReview = () => {
    if (!bookArrived) return;
    setStageIndex(1);
    setReviewStarted(true);
  };

  const activeStage = bookArrived ? TRUNK_STAGES[stageIndex] : null;
  const nextUnlocked = activeStage?.id === "ready";
  const activeGuide = reviewStarted ? activeStage?.id : undefined;

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-black text-amber-50">
      <div className="absolute inset-0">
        <img
          src={trunkBgAsset.url}
          alt="The Trunk Layer — a vast root chamber with a central reading table beneath a shaft of light."
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: "center center" }}
          draggable={false}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 100%)",
          }}
        />

        <div
          className="pointer-events-none absolute left-1/2 top-0 h-full -translate-x-1/2 trunk-shaft"
          aria-hidden
        />

        <div
          className={`pointer-events-none absolute z-[4] trunk-character-spotlight trunk-spotlight-luma ${
            activeGuide === "luma" ? "trunk-character-spotlight-active" : ""
          }`}
          aria-hidden
        />
        <img
          src={pinkGuideAsset.url}
          alt=""
          className={`pointer-events-none absolute z-[6] trunk-guide-pink ${
            activeGuide === "luma" ? "trunk-guide-active" : ""
          }`}
          draggable={false}
        />

        <div
          className={`pointer-events-none absolute z-[4] trunk-character-spotlight trunk-spotlight-bloom ${
            activeGuide === "bloom" ? "trunk-character-spotlight-active" : ""
          }`}
          aria-hidden
        />
        <img
          src={greenGuideAsset.url}
          alt=""
          className={`pointer-events-none absolute z-[7] trunk-guide-green ${
            activeGuide === "bloom" ? "trunk-guide-active" : ""
          }`}
          draggable={false}
        />

        <div
          className={`pointer-events-none absolute z-[4] trunk-character-spotlight trunk-spotlight-vault ${
            activeGuide === "vault" ? "trunk-character-spotlight-active" : ""
          }`}
          aria-hidden
        />
        <div className="pointer-events-none absolute z-[5] trunk-guide-gold-shadow" aria-hidden />
        <img
          src={goldGuardianAsset.url}
          alt=""
          className={`pointer-events-none absolute z-[6] trunk-guide-gold ${
            activeGuide === "vault" ? "trunk-guide-active" : ""
          }`}
          draggable={false}
        />

        <div
          className={`pointer-events-none absolute z-[4] trunk-character-spotlight trunk-spotlight-compass ${
            activeGuide === "compass" || activeGuide === "ready"
              ? "trunk-character-spotlight-active"
              : ""
          }`}
          aria-hidden
        />
        <img
          src={compassStagAsset.url}
          alt=""
          className={`pointer-events-none absolute z-[5] trunk-compass trunk-compass-standing ${
            activeGuide === "compass" || activeGuide === "ready" ? "trunk-guide-active" : ""
          }`}
          draggable={false}
        />

        <img
          src={packetBookAsset.url}
          alt=""
          className={`pointer-events-none absolute left-1/2 z-[10] ${
            bookArrived ? "trunk-book-resting" : "trunk-book-arriving"
          }`}
          draggable={false}
        />

        {bookArrived && (
          <div
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 trunk-table-glow"
            aria-hidden
          />
        )}
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 pt-5 sm:px-8 sm:pt-6">
        <Link
          to="/root-room"
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-amber-200/40 bg-black/35 px-3.5 py-1.5 text-xs text-amber-50/90 backdrop-blur-md transition hover:bg-black/55"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Root Room
        </Link>
        <TrunkNextButton unlocked={nextUnlocked} />
      </header>

      <div
        className="pointer-events-none absolute left-1/2 z-10 w-[min(540px,92vw)] -translate-x-1/2 px-4"
        style={{ bottom: "4.5%" }}
      >
        <div className="pointer-events-auto trunk-status-panel relative overflow-hidden rounded-[14px] px-5 py-4 text-amber-50 sm:px-6 sm:py-5">
          <div className="trunk-ring-field" aria-hidden />
          <div className="trunk-bark-edge" aria-hidden />
          <div className="relative flex items-center justify-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-200" />
            <span className="text-[11px] uppercase tracking-[0.34em] text-amber-100/90 max-sm:tracking-[0.22em]">
              Trunk Layer
            </span>
          </div>
          <h2 className="trunk-panel-title relative mt-1 text-center text-[23px] font-bold text-amber-50 sm:text-[26px]">
            {activeStage ? activeStage.title : "Carrying the Packet…"}
          </h2>
          <p className="relative mt-2 text-center text-[13px] leading-relaxed text-amber-50/95">
            {activeStage?.body ?? "The packet is rising through the trunk on a thread of light."}
          </p>
          {bookArrived && !reviewStarted && (
            <div className="relative mt-4 flex justify-center">
              <button
                type="button"
                onClick={handleStartReview}
                className="trunk-start-button inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-[12px] font-semibold uppercase tracking-[0.16em] text-amber-950 transition hover:-translate-y-[1px] hover:brightness-110"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Start Trunk Review
              </button>
            </div>
          )}
          <div className="relative mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
            {TRUNK_STAGES.map((stage, index) => {
              const complete =
                bookArrived && (index < stageIndex || (reviewStarted && index === 0));
              const active =
                bookArrived && index === stageIndex && (!reviewStarted ? index === 0 : true);
              return (
                <div
                  key={stage.id}
                  className={`trunk-stage-chip ${complete ? "trunk-stage-complete" : ""} ${
                    active ? "trunk-stage-active" : ""
                  }`}
                >
                  {complete ? (
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                  ) : (
                    <CircleDashed className="h-3 w-3 shrink-0" />
                  )}
                  <span>{stage.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .trunk-shaft {
          width: clamp(60px, 8vw, 140px);
          background: linear-gradient(180deg, rgba(255,245,210,0.55) 0%, rgba(255,220,150,0.28) 35%, rgba(255,200,120,0.10) 65%, transparent 90%);
          mix-blend-mode: screen;
          filter: blur(4px);
          animation: trunk-shaft-breathe 5s ease-in-out infinite;
        }
        @keyframes trunk-shaft-breathe {
          0%, 100% { opacity: 0.65; }
          50% { opacity: 1; }
        }
        @keyframes trunk-book-arriving-kf {
          0%   { top: -8%;  transform: translateX(-50%) scale(0.35); opacity: 0; filter: drop-shadow(0 0 60px rgba(255,235,180,1)); }
          20%  { opacity: 1; }
          100% { top: 49%;  transform: translateX(-50%) scale(0.85); opacity: 1; filter: drop-shadow(0 14px 22px rgba(0,0,0,0.7)) drop-shadow(0 0 28px rgba(255,210,140,0.85)); }
        }
        .trunk-book-arriving {
          top: -8%;
          height: 15.3vh;
          width: auto;
          transform-origin: 50% 90%;
          animation: trunk-book-arriving-kf 1.8s cubic-bezier(0.4, 0.0, 0.4, 1) forwards;
          will-change: top, transform, opacity;
        }
        .trunk-book-resting {
          top: 49%;
          height: 15.3vh;
          width: auto;
          transform-origin: 50% 90%;
          transform: translateX(-50%) scale(0.85);
          filter: drop-shadow(0 14px 22px rgba(0,0,0,0.7)) drop-shadow(0 0 28px rgba(255,210,140,0.9));
        }
        @keyframes trunk-glow-kf {
          0%   { opacity: 0; transform: translateX(-50%) scale(0.4); }
          100% { opacity: 0.85; transform: translateX(-50%) scale(1); }
        }
        .trunk-table-glow {
          bottom: 26%;
          width: 38vmin;
          height: 14vmin;
          border-radius: 50%;
          background: radial-gradient(ellipse at center, rgba(255,225,160,0.7) 0%, rgba(255,180,80,0.3) 45%, transparent 75%);
          filter: blur(14px);
          mix-blend-mode: screen;
          animation: trunk-glow-kf 0.8s ease-out forwards;
        }
        .trunk-guide-pink,
        .trunk-guide-green,
        .trunk-guide-gold {
          width: auto;
          max-width: none;
          filter: drop-shadow(0 18px 26px rgba(0,0,0,0.72)) drop-shadow(0 0 24px rgba(255,205,120,0.18));
        }
        .trunk-compass {
          left: 50%;
          height: auto;
          width: auto;
          max-height: 60vh;
          transform-origin: 50% 100%;
          filter: drop-shadow(0 18px 24px rgba(0,0,0,0.75)) drop-shadow(0 0 22px rgba(255,210,140,0.25));
          clip-path: inset(0 0 10% 0);
        }
        .trunk-character-spotlight {
          width: 22vmin;
          height: 22vmin;
          border-radius: 50%;
          background:
            radial-gradient(circle at 50% 42%, rgba(255,246,207,0.72) 0%, rgba(255,205,104,0.34) 34%, rgba(255,170,65,0.13) 58%, transparent 74%);
          filter: blur(10px);
          mix-blend-mode: screen;
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.65);
          transition: opacity 0.55s ease, transform 0.55s ease;
        }
        .trunk-character-spotlight-active {
          opacity: 0.96;
          transform: translate(-50%, -50%) scale(1);
          animation: trunk-spotlight-breathe-kf 1.8s ease-in-out infinite;
        }
        @keyframes trunk-spotlight-breathe-kf {
          0%, 100% { filter: blur(10px); }
          50% { filter: blur(13px); }
        }
        .trunk-spotlight-luma {
          left: 30%;
          top: 57%;
        }
        .trunk-spotlight-bloom {
          left: 58%;
          top: 60%;
          width: 18vmin;
          height: 18vmin;
        }
        .trunk-spotlight-vault {
          left: 82%;
          top: 54%;
          width: 24vmin;
          height: 24vmin;
        }
        .trunk-spotlight-compass {
          left: 50%;
          top: 43%;
          width: 25vmin;
          height: 25vmin;
        }
        .trunk-compass-standing {
          bottom: 38%;
          transform: translateX(-50%) scale(0.735);
          animation: trunk-compass-stand-kf 4s ease-in-out infinite;
        }
        @keyframes trunk-compass-stand-kf {
          0%, 100% { transform: translateX(-50%) scale(0.735) translateX(0); }
          50%      { transform: translateX(-50%) scale(0.735) translateX(5px); }
        }
        .trunk-compass.trunk-guide-active {
          animation: trunk-compass-stand-kf 4s ease-in-out infinite, trunk-guide-active-kf 1.6s ease-in-out infinite;
        }
        .trunk-guide-pink {
          left: 17%;
          bottom: 10%;
          height: 52.2vh;
        }
        .trunk-guide-green {
          left: 54%;
          bottom: 19%;
          height: 44.55vh;
        }
        .trunk-guide-gold {
          right: 10%;
          bottom: 9%;
          height: 58.14vh;
          filter: drop-shadow(0 22px 18px rgba(0,0,0,0.75)) drop-shadow(0 0 32px rgba(255,190,70,0.35)) drop-shadow(0 -8px 18px rgba(255,200,90,0.22));
        }
        .trunk-guide-gold-shadow {
          right: 8%;
          bottom: 7%;
          width: 26.6vh;
          height: 4.75vh;
          border-radius: 50%;
          background: radial-gradient(ellipse at center, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.35) 55%, transparent 80%);
          filter: blur(10px);
          transform: scaleY(0.55);
          opacity: 0.85;
        }
        .trunk-guide-active {
          filter: drop-shadow(0 20px 28px rgba(0,0,0,0.72)) drop-shadow(0 0 34px rgba(255,222,145,0.78)) drop-shadow(0 0 14px rgba(255,245,205,0.45));
          animation: trunk-guide-active-kf 1.6s ease-in-out infinite;
        }
        @keyframes trunk-guide-active-kf {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.88; }
        }
        .trunk-status-panel {
          background:
            radial-gradient(circle at 50% 45%, rgba(134, 79, 26, 0.45) 0 12%, transparent 13%),
            radial-gradient(circle at 50% 45%, transparent 0 22%, rgba(222, 165, 82, 0.2) 22.5% 23.5%, transparent 24% 34%, rgba(255, 212, 133, 0.15) 34.5% 35.5%, transparent 36% 48%, rgba(177, 105, 37, 0.18) 48.5% 50%, transparent 50.5%),
            radial-gradient(ellipse at top, rgba(134,84,24,0.9) 0%, rgba(74,43,13,0.93) 58%, rgba(38,21,7,0.96) 100%);
          border: 1px solid rgba(243, 194, 103, 0.62);
          box-shadow:
            0 16px 46px -12px rgba(0,0,0,0.88),
            inset 0 0 0 1px rgba(255,238,181,0.12),
            inset 0 12px 28px rgba(255,205,125,0.12),
            inset 0 -20px 38px rgba(25,11,3,0.54),
            0 0 38px -12px rgba(255,190,90,0.55);
          backdrop-filter: blur(7px);
        }
        .trunk-ring-field {
          position: absolute;
          inset: -18%;
          background:
            repeating-radial-gradient(circle at 50% 46%, rgba(255,232,164,0.18) 0 1px, transparent 1px 15px),
            radial-gradient(circle at 50% 46%, rgba(255,220,150,0.16), transparent 58%);
          opacity: 0.68;
          transform: scaleX(1.35);
        }
        .trunk-bark-edge {
          position: absolute;
          inset: 6px;
          border-radius: 11px;
          border: 1px solid rgba(80, 39, 10, 0.62);
          box-shadow:
            inset 0 0 0 2px rgba(255, 213, 136, 0.08),
            inset 0 0 22px rgba(14, 7, 2, 0.58);
        }
        .trunk-panel-title {
          font-family: "Cormorant Garamond", "Cinzel Decorative", serif;
          letter-spacing: 0.05em;
          text-shadow: 0 2px 2px rgba(18, 8, 2, 0.78), 0 0 13px rgba(255, 209, 128, 0.24);
        }
        .trunk-stage-chip {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          border-radius: 999px;
          border: 1px solid rgba(255, 219, 150, 0.2);
          background: rgba(29, 14, 5, 0.38);
          padding: 0.28rem 0.35rem;
          font-size: 0.64rem;
          line-height: 1;
          color: rgba(255, 240, 204, 0.72);
          white-space: nowrap;
        }
        .trunk-stage-active {
          border-color: rgba(255, 220, 145, 0.75);
          background: rgba(105, 62, 16, 0.62);
          color: rgba(255, 247, 221, 0.96);
          box-shadow: 0 0 16px rgba(255, 193, 91, 0.24);
        }
        .trunk-stage-complete {
          border-color: rgba(191, 255, 188, 0.42);
          color: rgba(219, 255, 206, 0.86);
        }
        .trunk-start-button {
          background: linear-gradient(180deg, #ffe8a6 0%, #e0a846 52%, #9c5f13 100%);
          border: 1px solid rgba(69, 34, 5, 0.82);
          box-shadow:
            inset 0 1px 0 rgba(255,255,230,0.72),
            inset 0 -2px 0 rgba(83, 38, 5, 0.48),
            0 8px 18px rgba(0,0,0,0.36),
            0 0 22px rgba(255,190,85,0.28);
          text-shadow: 0 1px 0 rgba(255, 239, 176, 0.45);
        }
        @media (max-width: 900px) {
          .trunk-spotlight-luma {
            left: 14%;
            top: 59%;
            width: 20vmin;
            height: 20vmin;
          }
          .trunk-spotlight-bloom {
            left: 57%;
            top: 51%;
            width: 16vmin;
            height: 16vmin;
          }
          .trunk-spotlight-vault {
            left: 87%;
            top: 58%;
            width: 22vmin;
            height: 22vmin;
          }
          .trunk-spotlight-compass {
            left: 50%;
            top: 43%;
            width: 23vmin;
            height: 23vmin;
          }
          .trunk-guide-pink {
            left: 3%;
            bottom: 11%;
            height: 42vh;
          }
          .trunk-guide-green {
            left: 50%;
            bottom: 27%;
            height: 29.7vh;
          }
          .trunk-guide-gold {
            right: -3%;
            bottom: 12%;
            height: 44.65vh;
            filter: drop-shadow(0 18px 16px rgba(0,0,0,0.72)) drop-shadow(0 0 26px rgba(255,190,70,0.30)) drop-shadow(0 -6px 14px rgba(255,200,90,0.18));
          }
          .trunk-guide-gold-shadow {
            right: -1%;
            bottom: 10%;
            width: 20.9vh;
            height: 3.8vh;
          }
        }
        @media (max-width: 640px) {
          .trunk-spotlight-luma {
            left: 10%;
            top: 57%;
            width: 19vmin;
            height: 19vmin;
          }
          .trunk-spotlight-bloom {
            left: 54%;
            top: 49%;
            width: 15vmin;
            height: 15vmin;
          }
          .trunk-spotlight-vault {
            left: 87%;
            top: 56%;
            width: 20vmin;
            height: 20vmin;
          }
          .trunk-spotlight-compass {
            left: 50%;
            top: 42%;
            width: 22vmin;
            height: 22vmin;
          }
          .trunk-book-arriving,
          .trunk-book-resting {
            height: 11vh;
          }
          .trunk-guide-pink {
            left: -6%;
            bottom: 18%;
            height: 34vh;
          }
          .trunk-guide-green {
            left: 47%;
            bottom: 31%;
            height: 22.5vh;
          }
          .trunk-guide-gold {
            right: -8%;
            bottom: 18%;
            height: 37.05vh;
            filter: drop-shadow(0 14px 12px rgba(0,0,0,0.68)) drop-shadow(0 0 20px rgba(255,190,70,0.25)) drop-shadow(0 -4px 10px rgba(255,200,90,0.14));
          }
          .trunk-guide-gold-shadow {
            right: -6%;
            bottom: 16%;
            width: 17.1vh;
            height: 3.325vh;
          }
          .trunk-stage-chip {
            font-size: 0.58rem;
          }
        }
      `}</style>
    </main>
  );
}

function TrunkNextButton({ unlocked }: { unlocked: boolean }) {
  const palette = unlocked ? TRUNK_NEXT_PALETTE.gold : TRUNK_NEXT_PALETTE.leather;
  return (
    <button
      type="button"
      disabled={!unlocked}
      className="pointer-events-auto"
      title={unlocked ? "Ready for the next layer" : "Complete the Trunk first"}
    >
      <span
        className={`group relative inline-flex h-[40px] w-[132px] shrink-0 items-center font-serif transition-transform sm:w-[188px] ${
          unlocked ? "hover:-translate-y-[1px]" : "cursor-not-allowed opacity-60 saturate-[0.55]"
        }`}
        aria-disabled={!unlocked}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-1 left-1.5 right-1.5 h-2 rounded-full blur-[3px]"
          style={{ background: "rgba(10,5,0,0.55)" }}
        />
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
            className="relative z-10 flex w-full items-center justify-center gap-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] sm:px-3.5 sm:text-[12px] sm:tracking-[0.18em]"
            style={{
              color: palette.text,
              textShadow: "0 1px 0 rgba(0,0,0,0.7), 0 0 6px rgba(0,0,0,0.4)",
            }}
          >
            <span className="truncate">Next Step</span>
            {unlocked && <ArrowRight className="h-3 w-3 opacity-90" />}
          </span>
          <span
            className="pointer-events-none absolute right-1.5 top-1 text-[8px] italic sm:right-2 sm:text-[9px]"
            style={{ color: palette.text, opacity: 0.8 }}
          >
            {unlocked ? "Ready" : "Not Yet"}
          </span>
        </span>
      </span>
    </button>
  );
}
