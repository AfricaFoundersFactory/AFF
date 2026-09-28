// Investor Network + Fundraising Pipeline domain model (AFF-DASH-10).
//
// This is still FOUNDER WORKSPACE — there is no Investor login/workspace.
// Investor records here are illustrative demo organizations (see
// InvestorOrganization.isDemo) used by founders as a private CRM-style
// workspace, never a live investor database and never a channel that
// delivers real outreach (no email/SMS/LinkedIn provider exists).
//
// Reuses existing domain concepts rather than duplicating them:
//  - StartupStage (types/common.ts) — same stage vocabulary as Digital Twin.
//  - FundingInstrument (types/digital-twin.ts) — same instrument vocabulary
//    already used by StartupFunding/FundingRequirement.
//  - MonetaryAmount (types/common.ts) — same Money shape as Financials.
//  - BusinessModelType (types/digital-twin.ts).
//
// No score of any kind lives in this file. See lib/investors/matching.ts for
// why matching is explainable-reasons-only, never a percentage.
import type { MonetaryAmount, StartupStage } from "./common";
import type { BusinessModelType, FundingInstrument } from "./digital-twin";

// ---------------------------------------------------------------------------
// Investor organization / profile
// ---------------------------------------------------------------------------

export type InvestorType =
  | "ANGEL"
  | "ANGEL_NETWORK"
  | "VC"
  | "CORPORATE_VC"
  | "FAMILY_OFFICE"
  | "IMPACT_FUND"
  | "DEVELOPMENT_FINANCE"
  | "ACCELERATOR_FUND"
  | "VENTURE_STUDIO"
  | "PRIVATE_EQUITY"
  | "OTHER";

export type LeadPreference = "leads" | "follows" | "either";

// Every field is optional except the arrays (which default to empty) —
// UNKNOWN is always better than a fabricated value. See lib/investors/thesis.ts.
export type InvestmentThesis = {
  stages: StartupStage[];
  industries: string[];
  geographies: string[]; // free-text regions, e.g. "West Africa"
  countries: string[]; // ISO-ish country names/codes, founder/demo-entered
  businessModels: BusinessModelType[];
  ticketMin?: MonetaryAmount;
  ticketMax?: MonetaryAmount;
  instruments: FundingInstrument[];
  impactThemes: string[];
  leadPreference?: LeadPreference;
  followOn?: boolean;
  description?: string;
};

