"use client";

import { Reveal } from "@/components/ui/Reveal";
import type { AssessmentPoint } from "@/types/scoring";

export function ProgressChart({ points }: { points: AssessmentPoint[] }) {
  const max = Math.max(...points.map((p) => p.value), 1);

  return (
    <div className="flex flex-1 items-end gap-6 sm:gap-9" style={{ height: 220 }}>
      {points.map((point) => (
        <Reveal key={point.label} className="flex flex-1 flex-col items-center gap-3">
          {(visible) => (
            <>
              <div className="font-heading text-sm font-bold text-aff-text sm:text-base">
                {point.value}
              </div>
              <div
                className="w-9 rounded-t-md transition-[height] duration-[1000ms] ease-out sm:w-11"
                style={{
                  height: visible ? `${(point.value / max) * 160}px` : "0px",
                  background: "linear-gradient(180deg, var(--aff-accent), rgba(23,201,154,0.35))",
                }}
              />
              <div className="text-center text-[10px] font-semibold tracking-[0.06em] text-aff-muted sm:text-[11px]">
                {point.label}
              </div>
            </>
          )}
        </Reveal>
      ))}
    </div>
  );
}
