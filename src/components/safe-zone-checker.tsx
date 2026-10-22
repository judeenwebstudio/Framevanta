"use client";

import { useReducer, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { useLocalImage } from "@/hooks/use-local-image";
import { PLATFORM_IDS, SAFE_ZONE_PRESETS, type Rect } from "@/lib/safe-zone-presets.v1";
import { guideZone, initialSafeZoneState, safeZoneReducer, SAFE_ZONE_LIMITS, MIN_GUIDE_SIZE, type GuideId } from "@/lib/safe-zone-state";
import styles from "./safe-zone-checker.module.css";

const GUIDE_IDS: GuideId[] = ["text", "logo"];
const guideName = (id: GuideId) => id === "text" ? "Text" : "Logo";
const rectStyle = (rect: Rect): CSSProperties => ({ left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.width}%`, height: `${rect.height}%` });
const zoneDescriptions = {
  safe: "Inside illustrative safe region; visibility is not guaranteed.",
  caution: "Caution: outside illustrative safe region.",
  obstruction: "Intersects an illustrative UI obstruction.",
};
type Drag = { pointerId: number; guide: GuideId; mode: "move" | "resize"; x: number; y: number; width: number; height: number; origin: Rect };

export function SafeZoneChecker() {
  const image = useLocalImage(SAFE_ZONE_LIMITS);
  const [state, dispatch] = useReducer(safeZoneReducer, undefined, initialSafeZoneState);
  const [draggingFile, setDraggingFile] = useState(false);
  const [notice, setNotice] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const chooseButton = useRef<HTMLButtonElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const preset = SAFE_ZONE_PRESETS[state.platform];
  const active = state.guides[state.activeGuide];
  const { asset, loading, error } = image.state;

  function startDrag(event: PointerEvent<HTMLButtonElement>, guide: GuideId, mode: Drag["mode"]) {
    if (event.button !== 0 || !event.isPrimary) return;
    const bounds = frame.current?.getBoundingClientRect();
    if (!bounds?.width || !bounds.height) return;
    dispatch({ type: "active", value: guide });
    drag.current = { guide, mode, origin: { ...state.guides[guide] }, pointerId: event.pointerId, x: event.clientX, y: event.clientY, width: bounds.width, height: bounds.height };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    dispatch({ type: "transform", guide: current.guide, origin: current.origin, mode: current.mode, dx: (event.clientX - current.x) / current.width * 100, dy: (event.clientY - current.y) / current.height * 100 });
  }
  function finishDrag(event: PointerEvent<HTMLButtonElement>, cancel = false) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (cancel) dispatch({ type: "transform", guide: current.guide, origin: current.origin, mode: current.mode, dx: 0, dy: 0 });
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function guideKey(event: KeyboardEvent<HTMLButtonElement>, guide: GuideId, mode: Drag["mode"]) {
    if (event.key === "Escape" && drag.current) {
      const current = drag.current;
      dispatch({ type: "transform", guide: current.guide, origin: current.origin, mode: current.mode, dx: 0, dy: 0 });
      drag.current = null;
      if (event.currentTarget.hasPointerCapture(current.pointerId)) event.currentTarget.releasePointerCapture(current.pointerId);
      return;
    }
    const directions: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    const step = event.shiftKey ? 5 : 1;
    dispatch({ type: "active", value: guide });
    dispatch({ type: "transform", guide, origin: state.guides[guide], mode, dx: direction[0] * step, dy: direction[1] * step });
  }
  function reset() {
    drag.current = null;
    image.clear();
    dispatch({ type: "reset" });
    setNotice("Reset complete. Image removed; platform, overlays, and both guides restored to defaults.");
  }

  return <div className={styles.tool}>
    <div className={styles.intro}><span className="pill"><span/> FREE · ONE PLATFORM AT A TIME</span><p>Plan around the interface. Your image is processed in this tab and is never uploaded or saved.</p></div>
    <p className={styles.accuracy}><strong>Unverified illustrative presets.</strong> These overlays are design illustrations, not official platform measurements. UI placement varies by app version, device, and content placement. Check your final post in the target app.</p>
    <div className={styles.workspace}>
      <aside className={styles.controls} aria-label="Safe zone controls">
        <h2>Your canvas</h2>
        <div className={`${styles.dropzone} ${draggingFile ? styles.dragging : ""}`}
          onDragOver={event => { event.preventDefault(); setDraggingFile(true); }}
          onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDraggingFile(false); }}
          onDrop={event => { event.preventDefault(); setDraggingFile(false); setNotice(""); void image.select(Array.from(event.dataTransfer.files)); }}>
          <span aria-hidden="true" className={styles.uploadIcon}>↥</span><p>Drop one image here</p>
          <button ref={chooseButton} type="button" className="button button-secondary" aria-describedby={`safe-upload-help${error ? " safe-upload-error" : ""}`} onClick={() => fileInput.current?.click()}>{asset ? "Replace Image" : "Choose Image"}</button>
          <input ref={fileInput} className={styles.fileInput} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose safe zone image" tabIndex={-1} onChange={event => {
            const files = Array.from(event.currentTarget.files ?? []); event.currentTarget.value = "";
            if (files.length) { setNotice(""); void image.select(files); }
          }}/>
          <p id="safe-upload-help" className={styles.help}>JPEG, PNG, WebP · Up to {SAFE_ZONE_LIMITS.maxBytes / 1024 / 1024} MiB</p>
        </div>
        <p className={styles.status} role="status" aria-atomic="true">{loading ? "Checking and preparing image locally…" : asset && !error ? `Image ready.${asset.warnings.length ? ` ${asset.warnings.length} warnings below.` : ""}` : !error ? "No image selected. Explore the illustrative overlays or choose an image." : ""}</p>
        {error && <p id="safe-upload-error" className={styles.error} role="alert">{error}{asset ? " Your previous image is still shown." : ""}</p>}
        {asset && <div className={styles.fileInfo}><p className={styles.filename}>{asset.name}</p><p>{asset.width} × {asset.height} px · {(asset.width / asset.height).toFixed(2)}:1</p>{asset.warnings.length > 0 && <ul aria-label="Image warnings" className={styles.warnings}>{asset.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul>}</div>}
        {(asset || error || loading) && <button className={styles.textButton} type="button" onClick={() => { image.clear(); setNotice("Image removed. Overlay and guide settings are unchanged."); chooseButton.current?.focus(); }}>Remove Image</button>}

        <fieldset className={styles.platforms}><legend>Platform</legend>{PLATFORM_IDS.map(id => <label key={id}><input type="radio" name="safe-platform" value={id} checked={state.platform === id} onChange={() => { dispatch({ type: "platform", value: id }); setNotice(""); }}/>{SAFE_ZONE_PRESETS[id].name}</label>)}</fieldset>
        <div className={styles.overlayControls}><label className={styles.checkLabel}><input type="checkbox" checked={state.overlayVisible} onChange={event => dispatch({ type: "visibility", value: event.target.checked })}/> Show platform overlay</label><label htmlFor="overlay-opacity">Overlay fill opacity <output htmlFor="overlay-opacity">{state.opacity}%</output></label><input id="overlay-opacity" type="range" min={0} max={90} step={1} value={state.opacity} disabled={!state.overlayVisible} aria-describedby="opacity-help" onChange={event => dispatch({ type: "opacity", value: Number(event.target.value) })}/><p id="opacity-help" className={styles.help}>Fills fade; labels and boundaries stay readable. Guides are separate from the platform overlay.</p></div>

        <fieldset className={styles.guideSelect}><legend>Edit a guide</legend>{GUIDE_IDS.map(id => <label key={id}><input type="radio" name="active-guide" value={id} checked={state.activeGuide === id} onChange={() => dispatch({ type: "active", value: id })}/>{guideName(id)} guide</label>)}</fieldset>
        <div className={styles.numericGrid}>{(["x", "y", "width", "height"] as const).map(field => <div key={field}><label htmlFor={`guide-${field}`}>{field === "x" ? "Left (X)" : field === "y" ? "Top (Y)" : field === "width" ? "Width" : "Height"} %</label><input id={`guide-${field}`} type="number" inputMode="decimal" min={field === "width" || field === "height" ? MIN_GUIDE_SIZE : 0} max={field === "x" ? 100 - active.width : field === "y" ? 100 - active.height : field === "width" ? 100 - active.x : 100 - active.y} step={0.1} value={active[field]} aria-label={`${guideName(state.activeGuide)} guide ${field} percent`} aria-describedby="guide-help" onChange={event => dispatch({ type: "guide", guide: state.activeGuide, field, value: event.currentTarget.valueAsNumber })}/></div>)}</div>
        <p id="guide-help" className={styles.help}>Coordinates are percentages of the full frame, including empty space. Guides stay within the frame; minimum size is 5%. Use these fields instead of dragging.</p>
        <button type="button" className="button button-secondary" onClick={reset}>Reset all</button><p role="status" className={styles.status}>{notice}</p>
      </aside>

      <section className={styles.previewPanel} aria-labelledby="safe-preview-heading">
        <span className="eyebrow">A LITTLE ROOM FOR YOUR MESSAGE</span><h2 id="safe-preview-heading">{preset.name} · 9:16 preview</h2>
        <div className={styles.presetInfo}><strong>{preset.accuracy}</strong><span>Preset version: {preset.version}</span><span>Last reviewed: {preset.lastReviewed ?? "Not reviewed"}</span></div>
        <div className={styles.legend} aria-label="Overlay legend"><span className={styles.safeKey}>✓ Safe* · dashed</span><span className={styles.cautionKey}>! Caution · dotted</span><span className={styles.obstructionKey}>× Obstruction · hatched</span></div>
        <div className={styles.stage}><div ref={frame} className={styles.frame} aria-label={`${preset.name} illustrative safe zone canvas`} style={{ "--overlay-opacity": state.opacity / 100 } as CSSProperties}>
          {asset ? <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.sourceImage} src={asset.url} width={asset.width} height={asset.height} alt={`Local preview: ${asset.name}`} draggable={false}/>
          </> : <div className={styles.empty}><span aria-hidden="true">▧</span><p>{loading ? "Preparing your image…" : "Choose an image to preview"}</p><p>Full image fits here without stretching.</p></div>}
          {state.overlayVisible && <div className={styles.overlay} aria-hidden="true">
            <div className={styles.cautionRegion}><div className={styles.cautionFill}/><span className={styles.cautionLabel}>! Caution</span></div>
            <div className={styles.safeRegion} style={rectStyle(preset.safe)}><div className={styles.safeFill}/><span>✓ Safe*</span></div>
            {preset.obstructions.map(region => <div key={region.label} className={styles.obstructionRegion} style={rectStyle(region.rect)}><div className={styles.obstructionFill}/><span>× {region.label}</span></div>)}
          </div>}
          {GUIDE_IDS.map(id => <div key={id} className={styles.guide} data-guide={id} data-active={state.activeGuide === id} style={rectStyle(state.guides[id])}>
            <button type="button" className={styles.moveGuide} aria-label={`Move ${guideName(id).toLowerCase()} guide`} aria-describedby="pointer-help" aria-pressed={state.activeGuide === id} onClick={() => dispatch({ type: "active", value: id })} onPointerDown={event => startDrag(event, id, "move")} onPointerMove={moveDrag} onPointerUp={event => finishDrag(event)} onPointerCancel={event => finishDrag(event, true)} onLostPointerCapture={() => { drag.current = null; }} onKeyDown={event => guideKey(event, id, "move")}><span>{guideName(id)} guide</span></button>
            <button type="button" className={styles.resizeGuide} aria-label={`Resize ${guideName(id).toLowerCase()} guide`} aria-describedby="pointer-help" onClick={() => dispatch({ type: "active", value: id })} onPointerDown={event => startDrag(event, id, "resize")} onPointerMove={moveDrag} onPointerUp={event => finishDrag(event)} onPointerCancel={event => finishDrag(event, true)} onLostPointerCapture={() => { drag.current = null; }} onKeyDown={event => guideKey(event, id, "resize")}><span aria-hidden="true">↘</span></button>
          </div>)}
        </div></div>
        <p id="pointer-help" className={styles.help}>Drag a guide to move it, or its ↘ handle to resize. Keyboard: focus a guide or handle, use arrow keys (1%), Shift + arrows (5%). Escape cancels an active pointer drag. Numeric fields provide the same controls.</p>
        <div className={styles.assessment} role="status" aria-atomic="true"><strong>{preset.name} · illustrative guide assessment</strong>{GUIDE_IDS.map(id => <p key={id}><b>{guideName(id)}:</b> {zoneDescriptions[guideZone(state.guides[id], preset)]}</p>)}</div>
        <p className={styles.help}>* “Safe” only means inside this illustration’s candidate central region. It is not a guarantee. The rest of the frame is caution unless marked as a UI obstruction. The image uses a contain fit; any letterboxing is intentional.</p>
      </section>
    </div>
    <div className={styles.notes}><h2>One platform, one clear view.</h2><p>All three platform modes are free without login. Multi-platform side-by-side comparison and saved preferences are planned Creator Pro features and are not available. Nothing is stored between visits.</p><p>Images only: JPEG, PNG, WebP. Up to 10 MiB, {SAFE_ZONE_LIMITS.maxDimension.toLocaleString("en-US")} px per side, and {SAFE_ZONE_LIMITS.maxPixels / 1_000_000} megapixels. Suggested canvas: 1080 × 1920, with nonblocking warnings for other sizes/ratios. Animated images become a single static frame. This tool does not process or transcode video, edit your original, or export a file.</p></div>
  </div>;
}
