import { useEffect, useState } from "react";
import clarityReadyAsset from "@/assets/clarity-squirrel-ready.png.asset.json";

/**
 * Fullscreen overlay shown when the user clicks Next Step from the Library.
 * Clarity walks forward presenting the completed packet, the book glows and
 * fills the screen as a warm cut, then we hand off to the Root Room.
 *
 * Honors prefers-reduced-motion: skips the motion and does a quick fade.
 */
export function RootDescentTransition({ onComplete }: { onComplete: () => void }) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
  }, []);

  useEffect(() => {
    const duration = reducedMotion ? 400 : 1700;
    const t = window.setTimeout(onComplete, duration);
    return () => window.clearTimeout(t);
  }, [onComplete, reducedMotion]);

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden"
      style={{ background: "radial-gradient(ellipse at center, #2a1606 0%, #0a0502 75%, #000 100%)" }}
      aria-hidden
    >
      {/* Clarity walks forward presenting the packet */}
      <img
        src={clarityReadyAsset.url}
        alt=""
        className={reducedMotion ? "clarity-fade" : "clarity-forward"}
        draggable={false}
      />

      {/* Warm glow that grows and fills the screen as the book reaches camera */}
      <div className={reducedMotion ? "book-glow-fade" : "book-glow"} />

      <style>{`
        @keyframes clarity-forward-kf {
          0%   { transform: translate(-50%, -50%) scale(0.55); opacity: 0; filter: drop-shadow(0 0 0 rgba(255,180,80,0)); }
          18%  { opacity: 1; }
          70%  { transform: translate(-50%, -50%) scale(1.35); opacity: 1; filter: drop-shadow(0 0 30px rgba(255,200,120,0.85)); }
          100% { transform: translate(-50%, -50%) scale(2.4);  opacity: 0; filter: drop-shadow(0 0 60px rgba(255,210,140,1)); }
        }
        @keyframes clarity-fade-kf {
          0%, 100% { opacity: 0; }
          50%      { opacity: 1; }
        }
        @keyframes book-glow-kf {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.2); }
          55%  { opacity: 0.25; transform: translate(-50%, -50%) scale(0.8); }
          80%  { opacity: 0.85; transform: translate(-50%, -50%) scale(2.2); }
          100% { opacity: 1;    transform: translate(-50%, -50%) scale(4); }
        }
        .clarity-forward {
          position: absolute; left: 50%; top: 50%;
          height: 80vh; width: auto; max-width: none;
          transform: translate(-50%, -50%) scale(0.55);
          object-fit: contain;
          animation: clarity-forward-kf 1.7s cubic-bezier(0.45, 0.05, 0.55, 1) forwards;
          will-change: transform, opacity;
        }
        .clarity-fade {
          position: absolute; left: 50%; top: 50%;
          height: 80vh; width: auto; max-width: none;
          transform: translate(-50%, -50%);
          object-fit: contain;
          animation: clarity-fade-kf 0.4s ease-out forwards;
        }
        .book-glow {
          position: absolute; left: 50%; top: 50%;
          width: 40vmin; height: 40vmin;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,240,200,1) 0%, rgba(255,200,120,0.9) 30%, rgba(255,160,60,0.5) 55%, transparent 75%);
          pointer-events: none;
          opacity: 0;
          animation: book-glow-kf 1.7s ease-in forwards;
          will-change: transform, opacity;
        }
        .book-glow-fade {
          position: absolute; inset: 0;
          background: radial-gradient(circle at center, rgba(255,220,160,0.9), rgba(40,20,5,1) 80%);
          opacity: 0;
          animation: clarity-fade-kf 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
