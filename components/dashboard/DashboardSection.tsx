import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function DashboardSection({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-aff-line bg-aff-bg2 p-5 sm:p-6", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-heading text-[13px] font-semibold tracking-[0.08em] text-aff-muted">
          {title.toUpperCase()}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
