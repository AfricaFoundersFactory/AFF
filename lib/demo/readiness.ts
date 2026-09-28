import type { NextBestAction } from "@/types/readiness";

// The DASH-01 placeholder ReadinessAssessment demo data that used to live
// here has been replaced by the real, deterministically-computed assessment
// history in lib/demo/readiness-assessments.ts. NextBestAction is a separate
// Command Center recommendation widget, unrelated to readiness scoring.
export const demoNextBestActionByStartup: Record<string, NextBestAction> = {
  "startup-wakama": {
    id: "action-wakama-1",
    title: "Improve your financial readiness",
    description: "Your financial assumptions are incomplete.",
    estimatedEffortMinutes: 35,
    potentialImpactPoints: 5,
    linkedModule: "financials",
  },
  "startup-solari": {
    id: "action-solari-1",
    title: "Strengthen your fundraising narrative",
    description: "Your fundraising materials are missing a clear use-of-funds breakdown.",
    estimatedEffortMinutes: 40,
    potentialImpactPoints: 4,
    linkedModule: "pitch",
  },
};
