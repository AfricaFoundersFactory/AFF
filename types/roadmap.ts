import type { DimensionKey } from "./readiness-engine";

// ---------------------------------------------------------------------------
// Shared status/priority/effort vocab.
//
// These stay lowercase (not the SCREAMING_CASE used in the AFF-DASH-04 spec
// prose) because TaskStatus/TaskPriority already existed pre-batch and are
// consumed by StatusBadge/TaskCard/i18n keys (dashboard.thisWeek.status.*)
// keyed on lowercase values. Extending the same enum keeps one vocabulary
// instead of introducing a parallel casing for new fields.
// ---------------------------------------------------------------------------
export type TaskStatus = "todo" | "in_progress" | "done" | "blocked" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type Impact = "high" | "medium" | "low";
export type Effort = "quick" | "short" | "medium" | "long";

// Where a roadmap item or task originated — always rendered, never hidden,
// so a founder can trace every action back to its source (readiness gap,
// their own goal, something they typed themselves, etc).
export type SourceType =
  | "READINESS_GAP"
  | "FOUNDER_GOAL"
  | "PROFILE_COMPLETION"
  | "FOUNDER_CREATED"
  | "AFF_PROGRAM"
  | "EXPERT_RECOMMENDATION"
  // --- AFF-DASH-05 additions ---
  | "PITCH_IMPROVEMENT"
  // --- AFF-DASH-08 additions ---
  | "OPPORTUNITY_PREPARATION"
  | "RESOURCE_ACTION";

export type Task = {
  id: string;
  title: string;
  category: string;
  status: TaskStatus;
  priority: TaskPriority;
  // Optional now: founder-created tasks and roadmap-linked tasks may have
  // no due date. Callers that need a due date for "this week" selection
  // (dashboard-data.ts) filter for one before handing tasks to the UI.
  dueDate?: string;
  linkedModule: string;

  // --- AFF-DASH-04 additions (all additive/optional) ---
  startupId?: string;
  description?: string;
  roadmapItemId?: string;
  goalId?: string;
  startedAt?: string;
  completedAt?: string;
  estimatedEffort?: Effort;
  dependencies?: string[];
  sourceType?: SourceType;
  createdBy?: "AFF" | "FOUNDER";
  createdAt?: string;
  updatedAt?: string;

  // --- AFF-DASH-05 additions: traceability back to a Pitch Lab origin
  // (a review comment or a manually-added readiness gap in the pitch).
  // sourceReference disambiguates WHICH comment/gap this task came from,
  // so lib/services/pitch-review.ts can prevent duplicate task creation
  // from the same unresolved comment.
  sourceReference?: string;
  pitchVersionId?: string;
  pitchSectionId?: string;
};

export type Milestone = {
  id: string;
  title: string;
  dueDate?: string;
  completed: boolean;
  roadmapItemIds?: string[];
};

export type RoadmapItem = {
  id: string;
  title: string;
  status: TaskStatus;

  // --- AFF-DASH-04 additions ---
  startupId?: string;
  roadmapId?: string;
  titleKey?: string;
  descriptionKey?: string;
  description?: string;
  sourceType?: SourceType;
  sourceReference?: string;
  category?: string;
  priority?: TaskPriority;
  priorityReasons?: string[];
  impact?: Impact;
  effort?: Effort;
  estimatedDuration?: string;
  expectedOutcome?: string;
  readinessDimension?: DimensionKey;
  readinessCriterion?: string;
  goalId?: string;
  dueDate?: string;
  startedAt?: string;
  completedAt?: string;
  dependencies?: string[];
  taskIds?: string[];
  evidenceRequirement?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Roadmap = {
  id: string;
  startupId: string;
  // Precomputed counts kept for backward compatibility with existing
  // consumers (ProgressCard/CommandCenterView). Callers must derive these
  // at READ time via lib/roadmap/progress.ts#computeRoadmapProgress —
  // never store stale counts across mutations.
  progressPct: number;
  completedCount: number;
  inProgressCount: number;
  remainingCount: number;
  items: RoadmapItem[];
  milestones: Milestone[];

  // --- AFF-DASH-04 additions ---
  version?: number;
  title?: string;
  status?: "active" | "superseded";
  createdAt?: string;
  updatedAt?: string;
  sourceAssessmentId?: string;
};
