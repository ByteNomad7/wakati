import { describe, expect, it } from "vitest";
import en from "@/i18n/dictionaries/en";
import fr from "@/i18n/dictionaries/fr";
import { defaultLocale, isLocale } from "@/i18n/config";
import { formatPrice, interpolate } from "@/i18n/format";
import { negotiateLocale } from "@/i18n/negotiate";
import { localePath, routes, stripLocale, switchLocalePath } from "@/i18n/paths";

type Tree = { [k: string]: unknown };

function shape(value: unknown, path = ""): string[] {
  if (Array.isArray(value)) return [`${path}[${value.length}]`, ...value.flatMap((v, i) => shape(v, `${path}[${i}]`))];
  if (value && typeof value === "object")
    return Object.keys(value as Tree)
      .sort()
      .flatMap((k) => shape((value as Tree)[k], path ? `${path}.${k}` : k));
  return [path];
}

function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
}

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("dictionaries", () => {
  it("have identical structure in English and French (including list lengths)", () => {
    expect(shape(fr)).toEqual(shape(en));
  });

  it("contain no empty strings", () => {
    for (const s of [...strings(en), ...strings(fr)]) expect(s.trim()).not.toBe("");
  });

  it("use the same interpolation placeholders in both languages", () => {
    const enStrings = strings(en);
    const frStrings = strings(fr);
    enStrings.forEach((s, i) => expect(placeholders(frStrings[i]), s).toEqual(placeholders(s)));
  });

  it("keep the hero copy from the brief", () => {
    expect(en.hero.title).toBe("Find what you need. Sell what you don't.");
    expect(en.meta.tagline).toBe("Buy • Sell • Find Locally");
  });
});

describe("formatting", () => {
  it("formats FCFA prices per locale", () => {
    expect(formatPrice(250000, "en")).toBe("250,000 FCFA");
    expect(formatPrice(250000, "fr")).toBe("250 000 FCFA");
    expect(formatPrice(0, "en")).toBe("0 FCFA");
  });

  it("interpolates named values and leaves unknown ones", () => {
    expect(interpolate("{a} and {b}", { a: 1 })).toBe("1 and {b}");
  });
});

describe("locale routing", () => {
  it("validates locales", () => {
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("prefers an explicit cookie, then Accept-Language, then the default", () => {
    expect(negotiateLocale("fr-FR,fr;q=0.9", "en")).toBe("en");
    expect(negotiateLocale("fr-CM,fr;q=0.9,en;q=0.5", undefined)).toBe("fr");
    expect(negotiateLocale("de-DE", undefined)).toBe(defaultLocale);
    expect(negotiateLocale(null, "xx")).toBe(defaultLocale);
    expect(negotiateLocale("***invalid***", undefined)).toBe(defaultLocale);
  });

  it("builds and switches locale-prefixed paths", () => {
    expect(localePath("fr")).toBe("/fr");
    expect(localePath("en", routes.category("cars"))).toBe("/en/c/cars");
    expect(switchLocalePath("/en/c/cars", "fr")).toBe("/fr/c/cars");
    expect(switchLocalePath("/en", "fr")).toBe("/fr");
    expect(switchLocalePath("/search", "fr")).toBe("/fr/search");
    expect(stripLocale("/fr/search")).toBe("/search");
    expect(stripLocale("/fr")).toBe("/");
  });
});
