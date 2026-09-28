// AFF Pitch Lab domain model (AFF-DASH-05).
//
// Pitch Readiness, Profile Completion, AFF Readiness and Roadmap Progress
// are FOUR DIFFERENT METRICS — see lib/pitch/readiness.ts for the full
// separation rationale. Nothing in this file (or anything that consumes it)
// may write to types/readiness-engine.ts's score fields, and nothing here
// is ever mutated by a Roadmap/Task completion.
//
// Stable identifiers throughout (never translated strings as keys) — see
// lib/pitch/section-config.ts and lib/pitch/qna-catalog.ts for the
// "template ID + translation key" pattern already used by
// lib/roadmap/action-catalog.ts.

// ---------------------------------------------------------------------------
// Objective / audience / pitch type
// ---------------------------------------------------------------------------

export type PitchObjective =
  | "fundraising"
  | "customer"
  | "partnership"
  | "grant"
  | "accelerator"
  | "competition"
  | "pitch_live"
  | "general";

export type PitchAudience =
  | "investors"
  | "customers"
  | "corporates"
  | "government"
  | "donors"
  | "accelerators"
  | "general_public";

export type PitchType = "elevator" | "one_minute" | "three_minute" | "five_minute" | "investor_deck" | "custom";

// ---------------------------------------------------------------------------
// Fundraising context (only meaningful when objective === "fundraising")
// ---------------------------------------------------------------------------

export type FundraisingContext = {
  round?: string;
  amountSought?: { amount: number; currency: string };
  instrument?: string;
  minimumTicket?: { amount: number; currency: string };
  targetInvestors?: string;
  useOfFunds?: string;
  timeline?: string;
};

// ---------------------------------------------------------------------------
// Pitch section model
// ---------------------------------------------------------------------------

export type PitchSectionType =
  | "hook"
  | "problem"
  | "solution"
  | "product"
  | "market"
  | "business_model"
  | "traction"
  | "competition"
  | "go_to_market"
  | "team"
  | "financials"
  | "fundraising_ask"
  | "vision_impact"
  | "closing";

export type PitchSectionStatus = "empty" | "draft" | "complete" | "needs_work";

// Traceability back to the Digital Twin field(s) a section was prefilled
// from. `snapshot` is the raw twin content AT IMPORT TIME (used only to
// detect later Digital Twin drift — see lib/pitch/prefill.ts) — it is never
// re-rendered as pitch narrative on its own.
export type SourceReference = {
  fieldKey: string; // e.g. "problem.statement", "traction.metrics"
  labelKey: string; // translation key, e.g. "dashboard.pitch.sourceFields.problemStatement"
  snapshot: string; // stable stringified snapshot of the twin value at import time
};

export type PitchSection = {
  id: string;
  type: PitchSectionType;
  content: string;
  keyPoints: string[];
  sourceReferences: SourceReference[];
  status: PitchSectionStatus;
  order: number;
  required: boolean;
};

// ---------------------------------------------------------------------------
// Pitch Readiness result (Part 11/12/13) — separate engine from AFF Readiness
// ---------------------------------------------------------------------------

export type PitchReadinessDimensionKey =
  | "narrative_clarity"
  | "problem_evidence"
  | "solution_clarity"
  | "market_story"
  | "business_model"
  | "traction_story"
  | "differentiation"
  | "team_story"
  | "financial_funding_clarity"
  | "ask_clarity"
  | "evidence_coverage"
  | "pitch_completeness";

export type PitchReadinessDimensionResult = {
  key: PitchReadinessDimensionKey;
  score: number; // 0-100
};

export type PitchReadinessResult = {
  score: number; // 0-100, deterministic
  confidence: number; // 0-100 — evaluability/evidence, NOT persuasiveness
  dimensions: PitchReadinessDimensionResult[];
  computedAt: string;
};

// ---------------------------------------------------------------------------
// Pitch version
// ---------------------------------------------------------------------------

export type PitchVersionStatus = "draft" | "in_review" | "final" | "archived";

export type PitchVersion = {
  id: string;
  workspaceId: string;
  startupId: string;
  version: number;
  title: string;
  status: PitchVersionStatus;
  sections: PitchSection[];
  readiness?: PitchReadinessResult;
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string;
};

// ---------------------------------------------------------------------------
// Pitch workspace (root aggregate)
// ---------------------------------------------------------------------------