export type InvestorOrganization = {
  id: string;
  name: string;
  type: InvestorType;
  description?: string;
  website?: string;
  headquartersCountry?: string;
  // Always true in this batch — see PART A §7 of the work order. The UI
  // must always render a visible "Illustrative demo investor" notice
  // wherever an organization with isDemo === true is shown.
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InvestorContact = {
  id: string;
  name: string;
  role?: string;
  isPrimary: boolean;
};

// 1:1 with InvestorOrganization for this batch (id === organizationId) —
// split out because the thesis/contacts are logically distinct facts an
// AFF ops team could maintain separately from firmographic identity.
export type InvestorProfile = {
  id: string;
  organizationId: string;
  thesis: InvestmentThesis;
  contacts: InvestorContact[];
};

export type InvestorRecord = {
  organization: InvestorOrganization;
  profile: InvestorProfile;
};

export type InvestorFilters = {
  query?: string;
  type?: InvestorType;
  stage?: StartupStage;
  industry?: string;
  geography?: string;
  country?: string;
  instrument?: FundingInstrument;
  impactTheme?: string;
  // A candidate ticket amount to check against the investor's thesis
  // ticketMin/ticketMax range — the same overlap concept used by
  // lib/investors/matching.ts's TICKET_OVERLAP reason, never a score.
  // An investor with no ticket range on file, or a currency mismatch, is
  // never excluded — UNKNOWN/incomparable is not the same as "no match".
  ticketAmount?: MonetaryAmount;
};

// ---------------------------------------------------------------------------
// Explainable matching — see lib/investors/matching.ts. NEVER a score, NEVER
// a percentage, NEVER a probability. Only human-readable, checkable reasons.
// ---------------------------------------------------------------------------

export type SubstantiveMatchReasonKey =
  | "STAGE_MATCH"
  | "INDUSTRY_MATCH"
  | "GEOGRAPHY_MATCH"
  | "TICKET_OVERLAP"
  | "INSTRUMENT_MATCH";

export type SupplementaryMatchReasonKey = "IMPACT_MATCH";

export type MatchReasonKey = SubstantiveMatchReasonKey | SupplementaryMatchReasonKey;

export type MismatchReasonKey =
  | "STAGE_MISMATCH"
  | "GEOGRAPHY_MISMATCH"
  | "TICKET_MISMATCH"
  | "TICKET_COMPARISON_UNAVAILABLE"
  | "INSTRUMENT_MISMATCH";

export type InvestorMatch = {
  investorId: string;
  startupId: string;
  substantiveReasons: SubstantiveMatchReasonKey[];
  supplementaryReasons: SupplementaryMatchReasonKey[];
  mismatches: MismatchReasonKey[];
  // Deterministic, explainable "is this worth surfacing under Recommended" —
  // requires >=1 substantive reason AND no stage mismatch. NOT a score.
  recommended: boolean;
};

// ---------------------------------------------------------------------------
// Shortlist — private, founder-managed organization. Never an AFF ranking,
// never exposed to Community/other startups.
// ---------------------------------------------------------------------------

export type ShortlistPriority = "LOW" | "MEDIUM" | "HIGH";

export type InvestorShortlistEntry = {
  id: string;
  startupId: string;
  investorId: string;
  priority: ShortlistPriority;
  note?: string;
  nextAction?: string;
  nextActionAt?: string;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Fundraising round — tracking layer only. Does NOT duplicate
// FundingRequirement (types/financials.ts), which remains the canonical
// funding ask; this models the round-as-a-process (status/timeline).
// ---------------------------------------------------------------------------

export type FundraisingRoundStatus = "PLANNING" | "ACTIVE" | "PAUSED" | "CLOSED" | "CANCELLED";

export type FundraisingRound = {
  id: string;
  startupId: string;
  name: string;
  status: FundraisingRoundStatus;
  targetAmount: MonetaryAmount;
  instrument?: FundingInstrument;
  openedAt?: string;
  targetCloseDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Fundraising pipeline — founder-entered relationship states. AFF never
// implies external confirmation unless explicitly recorded by the founder.
// ---------------------------------------------------------------------------

export type PipelineStage =
  | "RESEARCH"
  | "SHORTLISTED"
  | "INTRO_REQUESTED"
  | "CONTACTED"
  | "MEETING"
  | "FOLLOW_UP"
  | "DUE_DILIGENCE"
  | "TERM_SHEET"
  | "COMMITTED"
  | "PASSED"
  | "DECLINED"
  | "ARCHIVED";

// A pipeline relationship in one of these stages counts as "active" for the
// purposes of duplicate-active-relationship prevention (§21).
export const TERMINAL_PIPELINE_STAGES: PipelineStage[] = ["PASSED", "DECLINED", "ARCHIVED"];

export type FundraisingPipelineEntry = {
  id: string;
  startupId: string;
  investorId: string;
  fundraisingRoundId?: string;
  stage: PipelineStage;
  ownerFounderId: string;
  note?: string;
  nextAction?: string;
  nextActionAt?: string;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Interactions — founder-recorded only. Selecting EMAIL/CALL does not mean
// AFF sent an email or made a call; it means the founder logged that they
// did, outside AFF.
// ---------------------------------------------------------------------------

export type InteractionType = "NOTE" | "EMAIL" | "CALL" | "MEETING" | "INTRODUCTION" | "FOLLOW_UP" | "DATA_ROOM_SHARED" | "OTHER";

export type InvestorInteraction = {
  id: string;
  startupId: string;
  investorId: string;
  pipelineEntryId?: string;
  type: InteractionType;
  occurredAt: string;
  summary: string;
  nextAction?: string;
  nextActionAt?: string;
  createdBy: string;
  createdAt: string;
};

// ---------------------------------------------------------------------------
// Introduction requests — REQUESTED means "submitted inside AFF", never
// "investor contacted". INTRODUCED only via an explicit service transition.
// ---------------------------------------------------------------------------

export type IntroductionStatus = "DRAFT" | "REQUESTED" | "UNDER_REVIEW" | "APPROVED" | "DECLINED" | "INTRODUCED" | "CANCELLED";

export type IntroductionStatusEvent = {
  status: IntroductionStatus;
  at: string;
};

export type IntroductionRequest = {
  id: string;
  startupId: string;
  investorId: string;
  fundraisingRoundId?: string;
  status: IntroductionStatus;
  reason?: string;
  context?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  history: IntroductionStatusEvent[];
};

// Factual preparation indicators only — a checklist, never a score. Missing
// items are informational ("recommended before requesting an introduction"),
// never a hard block.
export type ReadinessChecklistItemKey =
  | "profileCompleted"
  | "pitchExists"
  | "fundingRequirementEntered"
  | "dataRoomReady"
  | "financialsAvailable"
  | "readinessAssessmentAvailable";

export type IntroductionReadinessChecklistItem = {
  key: ReadinessChecklistItemKey;
  met: boolean;
};

export type IntroductionReadinessChecklist = {
  items: IntroductionReadinessChecklistItem[];
};

// ---------------------------------------------------------------------------
// Data Room sharing — explicit founder authorization metadata only. No real
// external file access/download/view tracking exists.
// ---------------------------------------------------------------------------

export type DataRoomShareStatus = "ACTIVE" | "REVOKED";

export type DataRoomShare = {
  id: string;
  startupId: string;
  investorId: string;
  pipelineEntryId?: string;
  documentIds: string[];
  status: DataRoomShareStatus;
  createdAt: string;
  revokedAt?: string;
};
