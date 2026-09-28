/**
 * Deterministic "Data Room Completion" — e.g. 18 required documents, 12
 * available, 2 outdated, 4 missing → completion 12/18. This is a document-
 * readiness percentage ONLY. It must never be merged into, reported as, or
 * confused with AFF Readiness (a wholly separate score in
 * lib/services/readiness.ts) — see lib/services/financial-metric-separation.test.ts.
 */
import type { DataRoomChecklist, DataRoomCompletion } from "@/types/data-room";

const SATISFIED_STATUSES = new Set(["available", "verified"]);

export function computeDataRoomCompletion(checklist: DataRoomChecklist): DataRoomCompletion {
  const requiredTotal = checklist.items.length;
  let availableCount = 0;
  let outdatedCount = 0;
  let needsReviewCount = 0;
  let missingCount = 0;

  for (const item of checklist.items) {
    if (SATISFIED_STATUSES.has(item.status)) availableCount += 1;
    else if (item.status === "outdated") outdatedCount += 1;
    else if (item.status === "needs_review") needsReviewCount += 1;
    else missingCount += 1; // "missing" or "draft" — not yet ready for diligence
  }

  return {
    requiredTotal,
    availableCount,
    outdatedCount,
    needsReviewCount,
    missingCount,
    completionPct: requiredTotal === 0 ? 0 : availableCount / requiredTotal,
  };
}
