"use client";

import type { DimensionResult } from "@/types/readiness-engine";

type Entry = { dimension: string; criterionId: string };

function flatten(dimensions: DimensionResult[], key: "strengths" | "gaps", limit: number): Entry[] {
  const entries: Entry[] = [];
  for (const d of dimensions) {
    for (const criterionId of d[key]) {
      entries.push({ dimension: d.dimension, criterionId });
      if (entries.length >= limit) return entries;
    }
  }
  return entries;
}

export function StrengthsGapsPanel({
  dimensions,
  strengthsTitle,
  gapsTitle,
  criterionLabel,
  emptyStrengths,
  emptyGaps,
  catalogCriterionIds,
  roadmapCriterionIds,
  onAddToRoadmap,
  addLabel,
  addedLabel,
}: {
  dimensions: DimensionResult[];
  strengthsTitle: string;
  gapsTitle: string;
  criterionLabel: (criterionId: string) => string;
  emptyStrengths: string;
  emptyGaps: string;
  /** Criterion ids that have a deterministic action-catalog template — only these get an "Add to roadmap" affordance. */
  catalogCriterionIds?: Set<string>;
  /** Criterion ids that already have an active roadmap item. */
  roadmapCriterionIds?: Set<string>;
  onAddToRoadmap?: (criterionId: string) => void;
  addLabel?: string;
  addedLabel?: string;
}) {
  const strengths = flatten(dimensions, "strengths", 5);
  const gaps = flatten(dimensions, "gaps", 5);

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div>
        <h3 className="mb-3 text-[13px] font-semibold tracking-[0.06em] text-aff-muted">{strengthsTitle.toUpperCase()}</h3>
        {strengths.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {strengths.map((e) => (
              <li key={`${e.dimension}-${e.criterionId}`} className="flex items-start gap-2 text-[13.5px] text-aff-text">
                <span className="text-aff-accent" aria-hidden="true">✓</span>
                {criterionLabel(e.criterionId)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-aff-muted">{emptyStrengths}</p>
        )}
      </div>
      <div>
        <h3 className="mb-3 text-[13px] font-semibold tracking-[0.06em] text-aff-muted">{gapsTitle.toUpperCase()}</h3>
        {gaps.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {gaps.map((e) => {
              const inCatalog = catalogCriterionIds?.has(e.criterionId) ?? false;
              const inRoadmap = roadmapCriterionIds?.has(e.criterionId) ?? false;
              return (
                <li
                  key={`${e.dimension}-${e.criterionId}`}
                  className="flex items-start justify-between gap-2 text-[13.5px] text-aff-text"
                >
                  <span className="flex items-start gap-2">
                    <span className="text-amber-400" aria-hidden="true">⚠</span>
                    {criterionLabel(e.criterionId)}
                  </span>
                  {inCatalog ? (
                    inRoadmap ? (
                      <span className="shrink-0 text-[11.5px] font-semibold text-aff-muted">{addedLabel}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAddToRoadmap?.(e.criterionId)}
                        className="shrink-0 text-[11.5px] font-semibold text-aff-accent hover:text-aff-accent-hover"
                      >
                        {addLabel}
                      </button>
                    )
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-[13px] text-aff-muted">{emptyGaps}</p>
        )}
      </div>
    </div>
  );
}
