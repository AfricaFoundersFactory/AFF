// Expert Network + Mentoring + Advisory Workflow domain model (AFF-DASH-07).
//
// Core actors this batch prepares clean domain separation for — FOUNDER,
// EXPERT, MENTOR, COACH, AFF_ADMIN — without building full production
// RBAC/auth (see lib/auth/session.ts, unchanged this batch). An individual
// may hold multiple roles later; nothing here forces exclusivity.
//
// ExpertProfile is its own domain concept, distinct from Founder
// (types/digital-twin.ts) and from PitchReview.reviewerId (types/pitch.ts).
// See lib/services/pitch-review.ts's file header for the documented
// decision on how the two relate (reviewer identity concept could
// eventually map onto ExpertProfile.id, without a forced merge this batch).
//
// NO monetization: no price/rate/checkout/wallet/commission/subscription/
// invoice/payment field exists anywhere below, and none should be added
// without a deliberate, separate decision.
//
// NO sensitive attributes: ExpertProfile intentionally has no
// gender/ethnicity/religion/age/other such field — lib/experts/matching.ts
// cannot use what does not exist here.

import type { StartupStage } from "./common";
import type { ExpertiseCategoryId, ExpertLanguage } from "@/lib/experts/taxonomy";

// Re-exported so callers don't need to import from lib/experts/taxonomy just
// for the type.
export type { ExpertiseCategoryId, ExpertLanguage };

// ---------------------------------------------------------------------------
// Expert profile
// ---------------------------------------------------------------------------

export type ExpertAvailability = "AVAILABLE" | "LIMITED" | "UNAVAILABLE";

export type ExpertProfileStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

// Verification is an explicit admin action only — see
// lib/services/experts.ts#verifyExpert. Never a default, never implied by
// any other mutation. This is NOT an expertise-quality score (see
// lib/services/expert-metric-separation.test.ts).
export type ExpertVerificationStatus = "UNVERIFIED" | "PROFILE_REVIEWED" | "AFF_VERIFIED";

// No scheduling system — a simple enum plus an optional self-reported
// hours/month figure, nothing calendar-shaped.
export type MentoringFormat = "VIDEO_CALL" | "PHONE_CALL" | "CHAT" | "IN_PERSON" | "DOCUMENT_REVIEW" | "PITCH_REVIEW";

