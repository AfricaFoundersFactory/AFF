"use client";

import { cn } from "@/lib/utils";
import type { DimensionStatus, CriterionStatus } from "@/types/readiness-engine";

const DIMENSION_STATUS_CLASSES: Record<DimensionStatus, string> = {
  strong: "text-aff-accent",
  good: "text-aff-cyan",
  developing: "text-amber-400",
  weak: "text-red-400",
  not_applicable: "text-aff-muted",
};

const CRITERION_STATUS_CLASSES: Record<CriterionStatus, string> = {
  strong: "border-aff-accent/40 text-aff-accent",
  good: "border-aff-cyan/40 text-aff-cyan",
  developing: "border-amber-400/40 text-amber-400",
  weak: "border-red-400/40 text-red-400",
  insufficient_evidence: "border-aff-line-strong text-aff-muted",
  not_applicable: "border-aff-line text-aff-muted",
};

export function DimensionStatusLabel({ status, label }: { status: DimensionStatus; label: string }) {
  return <span className={cn("text-[12.5px] font-semibold", DIMENSION_STATUS_CLASSES[status])}>{label}</span>;
}

export function CriterionStatusBadge({ status, label }: { status: CriterionStatus; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11.5px] font-semibold",
        CRITERION_STATUS_CLASSES[status],
      )}
    >
      {label}
    </span>
  );
}

export function ScoreDelta({ delta }: { delta: number }) {
  if (delta === 0) return null;
  return (
    <span className={cn("text-[12.5px] font-semibold", delta > 0 ? "text-aff-accent" : "text-red-400")}>
      {delta > 0 ? "+" : ""}
      {delta}
    </span>
  );
}
