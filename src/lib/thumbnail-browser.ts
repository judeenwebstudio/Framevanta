import { validateDimensions, type ImageDecoder } from "./thumbnail-validation";

// Re-encode a bounded, static raster for display. No original metadata or animation
// is retained. All object URLs and decode resources have one explicit owner.
export const decodeThumbnail: ImageDecoder = (blob, _mime, limits, signal) => new Promise((resolve, reject) => {
  signal?.throwIfAborted();
  const image = new Image();
  const url = URL.createObjectURL(blob);
  let settled = false;
  let canvas: HTMLCanvasElement | undefined;
  const finish = (error?: Error, result?: { blob: Blob; width: number; height: number }) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
    if (canvas) canvas.width = canvas.height = 0;
    image.onload = null;
    image.onerror = null;
    image.src = "";
    URL.revokeObjectURL(url);
    if (error) reject(error);
    else if (result) resolve(result);
  };
  const timer = setTimeout(() => finish(new Error("Image decoding took too long. Try a smaller or re-exported image.")), limits.decodeTimeoutMs);
  const abort = () => finish(new DOMException("Image selection cancelled.", "AbortError"));
  signal?.addEventListener("abort", abort, { once: true });
  image.onerror = () => finish(new Error("The browser could not decode this image. It may be corrupted or unsupported; try re-exporting as JPEG or PNG."));
  image.onload = () => {
    const surface = document.createElement("canvas");
    canvas = surface;
    try {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      validateDimensions({ width, height }, limits);
      const scale = Math.min(1, limits.previewMaxDimension / Math.max(width, height));
      surface.width = Math.max(1, Math.round(width * scale));
      surface.height = Math.max(1, Math.round(height * scale));
      const context = surface.getContext("2d");
      if (!context) throw new Error("Image preview is unavailable in this browser.");
      context.drawImage(image, 0, 0, surface.width, surface.height);
      surface.toBlob(result => {
        surface.width = surface.height = 0;
        if (!result) finish(new Error("Could not prepare this image. Try a different file."));
        else finish(undefined, { blob: result, width, height });
      }, "image/png");
    } catch (error) {
      surface.width = surface.height = 0;
      finish(error instanceof Error ? error : new Error("Could not prepare this image."));
    }
  };
  image.src = url;
});
