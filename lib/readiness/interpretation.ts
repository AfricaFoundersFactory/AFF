import type { ReadinessInterpretationBand } from "@/types/readiness-engine";

// Product-maturity descriptors ONLY — never investment advice. Readiness is
// diagnostic; nothing here implies "fundable" or "good/bad investment".
export function interpretScore(score: number | null): ReadinessInterpretationBand | null {
  if (score === null) return null;
  if (score >= 85) return "advanced";
  if (score >= 70) return "strong";
  if (score >= 50) return "progressing";
  if (score >= 25) return "developing";
  return "early";
}
