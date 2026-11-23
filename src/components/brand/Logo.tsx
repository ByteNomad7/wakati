import Image from "next/image";
import { brandAssets } from "@/lib/brand/tokens";

/**
 * Renders the OFFICIAL Wakati artwork from /public/brand. Do not replace these
 * files with redrawn versions; swap in updated official exports with the same names.
 */
export function LogoHorizontal({ className, priority }: { className?: string; priority?: boolean }) {
  const { src, width, height } = brandAssets.horizontal;
  return (
    <Image src={src} width={width} height={height} alt="Wakati" priority={priority} unoptimized className={className} />
  );
}

/** Light-on-dark lockup for navy surfaces (footer, dark sections). */
export function LogoHorizontalReverse({ className }: { className?: string }) {
  const { src, width, height } = brandAssets.horizontalReverse;
  return <Image src={src} width={width} height={height} alt="Wakati" unoptimized className={className} />;
}

export function LogoSymbol({ className, alt = "" }: { className?: string; alt?: string }) {
  const { src, width, height } = brandAssets.symbol;
  return <Image src={src} width={width} height={height} alt={alt} unoptimized className={className} />;
}

/** Rounded app icon (official PNG), e.g. for install prompts. */
export function AppIcon({ className, alt = "Wakati" }: { className?: string; alt?: string }) {
  return <Image src="/icons/wakati-icon-192.png" width={192} height={192} alt={alt} className={className} />;
}
