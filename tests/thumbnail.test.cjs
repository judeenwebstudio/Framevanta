const { test } = require("node:test");
const assert = require("node:assert/strict");
const { inspectImage, validateFileSize, validateDimensions, prepareThumbnail, THUMBNAIL_LIMITS: limits } = require("../.test-build/thumbnail-validation.js");
const { slotReducer, emptySlot } = require("../.test-build/thumbnail-state.js");
const { decodeThumbnail } = require("../.test-build/thumbnail-browser.js");

function png(width = 1280, height = 720) {
  const bytes = Buffer.alloc(33);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes);
  bytes.writeUInt32BE(13, 8); bytes.write("IHDR", 12);
  bytes.writeUInt32BE(width, 16); bytes.writeUInt32BE(height, 20);
  return bytes;
}
function jpeg(marker) {
  const b = Buffer.from([255, 216, 255, 224, 0, 4, 0, 0, 255, marker, 0, 8, 8, 2, 208, 5, 0, 0]);
  return b;
}
function webp(tag) {
  const b = Buffer.alloc(30); b.write("RIFF"); b.writeUInt32LE(22, 4); b.write("WEBP", 8); b.write(tag, 12); b.writeUInt32LE(10, 16);
  return b;
}

test("content sniffing accepts PNG and both baseline/progressive JPEG regardless of claimed MIME", async () => {
  assert.deepEqual(inspectImage(png()), { mime: "image/png", width: 1280, height: 720 });
  for (const marker of [192, 194]) assert.deepEqual(inspectImage(jpeg(marker)), { mime: "image/jpeg", width: 1280, height: 720 });
  let detected;
  await prepareThumbnail(new Blob([png()], { type: "image/svg+xml" }), async (blob, mime) => {
    detected = [blob.type, mime]; return { blob, width: 1280, height: 720 };
  });
  assert.deepEqual(detected, ["image/png", "image/png"]);
});
test("supports VP8X, VP8, and VP8L WebP dimension headers", () => {
  const extended = webp("VP8X"); extended.writeUIntLE(1279, 24, 3); extended.writeUIntLE(719, 27, 3);
  assert.deepEqual(inspectImage(extended), { mime: "image/webp", width: 1280, height: 720 });
  const lossy = webp("VP8 "); lossy.set([157, 1, 42], 23); lossy.writeUInt16LE(1280, 26); lossy.writeUInt16LE(720, 28);
  assert.equal(inspectImage(lossy).width, 1280); assert.equal(inspectImage(lossy).height, 720);
  const lossless = webp("VP8L"); lossless[20] = 47; const bits = 1279 | (719 << 14); lossless.writeUInt32LE(bits, 21);
  assert.equal(inspectImage(lossless).width, 1280); assert.equal(inspectImage(lossless).height, 720);
});
test("rejects SVG, GIF, renamed text, empty/truncated headers, and malformed JPEG lengths", () => {
  for (const data of [Buffer.from("<svg/>"), Buffer.from("GIF89a"), Buffer.from("not an image"), Buffer.alloc(0), png().subarray(0, 20), Buffer.from([255,216,255,224,0,0,0,0,0,0,0,0])]) assert.throws(() => inspectImage(data), /supported image|corrupted/);
});
test("uses a buffer view's byte offset correctly", () => {
  const padded = Buffer.concat([Buffer.alloc(7), png()]);
  assert.equal(inspectImage(padded.subarray(7)).width, 1280);
});
test("file size boundaries reject empty, nonfinite and oversized input", () => {
  for (const size of [0, -1, NaN, Infinity, limits.maxBytes + 1]) assert.throws(() => validateFileSize(size));
  assert.doesNotThrow(() => validateFileSize(limits.maxBytes));
  assert.throws(() => validateFileSize(11, { ...limits, maxBytes: 10 }));
});
test("hard dimensions reject zero, invalid, excessive sides and excessive pixel count", () => {
  for (const pair of [[0, 720], [1280, -1], [1.5, 720], [8193, 100], [6000, 5000], [NaN, 2]]) assert.throws(() => validateDimensions({ width: pair[0], height: pair[1] }));
  assert.doesNotThrow(() => validateDimensions({ width: 6000, height: 4000 }));
  assert.doesNotThrow(() => validateDimensions({ width: 8192, height: 1 }));
});
test("resolution and ratio warnings never block otherwise valid images", () => {
  assert.deepEqual(validateDimensions({ width: 1280, height: 720 }), []);
  assert.equal(validateDimensions({ width: 640, height: 360 }).length, 1);
  assert.equal(validateDimensions({ width: 1000, height: 1000 }).length, 2);
  assert.equal(validateDimensions({ width: 1920, height: 1080 }).length, 0);
  assert.equal(validateDimensions({ width: 1280, height: 721 }).length, 0);
});
test("preflight blocks oversized/unsupported images before decoder allocation", async () => {
  let calls = 0;
  const decode = async () => { calls++; throw new Error("not called"); };
  await assert.rejects(prepareThumbnail(new Blob([png(9000, 720)]), decode), /dimensions/);
  await assert.rejects(prepareThumbnail(new Blob(["<svg/>"]), decode), /supported/);
  await assert.rejects(prepareThumbnail(new Blob([png()]), decode, { ...limits, maxBytes: 5 }), /limit/);
  assert.equal(calls, 0);
});
test("header-only/corrupt images must pass real decoding, and decoded dimensions are revalidated", async () => {
  await assert.rejects(prepareThumbnail(new Blob([png()]), async () => { throw new Error("Corrupted decoder input"); }), /Corrupted/);
  await assert.rejects(prepareThumbnail(new Blob([png()]), async blob => ({ blob, width: 9000, height: 720 })), /dimensions/);
  const result = await prepareThumbnail(new Blob([png()]), async blob => ({ blob, width: 640, height: 480 }));
  assert.equal(result.width, 640); assert.equal(result.warnings.length, 2);
});
test("cancellation prevents decoding after a pending file read", async () => {
  const controller = new AbortController();
  let calls = 0;
  const pending = prepareThumbnail(new Blob([png()]), async blob => { calls++; return { blob, width: 1280, height: 720 }; }, limits, controller.signal);
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" }); assert.equal(calls, 0);
});

