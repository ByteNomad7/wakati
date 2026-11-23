"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";

export interface MobileMenuLink {
  href: string;
  label: string;
  icon?: ReactNode;
}

/**
 * Off-canvas menu for small screens. Lightweight: no animation library, closes on
 * Escape, on backdrop tap and on navigation, and returns focus to the trigger.
 */
export function MobileMenu({
  openLabel,
  closeLabel,
  title,
  sections,
  footer,
}: {
  openLabel: string;
  closeLabel: string;
  title: string;
  sections: { heading: string; links: MobileMenuLink[] }[];
  footer?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  // The header uses backdrop-filter, which traps position:fixed children, so the
  // drawer is rendered into <body> once mounted on the client.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Close when the route changes (adjusting state during render, per React guidance).
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(true)}
        className="inline-flex size-11 items-center justify-center rounded-[var(--radius-control)] text-navy-900 hover:bg-navy-50"
      >
        <Menu aria-hidden="true" className="size-6" />
        <span className="sr-only">{openLabel}</span>
      </button>

      {mounted ? createPortal(
      <div
        id={panelId}
        hidden={!open}
        className="fixed inset-0 z-50"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="absolute inset-0 bg-navy-950/50" onClick={() => setOpen(false)} aria-hidden="true" />
        <div className="absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col bg-white shadow-[var(--shadow-raised)]">
          <div className="flex items-center justify-between border-b border-navy-100 px-4 py-3">
            <p className="text-base font-extrabold text-navy-900">{title}</p>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex size-11 items-center justify-center rounded-[var(--radius-control)] hover:bg-navy-50"
            >
              <X aria-hidden="true" className="size-6" />
              <span className="sr-only">{closeLabel}</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-3">
            {sections.map((section) => (
              <div key={section.heading} className="mb-4">
                <p className="px-3 pb-1 text-xs font-bold uppercase tracking-wider text-navy-500">{section.heading}</p>
                <ul>
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="flex min-h-12 items-center gap-3 rounded-[var(--radius-control)] px-3 text-[15px] font-semibold text-navy-900 hover:bg-navy-50"
                      >
                        {link.icon}
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {footer ? <div className="border-t border-navy-100 p-4">{footer}</div> : null}
        </div>
      </div>,
      document.body,
      ) : null}
    </>
  );
}
