import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import trunkBgAsset from "@/assets/trunk-room-bg-v2.png.asset.json";
import packetBookAsset from "@/assets/trunk-packet-book.png.asset.json";
import compassStagAsset from "@/assets/compass-stag.png.asset.json";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

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

function TrunkPage() {
  const [bookArrived, setBookArrived] = useState(false);
  const [compassArrived, setCompassArrived] = useState(false);

  useEffect(() => {
    const t1 = window.setTimeout(() => setBookArrived(true), 1800);
    const t2 = window.setTimeout(() => setCompassArrived(true), 4200);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

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

        {/* Shaft of light over the table */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-full -translate-x-1/2 trunk-shaft"
          aria-hidden
        />

        {/* Arriving packet book — descends along the light beam, lands flat on the table */}
        <img
          src={packetBookAsset.url}
          alt=""
          className={`pointer-events-none absolute left-1/2 z-[10] ${
            bookArrived ? "trunk-book-resting" : "trunk-book-arriving"
          }`}
          draggable={false}
        />

        {/* Soft warm glow on table when book lands */}
        {bookArrived && (
          <div
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 trunk-table-glow"
            aria-hidden
          />
        )}

        {/* Compass — emerges from the distant doorway, walks up beside the table */}
        <img
          src={compassStagAsset.url}
          alt=""
          className={`pointer-events-none absolute z-[5] ${
            compassArrived ? "trunk-compass-standing" : "trunk-compass-walking"
          }`}
          draggable={false}
        />
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 pt-5 sm:px-8 sm:pt-6">
        <Link
          to="/root-room"
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-amber-200/40 bg-black/35 px-3.5 py-1.5 text-xs text-amber-50/90 backdrop-blur-md transition hover:bg-black/55"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Root Room
        </Link>
        <TrunkNextButton unlocked={false} />
      </header>

      {/* Status panel */}
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
          <div className="relative flex items-center justify-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-200" />
            <span className="text-[11px] uppercase tracking-[0.34em] text-amber-100/90">
              Trunk Layer
            </span>
          </div>
          <h2 className="relative mt-1 text-center text-[22px] font-bold tracking-wide text-amber-50">
            {bookArrived ? "The Packet Has Arrived" : "Carrying the Packet…"}
          </h2>
          <p className="relative mt-2 text-center text-[13px] leading-relaxed text-amber-50/95">
            {bookArrived
              ? "Your packet rests on the trunk table. The lantern guides will soon gather to light the next steps."
              : "The packet is rising through the trunk on a thread of light."}
          </p>
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
        /* Book descends from the ceiling along the light beam and settles fully on the table */
        @keyframes trunk-book-arriving-kf {
          0%   { top: -8%;  transform: translateX(-50%) scale(0.35); opacity: 0; filter: drop-shadow(0 0 60px rgba(255,235,180,1)); }
          20%  { opacity: 1; }
          100% { top: 58%;  transform: translateX(-50%) scale(1);    opacity: 1; filter: drop-shadow(0 14px 22px rgba(0,0,0,0.7)) drop-shadow(0 0 28px rgba(255,210,140,0.85)); }
        }
        .trunk-book-arriving {
          top: -8%;
          height: 18vh; width: auto;
          transform-origin: 50% 90%;
          animation: trunk-book-arriving-kf 1.8s cubic-bezier(0.4, 0.0, 0.4, 1) forwards;
          will-change: top, transform, opacity;
        }
        @keyframes trunk-book-rest-kf {
          0%, 100% { transform: translateX(-50%) scale(1) translateY(0); }
          50%      { transform: translateX(-50%) scale(1) translateY(-2px); }
        }
        .trunk-book-resting {
          top: 58%;
          height: 18vh; width: auto;
          transform-origin: 50% 90%;
          filter: drop-shadow(0 14px 22px rgba(0,0,0,0.7)) drop-shadow(0 0 28px rgba(255,210,140,0.9));
          animation: trunk-book-rest-kf 4s ease-in-out infinite;
        }
        @keyframes trunk-glow-kf {
          0%   { opacity: 0; transform: translateX(-50%) scale(0.4); }
          100% { opacity: 0.85; transform: translateX(-50%) scale(1); }
        }
        .trunk-table-glow {
          bottom: 26%;
          width: 38vmin; height: 14vmin;
          border-radius: 50%;
          background: radial-gradient(ellipse at center, rgba(255,225,160,0.7) 0%, rgba(255,180,80,0.3) 45%, transparent 75%);
          filter: blur(14px);
          mix-blend-mode: screen;
          animation: trunk-glow-kf 0.8s ease-out forwards;
        }
        /* Compass — walks forward from deep center, stops behind the table */
        @keyframes trunk-compass-walking-kf {
          0%   { left: 50%; bottom: 44%; transform: translateX(-50%) scale(0.05); opacity: 0; filter: brightness(0.5) drop-shadow(0 0 8px rgba(255,200,120,0.4)); }
          15%  { opacity: 1; }
          100% { left: 50%; bottom: 30%; transform: translateX(-50%) scale(0.66); opacity: 1; filter: brightness(1) drop-shadow(0 18px 24px rgba(0,0,0,0.7)) drop-shadow(0 0 22px rgba(255,170,70,0.5)); }
        }
        .trunk-compass-walking {
          height: 78vh; width: auto;
          transform-origin: 50% 100%;
          animation: trunk-compass-walking-kf 2.4s cubic-bezier(0.4, 0.0, 0.5, 1) forwards;
          will-change: left, bottom, transform, opacity;
        }
        @keyframes trunk-compass-stand-kf {
          0%, 100% { transform: translateX(-50%) scale(0.66) translateY(0); }
          50%      { transform: translateX(-50%) scale(0.66) translateY(-3px); }
        }
        .trunk-compass-standing {
          left: 50%; bottom: 30%;
          height: 78vh; width: auto;
          transform-origin: 50% 100%;
          filter: drop-shadow(0 18px 24px rgba(0,0,0,0.7)) drop-shadow(0 0 22px rgba(255,170,70,0.55));
          animation: trunk-compass-stand-kf 5s ease-in-out infinite;
        }
        @media (max-width: 640px) {
          .trunk-book-arriving, .trunk-book-resting { height: 13vh; }
          .trunk-compass-walking, .trunk-compass-standing { height: 60vh; }
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
        className={`group relative inline-flex h-[40px] w-[188px] shrink-0 items-center font-serif transition-transform ${
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
    </button>
  );
}
