// Founder Analytics domain model (AFF-DASH-09 Part B).
//
// Observation-only: every field here is DERIVED (read-only) from an
// existing canonical service — never a second source of truth, never a
// recomputation of a canonical calculation. lib/services/analytics.ts is
// the only place that assembles a FounderAnalyticsSnapshot, and it does so
// entirely by calling into lib/services/{readiness,roadmap,tasks,pitch,
// pitch-practice,financials,data-room,mentoring,support-requests,
// opportunities,community}.ts.
//
// HARD RULE (grep-verifiable): no field here is a combined/opaque score
// naming a "global", "master", "AFF-wide" or "composite/aggregate" score
// concept. See the static check in analytics.test.ts.

export type AnalyticsRange = "30D" | "90D" | "ALL";

export type ProgressTimelineEventType =
  | "READINESS_ASSESSMENT_COMPLETED"
  | "READINESS_IMPROVED"
  | "ROADMAP_GENERATED"
  | "TASK_COMPLETED"
  | "PITCH_VERSION_CREATED"
  | "PITCH_PRACTICE_COMPLETED"
  | "FINANCIAL_PERIOD_ADDED"
  | "DATA_ROOM_DOCUMENT_UPDATED"
  | "EXPERT_RECOMMENDATION_COMPLETED"
  | "OPPORTUNITY_APPLIED";

export type ProgressTimelineEvent = {
  id: string;
  type: ProgressTimelineEventType;
  occurredAt: string;
  // i18n key suffix under dashboard.analytics.timeline.events.<labelKey>
  labelKey: string;
  data?: Record<string, string>;
  isDemo?: boolean;
};

// `available: false` means the underlying canonical data doesn't exist yet
// for this startup — the UI must render an honest empty state, never a
// fabricated value.
export type AvailableBlock<T> = { available: true; data: T } | { available: false };

export type ReadinessAnalytics = AvailableBlock<{
  currentScore: number;
  previousScore?: number;
  trend: "up" | "down" | "flat" | "unknown";
  assessmentCount: number;
}>;

export type ExecutionAnalytics = {
  tasksTotal: number;
  tasksCompleted: number;
  tasksOverdue: number;
  roadmapProgressPct: number | null;
  priorityCompletion: { priority: string; total: number; completed: number }[];
};

export type PitchAnalytics = AvailableBlock<{
  versionCount: number;
  practiceSessionCount: number;
  currentReadinessAvailable: boolean;
  unresolvedReviewComments: number;
}>;

// Mirrors lib/financials/calculations.ts#RunwayResult exactly — Analytics
// reuses the canonical discriminated union rather than collapsing it to a
// single number, so "not burning cash" (sustainable) stays distinguishable
// from "we don't have enough data" (unavailable). Never Infinity.
export type RunwayAnalytics =
  | { status: "unavailable" }
  | { status: "sustainable" }
  | { status: "calculated"; months: number };

export type FinancialAnalytics = AvailableBlock<{
  periodCount: number;
  latestPeriodLabel?: string;
  runway: RunwayAnalytics;
  forecastCoverageMonths: number;
}>;

export type DataRoomAnalytics = {
  completionPct: number;
  availableCount: number;
  verifiedCount: number;
  missingCount: number;
  outdatedCount: number;
};

export type ExpertSupportAnalytics = {
  supportRequestCount: number;
  sessionsCompleted: number;
  recommendationsReceived: number;
  recommendationsAccepted: number;
  recommendationsCompleted: number;
  recommendationsConvertedToTasks: number;
};

export type OpportunityAnalytics = {
  // Founder-entered statuses only — AFF never infers a real external
  // outcome. Label this in the UI.
  saved: number;
  preparing: number;
  applied: number;
  shortlisted: number;
  accepted: number;
  rejected: number;
};

export type CommunityAnalytics = {
  postsCreated: number;
  questionsAsked: number;
  helpfulContributions: number; // HELPFUL reactions received on the founder's own posts/comments
  eventsRegistered: number;
};

export type ProfileCompletionAnalytics = {
  completionPct: number;
};

export type FounderAnalyticsSnapshot = {
  startupId: string;
  range: AnalyticsRange;
  generatedAt: string;
  profileCompletion: ProfileCompletionAnalytics;
  readiness: ReadinessAnalytics;
  execution: ExecutionAnalytics;
  pitch: PitchAnalytics;
  financials: FinancialAnalytics;
  dataRoom: DataRoomAnalytics;
  expertSupport: ExpertSupportAnalytics;
  opportunities: OpportunityAnalytics;
  community: CommunityAnalytics;
  timeline: ProgressTimelineEvent[];
};