const asset = { url: "blob:a", name: "a.png", width: 1280, height: 720, warnings: [] };
test("failed replacement preserves the last valid image; a new attempt clears the error", () => {
  let state = slotReducer(emptySlot, { type: "start", request: 1 });
  state = slotReducer(state, { type: "success", request: 1, asset });
  state = slotReducer(state, { type: "start", request: 2 });
  assert.equal(state.asset, asset); assert.equal(state.loading, true);
  state = slotReducer(state, { type: "error", request: 2, error: "bad image" });
  assert.equal(state.asset, asset); assert.equal(state.error, "bad image");
  state = slotReducer(state, { type: "start", request: 3 }); assert.equal(state.error, undefined);
});
test("stale success/error cannot overwrite replacement or reset", () => {
  const state = slotReducer(emptySlot, { type: "start", request: 2 });
  assert.equal(slotReducer(state, { type: "success", request: 1, asset }), state);
  assert.equal(slotReducer(state, { type: "error", request: 1, error: "stale" }), state);
  const reset = slotReducer(state, { type: "clear", request: 3 });
  assert.deepEqual(reset, { request: 3, loading: false });
  assert.equal(slotReducer(reset, { type: "success", request: 2, asset }), reset);
});
test("A/B state is independent and clear removes image, errors and loading", () => {
  const a = slotReducer(slotReducer(emptySlot, { type: "start", request: 1 }), { type: "success", request: 1, asset });
  const b = slotReducer(emptySlot, { type: "start", request: 1 });
  assert.equal(a.asset, asset); assert.equal(b.asset, undefined);
  assert.deepEqual(slotReducer(a, { type: "clear", request: 2 }), { request: 2, loading: false });
});

// Minimal browser resource doubles exercise cleanup/error/timeout paths without
// a DOM library. Real browser decoding and rendering are checked separately.
test("browser decoder cleans up URLs and image handlers on success, error, abort and timeout", async t => {
  const images = []; const revoked = []; const canvases = [];
  const previousImage = globalThis.Image; const previousDocument = globalThis.document;
  t.after(() => {
    if (previousImage === undefined) delete globalThis.Image; else globalThis.Image = previousImage;
    if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
  });
  t.mock.method(URL, "createObjectURL", () => `blob:test-${images.length}`);
  t.mock.method(URL, "revokeObjectURL", url => revoked.push(url));
  globalThis.Image = class {
    naturalWidth = 1280; naturalHeight = 720; src = ""; onload = null; onerror = null;
    constructor() { images.push(this); }
  };
  globalThis.document = { createElement: () => {
    const canvas = { width: 0, height: 0, getContext: () => ({ drawImage() {} }), toBlob: callback => callback(new Blob(["raster"])) };
    canvases.push(canvas); return canvas;
  } };
  const success = decodeThumbnail(new Blob(), "image/png", limits); images.at(-1).onload();
  assert.equal((await success).width, 1280); assert.equal(canvases[0].width, 0);
  const fail = decodeThumbnail(new Blob(), "image/png", limits); images.at(-1).onerror(); await assert.rejects(fail, /decode/);
  const controller = new AbortController();
  const abort = decodeThumbnail(new Blob(), "image/png", limits, controller.signal); controller.abort(); await assert.rejects(abort, { name: "AbortError" });
  await assert.rejects(decodeThumbnail(new Blob(), "image/png", { ...limits, decodeTimeoutMs: 1 }), /too long/);
  assert.equal(revoked.length, 4);
  for (const image of images) { assert.equal(image.src, ""); assert.equal(image.onload, null); assert.equal(image.onerror, null); }
});
