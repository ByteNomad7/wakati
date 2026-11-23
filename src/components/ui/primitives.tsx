import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

type ButtonVariant = "primary" | "dark" | "secondary" | "ghost" | "onDark";
type ButtonSize = "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  // Navy text on orange meets WCAG AA (white on orange does not).
  primary: "bg-orange-500 text-navy-900 hover:bg-orange-600 shadow-sm",
  dark: "bg-navy-900 text-white hover:bg-navy-800 shadow-sm",
  secondary: "bg-white text-navy-900 ring-1 ring-inset ring-navy-100 hover:bg-navy-50",
  ghost: "text-navy-900 hover:bg-navy-50",
  onDark: "bg-white/10 text-white ring-1 ring-inset ring-white/25 hover:bg-white/15",
};

const sizes: Record<ButtonSize, string> = {
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-6 text-base",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cx(
    "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-bold transition-colors",
    variants[variant],
    sizes[size],
    className,
  );
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}

export function SectionHeading({
  id,
  title,
  lead,
  action,
}: {
  id: string;
  title: string;
  lead?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id={id} className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-[1.75rem]">
          {title}
        </h2>
        {lead ? <p className="mt-1 text-navy-500">{lead}</p> : null}
      </div>
      {action}
    </div>
  );
}
