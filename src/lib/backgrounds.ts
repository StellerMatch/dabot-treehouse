import doorwayImage from "@/assets/dabottree-doorway.jpg";
import libraryImage from "@/assets/dabottree-library.jpg";

export type BackgroundConfig = {
  type: "image" | "video";
  /** Asset path, imported URL, or uploaded file URL */
  src: string;
  /** Poster image shown before a video loads (videos only) */
  poster?: string;
  /** Loop video playback. Ignored for images. */
  loop?: boolean;
  /** Play video exactly once then hold last frame. Overrides loop. */
  playOnce?: boolean;
  /** Mute video audio. Required true for autoplay in most browsers. */
  muted?: boolean;
  /** Autoplay video on mount. */
  autoplay?: boolean;
  /** How the media fills the viewport. Defaults to "cover". */
  objectFit?: "cover" | "contain";
};

/**
 * Active background for the DaBotTree front page.
 *
 * To swap: replace `src` with your own image or video URL (or a new import),
 * set `type` accordingly, and adjust loop / playOnce / poster as needed.
 * No layout changes are required — the page reads from this single config.
 *
 * Example (video):
 *   export const frontPageBackground: BackgroundConfig = {
 *     type: "video",
 *     src: "/backgrounds/dabottree-doorway.mp4",
 *     poster: "/backgrounds/dabottree-doorway.jpg",
 *     loop: true,
 *     muted: true,
 *     autoplay: true,
 *     objectFit: "cover",
 *   };
 */
export const frontPageBackground: BackgroundConfig = {
  type: "image",
  src: doorwayImage,
  objectFit: "cover",
  muted: true,
  autoplay: true,
  loop: true,
};

export const accountEntryBackground: BackgroundConfig = {
  type: "image",
  src: libraryImage,
  objectFit: "cover",
  muted: true,
  autoplay: true,
  loop: true,
};
