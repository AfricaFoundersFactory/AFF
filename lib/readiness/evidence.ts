import type { EvidenceReference, EvidenceSourceType, EvidenceVerificationStatus } from "@/types/readiness-engine";

// IDs are derived purely from their inputs (never a counter or Date.now())
// so that evaluating the same context twice produces byte-for-byte identical
// evidence — required by the engine's determinism guarantee.
function build(
  sourceType: EvidenceSourceType,
  sourcePath: string,
  verificationStatus: EvidenceVerificationStatus,
  capturedAt: string,
): EvidenceReference {
  return { id: `${sourceType}:${sourcePath}`, sourceType, sourcePath, capturedAt, verificationStatus };
}

/**
 * Evidence pulled directly from the Digital Twin. `verified` should mirror
 * the underlying field's own verification flag where one exists (e.g.
 * TractionMetric.verified) — we never claim more certainty than the founder
 * themselves recorded.
 */
export function twinEvidence(sourcePath: string, capturedAt: string, verified = false): EvidenceReference {
  return build("digital_twin", sourcePath, verified ? "documented" : "unverified", capturedAt);
}

/** Evidence from an assessment answer — always self-reported by the founder. */
export function answerEvidence(questionId: string, capturedAt: string): EvidenceReference {
  return build("assessment_answer", `answer.${questionId}`, "founder_declared", capturedAt);
}
