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
      {/* Flickering tree-core glow */}
      <div
        className="dabottree-core-flicker absolute left-1/2 top-[52%] h-[55vh] w-[55vh] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,178,80,0.55) 0%, rgba(255,140,40,0.25) 35%, rgba(0,0,0,0) 70%)",
          animation: "dabottree-core-flicker 6.5s ease-in-out infinite",
          mixBlendMode: "screen",
        }}
      />
      {/* Soft pulsing aura around trunk */}
      <div
        className="dabottree-glow-pulse absolute left-1/2 top-[55%] h-[90vh] w-[90vh] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,160,60,0.18) 0%, rgba(0,0,0,0) 60%)",
          animation: "dabottree-glow-pulse 8s ease-in-out infinite",
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

      {/* Idea sparks */}
      {[
        { left: "46%", x: "-30px", delay: "0s", dur: "9s", size: 2 },
        { left: "52%", x: "20px", delay: "2.4s", dur: "11s", size: 3 },
        { left: "49%", x: "50px", delay: "5s", dur: "10s", size: 2 },
        { left: "55%", x: "-15px", delay: "7s", dur: "12s", size: 2 },
        { left: "43%", x: "35px", delay: "3.5s", dur: "13s", size: 3 },
      ].map((s, i) => (
        <span
          key={i}
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
    </div>
  );
}

