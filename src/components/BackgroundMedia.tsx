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
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-black/70" />
    </div>
  );
}
