/**
 * ILLUSTRATIVE geometry only. These percentages are product design choices,
 * not measurements from platform UIs. See docs/safe-zone-presets.md.
 * Change version when geometry changes; keep lastReviewed null until a real,
 * documented review exists. Rectangles use percentages of the 9:16 frame.
 */
export type Rect = { x: number; y: number; width: number; height: number };
export type PlatformId = "reels" | "shorts" | "tiktok";
export type Preset = {
  id: PlatformId;
  name: string;
  version: string;
  lastReviewed: string | null;
  accuracy: "Unverified illustrative preset";
  safe: Rect;
  obstructions: { label: string; rect: Rect }[];
};
const metadata = { version: "illustrative-v1.0.0", lastReviewed: null, accuracy: "Unverified illustrative preset" } as const;
export const SAFE_ZONE_PRESETS: Record<PlatformId, Preset> = {
  reels: {
    ...metadata, id: "reels", name: "Instagram Reels",
    safe: { x: 8, y: 16, width: 68, height: 50 },
    obstructions: [
      { label: "Top UI", rect: { x: 0, y: 0, width: 100, height: 10 } },
      { label: "Caption / navigation", rect: { x: 0, y: 80, width: 100, height: 20 } },
      { label: "Actions", rect: { x: 84, y: 28, width: 16, height: 52 } },
    ],
  },
  shorts: {
    ...metadata, id: "shorts", name: "YouTube Shorts",
    safe: { x: 8, y: 14, width: 70, height: 53 },
    obstructions: [
      { label: "Top UI", rect: { x: 0, y: 0, width: 100, height: 8 } },
      { label: "Caption / navigation", rect: { x: 0, y: 77, width: 100, height: 23 } },
      { label: "Actions", rect: { x: 84, y: 30, width: 16, height: 47 } },
    ],
  },
  tiktok: {
    ...metadata, id: "tiktok", name: "TikTok",
    safe: { x: 8, y: 16, width: 66, height: 48 },
    obstructions: [
      { label: "Top UI", rect: { x: 0, y: 0, width: 100, height: 10 } },
      { label: "Caption / navigation", rect: { x: 0, y: 74, width: 100, height: 26 } },
      { label: "Actions", rect: { x: 82, y: 25, width: 18, height: 49 } },
    ],
  },
};
export const PLATFORM_IDS: PlatformId[] = ["reels", "shorts", "tiktok"];
