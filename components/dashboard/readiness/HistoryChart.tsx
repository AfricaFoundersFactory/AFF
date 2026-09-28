"use client";

import type { ReadinessAssessment } from "@/types/readiness-engine";

export function HistoryChart({
  history,
  formatDate,
}: {
  history: ReadinessAssessment[];
  formatDate: (iso: string) => string;
}) {
  if (history.length === 0) return null;

  return (
    <div className="flex items-end gap-4 overflow-x-auto pb-1">
      {history.map((assessment) => (
        <div key={assessment.id} className="flex shrink-0 flex-col items-center gap-2">
          <div className="font-heading text-lg font-semibold text-aff-text">{assessment.overallScore ?? "—"}</div>
          <div
            className="w-10 rounded-t-md bg-aff-accent"
            style={{ height: `${Math.max(6, (assessment.overallScore ?? 0) * 0.6)}px` }}
            aria-hidden="true"
          />
          <div className="text-[11px] text-aff-muted">
            {formatDate(assessment.completedAt ?? assessment.startedAt)}
          </div>
        </div>
      ))}
    </div>
  );
}