export type ExpertProfile = {
  id: string;
  // Optional: an expert profile can exist before/without a linked platform
  // user account (demo data has none) — a future batch can link one without
  // restructuring this type.
  userId?: string;
  displayName: string;
  headline: string;
  bio: string;
  country: string;
  city?: string;
  languages: ExpertLanguage[];
  expertise: ExpertiseCategoryId[];
  industries: ExpertiseCategoryId[]; // subset drawn from INDUSTRY_EXPERTISE_IDS
  startupStages: StartupStage[];
  markets: string[]; // countries/regions the expert can meaningfully advise on
  yearsExperience?: number;
  availability: ExpertAvailability;
  hoursPerMonth?: number;
  mentoringFormats: MentoringFormat[];
  profileStatus: ExpertProfileStatus;
  verificationStatus: ExpertVerificationStatus;
  currentRole?: string;
  organization?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Startup need model — read-only derivation target, not a background job.
// See lib/experts/needs.ts for the adapters that produce these.
// ---------------------------------------------------------------------------

export type StartupNeedSourceType =
  | "READINESS_GAP"
  | "ROADMAP_ITEM"
  | "TASK"
  | "PITCH_GAP"
  | "FINANCIAL_SIGNAL"
  | "DATA_ROOM_GAP"
  | "FOUNDER_DECLARED";

export type StartupNeedUrgency = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type StartupNeedStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "DISMISSED";

export type StartupNeed = {
  id: string;
  startupId: string;
  sourceType: StartupNeedSourceType;
  // Traceability only (e.g. a readiness criterion id, a roadmap item id, a
  // task id, a financial signal key) — never a duplicate of the source's
  // full data.
  sourceId?: string;
  category: ExpertiseCategoryId;
  title: string;
  description: string;
  urgency: StartupNeedUrgency;
  status: StartupNeedStatus;
  createdAt: string;
  resolvedAt?: string;
};

// ---------------------------------------------------------------------------
// Support request — founder -> expert. "SENT" is submitted inside AFF ONLY;
// no real email/notification delivery exists (surfaced explicitly in the
// UI copy, never implied otherwise).
//
// `message` is kept as its own top-level field (not buried in a notes blob)
// so a future /dashboard/messages feature could plausibly thread off of it
// without restructuring this type.
// ---------------------------------------------------------------------------

export type SupportRequestStatus = "DRAFT" | "SENT" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "COMPLETED";

export type SupportRequest = {
  id: string;
  startupId: string;
  founderId: string;
  expertId: string;
  needId?: string;
  topic: string;
  message: string;
  preferredFormat: MentoringFormat;
  preferredLanguage: ExpertLanguage;
  status: SupportRequestStatus;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Mentoring session — a live advisory interaction, distinct from a
// PitchReview (which comments on a pitch). scheduledAt is just an optional
// field a founder/expert could set manually if they want — no calendar
// system exists or is implied.
// ---------------------------------------------------------------------------

export type MentoringSessionStatus = "PLANNED" | "COMPLETED" | "CANCELLED";

export type MentoringSession = {
  id: string;
  startupId: string;
  supportRequestId: string;
  expertId: string;
  founderId: string;
  topic: string;
  format: MentoringFormat;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  founderNotes?: string;
  // Demo expert notes/recommendations MUST be rendered with an explicit
  // illustrative/demo label in the UI — never presented as real human
  // advice (see isDemo below, mirroring PitchReview.isDemo).
  expertNotes?: string;
  isDemo?: boolean;
  recommendationIds: string[];
  actionItems: string[];
  status: MentoringSessionStatus;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Expert recommendation — a HUMAN recommendation, explicitly NOT an AFF
// Readiness result. Must never feed any readiness calculation (see
// lib/services/expert-metric-separation.test.ts).
// ---------------------------------------------------------------------------

export type ExpertRecommendationPriority = "low" | "medium" | "high" | "critical";
export type ExpertRecommendationStatus = "OPEN" | "ACCEPTED" | "DISMISSED" | "COMPLETED";

export type ExpertRecommendation = {
  id: string;
  sessionId: string;
  startupId: string;
  expertId: string;
  category: ExpertiseCategoryId;
  title: string;
  description: string;
  priority: ExpertRecommendationPriority;
  status: ExpertRecommendationStatus;
  sourceReference?: string;
  // Set once "Create task" has been used — prevents duplicate task
  // creation, mirroring ReviewComment.taskId in types/pitch.ts.
  taskId?: string;
  // Set once "Add to roadmap" has been used (founder-triggered only).
  roadmapItemId?: string;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Matching result — human-readable reasons only, NEVER a score/percentage.
// ---------------------------------------------------------------------------

export type MatchReason = {
  key: string; // stable id, e.g. "expertise_overlap", "language_match"
  labelKey: string; // i18n key
  // Data backing the reason (e.g. { category: "FUNDRAISING" }) so the UI can
  // render specifics without free-floating claims.
  data?: Record<string, string>;
};

export type ExpertMatch = {
  expert: ExpertProfile;
  reasons: MatchReason[];
};

// ---------------------------------------------------------------------------
// Follow-up aggregate — measures RECOMMENDATION EXECUTION, never an expert
// rating. No star rating, no expert quality score anywhere.
// ---------------------------------------------------------------------------

export type RecommendationFollowUp = {
  sessionId: string;
  total: number;
  accepted: number;
  convertedToTask: number;
  completed: number;
  dismissed: number;
};
