# Wakati brand assets

These are the **official** files supplied with the Phase 1 brief. Do not redraw, trace,
recolour or "clean up" them. To update the logo, replace a file with a new official
export under the **same name** and update the SHA-256 in `tests/brand-tokens.test.ts`
(that test fails if a file changes, so edits are always deliberate).

| File | Use | Status |
| --- | --- | --- |
| `wakati-horizontal.svg` | Header lockup on light backgrounds | Supplied |
| `wakati-symbol.svg` | Favicon (`src/app/icon.svg` is a byte-identical copy) | Supplied |
| `wakati-app-icon-1024.png` | App/PWA icon master | Supplied |
| `wakati-horizontal-reverse.svg` | Lockup for navy backgrounds (footer, hero) | **Needed** – slot in `brandAssets.horizontalReverse` |
| `wakati-app-icon-maskable-1024.png` | Android adaptive/maskable icon with safe zone | **Needed** |
| App store icon sets (iOS/Android) | Future native apps | **Needed** |

Derived files (resampled from `wakati-app-icon-1024.png`, no redrawing):
`/public/icons/wakati-icon-{32,48,180,192,512}.png`, `src/app/apple-icon.png`,
`src/app/favicon.ico`.

Note: the supplied app icon shows a white "W" on navy, while the symbol SVG uses a
navy "W". Both are used exactly as supplied; please confirm this is intended.

## Colours

| Token | Hex | Notes |
| --- | --- | --- |
| Deep navy | `#102C46` | Text, navigation, dark surfaces |
| Vibrant orange | `#FF7916` | Calls to action, accents |
| White | `#FFFFFF` | Content surfaces |
| Light background | `#F5F7FA` | Page canvas |

Accessibility: white text on orange is only ~2.8:1, so orange buttons use **navy** text
(5.4:1). Orange text on white uses the darker `orange-700` (`#B54D00`).
Typeface: Manrope (self-hosted via `@fontsource-variable/manrope`, no Google Fonts call).
