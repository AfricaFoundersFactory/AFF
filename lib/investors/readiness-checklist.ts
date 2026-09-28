/**
 * Introduction Readiness Checklist — factual preparation indicators only.
 * NOT a score, NOT a fundability/investability signal. See §26 of the
 * AFF-DASH-10 work order: missing items are informational
 * ("recommended before requesting an introduction"), never a hard block and
 * never worded as "you are not investable".
 */
import type { IntroductionReadinessChecklist, ReadinessChecklistItemKey } from "@/types/investors";

export type ReadinessChecklistInput = {
  profileCompletionPct: number;
  hasPitch: boolean;
  hasFundingRequirement: boolean;
  dataRoomCompletionPct: number;
  hasFinancialData: boolean;
  hasReadinessAssessment: boolean;
};

// Thresholds are deliberately generous — this is a nudge, not a gate.
const PROFILE_COMPLETION_THRESHOLD = 60;
const DATA_ROOM_COMPLETION_THRESHOLD = 50;

export function computeIntroductionReadiness(input: ReadinessChecklistInput): IntroductionReadinessChecklist {
  const items: { key: ReadinessChecklistItemKey; met: boolean }[] = [
    { key: "profileCompleted", met: input.profileCompletionPct >= PROFILE_COMPLETION_THRESHOLD },
    { key: "pitchExists", met: input.hasPitch },
    { key: "fundingRequirementEntered", met: input.hasFundingRequirement },
    { key: "dataRoomReady", met: input.dataRoomCompletionPct >= DATA_ROOM_COMPLETION_THRESHOLD },
    { key: "financialsAvailable", met: input.hasFinancialData },
    { key: "readinessAssessmentAvailable", met: input.hasReadinessAssessment },
  ];
  return { items };
}
