import { SAFE_ZONE_PRESETS, type PlatformId, type Preset, type Rect } from "./safe-zone-presets.v1";
import { THUMBNAIL_LIMITS, type ImageLimits } from "./thumbnail-validation";

export const SAFE_ZONE_LIMITS: ImageLimits = {
  ...THUMBNAIL_LIMITS, recommendedWidth: 1080, recommendedHeight: 1920,
  targetRatio: 9 / 16, previewMaxDimension: 1920,
  warningCopy: {
    resolution: "Below the suggested 1080 × 1920 canvas resolution; this image may appear soft. This is a tool suggestion, not a platform upload rule.",
    ratio: "This image is not approximately 9:16. It is fitted without stretching; empty space may appear inside the vertical frame.",
  },
};
export type GuideId = "text" | "logo";
export type Zone = "safe" | "caution" | "obstruction";
export type SafeZoneState = {
  platform: PlatformId; opacity: number; overlayVisible: boolean; activeGuide: GuideId;
  guides: Record<GuideId, Rect>;
};
export const MIN_GUIDE_SIZE = 5;
export function initialSafeZoneState(): SafeZoneState {
  return { platform: "reels", opacity: 45, overlayVisible: true, activeGuide: "text", guides: {
    text: { x: 16, y: 28, width: 52, height: 12 },
    logo: { x: 16, y: 48, width: 18, height: 10 },
  } };
}
const clamp = (value: number, min: number, max: number) => Math.round(Math.min(max, Math.max(min, value)) * 10) / 10;
export function updateGuide(rect: Rect, field: keyof Rect, value: number): Rect {
  if (!Number.isFinite(value)) return rect;
  switch (field) {
    case "x": return { ...rect, x: clamp(value, 0, 100 - rect.width) };
    case "y": return { ...rect, y: clamp(value, 0, 100 - rect.height) };
    case "width": return { ...rect, width: clamp(value, MIN_GUIDE_SIZE, 100 - rect.x) };
    case "height": return { ...rect, height: clamp(value, MIN_GUIDE_SIZE, 100 - rect.y) };
  }
}
export function transformGuide(rect: Rect, mode: "move" | "resize", dx: number, dy: number): Rect {
  const horizontal = mode === "move" ? "x" : "width";
  const vertical = mode === "move" ? "y" : "height";
  return updateGuide(updateGuide(rect, horizontal, rect[horizontal] + dx), vertical, rect[vertical] + dy);
}
export function guideZone(guide: Rect, preset: Preset): Zone {
  const intersects = (r: Rect) => guide.x < r.x + r.width && guide.x + guide.width > r.x && guide.y < r.y + r.height && guide.y + guide.height > r.y;
  if (preset.obstructions.some(region => intersects(region.rect))) return "obstruction";
  const r = preset.safe;
  if (guide.x >= r.x && guide.y >= r.y && guide.x + guide.width <= r.x + r.width && guide.y + guide.height <= r.y + r.height) return "safe";
  return "caution";
}
export type SafeZoneAction =
  | { type: "platform"; value: PlatformId }
  | { type: "opacity"; value: number }
  | { type: "visibility"; value: boolean }
  | { type: "active"; value: GuideId }
  | { type: "guide"; guide: GuideId; field: keyof Rect; value: number }
  | { type: "transform"; guide: GuideId; origin: Rect; mode: "move" | "resize"; dx: number; dy: number }
  | { type: "reset" };
export function safeZoneReducer(state: SafeZoneState, action: SafeZoneAction): SafeZoneState {
  switch (action.type) {
    case "reset": return initialSafeZoneState();
    case "platform": return Object.hasOwn(SAFE_ZONE_PRESETS, action.value) ? { ...state, platform: action.value } : state;
    case "opacity": return Number.isFinite(action.value) ? { ...state, opacity: clamp(action.value, 0, 90) } : state;
    case "visibility": return { ...state, overlayVisible: action.value };
    case "active": return { ...state, activeGuide: action.value };
    case "guide": return { ...state, guides: { ...state.guides, [action.guide]: updateGuide(state.guides[action.guide], action.field, action.value) } };
    case "transform": return { ...state, guides: { ...state.guides, [action.guide]: transformGuide(action.origin, action.mode, action.dx, action.dy) } };
  }
}
