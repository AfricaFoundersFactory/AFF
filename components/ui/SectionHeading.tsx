import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  children,
  body,
  align = "center",
  size = "md",
  className,
}: {
  eyebrow?: ReactNode;
  children: ReactNode;
  body?: ReactNode;
  align?: "center" | "left";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "text-2xl sm:text-[30px]",
    md: "text-[27px] sm:text-[38px]",
    lg: "text-[34px] sm:text-[42px] lg:text-[44px]",
  }[size];

  return (
    <div
      className={cn(
        "mb-11 sm:mb-16",
        align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl text-left",
        className,
      )}
    >
      {eyebrow}
      <h2
        className={cn(
          "font-heading font-semibold leading-[1.25] tracking-[-0.01em] text-aff-text",
          sizeClasses,
        )}
      >
        {children}
      </h2>
      {body ? (
        <p className="mt-5 text-[15px] leading-relaxed text-aff-muted sm:text-lg sm:leading-[1.65]">
          {body}
        </p>
      ) : null}
    </div>
  );
}
