export type ThumbnailAsset = { url: string; name: string; width: number; height: number; warnings: string[] };
export type SlotState = { request: number; asset?: ThumbnailAsset; loading: boolean; error?: string };
export type SlotAction = { type: "start"; request: number } | { type: "success"; request: number; asset: ThumbnailAsset } | { type: "error"; request: number; error: string } | { type: "clear"; request: number };
export const emptySlot: SlotState = { request: 0, loading: false };
export function slotReducer(state: SlotState, action: SlotAction): SlotState {
  if (action.type === "clear") return { request: action.request, loading: false };
  if (action.type === "start") return { request: action.request, asset: state.asset, loading: true };
  if (action.request !== state.request) return state;
  if (action.type === "success") return { request: action.request, asset: action.asset, loading: false };
  return { ...state, loading: false, error: action.error };
}
