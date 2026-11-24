#!/usr/bin/env node
/**
 * Derives brand variants from the APPROVED artwork in public/brand. Nothing is
 * redrawn: every path is copied verbatim; only fills and placement change.
 *
 *   node scripts/brand/generate-derived-assets.mjs
 *
 * Outputs
 *   public/brand/wakati-horizontal-reverse.svg   navy fills → white (for navy backgrounds)
 *   public/brand/wakati-maskable.svg              full-bleed navy square, symbol in the safe zone
 *   public/icons/wakati-maskable-{192,512,1024}.png
 *
 * Android maskable icons can be cropped to any shape inside the centre circle
 * whose diameter is 80% of the icon. The symbol is scaled so its bounding box
 * fits inside a circle of SAFE_RADIUS (< 40%) with margin.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "../..");
const read = (p) => readFileSync(resolve(root, p), "utf8");
const NAVY = "#102C46";
const WHITE = "#FFFFFF";
const SIZE = 1024;
const SAFE_RADIUS = 0.34 * SIZE; // inside the 0.40 safe circle, leaving breathing room

/** Exported so tests can verify the derivation is a pure colour swap. */
export function toReverse(svg) {
  return svg.replaceAll(`fill="${NAVY}"`, `fill="${WHITE}"`);
}

const horizontal = read("public/brand/wakati-horizontal.svg");
const reverse = toReverse(horizontal);
writeFileSync(resolve(root, "public/brand/wakati-horizontal-reverse.svg"), reverse);

// Symbol with the W in white, as on the approved app icon.
const symbol = read("public/brand/wakati-symbol.svg");
const inner = toReverse(symbol).replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

// Measure the symbol's real bounding box by rendering it and trimming.
const probeScale = 4;
const probe = await sharp(Buffer.from(toReverse(symbol)), { density: 72 * probeScale })
  .png()
  .toBuffer();
const { info } = await sharp(probe).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
const bbox = {
  x: -info.trimOffsetLeft / probeScale,
  y: -info.trimOffsetTop / probeScale,
  w: info.width / probeScale,
  h: info.height / probeScale,
};
const halfDiagonal = Math.hypot(bbox.w / 2, bbox.h / 2);
const scale = SAFE_RADIUS / halfDiagonal;
const tx = SIZE / 2 - (bbox.x + bbox.w / 2) * scale;
const ty = SIZE / 2 - (bbox.y + bbox.h / 2) * scale;

const maskable = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}"><rect width="${SIZE}" height="${SIZE}" fill="${NAVY}"/><g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})">${inner}</g></svg>\n`;
writeFileSync(resolve(root, "public/brand/wakati-maskable.svg"), maskable);

for (const size of [192, 512, 1024]) {
  await sharp(Buffer.from(maskable), { density: (72 * size) / SIZE })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(resolve(root, `public/icons/wakati-maskable-${size}.png`));
}

console.log(
  `Symbol bbox ${bbox.w.toFixed(1)}×${bbox.h.toFixed(1)} → scale ${scale.toFixed(3)}; ` +
    `content radius ${(halfDiagonal * scale).toFixed(0)}px of ${SIZE * 0.4}px safe radius.`,
);
