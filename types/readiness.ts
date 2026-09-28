// The DASH-01 placeholder ReadinessAssessment/ReadinessDimensionScore types
// that used to live here have been superseded by the real AFF Readiness
// Engine — see types/readiness-engine.ts. NextBestAction is unrelated to
// readiness scoring (it's a separate Command Center recommendation widget)
// and stays here.

export type NextBestAction = {
  id: string;
  title: string;
  description: string;
  estimatedEffortMinutes: number;
  potentialImpactPoints: number;
  linkedModule: string;
};
