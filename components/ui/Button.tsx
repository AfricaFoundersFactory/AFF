import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variantClasses: Record<Variant, string> = {
  // Deep emerald (not the flat --aff-accent) so white text keeps AA contrast.
  primary: "bg-aff-cta-bg text-aff-text hover:bg-aff-cta-bg-hover",
  secondary:
    "bg-transparent text-aff-text border border-aff-line hover:border-aff-accent hover:text-aff-accent",
  ghost: "bg-transparent text-aff-muted hover:text-aff-text",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-lg font-body text-[14.5px] font-semibold transition-colors px-6 py-3.5 disabled:opacity-45 disabled:pointer-events-none";

export function buttonClasses({
  variant = "primary",
  block,
  className,
}: {
  variant?: Variant;
  block?: boolean;
  className?: string;
}) {
  return cn(baseClasses, variantClasses[variant], block && "w-full", className);
}

export function Button({
  variant = "primary",
  block,
  className,
  children,
  ...rest
}: {
  variant?: Variant;
  block?: boolean;
  className?: string;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={buttonClasses({ variant, block, className })} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  block,
  external,
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  block?: boolean;
  external?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const classes = buttonClasses({ variant, block, className });

  if (external) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
