"use client";

import { useEffect, useReducer, useRef } from "react";
import { prepareThumbnail, THUMBNAIL_LIMITS, type ImageLimits } from "@/lib/thumbnail-validation";
import { decodeThumbnail } from "@/lib/thumbnail-browser";
import { emptySlot, slotReducer } from "@/lib/thumbnail-state";

/** Shared local image owner: cancellation, stale requests, URLs and error recovery. */
export function useLocalImage(limits: ImageLimits = THUMBNAIL_LIMITS) {
  const [state, dispatch] = useReducer(slotReducer, emptySlot);
  const request = useRef(0);
  const currentUrl = useRef<string | undefined>(undefined);
  const controller = useRef<AbortController | undefined>(undefined);
  const release = () => {
    if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    currentUrl.current = undefined;
  };
  useEffect(() => () => { request.current++; controller.current?.abort(); release(); }, []);
  async function select(files: File[]) {
    const id = ++request.current;
    controller.current?.abort();
    controller.current = new AbortController();
    dispatch({ type: "start", request: id });
    try {
      if (files.length !== 1) throw new Error("Choose exactly one image for this image slot.");
      const prepared = await prepareThumbnail(files[0], decodeThumbnail, limits, controller.current.signal);
      if (id !== request.current) return;
      const url = URL.createObjectURL(prepared.blob);
      release();
      currentUrl.current = url;
      dispatch({ type: "success", request: id, asset: { url, name: files[0].name, width: prepared.width, height: prepared.height, warnings: prepared.warnings } });
    } catch (error) {
      if (id === request.current) dispatch({ type: "error", request: id, error: error instanceof Error ? error.message : "Could not read this image. Please try again." });
    }
  }
  function clear() {
    controller.current?.abort();
    release();
    dispatch({ type: "clear", request: ++request.current });
  }
  return { state, select, clear };
}
