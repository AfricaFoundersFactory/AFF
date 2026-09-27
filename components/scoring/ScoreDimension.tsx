"use client";

import { Reveal } from "@/components/ui/Reveal";

export function ScoreDimension({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="flex items-center gap-4 sm:gap-5">
      <div className="w-[140px] flex-shrink-0 text-[12.5px] font-semibold tracking-[0.03em] text-aff-text sm:w-[220px] sm:text-[13.5px]">
        {label}
      </div>
      <Reveal className="relative h-1 flex-1 overflow-hidden rounded-full bg-aff-line-strong/40">
        {(visible) => (
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-aff-accent transition-[width] duration-[1200ms] ease-out"
            style={{ width: visible ? `${pct}%` : "0%" }}
          />
        )}
      </Reveal>
    </div>
  );
}
