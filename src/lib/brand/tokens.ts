/**
 * Wakati brand tokens.
 *
 * The four core colours come from the approved brand sheet and must not be
 * changed without brand approval. Supporting tints/shades are derived for UI
 * states (hover, borders, text accents) and are mirrored as CSS custom
 * properties in `src/app/globals.css` (a unit test keeps the two in sync).
 */
export const brandColors = {
  navy: "#102C46",
  orange: "#FF7916",
  white: "#FFFFFF",
  canvas: "#F5F7FA",
} as const;

/** Derived UI palette. Keys map 1:1 to `--color-*` variables in globals.css. */
export const palette = {
  "navy-950": "#0A1E31",
  "navy-900": brandColors.navy,
  "navy-800": "#1B3B5A",
  "navy-700": "#2C5073",
  "navy-500": "#5B7590",
  "navy-300": "#A9B8C8",
  "navy-100": "#E2E8EF",
  "navy-50": "#EEF2F6",
  "orange-500": brandColors.orange,
  "orange-600": "#EC6A0A",
  /** Orange that passes WCAG AA (4.5:1) as text on white. */
  "orange-700": "#B54D00",
  "orange-100": "#FFE4CC",
  "orange-50": "#FFF4EA",
  canvas: brandColors.canvas,
  surface: brandColors.white,
} as const;

export type PaletteToken = keyof typeof palette;

/**
 * Accessibility rules encoded as pairs that are verified by tests.
 * - Orange buttons use navy text (white on #FF7916 is only ~2.8:1).
 * - Orange text on white uses `orange-700`.
 */
export const contrastPairs: ReadonlyArray<{
  name: string;
  fg: PaletteToken;
  bg: PaletteToken;
  min: number;
}> = [
  { name: "body text on canvas", fg: "navy-900", bg: "canvas", min: 4.5 },
  { name: "muted text on white", fg: "navy-500", bg: "surface", min: 4.5 },
  { name: "white text on navy", fg: "surface", bg: "navy-900", min: 4.5 },
  { name: "navy text on orange CTA", fg: "navy-900", bg: "orange-500", min: 4.5 },
  { name: "orange accent text on white", fg: "orange-700", bg: "surface", min: 4.5 },
  { name: "orange on navy (large/decorative)", fg: "orange-500", bg: "navy-900", min: 3 },
];

/** Official brand asset slots. Files live in /public/brand and must not be redrawn. */
export const brandAssets = {
  horizontal: { src: "/brand/wakati-horizontal.svg", width: 1150, height: 330 },
  symbol: { src: "/brand/wakati-symbol.svg", width: 400, height: 320 },
  appIcon: { src: "/brand/wakati-app-icon-1024.png", width: 1024, height: 1024 },
  /**
   * Light-on-dark lockup for navy backgrounds. Derived from the approved horizontal
   * logo by scripts/brand/generate-derived-assets.mjs (navy fills → white only).
   */
  horizontalReverse: { src: "/brand/wakati-horizontal-reverse.svg", width: 1150, height: 330 },
  /** Android maskable icon master (full-bleed navy, symbol inside the safe zone). */
  maskable: { src: "/brand/wakati-maskable.svg", width: 1024, height: 1024 },
} as const;
