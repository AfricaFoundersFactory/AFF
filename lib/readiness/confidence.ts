/**
 * Deterministic V1 confidence model.
 *
 * Confidence answers "how much should you trust this score?" — it is NOT
 * derived from the score itself. A dimension can score well on the few
 * criteria AFF could evaluate while still carrying low confidence, because
 * many applicable criteria had no usable evidence.
 *
 * Formula (documented here, not scattered across components):
 *
 * 1. Each piece of evidence has a trust weight based on its verification
 *    status (see EVIDENCE_CONFIDENCE below) — self-reported data trusted
 *    less than documented data, which is trusted less than anything
 *    expert/externally verified (never claimed for demo data).
 * 2. A criterion's confidence = average evidence trust weight across its own
 *    evidence, as a 0-100 score. A criterion with NO evidence (insufficient
 *    evidence) has confidence 0.
 * 3. A dimension's confidence = the weighted average of ALL its APPLICABLE
 *    criteria's confidence (weight = the same importance weight used for
 *    scoring), where non-evaluable criteria contribute 0. This is what lets
 *    missing evidence drag down confidence without ever touching the score
 *    average (which only runs over evaluable criteria) — exactly the
 *    "missing data affects confidence, not automatically maturity" rule.
 * 4. Overall confidence = the weighted average of dimension confidences,
 *    using the same normalized dimension weights used for the overall
 *    score.
 *
 * No randomness, no Date.now(), no AI calls.
 */
import type { EvidenceReference, EvidenceVerificationStatus } from "@/types/readiness-engine";

const EVIDENCE_CONFIDENCE: Record<EvidenceVerificationStatus, number> = {
  unverified: 0.3,
  founder_declared: 0.5,
  documented: 0.7,
  expert_verified: 0.9,
  externally_verified: 1.0,
};

export function criterionConfidenceFromEvidence(evidence: EvidenceReference[]): number {
  if (evidence.length === 0) return 0;
  const avg = evidence.reduce((sum, e) => sum + EVIDENCE_CONFIDENCE[e.verificationStatus], 0) / evidence.length;
  return Math.round(avg * 100);
}

export type WeightedConfidenceEntry = { weight: number; confidence: number };

/** Weighted average of confidence values; entries with zero total weight yield 0. */
export function weightedAverageConfidence(entries: WeightedConfidenceEntry[]): number {
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
  if (totalWeight === 0) return 0;
  const weighted = entries.reduce((sum, e) => sum + e.weight * e.confidence, 0) / totalWeight;
  return Math.round(clamp(weighted, 0, 100));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
