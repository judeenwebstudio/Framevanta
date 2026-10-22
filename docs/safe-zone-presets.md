# Safe-zone presets: illustrative v1

Configuration: `src/lib/safe-zone-presets.v1.ts`. All platform-specific geometry lives there. Units are percentages of the full 9:16 preview frame, measured from its top-left corner, including any letterboxing. They are not source-image pixel coordinates.

These are **Unverified illustrative presets**. Geometry is an intentionally simplified product illustration, not an official measurement, empirical capture, recommended platform specification, or guarantee of visibility. No platform documentation or device measurement is asserted as a source. Labels describe hypothetical areas occupied by top UI, caption/navigation, and action controls.

Each preset exposes `version: illustrative-v1.0.0`, `lastReviewed: null`, and an explicit accuracy label. The UI displays “Last reviewed: Not reviewed”; null must not be replaced with a guessed or build-generated date. Version identifiers describe configuration revisions, not platform app versions.

- **Safe:** green tint with a dashed boundary and a “✓ Safe*” label. This only means inside the illustration's candidate central rectangle.
- **Caution:** amber dotted space outside that rectangle, with a “! Caution” label. This is the default for any space not marked safe or obstructed.
- **Obstruction:** red diagonal hatching, solid boundary, “×” symbol and textual UI-area labels. Any positive-area guide overlap takes precedence over the other classifications. Touching a boundary without crossing it is not counted as an overlap.

Safe regions are wholly inside the frame and do not overlap obstruction regions. The rest of the frame is caution; no unstated safe-area measurements are inferred. Slider opacity affects fills only; text, patterns/boundaries, and the legend preserve non-color distinctions. Hiding the overlay hides its fills, labels, patterns and boundaries together; guide controls and the explicitly illustrative position assessment remain available.

Actual UI varies by app/platform version, device, locale, caption length, content/ad placement, accessibility settings, and expanded controls. Check the final content in the target app. This is a static image planning aid, not video emulation or a platform compliance checker.

To revise: increment the configuration version when geometry changes, describe the change and its source/assumptions here, and run preset bounds, overlap, switching, and classification tests. Only enter a review date after a real documented review with a stated method and scope. An actual date alone does not make a preset official or universal. Existing v1 geometry should remain traceable when future versions are introduced.
