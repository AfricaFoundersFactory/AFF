// AFF Readiness Engine — domain model.
//
// This is the REAL readiness scoring system: explainable, traceable,
// stage-aware, evidence-aware, confidence-aware and historical. It is
// entirely distinct from Profile Completion (types/profile-completion.ts),
// which only measures whether Digital Twin information exists. A startup
// can have high completion and low readiness, or the reverse — never derive
// one from the other.
//
// Readiness is diagnostic, never investment advice: nothing in this model
// produces a "fundable" verdict, a success probability, or a ranking.

import type { StartupStage } from "./common";
import type { BusinessModelType, StartupDigitalTwin } from "./digital-twin";

export const FRAMEWORK_VERSION = "AFF_READINESS_V1";

export type DimensionKey =
  | "problem_market"
  | "product"
  | "business_model"
  | "traction"
  | "team"
  | "finance"
  | "fundraising"
  | "operations"
  | "legal_governance"
  | "impact_esg";

export const DIMENSION_KEYS: DimensionKey[] = [
  "problem_market",
  "product",
  "business_model",
  "traction",
  "team",
  "finance",
  "fundraising",
  "operations",
  "legal_governance",
  "impact_esg",
];

// Internal scoring scale is deliberately coarse — never a false-precision
// float like 67.48391. Every criterion lands on one of these five rungs, or
// null when it cannot be evaluated at all.
export type CriterionScoreValue = 0 | 25 | 50 | 75 | 100;

export type CriterionStatus = "strong" | "good" | "developing" | "weak" | "insufficient_evidence" | "not_applicable";

export type DimensionStatus = "strong" | "good" | "developing" | "weak" | "not_applicable";

// How much a criterion matters at a given stage / for a given business
// model. "not_applicable" removes it from scoring entirely (never scored as
// zero) — see lib/readiness/weights.ts.
export type ImportanceTier = "not_applicable" | "low" | "medium" | "high" | "critical";

export type EvidenceSourceType =
  | "digital_twin"
  | "assessment_answer"
  | "document"
  | "founder_declaration"
  | "expert_review"
  | "verified_external_data";

// Deliberately conservative: demo/founder-entered data is never marked
// expert_verified or externally_verified.
export type EvidenceVerificationStatus =
  | "unverified"
  | "founder_declared"
  | "documented"
  | "expert_verified"
  | "externally_verified";

export type EvidenceReference = {
  id: string;
  sourceType: EvidenceSourceType;
  // A stable, technical (untranslated) pointer, e.g. "traction.metrics.mrr"
  // or "answer.founder_commitment" — not user-facing prose.
  sourcePath: string;
  capturedAt: string;
  verificationStatus: EvidenceVerificationStatus;
};

// ---------------------------------------------------------------------------
// Framework configuration (static data — see lib/readiness/framework.ts)
// ---------------------------------------------------------------------------

export type CriterionDefinition = {
  id: string;
  dimension: DimensionKey;
  stageApplicability: Record<StartupStage, ImportanceTier>;
  businessModelEmphasis?: Partial<Record<BusinessModelType, ImportanceTier>>;
};

export type DimensionDefinition = {
  key: DimensionKey;
  criteria: CriterionDefinition[];
};

// ---------------------------------------------------------------------------
// Evaluation context & results
// ---------------------------------------------------------------------------

export type AssessmentAnswerValue = string | number | boolean | string[];

export type EvaluationContext = {
  twin: StartupDigitalTwin;
  answers: Record<string, AssessmentAnswerValue>;
  stage: StartupStage;
  businessModel: BusinessModelType[];
  // Supplied once by the caller (never Date.now() inside an evaluator) so
  // that evaluating the same inputs always produces identical evidence.
  assessedAt: string;
};

// What a single criterion evaluator function returns — pure, deterministic,
// no I/O, no Date.now() influencing the score.
export type CriterionEvaluation = {
  rawScore: CriterionScoreValue | null;
  evidence: EvidenceReference[];
  missingEvidenceKeys: string[];
};

export type CriterionResult = {
  criterionId: string;
  dimension: DimensionKey;
  status: CriterionStatus;
  rawScore: CriterionScoreValue | null;
  normalizedScore: CriterionScoreValue | null;
  weight: number;
  confidence: number;
  evaluability: boolean;
  evidence: EvidenceReference[];
  missingEvidence: string[];
  explanationKey: string;
  improvementHintKey: string;
};

export type DimensionResult = {
  dimension: DimensionKey;
  score: number | null;
  previousScore: number | null;
  confidence: number;
  status: DimensionStatus;
  weight: number;
  criteria: CriterionResult[];
  strengths: string[];
  gaps: string[];
  potentialImprovement: number;
};

// ---------------------------------------------------------------------------
// Adaptive questionnaire
// ---------------------------------------------------------------------------

export type QuestionType = "yes_no" | "single_select" | "multi_select" | "number" | "percentage" | "text" | "scale";

export type QuestionOption = { value: string; labelKey: string };

export type QuestionDefinition = {
  id: string;
  dimension: DimensionKey;
  criterionId: string;
  type: QuestionType;
  labelKey: string;
  helpKey?: string;
  options?: QuestionOption[];
  required: boolean;
  // Skip this question when the current Digital Twin/answers already make it
  // moot (e.g. don't ask about revenue consistency when there's no revenue
  // yet at all).
  applicableIf?: (ctx: Pick<EvaluationContext, "twin" | "answers" | "stage">) => boolean;
};

// ---------------------------------------------------------------------------
// Assessment snapshot (immutable once completed)
// ---------------------------------------------------------------------------

export type AssessmentAnswer = {
  questionId: string;
  value: AssessmentAnswerValue;
  answeredAt: string;
};

export type AssessmentStatus = "draft" | "completed";

export type ReadinessAssessment = {
  id: string;
  startupId: string;
  version: number;
  frameworkVersion: string;
  status: AssessmentStatus;
  startupStageAtAssessment: StartupStage;
  businessModelAtAssessment: BusinessModelType[];
  startedAt: string;
  completedAt?: string;
  overallScore: number | null;
  overallConfidence: number;
  dimensions: DimensionResult[];
  answers: AssessmentAnswer[];
  evidenceSnapshot: EvidenceReference[];
};

export type ReadinessInterpretationBand = "early" | "developing" | "progressing" | "strong" | "advanced";
