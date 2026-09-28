/**
 * Reassessment-loop trigger.
 *
 * Deterministic rule (exact): suggest reassessment once, since the latest
 * completed assessment's completedAt, the founder has completed
 * >= REASSESSMENT_GAP_THRESHOLD roadmap items whose sourceType is
 * READINESS_GAP. This is chosen over a task-count rule because a completed
 * READINESS_GAP roadmap item is the closest available proxy for "founder
 * likely produced new evidence relevant to a specific criterion" without
 * this module inspecting Digital Twin diffs itself.
 *
 * This function NEVER calls anything in lib/services/readiness.ts and never
 * mutates a score — it only reads roadmap item completion timestamps and
 * returns a suggestion + a plain-data summary. The UI is responsible for
 * turning "true" into a banner CTA that calls the EXISTING
 * reassessAction/reassess() flow; nothing here runs it automatically.
 */
import type { ReadinessAssessment } from "@/types/readiness-engine";
import type { RoadmapItem } from "@/types/roadmap";

export const REASSESSMENT_GAP_THRESHOLD = 5;

export type ReassessmentSuggestion = {
  shouldSuggest: boolean;
  completedGapItemsSinceLastAssessment: number;
  threshold: number;
};

export function shouldSuggestReassessment(
  latestAssessment: ReadinessAssessment | undefined,
  roadmapItems: RoadmapItem[],
): ReassessmentSuggestion {
  if (!latestAssessment?.completedAt) {
    return { shouldSuggest: false, completedGapItemsSinceLastAssessment: 0, threshold: REASSESSMENT_GAP_THRESHOLD };
  }

  const completedAtMs = new Date(latestAssessment.completedAt).getTime();

  const completedGapItemsSinceLastAssessment = roadmapItems.filter((item) => {
    if (item.sourceType !== "READINESS_GAP" || item.status !== "done" || !item.completedAt) return false;
    return new Date(item.completedAt).getTime() >= completedAtMs;
  }).length;

  return {
    shouldSuggest: completedGapItemsSinceLastAssessment >= REASSESSMENT_GAP_THRESHOLD,
    completedGapItemsSinceLastAssessment,
    threshold: REASSESSMENT_GAP_THRESHOLD,
  };
}
