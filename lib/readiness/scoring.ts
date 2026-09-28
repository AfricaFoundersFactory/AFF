/**
 * Deterministic scoring engine V1 — the ONLY place a readiness score is
 * computed. Pure functions, no React, no I/O: given the same Digital Twin,
 * the same answers and the same framework version, evaluateAssessment()
 * always returns the same score, confidence, strengths and gaps.
 *
 * Two weight normalizations run side by side within every dimension (and
 * again across dimensions for the overall figures):
 *  - the SCORE uses weights renormalized over only the criteria/dimensions
 *    that were actually evaluable, so missing evidence never drags the
 *    score toward zero;
 *  - CONFIDENCE uses weights normalized over everything applicable
 *    (evaluable or not), so missing evidence visibly lowers confidence
 *    without touching the score. This is what makes "Score 76, Confidence
 *    34%" possible — see lib/readiness/confidence.ts for the full formula.
 */
import type {
  CriterionResult,
  CriterionStatus,
  DimensionKey,
  DimensionResult,
  DimensionStatus,
  EvaluationContext,
} from "@/types/readiness-engine";
import { DIMENSION_KEYS } from "@/types/readiness-engine";
import { allCriteria, criteriaForDimension } from "./framework";
import { normalizeWeights, normalizedDimensionWeights, resolveImportanceTier, tierWeight, isApplicableTier } from "./weights";
import { clamp, criterionConfidenceFromEvidence, weightedAverageConfidence } from "./confidence";
import { CRITERION_EVALUATORS } from "./evaluators";

function statusFromScore(score: number | null): CriterionStatus {
  if (score === null) return "insufficient_evidence";
  if (score >= 100) return "strong";
  if (score >= 75) return "good";
  if (score >= 50) return "developing";
  return "weak";
}

function dimensionStatusFromScore(score: number | null): DimensionStatus {
  if (score === null) return "not_applicable";
  if (score >= 85) return "strong";
  if (score >= 70) return "good";
  if (score >= 50) return "developing";
  return "weak";
}

function evaluateCriterion(criterionId: string, dimension: DimensionKey, weight: number, ctx: EvaluationContext): CriterionResult {
  const evaluator = CRITERION_EVALUATORS[criterionId];
  const result = evaluator(ctx);
  const confidence = result.rawScore === null ? 0 : criterionConfidenceFromEvidence(result.evidence);

  return {
    criterionId,
    dimension,
    status: statusFromScore(result.rawScore),
    rawScore: result.rawScore,
    normalizedScore: result.rawScore,
    weight,
    confidence,
    evaluability: result.rawScore !== null,
    evidence: result.evidence,
    missingEvidence: result.missingEvidenceKeys,
    explanationKey: `dashboard.readiness.criteria.${criterionId}.explanation`,
    improvementHintKey: `dashboard.readiness.criteria.${criterionId}.improvementHint`,
  };
}

/**
 * Illustrative, non-promissory upside: assumes every currently weak/
 * developing/unevaluated-but-applicable criterion could reasonably reach a
 * "good" (75) result, and reports the resulting point gain at the dimension
 * level. This explains what improving weak spots COULD do — it is never a
 * guarantee tied to a specific action (see AFF-DASH-03 Part 14).
 */
function potentialImprovement(criteria: CriterionResult[], currentScore: number | null): number {
  if (currentScore === null) return 0;
  const target = 75;
  const improvable = criteria.filter((c) => c.rawScore === null || c.rawScore < target);
  if (improvable.length === 0) return 0;

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return 0;

  const upside = improvable.reduce((sum, c) => {
    const current = c.rawScore ?? 0;
    return sum + (c.weight / totalWeight) * Math.max(0, target - current);
  }, 0);

  return Math.round(clamp(upside, 0, 100 - currentScore));
}

function pickStrengthsAndGaps(criteria: CriterionResult[]): { strengths: string[]; gaps: string[] } {
  const strengths = criteria
    .filter((c) => c.status === "strong" || c.status === "good")
    .sort((a, b) => (b.rawScore ?? 0) - (a.rawScore ?? 0) || b.weight - a.weight)
    .slice(0, 3)
    .map((c) => c.criterionId);

  const gaps = criteria
    .filter((c) => c.status === "weak" || c.status === "insufficient_evidence")
    .sort((a, b) => b.weight - a.weight || (a.rawScore ?? -1) - (b.rawScore ?? -1))
    .slice(0, 3)
    .map((c) => c.criterionId);

  return { strengths, gaps };
}

