import { readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { brandAssets, brandColors, contrastPairs, palette } from "@/lib/brand/tokens";

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("brand tokens", () => {
  it("keep the approved brand colours", () => {
    expect(brandColors).toEqual({ navy: "#102C46", orange: "#FF7916", white: "#FFFFFF", canvas: "#F5F7FA" });
  });

  it("are mirrored exactly in globals.css", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    for (const [name, value] of Object.entries(palette)) {
      expect(css, name).toMatch(new RegExp(`--color-${name}:\\s*${value};`, "i"));
    }
    expect(css).toContain('"Manrope Variable"');
  });

  it.each(contrastPairs)("meet WCAG contrast: $name", ({ fg, bg, min }) => {
    expect(contrast(palette[fg], palette[bg])).toBeGreaterThanOrEqual(min);
  });

  it("documents why orange buttons use navy text", () => {
    expect(contrast(brandColors.white, brandColors.orange)).toBeLessThan(4.5);
  });
});

describe("official brand assets", () => {
  // SHA-256 of the files supplied with the brief. A change here means the logo was edited.
  const approved: Record<string, string> = {
    "public/brand/wakati-horizontal.svg": "ac2fbde22e6b35830010f03cb7776dbceeee78e60d6e1ab2ea1e0de2710ed79f",
    "public/brand/wakati-symbol.svg": "2e93a71dd314406084d4c9ab2ab9c040465e40c71292c2e0f20cf6b5963817dc",
    "public/brand/wakati-app-icon-1024.png": "92c4e23a62261ea64387b3933cb078815aa86cbe3c73219ef4819619b4972357",
    "src/app/icon.svg": "2e93a71dd314406084d4c9ab2ab9c040465e40c71292c2e0f20cf6b5963817dc",
  };

  it.each(Object.entries(approved))("%s is the unmodified official file", (path, hash) => {
    expect(createHash("sha256").update(readFileSync(path)).digest("hex")).toBe(hash);
  });

  it("referenced asset slots exist", () => {
    for (const asset of [brandAssets.horizontal, brandAssets.symbol, brandAssets.appIcon]) {
      expect(statSync(`public${asset.src}`).size).toBeGreaterThan(0);
    }
    for (const size of [32, 48, 180, 192, 512]) {
      expect(statSync(`public/icons/wakati-icon-${size}.png`).size).toBeGreaterThan(0);
    }
    expect(statSync(`public${brandAssets.horizontalReverse.src}`).size).toBeGreaterThan(0);
    expect(statSync(`public${brandAssets.maskable.src}`).size).toBeGreaterThan(0);
  });
});

describe("derived brand assets", () => {
  const original = readFileSync("public/brand/wakati-horizontal.svg", "utf8");
  const reverse = readFileSync("public/brand/wakati-horizontal-reverse.svg", "utf8");

  it("reverse logo is the approved logo with only navy fills switched to white", () => {
    expect(reverse).toBe(original.replaceAll('fill="#102C46"', 'fill="#FFFFFF"'));
    expect(reverse).not.toContain("#102C46");
    expect(reverse.match(/#FF7916/g)?.length).toBe(original.match(/#FF7916/g)?.length);
    const paths = (svg: string) => [...svg.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]);
    expect(paths(reverse)).toEqual(paths(original));
  });

  it("maskable icon reuses the approved symbol paths verbatim", () => {
    const symbol = readFileSync("public/brand/wakati-symbol.svg", "utf8");
    const maskable = readFileSync("public/brand/wakati-maskable.svg", "utf8");
    for (const [, d] of symbol.matchAll(/ d="([^"]+)"/g)) expect(maskable).toContain(d);
  });

  it.each([192, 512, 1024])("maskable %ipx PNG is full-bleed with artwork inside the 80%% safe zone", async (size) => {
    const { data, info } = await sharp(`public/icons/wakati-maskable-${size}.png`)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect([info.width, info.height]).toEqual([size, size]);
    const navy = [0x10, 0x2c, 0x46];
    const safeRadius = 0.4 * size;
    let outside = 0;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        expect(data[i + 3]).toBe(255); // no transparency anywhere
        const isNavy = Math.abs(data[i] - navy[0]) + Math.abs(data[i + 1] - navy[1]) + Math.abs(data[i + 2] - navy[2]) < 12;
        if (!isNavy && Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2) > safeRadius) outside++;
      }
    }
    expect(outside).toBe(0);
  });
});
