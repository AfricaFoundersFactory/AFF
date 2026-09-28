"use client";

import { Link } from "@/i18n/navigation";
import { DimensionStatusLabel, ScoreDelta } from "./shared";
import type { DimensionResult } from "@/types/readiness-engine";

export function DimensionCard({
  result,
  label,
  statusLabel,
  confidenceLabel,
  strengthsLabel,
  gapsLabel,
  notApplicableLabel,
}: {
  result: DimensionResult;
  label: string;
  statusLabel: string;
  confidenceLabel: string;
  strengthsLabel: string;
  gapsLabel: string;
  notApplicableLabel: string;
}) {
  const delta =
    result.score != null && result.previousScore != null ? result.score - result.previousScore : null;

  return (
    <Link
      href={`/dashboard/readiness/${result.dimension}`}
      className="flex flex-col gap-3 rounded-xl border border-aff-line bg-aff-bg p-4 no-underline transition-colors hover:border-aff-line-strong"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13.5px] font-semibold text-aff-text">{label}</span>
        {result.score != null ? (
          <span className="font-heading text-xl font-semibold text-aff-text">{result.score}</span>
        ) : (
          <span className="text-[12px] text-aff-muted">{notApplicableLabel}</span>
        )}
      </div>

      {result.score != null ? (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-aff-line/50">
          <div className="h-full rounded-full bg-aff-accent" style={{ width: `${Math.min(100, Math.max(0, result.score))}%` }} />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-aff-muted">
        <DimensionStatusLabel status={result.status} label={statusLabel} />
        {delta !== null ? <ScoreDelta delta={delta} /> : null}
        <span>{confidenceLabel} {result.confidence}%</span>
      </div>

      <div className="flex items-center gap-3 text-[12px] text-aff-muted">
        <span>✓ {strengthsLabel} {result.strengths.length}</span>
        <span>⚠ {gapsLabel} {result.gaps.length}</span>
      </div>
    </Link>
  );
}
