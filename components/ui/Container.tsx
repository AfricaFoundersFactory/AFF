import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Container({
  children,
  className,
  narrow,
}: {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-6 sm:px-10 lg:px-[120px]",
        narrow ? "max-w-4xl" : "max-w-[1440px]",
        className,
      )}
    >
      {children}
    </div>
  );
}
