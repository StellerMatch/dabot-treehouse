import { useEffect, useState } from "react";

/**
 * Fullscreen overlay shown when the user clicks Next Step from the Library.
 * Plays a ~2.6s descent: the clean packet/book glows, lifts, then travels
 * down through warm glowing roots into the Root Room.
 *
 * Honors prefers-reduced-motion: skips the descent and does a quick fade.
 *
 * onComplete fires when it's time to navigate to /root-room.
 */
export function RootDescentTransition({ onComplete }: { onComplete: () => void }) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
  }, []);

  useEffect(() => {
    const duration = reducedMotion ? 500 : 2600;
    const t = window.setTimeout(onComplete, duration);
    return () => window.clearTimeout(t);
  }, [onComplete, reducedMotion]);

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden"
      style={{ background: "radial-gradient(ellipse at center, #1a0a02 0%, #000 80%)" }}
      aria-hidden
    >
      {/* Warm root walls closing in */}
      {!reducedMotion && (
        <>
          <div className="root-wall root-wall-left" />
          <div className="root-wall root-wall-right" />
          <div className="root-wall root-wall-top" />

          {/* Golden particle motes */}
          {Array.from({ length: 18 }).map((_, i) => (
            <span
              key={i}
              className="root-mote"
              style={{
                left: `${(i * 53) % 100}%`,
                animationDelay: `${(i % 6) * 0.15}s`,
                animationDuration: `${1.6 + (i % 4) * 0.3}s`,
              }}
            />
          ))}

          {/* Vignette / tunnel darkening */}
          <div className="root-vignette" />
        </>
      )}

      {/* The packet/book */}
      <div className={reducedMotion ? "root-packet-fade" : "root-packet"}>
        <div className="root-packet-glow" />
        <div className="root-packet-body">
          <div className="root-packet-spine" />
          <div className="root-packet-cover" />
        </div>
      </div>

      <style>{`
        @keyframes packet-descent {
          0%   { transform: translate(-50%, -50%) scale(1)    rotate(-2deg); opacity: 0; filter: drop-shadow(0 0 0 rgba(255,180,80,0)); }
          12%  { transform: translate(-50%, -55%) scale(1.05) rotate(0deg);  opacity: 1; filter: drop-shadow(0 0 24px rgba(255,200,120,0.85)); }
          35%  { transform: translate(-50%, -30%) scale(1.15) rotate(2deg);  opacity: 1; filter: drop-shadow(0 0 38px rgba(255,200,120,1)); }
          70%  { transform: translate(-50%, 40%)  scale(0.75) rotate(-3deg); opacity: 1; filter: drop-shadow(0 0 26px rgba(255,170,70,0.9)); }
          100% { transform: translate(-50%, 120%) scale(0.35) rotate(0deg);  opacity: 0; filter: drop-shadow(0 0 10px rgba(255,150,50,0.4)); }
        }
        @keyframes packet-fade {
          0%   { opacity: 0; }
          50%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes packet-glow-pulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.18); }
        }
        @keyframes root-mote-fall {
          0%   { transform: translateY(-10vh) scale(0.6); opacity: 0; }
          15%  { opacity: 1; }
          100% { transform: translateY(110vh) scale(1);   opacity: 0; }
        }
        @keyframes wall-close-left {
          0%   { transform: translateX(-100%) skewY(-6deg); opacity: 0; }
          40%  { opacity: 0.95; }
          100% { transform: translateX(-15%)  skewY(-6deg); opacity: 1; }
        }
        @keyframes wall-close-right {
          0%   { transform: translateX(100%) skewY(6deg); opacity: 0; }
          40%  { opacity: 0.95; }
          100% { transform: translateX(15%)  skewY(6deg); opacity: 1; }
        }
        @keyframes wall-close-top {
          0%   { transform: translateY(-100%); opacity: 0; }
          40%  { opacity: 0.9; }
          100% { transform: translateY(-20%);  opacity: 1; }
        }
        @keyframes vignette-tighten {
          0%   { box-shadow: inset 0 0 200px 40px rgba(0,0,0,0.4); }
          100% { box-shadow: inset 0 0 600px 200px rgba(0,0,0,0.95); }
        }
        .root-packet {
          position: absolute; left: 50%; top: 50%;
          width: 140px; height: 180px;
          animation: packet-descent 2.6s cubic-bezier(0.5, 0.05, 0.4, 1) forwards;
          will-change: transform, opacity;
        }
        .root-packet-fade {
          position: absolute; left: 50%; top: 50%;
          width: 140px; height: 180px;
          transform: translate(-50%, -50%);
          animation: packet-fade 0.5s ease-out forwards;
        }
        .root-packet-glow {
          position: absolute; inset: -40px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,210,130,0.9) 0%, rgba(255,170,60,0.4) 40%, transparent 70%);
          animation: packet-glow-pulse 1.2s ease-in-out infinite;
        }
        .root-packet-body {
          position: relative; width: 100%; height: 100%;
          border-radius: 4px;
          background: linear-gradient(135deg, #f5e0a8 0%, #d9b86a 60%, #a8842e 100%);
          box-shadow: 0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.5);
          border: 1px solid rgba(80,40,10,0.8);
        }
        .root-packet-spine {
          position: absolute; left: 0; top: 0; bottom: 0; width: 12px;
          background: linear-gradient(90deg, #8a5a1e 0%, #c89a4a 100%);
          border-right: 1px solid rgba(40,20,5,0.6);
        }
        .root-packet-cover {
          position: absolute; left: 30px; right: 20px; top: 30px; bottom: 30px;
          border: 2px solid rgba(120,70,20,0.7);
          border-radius: 2px;
          background:
            radial-gradient(circle at 50% 40%, rgba(255,240,200,0.6) 0%, transparent 60%),
            linear-gradient(180deg, rgba(180,130,60,0.3), transparent);
        }
        .root-wall {
          position: absolute; pointer-events: none;
          background:
            repeating-linear-gradient(115deg,
              rgba(80,40,15,0.95) 0px,
              rgba(60,25,8,0.95) 8px,
              rgba(110,60,25,0.85) 18px,
              rgba(50,20,5,0.95) 28px),
            radial-gradient(ellipse at center, rgba(255,160,60,0.25), transparent 70%);
          filter: blur(1px);
        }
        .root-wall-left {
          left: 0; top: -10%; bottom: -10%; width: 55%;
          clip-path: polygon(0 0, 100% 15%, 85% 50%, 100% 85%, 0 100%);
          animation: wall-close-left 2.4s cubic-bezier(0.4,0,0.3,1) forwards;
        }
        .root-wall-right {
          right: 0; top: -10%; bottom: -10%; width: 55%;
          clip-path: polygon(100% 0, 0 15%, 15% 50%, 0 85%, 100% 100%);
          animation: wall-close-right 2.4s cubic-bezier(0.4,0,0.3,1) forwards;
        }
        .root-wall-top {
          left: -10%; right: -10%; top: 0; height: 40%;
          clip-path: polygon(0 0, 100% 0, 85% 100%, 15% 100%);
          animation: wall-close-top 2.4s cubic-bezier(0.4,0,0.3,1) forwards;
        }
        .root-mote {
          position: absolute; top: 0;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: radial-gradient(circle, #ffe7a8 0%, rgba(255,180,80,0.6) 50%, transparent 100%);
          box-shadow: 0 0 8px rgba(255,200,120,0.9);
          animation: root-mote-fall linear infinite;
          will-change: transform, opacity;
        }
        .root-vignette {
          position: absolute; inset: 0; pointer-events: none;
          animation: vignette-tighten 2.6s ease-in forwards;
        }
      `}</style>
    </div>
  );
}
