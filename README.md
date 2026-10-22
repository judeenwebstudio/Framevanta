# Framevanta Creator Studio

Phase 3, Step 3: the responsive foundation plus local YouTube Thumbnail Preview and Reels / Shorts / TikTok Safe Zone Checker tools. The other three tools remain placeholders. No server uploads, downloads, authentication, database, payments, video transcoding, or domain configuration are implemented.

## Development

Use Node.js 20.9 or newer and npm.

```sh
npm ci
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

Run the production build before `npm start`. TypeScript may be run independently; Next.js generates route types during development/build.

## Structure

- `src/app`: App Router pages, global layout/styles, metadata, favicon, and not-found page.
- `src/app/tools/[slug]`: statically generated tool routes; mounts the thumbnail and safe-zone client workspaces for their slugs and preserves the other three unavailable states.
- `src/app/legal/[document]`: privacy, terms, and cookie draft structures, marked noindex.
- `src/components`: shared header/navigation, footer, links, icons, tool cards, and static homepage illustration.
- `src/lib/tools.ts`: typed, shared tool catalog.
- `src/components/thumbnail-preview.tsx` and its CSS module: local file controls, editable title/channel, responsive feed previews, independent appearance controls, A/B comparison, and lifecycle ownership.
- `src/lib/thumbnail-validation.ts`: configurable limits, content/header checks, decoded-dimension validation, and warning rules.
- `src/lib/thumbnail-browser.ts`: browser decode, bounded static raster generation, timeouts, cancellation, and resource cleanup.
- `src/lib/thumbnail-state.ts`: independently testable slot transitions that ignore stale responses and preserve valid images on failed replacement.
- `src/hooks/use-local-image.ts`: shared lifecycle owner for both tools, extracted from Thumbnail Preview without changing its limits or preview behavior. Reuses the existing validation, browser decoder, and slot reducer (legacy thumbnail filenames are retained for compatibility).
- `src/components/safe-zone-checker.tsx` and its CSS module: vertical frame, platform controls, overlay legend, upload states, pointer/keyboard guide controls, and numeric alternatives.
- `src/lib/safe-zone-presets.v1.ts`: all platform-specific illustrative geometry, version, accuracy label, and null review dates. See [preset documentation](docs/safe-zone-presets.md).
- `src/lib/safe-zone-state.ts`: vertical image profile, normalized guide geometry, region assessment, and reset/preset/overlay transitions.
- `tests/thumbnail.test.cjs`, `tests/safe-zone.test.cjs`, and `tsconfig.test.json`: dependency-free Node test runner with a separate TypeScript compilation directory (`.test-build`, ignored).

Routes: `/`, `/tools`, `/tools/youtube-thumbnail-preview`, `/tools/safe-zone-checker`, `/tools/instagram-carousel-splitter`, `/tools/social-media-image-resizer`, `/tools/publish-ready-export-pack`, `/pricing`, `/about`, `/contact`, `/legal/privacy`, `/legal/terms`, `/legal/cookies`.

The design uses #6D5EF5, warm neutral surfaces, native system fonts, inline SVG icons, and a CSS workspace illustration. No external image/font service is required. The illustration is labeled as a concept. Shared styles include keyboard focus, a skip link, mobile navigation, and reduced-motion support.

## Later work (outside this step)

Implement the remaining three tools only in separately scoped work. Any future measured safe-zone presets need a documented source, review method, scope, and actual review date. Finalize Pro entitlements, then scope accounts, storage, billing, saved comparisons, saved preferences, multi-platform comparisons, and comparison-sheet exports. Replace legal/contact placeholders with verified operator information and reviewed policies before launch. Confirm the brand and deployment origin before adding absolute canonical URLs, sitemap, and social preview URLs. No custom domain is purchased or configured by this project.

## Safe Zone Checker behavior and accuracy

Open `/tools/safe-zone-checker`. Choose or drop one JPEG, PNG, or WebP. The full image fits inside a 9:16 frame with `object-fit: contain`; landscape/square images are letterboxed, never stretched. Coordinates refer to the full frame, including that empty space. Originals are untouched. File processing, static raster generation, cancellation, stale-result protection, and URL cleanup reuse the thumbnail pipeline through `useLocalImage`. Failed replacement retains the previous valid image; Remove clears the image and error while retaining settings; Reset clears the image and restores the platform, opacity, overlay visibility, active guide, and both guide rectangles.

Switch freely between Instagram Reels, YouTube Shorts, and TikTok, one platform at a time without login. Geometry is versioned in `src/lib/safe-zone-presets.v1.ts` and documented in [docs/safe-zone-presets.md](docs/safe-zone-presets.md). Every mode is labeled **Unverified illustrative preset**, version **illustrative-v1.0.0**, **Last reviewed: Not reviewed** (`lastReviewed: null`). No official platform measurements, observed device measurements, or verification dates are claimed. These are hypothetical UI-region illustrations; actual placement varies and content visibility is never guaranteed.

The overlay uses green/dashed/text for candidate safe space, amber/dotted/text for caution, and red/hatched/solid/text for obstructions. Obstructions take precedence in guide assessment; all remaining space outside the candidate safe rectangle is caution. Fills have adjustable opacity (0–90%, default 45%); labels and boundaries remain readable. Show/hide removes the platform overlay as a whole while retaining guides and the explicitly illustrative assessment.

Text and logo guides move by dragging their body and resize from their bottom-right handle. Pointer capture tracks movement outside the handle. Pointer cancellation/Escape restores the drag origin. Arrow keys move/resize by 1 percentage point, Shift + arrows by 5. Numeric X/Y/width/height inputs supply an equivalent keyboard path and clamp to the frame, with a minimum size of 5% and 0.1% numeric precision. Guides persist when switching platforms and are independently positioned. No actual text/logo rendering, saved preferences, multi-platform side-by-side view, or export is implemented; those Pro references are clearly marked planned.

The vertical limits profile retains **10 MiB**, **8,192 px per side**, **24 MP**, and **15-second decode/encode timeout**. It suggests **1080 × 1920 / 9:16** with **2% relative ratio tolerance**, produces nonblocking resolution/ratio warnings, and caps the display raster's longest side at **1920 px**. Thumbnail Preview retains its original 1280 raster limit, 1280×720 recommendation, and 16:9 warnings.

## Step 3 verification — 22 October 2026

- `npm test`: **29 passed, 0 failed** (15 new safe-zone tests plus all 14 existing thumbnail tests). Covers content validation and pre-decode limits, vertical warnings and unchanged thumbnail defaults, preset labels/version/null dates, geometry bounds, preset switching, opacity/hide-show state, independent guides, normalized pointer/keyboard deltas, numeric clamping including 300 mixed operations, obstruction precedence/boundaries, complete settings reset, and image error recovery/stale results.
- `npm run lint`: passed with zero warnings, including a final run after supporting copy updates.
- `npm run typecheck`: passed, including a final run after supporting copy updates.
- `npm run build`: passed outside the sandbox so its CSS worker could run. All planned static routes generated.
- Production smoke checks: both working tool routes returned 200 with their controls; the remaining three routes retained their original processing placeholders. Safe-zone HTML contained the unverified label, version, and “Not reviewed” review status.
- In-app browser: switched all three platforms; adjusted opacity with the keyboard; hid/showed overlays while retaining opacity; moved and resized text guides with real pointer drags; exercised arrow and Shift + arrow controls; numeric positioning changed classification and clamped out-of-range values. Both text and logo guide controls were exercised.
- Browser file workflow: local 1080×1920 PNG loaded without warnings using a local blob and contain fit; corrupted PNG replacement produced an accessible error while preserving the valid image; valid landscape JPEG replacement cleared the error and showed both nonblocking warnings. Remove via Enter restored focus to Choose Image and retained guides; Reset via Enter restored all defaults and cleared the image.
- Responsive browser checks: viewport overrides 1440×1000 and 390×844 (content client widths 1425 and 375 after scrollbar), no horizontal document overflow. Controls/preview stack on mobile. Temporary viewport override was reset. Browser warning/error logs were empty. Screenshots: `.test-build/safe-zone-desktop.jpg` and `.test-build/safe-zone-mobile.jpg` (ignored local evidence).
- Thumbnail browser regression after hook extraction: PNG selection/preview still loaded, its success state appeared, and A/B toggle exposed the second slot; console warning/error log was empty. Its 14 existing automated tests also passed.
- Dependency audit rerun: production audit (`npm audit --omit=dev`) found zero vulnerabilities. Full audit still reports the five existing high-severity development lint-chain findings through `braces`; no new dependencies or lockfile changes were introduced. The incompatible Next lint-config downgrade remains unapplied.

### Step 3 limitations and remaining checks

Presets are deliberately unverified and cannot certify any content as visible on a platform. Only the available in-app browser was exercised. Physical file drag-and-drop, native mobile pickers/touch gestures, other engines, EXIF/color management, animation frame selection, screen-reader announcements, and pointer-cancel/Escape on real devices need broader manual checks. Guide rectangles can overlap each other; numeric controls remain available even when a guide is small or covered. No formal accessibility audit or performance benchmark was run.

Header/dimension checks and the bounded raster reduce allocation risk but do not replace patched browser decoders. Decoding a near-limit 24 MP original can still temporarily use roughly 96 MB of RGBA pixels before downsampling; test low-memory phones before launch. No server media handling or new network image APIs were added. Existing development-only audit findings remain a maintenance concern.

### Step 3 files changed

- Added: `src/hooks/use-local-image.ts`, `src/lib/safe-zone-presets.v1.ts`, `src/lib/safe-zone-state.ts`, `src/components/safe-zone-checker.tsx`, `src/components/safe-zone-checker.module.css`, `docs/safe-zone-presets.md`, `tests/safe-zone.test.cjs`.
- Updated: `src/components/thumbnail-preview.tsx` (shared hook only), `src/lib/thumbnail-validation.ts` (optional warning copy; default behavior unchanged), `src/app/tools/[slug]/page.tsx`, `src/lib/tools.ts`, `src/components/tool-card.tsx`, `src/app/page.tsx`, `src/app/tools/page.tsx`, `src/app/about/page.tsx`, `src/app/pricing/page.tsx`, `src/app/legal/[document]/page.tsx`, `src/app/layout.tsx`, `package.json` (test script), `tsconfig.test.json`, and this README. Supporting copy now reflects two local tools; the remaining tool page implementations and existing thumbnail preview CSS/tests are unchanged.

## Thumbnail Preview behavior and limits

Open `/tools/youtube-thumbnail-preview`. Choose or drop one JPEG, PNG, or WebP into each slot. Enable A/B to show slot B; hiding comparison retains B in tab memory until Remove, Reset, or unmount. Both variants share a video title and optional channel name. CSS clamps titles to two lines at the selected layout width. Appearance controls affect the preview surface independently of the site.

All core functionality is Free without login. Feed appearance and truncation are approximate and may vary from YouTube. No engagement statistics are invented. Saved comparisons and comparison-sheet exports are explicitly planned and unavailable.

Limits live in `THUMBNAIL_LIMITS` in `src/lib/thumbnail-validation.ts` and may also be injected into validation tests:

| Rule | Value | Behavior |
| --- | --- | --- |
| File size | 10 MiB (10,485,760 bytes), inclusive | Block empty or oversized files |
| Dimensions | 1–8,192 pixels per side, inclusive | Block invalid or oversized dimensions |
| Pixel count | 24,000,000, inclusive | Block excessive images before decoding |
| Recommended resolution | 1280 × 720 | Warn if either side is smaller; do not block |
| Recommended ratio | 16:9, 2% relative tolerance | Warn outside tolerance; center-crop preview |
| Display raster | Longest side at most 1280 pixels | Downsample only; leave originals unchanged |
| Decode/encode timeout | 15 seconds | Accessible error; preserve previous valid image |
| Editable text | Title: 200; channel: 100 characters | Tool input bounds, not claimed platform limits |

Extension and supplied MIME are not trusted. PNG, JPEG (including progressive), and WebP (VP8, VP8L, VP8X) signatures and dimensions are inspected before browser allocation. The browser must then decode the file successfully; decoded dimensions are checked again. A local canvas produces a bounded PNG without original metadata or animation. URLs are revoked on decode completion/failure/cancellation, replacement, removal, reset, and unmount. Timers, abort listeners, image handlers, and canvas buffers are cleared. Request identities prevent stale completions from overriding newer selections. No added dependencies, APIs, persistence, or image network requests are used.

## Step 2 verification — historical, 22 October 2026

- `npm run lint`: passed with zero warnings.
- `npm run typecheck`: passed.
- `npm run build`: passed outside the sandbox (required for this environment's CSS worker); all planned static routes generated.
- `npm test`: 14 tests passed. Covers signatures, MIME spoofing, malformed headers, file/dimension boundaries, soft warnings, pre-decode rejection, decoder failure, post-decode validation, cancellation, stale responses, replacement/reset/A-B state, and URL/image/canvas cleanup on success/error/abort/timeout. No testing dependencies were installed.
- Production server smoke check: thumbnail route returned 200 with the working controls; all four other tool routes returned 200 with their original processing placeholders.
- Browser testing in the in-app browser: real PNG, JPEG, and WebP selection/decoding; A/B comparison; shared title/channel; visible two-line truncation; independent dark/light and mobile/desktop controls; low-resolution and square-ratio warnings; corrupt-image error preserving the prior image; valid replacement clearing the error; keyboard Enter on Remove and Reset; focus restored to the chooser; reset cleared images, comparison, text changes, and appearance/layout selections.
- Browser layout checks at a 1440 × 1000 viewport override and a 390 × 844 mobile override (content client widths 1425 and 375 after scrollbar): no document horizontal overflow. Desktop comparison cards shared the same row; mobile cards stacked. Temporary viewport override was reset. Browser warning/error log was empty. Desktop screenshot: `.test-build/thumbnail-preview-desktop.jpg` (local, ignored).
- `npm audit --omit=dev`: zero vulnerabilities. `npm audit --json`: the same five high-severity development-only lint-chain findings through `braces` recorded in Step 1. npm still proposes an incompatible Next lint-config downgrade to 14.x; it was not applied.

### Known limitations and follow-up checks

Only the available in-app browser was exercised. Physical file drag-and-drop, native mobile file pickers, other browser engines, animated-image behavior, EXIF/color profiles, and screen-reader announcements still need manual cross-browser checks. Header parsers and resource limits reduce allocation risk but are not a replacement for patched browser image decoders. Full source decoding can still use substantial transient memory (up to roughly 96 MB of RGBA pixels per 24 MP image); test near-limit files on lower-memory phones. Output is a static preview frame, not an image editor or export. Ratio differences are centered crops with no repositioning controls. No formal accessibility audit or performance benchmark was run.

### Step 2 files changed

- Added: `src/components/thumbnail-preview.tsx`, `src/components/thumbnail-preview.module.css`, `src/lib/thumbnail-validation.ts`, `src/lib/thumbnail-browser.ts`, `src/lib/thumbnail-state.ts`, `tests/thumbnail.test.cjs`, `tsconfig.test.json`.
- Updated: `src/app/tools/[slug]/page.tsx`, `src/lib/tools.ts`, `src/components/tool-card.tsx`, `src/app/page.tsx`, `src/app/tools/page.tsx`, `src/app/about/page.tsx`, `src/app/pricing/page.tsx`, `src/app/legal/[document]/page.tsx`, `package.json`, `tsconfig.json`, `eslint.config.mjs`, `.gitignore`, and this README. Supporting copy changes describe the now-functional local tool and privacy behavior; the other tool page implementations are unchanged.
- `next dev` generated the root `AGENTS.md`; it contains Next.js's bundled agent guidance. `.next`, `.test-build`, and TypeScript build caches are generated/ignored. The lockfile and dependency declarations are unchanged.

## Step 1 verification — historical, 22 October 2026

- `npm install`: completed; lockfile created. Resolved Next.js 16.4.2.
- `npm run lint`: passed without warnings after fixing the PostCSS config export.
- `npm run typecheck`: passed, including a repeat after route type generation.
- `npm run build`: passed, generating all planned pages. The initial sandbox run failed to launch a Turbopack CSS worker; the same command passed outside the sandbox.
- `npm run start -- --hostname 127.0.0.1 --port 3001`: production server started. HTTP smoke checks returned 200 for all 13 content routes and 404 for an unknown tool route. Sandbox networking required running the server and requests outside the sandbox.
- `npm audit --omit=dev`: zero vulnerabilities. Full `npm audit --json`: five high-severity findings in the development-only ESLint dependency chain through `braces`. npm proposes downgrading the Next lint configuration to 14.x; that incompatible downgrade was not applied. Recheck upstream fixes before release.
- Browser visual testing and automated accessibility audits were not performed. Responsive breakpoints and accessibility basics are implemented, but require browser review before launch.
