const { test } = require("node:test");
const assert = require("node:assert/strict");
const { SAFE_ZONE_PRESETS, PLATFORM_IDS } = require("../.test-build/safe-zone-presets.v1.js");
const { SAFE_ZONE_LIMITS, initialSafeZoneState, safeZoneReducer, updateGuide, transformGuide, guideZone } = require("../.test-build/safe-zone-state.js");
const { prepareThumbnail, validateDimensions, THUMBNAIL_LIMITS } = require("../.test-build/thumbnail-validation.js");
const { slotReducer, emptySlot } = require("../.test-build/thumbnail-state.js");

function png(width = 1080, height = 1920) {
  const bytes = Buffer.alloc(33);
  Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes);
  bytes.writeUInt32BE(13, 8); bytes.write("IHDR", 12); bytes.writeUInt32BE(width, 16); bytes.writeUInt32BE(height, 20);
  return bytes;
}
const insideFrame = r => r.x >= 0 && r.y >= 0 && r.width >= 5 && r.height >= 5 && r.x + r.width <= 100.00001 && r.y + r.height <= 100.00001;

test("presets are explicitly versioned, unverified, and never fabricate review dates", () => {
  assert.deepEqual(PLATFORM_IDS, ["reels", "shorts", "tiktok"]);
  for (const id of PLATFORM_IDS) {
    const preset = SAFE_ZONE_PRESETS[id];
    assert.equal(preset.id, id); assert.equal(preset.version, "illustrative-v1.0.0");
    assert.equal(preset.lastReviewed, null); assert.equal(preset.accuracy, "Unverified illustrative preset");
  }
});
test("all preset geometry is bounded and safe rectangles never intersect obstruction regions", () => {
  for (const preset of Object.values(SAFE_ZONE_PRESETS)) {
    assert.ok(insideFrame(preset.safe));
    for (const region of preset.obstructions) { assert.ok(insideFrame(region.rect)); assert.ok(region.label.length > 0); }
    assert.equal(guideZone(preset.safe, preset), "safe");
  }
});
test("platform switching updates geometry but preserves image-independent guide and overlay settings", () => {
  let state = initialSafeZoneState();
  state = safeZoneReducer(state, { type: "guide", guide: "text", field: "x", value: 20 });
  state = safeZoneReducer(state, { type: "opacity", value: 67 });
  const guides = state.guides;
  for (const platform of PLATFORM_IDS) {
    state = safeZoneReducer(state, { type: "platform", value: platform });
    assert.equal(state.platform, platform); assert.equal(state.guides, guides); assert.equal(state.opacity, 67);
  }
  assert.notDeepEqual(SAFE_ZONE_PRESETS.reels.safe, SAFE_ZONE_PRESETS.shorts.safe);
  assert.equal(safeZoneReducer(state, { type: "platform", value: "unknown" }), state);
});
test("hide/show retains opacity and guides; opacity clamps and rejects nonfinite values", () => {
  let state = safeZoneReducer(initialSafeZoneState(), { type: "opacity", value: 33 });
  state = safeZoneReducer(state, { type: "visibility", value: false });
  assert.equal(state.overlayVisible, false); assert.equal(state.opacity, 33);
  state = safeZoneReducer(state, { type: "visibility", value: true });
  assert.equal(state.opacity, 33);
  assert.equal(safeZoneReducer(state, { type: "opacity", value: 999 }).opacity, 90);
  assert.equal(safeZoneReducer(state, { type: "opacity", value: -10 }).opacity, 0);
  assert.equal(safeZoneReducer(state, { type: "opacity", value: NaN }), state);
});
test("numeric guide positioning clamps to available frame space", () => {
  const rect = { x: 10, y: 20, width: 50, height: 30 };
  assert.equal(updateGuide(rect, "x", 99).x, 50);
  assert.equal(updateGuide(rect, "y", -1).y, 0);
  assert.equal(updateGuide(rect, "width", 999).width, 90);
  assert.equal(updateGuide(rect, "height", -100).height, 5);
  assert.equal(updateGuide(rect, "x", NaN), rect);
  assert.equal(updateGuide(rect, "height", Infinity), rect);
  assert.equal(updateGuide(rect, "x", 22.24).x, 22.2);
});
test("pointer move and resize use normalized frame deltas without drifting from the drag origin", () => {
  const origin = { x: 10, y: 20, width: 50, height: 30 };
  assert.deepEqual(transformGuide(origin, "move", 5, -10), { x: 15, y: 10, width: 50, height: 30 });
  assert.deepEqual(transformGuide(origin, "resize", 10, 5), { x: 10, y: 20, width: 60, height: 35 });
  assert.deepEqual(transformGuide(origin, "move", 0, 0), origin);
  assert.ok(insideFrame(transformGuide(origin, "resize", 500, 500)));
  assert.ok(insideFrame(transformGuide(origin, "move", -500, 500)));
});
test("guide invariants survive mixed numeric and transform operations", () => {
  let rect = initialSafeZoneState().guides.text;
  const fields = ["x", "y", "width", "height"];
  for (let i = 0; i < 300; i++) {
    rect = updateGuide(rect, fields[i % 4], (i * 37) % 170 - 30);
    rect = transformGuide(rect, i % 2 ? "move" : "resize", i % 13 - 6, i % 17 - 8);
    assert.ok(insideFrame(rect), JSON.stringify(rect));
  }
});
test("active guide and updates are independent for text and logo", () => {
  let state = initialSafeZoneState(); const originalText = state.guides.text;
  state = safeZoneReducer(state, { type: "active", value: "logo" });
  state = safeZoneReducer(state, { type: "guide", guide: "logo", field: "width", value: 30 });
  assert.equal(state.activeGuide, "logo"); assert.equal(state.guides.logo.width, 30); assert.equal(state.guides.text, originalText);
});
test("keyboard-equivalent arrow deltas move by one or five percent and resize independently", () => {
  const initial = initialSafeZoneState();
  let state = safeZoneReducer(initial, { type: "transform", guide: "text", mode: "move", origin: initial.guides.text, dx: 1, dy: 0 });
  assert.equal(state.guides.text.x, 17);
  state = safeZoneReducer(state, { type: "transform", guide: "text", mode: "resize", origin: state.guides.text, dx: 5, dy: -1 });
  assert.equal(state.guides.text.width, 57); assert.equal(state.guides.text.height, 11); assert.equal(state.guides.text.x, 17);
});
test("guide assessment distinguishes safe, caution, and obstruction for every preset", () => {
  for (const preset of Object.values(SAFE_ZONE_PRESETS)) {
    assert.equal(guideZone({ x: 16, y: 28, width: 30, height: 10 }, preset), "safe");
    assert.equal(guideZone({ x: 0, y: 40, width: 5, height: 5 }, preset), "caution");
    assert.equal(guideZone({ x: 10, y: 90, width: 30, height: 5 }, preset), "obstruction");
  }
});
test("obstruction intersection takes precedence; touching only the boundary is caution", () => {
  const preset = SAFE_ZONE_PRESETS.reels;
  assert.equal(guideZone({ x: 10, y: 75, width: 30, height: 5 }, preset), "caution");
  assert.equal(guideZone({ x: 10, y: 75, width: 30, height: 5.1 }, preset), "obstruction");
  const spanning = { x: 16, y: 28, width: 80, height: 12 };
  assert.equal(guideZone(spanning, preset), "obstruction");
});
test("reset restores every setting with fresh, independent guide objects", () => {
  let state = initialSafeZoneState();
  state = safeZoneReducer(state, { type: "platform", value: "tiktok" });
  state = safeZoneReducer(state, { type: "visibility", value: false });
  state = safeZoneReducer(state, { type: "opacity", value: 90 });
  state = safeZoneReducer(state, { type: "active", value: "logo" });
  state = safeZoneReducer(state, { type: "guide", guide: "logo", field: "x", value: 80 });
  const reset = safeZoneReducer(state, { type: "reset" });
  assert.deepEqual(reset, initialSafeZoneState()); assert.notEqual(reset.guides, state.guides);
});
test("vertical profile warns rather than rejects landscape/small images without altering thumbnail defaults", () => {
  assert.deepEqual(validateDimensions({ width: 1080, height: 1920 }, SAFE_ZONE_LIMITS), []);
  const warnings = validateDimensions({ width: 640, height: 360 }, SAFE_ZONE_LIMITS);
  assert.equal(warnings.length, 2); assert.match(warnings[1], /9:16.*without stretching/);
  assert.equal(validateDimensions({ width: 2160, height: 3840 }, SAFE_ZONE_LIMITS).length, 0);
  assert.deepEqual(validateDimensions({ width: 1280, height: 720 }, THUMBNAIL_LIMITS), []);
  assert.equal(THUMBNAIL_LIMITS.targetRatio, 16 / 9);
});
test("safe-zone files use real content validation and pre-decode allocation limits", async () => {
  let calls = 0;
  const decode = async blob => { calls++; return { blob, width: 1080, height: 1920 }; };
  const prepared = await prepareThumbnail(new Blob([png()], { type: "text/plain" }), decode, SAFE_ZONE_LIMITS);
  assert.equal(prepared.mime, "image/png"); assert.deepEqual(prepared.warnings, []); assert.equal(calls, 1);
  for (const blob of [new Blob(["<svg/>"]), new Blob([png(9000, 100)]), new Blob([png(6000, 5000)]), new Blob()]) await assert.rejects(prepareThumbnail(blob, decode, SAFE_ZONE_LIMITS));
  await assert.rejects(prepareThumbnail(new Blob([png()]), decode, { ...SAFE_ZONE_LIMITS, maxBytes: 10 }));
  assert.equal(calls, 1);
});
test("corrupt image recovery preserves valid content; retry clears errors; remove/reset ignore late results", () => {
  const asset = { url: "blob:vertical", name: "vertical.png", width: 1080, height: 1920, warnings: [] };
  let image = slotReducer(emptySlot, { type: "start", request: 1 });
  image = slotReducer(image, { type: "success", request: 1, asset });
  image = slotReducer(image, { type: "start", request: 2 });
  image = slotReducer(image, { type: "error", request: 2, error: "corrupted" });
  assert.equal(image.asset, asset); assert.equal(image.loading, false);
  image = slotReducer(image, { type: "start", request: 3 }); assert.equal(image.error, undefined);
  image = slotReducer(image, { type: "clear", request: 4 });
  assert.equal(image.asset, undefined);
  assert.equal(slotReducer(image, { type: "success", request: 3, asset }), image);
});
