import { describe, expect, it } from "vitest";
import { shouldSuggestReassessment, REASSESSMENT_GAP_THRESHOLD } from "./reassessment";
import type { ReadinessAssessment } from "@/types/readiness-engine";
import type { RoadmapItem } from "@/types/roadmap";

function assessment(completedAt: string | undefined): ReadinessAssessment {
  return {
    id: "a-v1",
    startupId: "s",
    version: 1,
    frameworkVersion: "AFF_READINESS_V1",
    status: completedAt ? "completed" : "draft",
    startupStageAtAssessment: "mvp",
    businessModelAtAssessment: [],
    startedAt: "2026-01-01T00:00:00.000Z",
    completedAt,
    overallScore: 50,
    overallConfidence: 50,
    dimensions: [],
    answers: [],
    evidenceSnapshot: [],
  };
}

function gapItem(id: string, completedAt: string): RoadmapItem {
  return { id, title: "x", status: "done", sourceType: "READINESS_GAP", completedAt };
}

describe("shouldSuggestReassessment", () => {
  it("never suggests when there is no completed assessment", () => {
    const result = shouldSuggestReassessment(undefined, [gapItem("1", "2026-02-01")]);
    expect(result.shouldSuggest).toBe(false);
  });

  it(`suggests once >= ${REASSESSMENT_GAP_THRESHOLD} READINESS_GAP items completed since the last assessment`, () => {
    const assessed = assessment("2026-01-01T00:00:00.000Z");
    const items = Array.from({ length: REASSESSMENT_GAP_THRESHOLD }, (_, i) => gapItem(`${i}`, "2026-01-10T00:00:00.000Z"));
    const result = shouldSuggestReassessment(assessed, items);
    expect(result.shouldSuggest).toBe(true);
    expect(result.completedGapItemsSinceLastAssessment).toBe(REASSESSMENT_GAP_THRESHOLD);
  });

  it("does not count completions before the last assessment or non-READINESS_GAP items", () => {
    const assessed = assessment("2026-02-01T00:00:00.000Z");
    const items = [
      gapItem("old", "2026-01-01T00:00:00.000Z"), // before assessment
      { id: "founder", title: "x", status: "done", sourceType: "FOUNDER_CREATED", completedAt: "2026-03-01T00:00:00.000Z" } as RoadmapItem,
    ];
    const result = shouldSuggestReassessment(assessed, items);
    expect(result.completedGapItemsSinceLastAssessment).toBe(0);
    expect(result.shouldSuggest).toBe(false);
  });
});
