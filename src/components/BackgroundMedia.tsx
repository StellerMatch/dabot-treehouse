import { useEffect, useRef, useState } from "react";
import { frontPageBackground, type BackgroundConfig } from "@/lib/backgrounds";

type Props = {
  config?: BackgroundConfig;
  className?: string;
};

/**
 * Full-viewport cinematic background layer.
 * - Fixed, behind all content (-z-10).
 * - Supports image or video sources via a single config object.
 * - Adds a dark readable overlay above the media for white text legibility.
 */
export function BackgroundMedia({ config, className }: Props) {
  const item = config ?? frontPageBackground;
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setFailed(false);
  }, [item.src]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || item.type !== "video" || !item.playOnce) return;
    const onEnded = () => {
      v.pause();
      try {
        v.currentTime = Math.max(0, v.duration - 0.05);
      } catch {}
    };
    v.addEventListener("ended", onEnded);
    return () => v.removeEventListener("ended", onEnded);
  }, [item.src, item.type, item.playOnce]);

  const fitClass =
    item.objectFit === "contain" ? "object-contain" : "object-cover";

  return (
    <div
      aria-hidden
      className={
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-neutral-950 " +
        (className ?? "")
      }
    >
      {!failed && item.type === "image" && (
        <img
          src={item.src}
          alt=""
          className={`h-full w-full ${fitClass} object-center`}
          onError={() => setFailed(true)}
        />
      )}
      {!failed && item.type === "video" && (
        <video
          ref={videoRef}
          className={`h-full w-full ${fitClass} object-center`}
          src={item.src}
          poster={item.poster}
          autoPlay={item.autoplay ?? true}
          muted={item.muted ?? true}
          playsInline
          loop={item.playOnce ? false : (item.loop ?? true)}
          onError={() => setFailed(true)}
        />
      )}
      {/* Fallback cinematic gradient if media missing */}
      {failed && (
        <div className="h-full w-full bg-[radial-gradient(ellipse_at_center,_#3a2410_0%,_#0b0f1a_70%)]" />
      )}
      {/* Dark readable overlay — sits above media, below content */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/30 to-black/75" />

      {/* Cinematic warm light layers */}
      {/* Outer breathing tree-core glow (slow) */}
      <div
        className="dabottree-core-flicker absolute left-1/2 top-[52%] h-[55vh] w-[55vh] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,178,80,0.55) 0%, rgba(255,140,40,0.25) 35%, rgba(0,0,0,0) 70%)",
          animation: "dabottree-core-flicker 7.5s ease-in-out infinite",
          mixBlendMode: "screen",
          transform: "translate(-50%, -50%)",
        }}
      />
      {/* Inner ember flicker (faster, smaller, hotter) */}
      <div
        className="dabottree-ember-flicker absolute left-1/2 top-[53%] h-[26vh] w-[26vh] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,225,170,0.85) 0%, rgba(255,160,60,0.55) 35%, rgba(255,90,20,0.18) 65%, rgba(0,0,0,0) 78%)",
          animation: "dabottree-ember-flicker 2.6s ease-in-out infinite",
          mixBlendMode: "screen",
          filter: "blur(18px)",
        }}
      />
      {/* Secondary off-beat ember layer for organic, non-strobe flicker */}
      <div
        className="dabottree-ember-flicker absolute left-1/2 top-[54%] h-[18vh] w-[18vh] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,210,140,0.7) 0%, rgba(255,130,40,0.35) 50%, rgba(0,0,0,0) 80%)",
          animation: "dabottree-ember-flicker 4.1s ease-in-out -1.3s infinite",
          mixBlendMode: "screen",
          filter: "blur(14px)",
        }}
      />
      {/* Soft pulsing aura around trunk — light spilling outward */}
      <div
        className="dabottree-glow-pulse absolute left-1/2 top-[55%] h-[90vh] w-[90vh] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,160,60,0.22) 0%, rgba(255,120,40,0.08) 35%, rgba(0,0,0,0) 65%)",
          animation: "dabottree-glow-pulse 9s ease-in-out infinite",
          mixBlendMode: "screen",
        }}
      />

      {/* Atmospheric drifting mist */}
      <div
        className="dabottree-mist absolute inset-x-[-5%] bottom-0 h-[40vh]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(255,200,140,0.10) 0%, rgba(0,0,0,0) 60%)",
          animation: "dabottree-mist-drift 14s ease-in-out infinite alternate",
        }}
      />

      {/* Idea sparks — rising slowly */}
      {[
        { left: "46%", x: "-30px", delay: "0s", dur: "11s", size: 2 },
        { left: "52%", x: "20px", delay: "2.4s", dur: "13s", size: 3 },
        { left: "49%", x: "50px", delay: "5s", dur: "12s", size: 2 },
        { left: "55%", x: "-15px", delay: "7s", dur: "14s", size: 2 },
        { left: "43%", x: "35px", delay: "3.5s", dur: "15s", size: 3 },
      ].map((s, i) => (
        <span
          key={`spark-${i}`}
          className="dabottree-spark absolute bottom-[18%] rounded-full bg-amber-200"
          style={{
            left: s.left,
            width: s.size,
            height: s.size,
            boxShadow: "0 0 8px 2px rgba(255,200,120,0.85)",
            ["--spark-x" as never]: s.x,
            animation: `dabottree-spark-drift ${s.dur} linear ${s.delay} infinite`,
          }}
        />
      ))}

      {/* Warm dust motes drifting near the tree light */}
      {[
        { left: "47%", top: "55%", x: "18px", delay: "0s", dur: "8s" },
        { left: "51%", top: "57%", x: "-22px", delay: "2.1s", dur: "9.5s" },
        { left: "53%", top: "53%", x: "14px", delay: "4.4s", dur: "10s" },
        { left: "45%", top: "58%", x: "-10px", delay: "6s", dur: "11s" },
      ].map((m, i) => (
        <span
          key={`mote-${i}`}
          className="dabottree-mote absolute rounded-full"
          style={{
            left: m.left,
            top: m.top,
            width: 1.5,
            height: 1.5,
            background: "rgba(255,215,160,0.9)",
            boxShadow: "0 0 6px 1px rgba(255,190,110,0.7)",
            ["--mote-x" as never]: m.x,
            animation: `dabottree-mote-drift ${m.dur} ease-in-out ${m.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

