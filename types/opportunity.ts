// Opportunity Discovery domain model (AFF-DASH-08 Part B).
//
// Replaces the pre-batch placeholder shape (id/title/deadline plus an
// opaque match-percentage field and a single "missing requirement" string)
// which encoded a forbidden opaque percentage —
// forbidden under the deterministic-only rule. Every consumer of the old
// shape (components/dashboard/OpportunityCard.tsx, lib/demo/opportunities.ts,
// lib/services/dashboard-data.ts, components/dashboard/CommandCenterView.tsx)
// is updated in this batch to use lib/opportunities/matching.ts's
// human-readable reasons instead of a score.
//
// Investors are explicitly NOT modeled as Opportunities (out of scope,
// reserved for a future Investor Connect batch).
//
// All demo content is fictional (see lib/services/opportunities.ts's seed)
// — never a real external program presented as current/live.

import type { MonetaryAmount, StartupStage } from "./common";

export type LocalizedText = { en: string; fr: string };

export type OpportunityType =
  | "ACCELERATOR"
  | "INCUBATOR"
  | "GRANT"
  | "COMPETITION"
  | "PITCH_EVENT"
  | "FUNDING_CALL"
  | "CORPORATE_PROGRAM"
  | "PUBLIC_PROGRAM"
  | "TRAINING"
  | "NETWORKING"
  | "OTHER";

export type OpportunityStatus = "OPEN" | "CLOSING_SOON" | "CLOSED";

// AFF_CURATED is reserved for a future real-content pipeline; every
// opportunity seeded this batch is DEMO.
export type OpportunitySource = "AFF_CURATED" | "DEMO";

export type OpportunityRequirement = {
  key: string;
  labelKey: string; // i18n key, e.g. "dashboard.opportunities.requirements.impactMetrics"
};

export type Opportunity = {
  id: string;
  title: string; // program name — a proper noun, not translated
  organization: string;
  description: LocalizedText;
  type: OpportunityType;
  countries: string[]; // ISO-ish country names matching Digital Twin's country field; [] = open to any country
  regions: string[];
  industries: string[]; // matches StartupDigitalTwin market.industry values
  startupStages: StartupStage[];
  fundingAmount?: MonetaryAmount;
  equityRequired?: boolean;
  deadline?: string;
  applicationUrl?: string;
  languages: string[]; // "en" | "fr"
  remoteAllowed?: boolean;
  requirements: OpportunityRequirement[];
  status: OpportunityStatus;
  source: OpportunitySource;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Matching — deterministic, human-readable reasons only. NEVER a score or
// percentage (see lib/opportunities/matching.ts and its
// *-metric-separation.test.ts). Both matches AND honest mismatches are
// surfaced.
// ---------------------------------------------------------------------------

export type OpportunityReasonKind = "MATCH" | "MISMATCH";

export type OpportunityMatchReason = {
  key: string;
  kind: OpportunityReasonKind;
  labelKey: string;
  data?: Record<string, string>;
};

export type OpportunityMatch = {
  opportunity: Opportunity;
  reasons: OpportunityMatchReason[];
};

// ---------------------------------------------------------------------------
// Saving — startup-specific, never shared across startups.
// ---------------------------------------------------------------------------

export type SavedOpportunity = {
  startupId: string;
  opportunityId: string;
  savedAt: string;
};

// ---------------------------------------------------------------------------
// Application tracking — FOUNDER SELF-REPORTED ONLY. AFF never claims to
// know the real external status of an application.
// ---------------------------------------------------------------------------

export type OpportunityApplicationStatus =
  | "INTERESTED"
  | "PREPARING"
  | "APPLIED"
  | "SHORTLISTED"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

export type OpportunityApplication = {
  id: string;
  startupId: string;
  opportunityId: string;
  status: OpportunityApplicationStatus;
  appliedAt?: string;
  deadline?: string;
  notes?: string;
  nextStep?: string;
  // Set once "Add preparation task" has been used — prevents duplicate task
  // creation, mirroring ExpertRecommendation.taskId in types/experts.ts.
  taskId?: string;
  createdAt: string;
  updatedAt: string;
};