export function evaluateDimension(
  dimension: DimensionKey,
  ctx: EvaluationContext,
  previousDimension?: DimensionResult | null,
): DimensionResult {
  const isImpactAndDisabled = dimension === "impact_esg" && !ctx.twin.impact.enabled;

  const definitions = criteriaForDimension(dimension);
  const tiersById = new Map(
    definitions.map((def) => [def.id, resolveImportanceTier(def, ctx.stage, ctx.businessModel)]),
  );

  const applicableIds = isImpactAndDisabled ? [] : definitions.map((d) => d.id).filter((id) => isApplicableTier(tiersById.get(id)!));

  if (applicableIds.length === 0) {
    return {
      dimension,
      score: null,
      previousScore: previousDimension?.score ?? null,
      confidence: 0,
      status: "not_applicable",
      weight: 0,
      criteria: [],
      strengths: [],
      gaps: [],
      potentialImprovement: 0,
    };
  }

  const baseWeights = Object.fromEntries(applicableIds.map((id) => [id, tierWeight(tiersById.get(id)!)]));
  const confidenceWeights = normalizeWeights(baseWeights, applicableIds);

  const criteria = applicableIds.map((id) => evaluateCriterion(id, dimension, confidenceWeights[id], ctx));

  const evaluableIds = criteria.filter((c) => c.evaluability).map((c) => c.criterionId);
  const scoreWeights = normalizeWeights(baseWeights, evaluableIds);

  const score =
    evaluableIds.length === 0
      ? null
      : Math.round(
          criteria.reduce((sum, c) => sum + (c.evaluability ? scoreWeights[c.criterionId] * (c.rawScore ?? 0) : 0), 0),
        );

  const confidence = weightedAverageConfidence(criteria.map((c) => ({ weight: c.weight, confidence: c.confidence })));
  const { strengths, gaps } = pickStrengthsAndGaps(criteria);

  return {
    dimension,
    score,
    previousScore: previousDimension?.score ?? null,
    confidence,
    status: dimensionStatusFromScore(score),
    weight: 0, // filled in by evaluateAssessment, which knows the full applicable-dimension set
    criteria,
    strengths,
    gaps,
    potentialImprovement: potentialImprovement(criteria, score),
  };
}

export type OverallResult = {
  overallScore: number | null;
  overallConfidence: number;
  dimensions: DimensionResult[];
};

export function evaluateAssessment(
  ctx: EvaluationContext,
  previousDimensionsByKey?: Partial<Record<DimensionKey, DimensionResult>>,
): OverallResult {
  const rawDimensions = DIMENSION_KEYS.map((key) =>
    evaluateDimension(key, ctx, previousDimensionsByKey?.[key] ?? null),
  );

  const applicableDimensionKeys = rawDimensions.filter((d) => d.score !== null || d.status !== "not_applicable").map((d) => d.dimension);
  // A dimension only truly participates in the overall score once it has a
  // computed score; dimensions with zero evaluable criteria are excluded
  // from THIS assessment's math (their weight would otherwise be
  // undefined), same as fully not-applicable dimensions.
  const scoreableDimensionKeys = rawDimensions.filter((d) => d.score !== null).map((d) => d.dimension);

  const confidenceDimWeights = normalizedDimensionWeights(ctx.stage, applicableDimensionKeys);
  const scoreDimWeights = normalizedDimensionWeights(ctx.stage, scoreableDimensionKeys);

  const dimensions = rawDimensions.map((d) => ({
    ...d,
    weight: applicableDimensionKeys.includes(d.dimension) ? confidenceDimWeights[d.dimension] : 0,
  }));

  const overallScore =
    scoreableDimensionKeys.length === 0
      ? null
      : Math.round(dimensions.reduce((sum, d) => sum + (d.score !== null ? scoreDimWeights[d.dimension] * d.score : 0), 0));

  const overallConfidence = weightedAverageConfidence(
    dimensions
      .filter((d) => applicableDimensionKeys.includes(d.dimension))
      .map((d) => ({ weight: confidenceDimWeights[d.dimension], confidence: d.confidence })),
  );

  return { overallScore, overallConfidence, dimensions };
}

export function allCriterionIds(): string[] {
  return allCriteria().map((c) => c.id);
}