export type PitchWorkspace = {
  id: string;
  startupId: string;
  objective: PitchObjective;
  audience: PitchAudience;
  pitchType: PitchType;
  fundraisingContext?: FundraisingContext;
  activeVersionId: string;
  versions: PitchVersion[];
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Checklist (Part 14) — computed in lib/, never hardcoded in the UI
// ---------------------------------------------------------------------------

export type ChecklistItemState = "pass" | "warn" | "fail";

export type ChecklistItem = {
  key: string; // stable id, e.g. "problem_defined"
  state: ChecklistItemState;
  labelKey: string;
};

// ---------------------------------------------------------------------------
// Practice workspace (Part 15/16)
// ---------------------------------------------------------------------------

export type PitchPracticeFormat = "30s" | "1min" | "3min" | "5min";

export type PitchPracticeSegment = {
  sectionType: PitchSectionType;
  startSeconds: number;
  endSeconds: number;
  labelKey: string;
};

// Founder self-assessment — explicitly NOT an AFF evaluation, and NEVER fed
// into computePitchReadiness(). Enforced structurally by keeping this type
// (and the store that holds it) entirely separate from PitchReadinessResult.
export type FounderSelfRatings = {
  clarity: number; // 1-5
  confidence: number; // 1-5
  timing: number; // 1-5
  storytelling: number; // 1-5
};

export type PitchPracticeAttempt = {
  id: string;
  startupId: string;
  pitchVersionId: string;
  format: PitchPracticeFormat;
  startedAt: string;
  completedAt?: string;
  actualDurationSeconds?: number;
  founderRatings?: FounderSelfRatings;
  notes?: string;
};

// ---------------------------------------------------------------------------
// Investor Q&A preparation (Part 17/18)
// ---------------------------------------------------------------------------

export type QnaCategory =
  | "problem"
  | "market"
  | "product"
  | "competition"
  | "business_model"
  | "traction"
  | "team"
  | "financials"
  | "fundraising"
  | "risks"
  | "vision";

export type QnaQuestionTemplate = {
  id: string;
  category: QnaCategory;
  questionKey: string;
  // Deterministic selector tags — see lib/pitch/qna-selector.ts. No AI.
  requiresRevenue?: boolean;
  requiresFundraising?: boolean;
  requiresBusinessModel?: Array<
    "b2b" | "b2c" | "b2b2c" | "marketplace" | "saas" | "subscription" | "transactional" | "licensing" | "other"
  >;
  fallbackForId?: string; // question this one replaces when its own requirement isn't met
};

export type QnaAnswerStatus = "not_started" | "drafted" | "prepared" | "needs_work";

export type QnaAnswerState = {
  questionId: string;
  answer: string;
  status: QnaAnswerStatus;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Expert review foundation (Part 19/20) — conceptual model, no real auth
// ---------------------------------------------------------------------------

export type PitchReviewStatus = "pending" | "in_progress" | "completed";

export type PitchReview = {
  id: string;
  startupId: string;
  pitchVersionId: string;
  reviewerId: string;
  reviewerName: string; // demo/illustrative — always labeled as such in UI
  isDemo: boolean; // true = illustrative/demo feedback, never presented as real
  status: PitchReviewStatus;
  createdAt: string;
  completedAt?: string;
  overallComment?: string;
  comments: ReviewComment[];
};

export type ReviewCommentType = "comment" | "question" | "suggestion" | "critical_issue";
export type ReviewCommentStatus = "open" | "resolved" | "dismissed";

export type ReviewComment = {
  id: string;
  reviewId: string;
  sectionId?: string;
  authorId: string;
  type: ReviewCommentType;
  message: string;
  status: ReviewCommentStatus;
  createdAt: string;
  resolvedAt?: string;
  taskId?: string; // set once "Create task" has been used — prevents duplicates
};

// ---------------------------------------------------------------------------
// Pitch Live readiness foundation (Part 23/24)
// ---------------------------------------------------------------------------

export type PitchLiveRequirements = {
  versionFinalized: boolean;
  requiredSectionsComplete: boolean;
  noCriticalUnresolvedIssue: boolean;
  hasPracticeAttempt: boolean;
};

export type PitchLiveReadiness = {
  requirements: PitchLiveRequirements;
  ready: boolean; // product-preparation readiness — NEVER an investment judgment
};
