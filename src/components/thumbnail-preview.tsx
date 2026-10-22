"use client";

import { useRef, useState } from "react";
import { THUMBNAIL_LIMITS } from "@/lib/thumbnail-validation";
import { type SlotState } from "@/lib/thumbnail-state";
import { useLocalImage as useThumbnailSlot } from "@/hooks/use-local-image";
import styles from "./thumbnail-preview.module.css";

const DEFAULT_TITLE = "Your next great video starts with a great thumbnail";

function ImageControl({ label, slot }: { label: string; slot: ReturnType<typeof useThumbnailSlot> }) {
  const input = useRef<HTMLInputElement>(null);
  const chooseButton = useRef<HTMLButtonElement>(null);
  const [dragging, setDragging] = useState(false);
  const id = `thumbnail-${label}`;
  const { asset, loading, error } = slot.state;
  return <section className={styles.uploadSection} aria-labelledby={`${id}-label`}>
    <h3 id={`${id}-label`}>Thumbnail {label}</h3>
    <div className={`${styles.dropzone} ${dragging ? styles.dragging : ""}`}
      onDragOver={event => { event.preventDefault(); setDragging(true); }}
      onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
      onDrop={event => { event.preventDefault(); setDragging(false); void slot.select(Array.from(event.dataTransfer.files)); }}>
      <span aria-hidden="true" className={styles.uploadIcon}>↥</span>
      <p>{asset ? "Drop a replacement image here" : "Drop an image here"}</p>
      <button ref={chooseButton} type="button" className="button button-secondary" onClick={() => input.current?.click()} aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`}>{asset ? `Replace Image ${label}` : `Choose Image ${label}`}</button>
      <input ref={input} id={id} type="file" accept="image/jpeg,image/png,image/webp" className={styles.fileInput} tabIndex={-1} aria-label={`Choose thumbnail ${label}`} onChange={event => {
        const files = Array.from(event.target.files ?? []);
        event.target.value = "";
        if (files.length) void slot.select(files);
      }}/>
      <p id={`${id}-help`} className={styles.help}>JPEG, PNG, WebP · Up to {THUMBNAIL_LIMITS.maxBytes / 1024 / 1024} MiB</p>
    </div>
    <div role="status" aria-live="polite" aria-atomic="true" className={styles.status}>
      {loading ? "Checking and preparing image locally…" : asset && !error ? `Thumbnail ${label} ready.${asset.warnings.length ? ` ${asset.warnings.length} image warnings are listed below.` : ""}` : !error ? `Thumbnail ${label} is empty.` : ""}
    </div>
    {error && <p id={`${id}-error`} role="alert" className={styles.error}>{error}{asset && " Your previous image is still shown."}</p>}
    {asset && <div className={styles.imageInfo}><p className={styles.filename}>{asset.name}</p><p>{asset.width} × {asset.height} px · {(asset.width / asset.height).toFixed(2)}:1</p>{asset.warnings.length > 0 && <ul aria-label={`Thumbnail ${label} warnings`} className={styles.warnings}>{asset.warnings.map(w => <li key={w}>{w}</li>)}</ul>}</div>}
    {(asset || loading || error) && <button type="button" className={styles.textButton} onClick={() => { slot.clear(); chooseButton.current?.focus(); }}>Remove Image {label}</button>}
  </section>;
}

function PreviewCard({ label, state, title, channel }: { label: string; state: SlotState; title: string; channel: string }) {
  return <article className={styles.previewCard} aria-label={`Thumbnail ${label} preview`}>
    <span className={styles.variant}>THUMBNAIL {label}</span>
    <div className={styles.thumbnail}>
      {/* The source is an owned local blob, never a remote URL. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {state.asset ? <img src={state.asset.url} alt={`Uploaded thumbnail ${label}: ${state.asset.name}`} width={state.asset.width} height={state.asset.height}/> : <div className={styles.emptyPreview}><span aria-hidden="true">▧</span><p>{state.loading ? "Preparing your thumbnail…" : `Choose image ${label} to see your preview`}</p></div>}
    </div>
    <div className={styles.videoDetails}><span className={styles.channelAvatar} aria-hidden="true">{channel.trim().slice(0, 1).toUpperCase() || "C"}</span><div className={styles.videoText}><h3 className={styles.videoTitle} title={title.trim() || "Untitled video"}>{title.trim() || "Untitled video"}</h3>{channel.trim() && <p className={styles.channelName}>{channel.trim()}</p>}</div><span aria-hidden="true">⋮</span></div>
  </article>;
}

export function ThumbnailPreview() {
  const a = useThumbnailSlot();
  const b = useThumbnailSlot();
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [channel, setChannel] = useState("");
  const [layout, setLayout] = useState("desktop");
  const [theme, setTheme] = useState("light");
  const [compare, setCompare] = useState(false);
  const [resetStatus, setResetStatus] = useState("");
  return <div className={styles.tool}>
    <div className={styles.intro}><span className="pill"><span/> FREE · NO LOGIN NEEDED</span><p>Your files stay in this browser tab. Nothing is uploaded or saved. Refreshing or leaving this page clears your work.</p></div>
    <div className={styles.workspace}>
      <aside className={styles.controls} aria-label="Thumbnail controls">
        <h2>Make it yours</h2>
        <ImageControl label="A" slot={a}/>
        <label className={styles.compareSwitch}><input type="checkbox" checked={compare} onChange={e => setCompare(e.target.checked)}/> Compare two thumbnails (A/B)</label>
        {compare && <ImageControl label="B" slot={b}/>}
        {!compare && b.state.asset && <p className={styles.help}>Image B is kept in this tab while comparison is hidden. Reset clears both images.</p>}
        <div className={styles.field}><label htmlFor="video-title">Video title</label><textarea id="video-title" maxLength={200} rows={3} value={title} onChange={e => setTitle(e.target.value)} aria-describedby="title-help"/><p id="title-help" className={styles.help}>Up to 200 characters for testing. Previews clamp long titles; this is not a platform title limit.</p></div>
        <div className={styles.field}><label htmlFor="channel-name">Channel name <span>(optional)</span></label><input id="channel-name" maxLength={100} value={channel} onChange={e => setChannel(e.target.value)} placeholder="Your channel name"/></div>
        <button type="button" className="button button-secondary" onClick={() => { a.clear(); b.clear(); setTitle(DEFAULT_TITLE); setChannel(""); setLayout("desktop"); setTheme("light"); setCompare(false); setResetStatus("Reset complete. Both images and all settings have been cleared."); }}>Reset all</button>
        <p className={styles.help} role="status">{resetStatus}</p>
      </aside>
      <section className={styles.previewPanel} aria-labelledby="preview-heading">
        <div className={styles.previewHeading}><div><span className="eyebrow">A FRESH PERSPECTIVE</span><h2 id="preview-heading">Your thumbnail, in context.</h2></div></div>
        <div className={styles.options}>
          <fieldset><legend>Preview layout</legend>{["desktop", "mobile"].map(value => <label key={value}><input type="radio" name="preview-layout" value={value} checked={layout === value} onChange={() => setLayout(value)}/>{value === "desktop" ? "Desktop" : "Mobile"}</label>)}</fieldset>
          <fieldset><legend>Preview appearance</legend>{["light", "dark"].map(value => <label key={value}><input type="radio" name="preview-theme" value={value} checked={theme === value} onChange={() => setTheme(value)}/>{value === "light" ? "Light" : "Dark"}</label>)}</fieldset>
        </div>
        <div className={styles.previewSurface} data-theme={theme} data-layout={layout} data-compare={compare}>
          <div className={styles.simulatedHeader}><span><span aria-hidden="true">▶</span> Video feed</span><span>Approximate {layout} preview</span></div>
          <div className={styles.previewGrid}><PreviewCard label="A" state={a.state} title={title} channel={channel}/>{compare && <PreviewCard label="B" state={b.state} title={title} channel={channel}/>}</div>
        </div>
        <p className={styles.disclaimer}>An approximate YouTube-style preview, not an exact reproduction or an affiliation with YouTube. Platform appearance, cropping, and title truncation may vary by device and interface. Both variants use the same title and channel for a fair visual comparison.</p>
      </section>
    </div>
    <div className={styles.notes}><h2>A few useful details</h2><p>Recommended canvas: 1280 × 720 (16:9). Other ratios remain usable and are center-cropped in the preview. Hard safety limits: {THUMBNAIL_LIMITS.maxDimension.toLocaleString("en-US")} px per side and {THUMBNAIL_LIMITS.maxPixels / 1_000_000} megapixels. These are this tool’s limits, not YouTube upload requirements.</p><p>Core previews and A/B comparison are free. Saved comparisons and comparison-sheet exports are planned and unavailable. Animated files are shown as a single static frame. Originals are not modified.</p></div>
  </div>;
}
