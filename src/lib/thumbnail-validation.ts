export const THUMBNAIL_LIMITS = {
  maxBytes: 10 * 1024 * 1024,
  maxDimension: 8192,
  maxPixels: 24_000_000,
  recommendedWidth: 1280,
  recommendedHeight: 720,
  targetRatio: 16 / 9,
  ratioTolerance: 0.02,
  previewMaxDimension: 1280,
  decodeTimeoutMs: 15_000,
} as const;

export type ImageLimits = { [K in keyof typeof THUMBNAIL_LIMITS]: number } & {
  warningCopy?: { resolution: string; ratio: string };
};
export type ImageInfo = { width: number; height: number; mime: "image/png" | "image/jpeg" | "image/webp" };
const invalid = () => new Error("This file is not a supported image or is corrupted. Choose a JPEG, PNG, or WebP image.");

// Read dimensions before decoding to reject obviously excessive allocations.
// Headers alone are never treated as proof that an image can be decoded.
export function inspectImage(bytes: Uint8Array): ImageInfo {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (start: number, length: number) => String.fromCharCode(...bytes.subarray(start, start + length));
  if (bytes.length >= 24 && bytes.slice(0, 8).every((b, i) => b === [137, 80, 78, 71, 13, 10, 26, 10][i]) && ascii(12, 4) === "IHDR" && view.getUint32(8) === 13) {
    return { mime: "image/png", width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (bytes.length >= 12 && bytes[0] === 255 && bytes[1] === 216) {
    let offset = 2;
    while (offset + 4 <= bytes.length) {
      if (bytes[offset++] !== 255) throw invalid();
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 218 || marker === 217) break;
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
      if (offset + 2 > bytes.length) break;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) throw invalid();
      if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker) && length >= 8) {
        return { mime: "image/jpeg", height: view.getUint16(offset + 3), width: view.getUint16(offset + 5) };
      }
      offset += length;
    }
  }
  if (bytes.length >= 30 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP" && view.getUint32(4, true) + 8 === bytes.length) {
    const tag = ascii(12, 4);
    const u24 = (i: number) => bytes[i] + (bytes[i + 1] << 8) + (bytes[i + 2] << 16);
    if (tag === "VP8X" && view.getUint32(16, true) === 10) return { mime: "image/webp", width: u24(24) + 1, height: u24(27) + 1 };
    if (tag === "VP8 " && bytes[23] === 157 && bytes[24] === 1 && bytes[25] === 42) return { mime: "image/webp", width: view.getUint16(26, true) & 0x3fff, height: view.getUint16(28, true) & 0x3fff };
    if (tag === "VP8L" && bytes[20] === 47) return { mime: "image/webp", width: 1 + bytes[21] + ((bytes[22] & 63) << 8), height: 1 + (bytes[22] >> 6) + (bytes[23] << 2) + ((bytes[24] & 15) << 10) };
  }
  throw invalid();
}

export function validateFileSize(size: number, limits: ImageLimits = THUMBNAIL_LIMITS) {
  if (!Number.isFinite(size) || size <= 0) throw new Error("This file is empty. Choose an image with content.");
  if (size > limits.maxBytes) throw new Error(`Image exceeds the ${limits.maxBytes / 1024 / 1024} MiB limit. Choose a smaller file.`);
}

export function validateDimensions(info: Pick<ImageInfo, "width" | "height">, limits: ImageLimits = THUMBNAIL_LIMITS): string[] {
  const { width, height } = info;
  if (![width, height].every(n => Number.isSafeInteger(n) && n > 0)) throw invalid();
  if (width > limits.maxDimension || height > limits.maxDimension || width * height > limits.maxPixels) {
    throw new Error(`Image dimensions exceed the limit of ${limits.maxDimension.toLocaleString("en-US")} px per side or ${limits.maxPixels / 1_000_000} megapixels.`);
  }
  const warnings: string[] = [];
  if (width < limits.recommendedWidth || height < limits.recommendedHeight) warnings.push(limits.warningCopy?.resolution ?? `Below the recommended ${limits.recommendedWidth} × ${limits.recommendedHeight} resolution; the thumbnail may look soft.`);
  if (Math.abs(width / height / limits.targetRatio - 1) > limits.ratioTolerance) warnings.push(limits.warningCopy?.ratio ?? "This image is not approximately 16:9. The preview uses a centered crop; edges may be hidden.");
  return warnings;
}

export type PreparedImage = ImageInfo & { blob: Blob; warnings: string[] };
export type ImageDecoder = (blob: Blob, mime: ImageInfo["mime"], limits: ImageLimits, signal?: AbortSignal) => Promise<{ blob: Blob; width: number; height: number }>;

export async function prepareThumbnail(file: Blob, decode: ImageDecoder, limits: ImageLimits = THUMBNAIL_LIMITS, signal?: AbortSignal): Promise<PreparedImage> {
  signal?.throwIfAborted();
  validateFileSize(file.size, limits);
  const bytes = new Uint8Array(await file.arrayBuffer());
  signal?.throwIfAborted();
  const info = inspectImage(bytes);
  validateDimensions(info, limits);
  // Ignore extension and caller-supplied MIME; only an allowlisted detected type reaches the decoder.
  const decoded = await decode(new Blob([bytes], { type: info.mime }), info.mime, limits, signal);
  signal?.throwIfAborted();
  const warnings = validateDimensions(decoded, limits);
  return { ...info, width: decoded.width, height: decoded.height, blob: decoded.blob, warnings };
}
