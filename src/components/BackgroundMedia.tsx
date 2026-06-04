import { useEffect, useRef, useState } from "react";
import { backgrounds, type BackgroundItem } from "@/lib/backgrounds";

type Props = {
  activeId?: string;
  className?: string;
};

export function BackgroundMedia({ activeId, className }: Props) {
  const item: BackgroundItem | undefined =
    backgrounds.find((b) => b.id === activeId) ?? backgrounds[0];
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setFailed(false);
  }, [item?.id]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !item || item.type !== "video") return;
    const onEnded = () => {
      if (item.playback === "once") {
        v.pause();
        // hold last frame
        try {
          v.currentTime = Math.max(0, v.duration - 0.05);
        } catch {}
      }
    };
    v.addEventListener("ended", onEnded);
    return () => v.removeEventListener("ended", onEnded);
  }, [item?.id, item?.playback]);

  const fitClass = item?.fit === "contain" ? "object-contain" : "object-cover";

  return (
    <div
      aria-hidden
      className={
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-neutral-950 " +
        (className ?? "")
      }
    >
      {item && !failed && item.type === "image" && (
        <img
          src={item.src}
          alt=""
          className={`h-full w-full ${fitClass}`}
          onError={() => setFailed(true)}
        />
      )}
      {item && !failed && item.type === "video" && (
        <video
          ref={videoRef}
          className={`h-full w-full ${fitClass}`}
          src={item.src}
          poster={item.poster}
          autoPlay
          muted={item.muted ?? true}
          playsInline
          loop={item.playback === "loop"}
          onError={() => setFailed(true)}
        />
      )}
      {/* Fallback gradient if media missing */}
      {(failed || !item) && (
        <div className="h-full w-full bg-[radial-gradient(ellipse_at_center,_#1f2937_0%,_#0b0f1a_70%)]" />
      )}
      {/* Subtle readable overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/55" />
    </div>
  );
}
