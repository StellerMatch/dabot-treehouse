export type BackgroundItem = {
  id: string;
  label: string;
  type: "image" | "video";
  src: string;
  poster?: string;
  fit?: "cover" | "contain";
  playback?: "loop" | "once";
  muted?: boolean;
  startVisible?: boolean;
};

// Replace these src paths with your own assets in /public or remote URLs later.
export const backgrounds: BackgroundItem[] = [
  {
    id: "doorway-dusk",
    label: "Doorway at Dusk",
    type: "image",
    src: "/backgrounds/doorway-dusk.jpg",
    fit: "cover",
    startVisible: true,
  },
  {
    id: "forest-loop",
    label: "Living Forest (loop)",
    type: "video",
    src: "/backgrounds/forest-loop.mp4",
    poster: "/backgrounds/forest-loop.jpg",
    fit: "cover",
    playback: "loop",
    muted: true,
  },
  {
    id: "spark-once",
    label: "Spark (play once)",
    type: "video",
    src: "/backgrounds/spark-once.mp4",
    poster: "/backgrounds/spark-once.jpg",
    fit: "cover",
    playback: "once",
    muted: true,
  },
];

export const defaultBackgroundId =
  backgrounds.find((b) => b.startVisible)?.id ?? backgrounds[0]?.id;
