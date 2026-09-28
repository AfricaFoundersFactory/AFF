/**
 * Pitch Readiness Engine V1 (AFF-DASH-05 Part 11/12/13) — a wholly SEPARATE
 * deterministic engine from lib/readiness/scoring.ts (AFF Readiness).
 *
 * NEVER conflate the two:
 *  - AFF Readiness measures whether a STARTUP is investment/program ready.
 *  - Pitch Readiness measures whether a PITCH VERSION is prepared for its
 *    intended audience/format.
 * Computing this never writes to, and is never averaged into, an AFF
 * Readiness score. See lib/services/pitch.ts for where it's invoked (only
 * ever recomputed explicitly, never as a side effect of Roadmap/Task
 * completion).
 *
 * Determinism: computePitchReadiness(version, twin) is a pure function of
 * its inputs only — no Date.now() in the scoring math, no randomness, no
 * AI/LLM call. Same version + same twin => same result, always.
 *
 * Scoring evaluates STRUCTURED PRESENCE AND EVIDENCE, never text length or
 * prose quality — see each dimension evaluator below for exactly what is
 * checked. Confidence is computed SEPARATELY from score: it reflects how
 * much of each dimension's checkable evidence actually exists (structure,
 * source references, required fields), and explicitly does NOT — and
 * cannot — assess persuasiveness, storytelling quality, semantic
 * consistency, language quality, or investor objections. UI copy
 * (messages/{en,fr}.json → dashboard.pitch.readiness.confidenceDisclaimer)
 * must keep stating this plainly.
 */
import type { PitchReadinessDimensionKey, PitchReadinessResult, PitchSection, PitchVersion } from "@/types/pitch";
import type { StartupDigitalTwin } from "@/types/digital-twin";

type DimensionEval = { score: number; presentSignals: number; totalSignals: number };

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

function section(version: PitchVersion, type: PitchSection["type"]): PitchSection | undefined {
  return version.sections.find((s) => s.type === type);
}

function hasContent(s: PitchSection | undefined): boolean {
  return Boolean(s && s.content.trim().length > 0);
}

function hasKeyPoints(s: PitchSection | undefined): boolean {
  return Boolean(s && s.keyPoints.length > 0);
}

function hasEvidence(s: PitchSection | undefined): boolean {
  return Boolean(s && s.sourceReferences.length > 0);
}

function evalFromChecks(checks: boolean[]): DimensionEval {
  const total = checks.length;
  const present = checks.filter(Boolean).length;
  return { score: clamp(Math.round((present / total) * 100)), presentSignals: present, totalSignals: total };
}

// ---------------------------------------------------------------------------
// Dimension evaluators — each returns {score, presentSignals, totalSignals}.
// `score` feeds the overall Pitch Readiness score; presentSignals/totalSignals
// feed confidence (see computePitchReadiness below).
// ---------------------------------------------------------------------------

function narrativeClarity(version: PitchVersion): DimensionEval {
  const hook = section(version, "hook");
  const problem = section(version, "problem");
  const solution = section(version, "solution");
  const closing = section(version, "closing");
  return evalFromChecks([hasContent(hook), hasContent(problem), hasContent(solution), hasContent(closing)]);
}

function problemEvidence(version: PitchVersion, twin: StartupDigitalTwin): DimensionEval {
  const problem = section(version, "problem");
  return evalFromChecks([
    hasContent(problem),
    hasEvidence(problem),
    Boolean(twin.problem.evidence),
    Boolean(twin.problem.painSeverity),
    hasKeyPoints(problem),
  ]);
}

function solutionClarity(version: PitchVersion): DimensionEval {
  const solution = section(version, "solution");
  const product = section(version, "product");
  return evalFromChecks([hasContent(solution), hasKeyPoints(solution), hasContent(product) || hasKeyPoints(product)]);
}

function marketStory(version: PitchVersion, twin: StartupDigitalTwin): DimensionEval {
  const market = section(version, "market");
  return evalFromChecks([
    hasContent(market),
    hasKeyPoints(market),
    Boolean(twin.market.tam || twin.market.sam || twin.market.som),
    twin.market.customerSegments.length > 0,
  ]);
}

function businessModelDimension(version: PitchVersion, twin: StartupDigitalTwin): DimensionEval {
  const bm = section(version, "business_model");
  return evalFromChecks([hasContent(bm), twin.businessModel.types.length > 0, twin.businessModel.revenueStreams.length > 0]);
}

/**
 * Traction Story — the spec's explicit example of "evaluate evidence, not
 * text length": strong = metrics + narrative + metric source references all
 * present; weak = a generic claim with no evidence and no metrics.
 */
function tractionStory(version: PitchVersion, twin: StartupDigitalTwin): DimensionEval {
  const traction = section(version, "traction");
  return evalFromChecks([
    hasContent(traction),
    twin.traction.metrics.length > 0,
    hasEvidence(traction),
    Boolean(twin.traction.narrative),
  ]);
}

function differentiation(version: PitchVersion, twin: StartupDigitalTwin): DimensionEval {
  const competition = section(version, "competition");
  return evalFromChecks([hasContent(competition), twin.market.competitors.length > 0, Boolean(twin.market.competitiveAdvantage)]);
}

function teamStory(version: PitchVersion, twin: StartupDigitalTwin): DimensionEval {
  const team = section(version, "team");
  return evalFromChecks([hasContent(team), twin.founders.length > 0, twin.founders.some((f) => Boolean(f.bio))]);
}

function financialFundingClarity(version: PitchVersion, twin: StartupDigitalTwin): DimensionEval {
  const financials = section(version, "financials");
  return evalFromChecks([
    hasContent(financials),
    twin.financials.monthlyRevenue !== undefined || twin.financials.annualRevenue !== undefined,
    twin.financials.runwayMonths !== undefined,
  ]);
}

function askClarity(version: PitchVersion, twin: StartupDigitalTwin): DimensionEval {
  const ask = section(version, "fundraising_ask");
  return evalFromChecks([hasContent(ask), Boolean(twin.funding.targetRaise), Boolean(twin.funding.useOfFunds)]);
}

function evidenceCoverage(version: PitchVersion): DimensionEval {
  const requiredSections = version.sections.filter((s) => s.required);
  if (requiredSections.length === 0) return { score: 0, presentSignals: 0, totalSignals: 1 };
  const withEvidence = requiredSections.filter((s) => hasEvidence(s) || hasKeyPoints(s)).length;
  return {
    score: clamp(Math.round((withEvidence / requiredSections.length) * 100)),
    presentSignals: withEvidence,
    totalSignals: requiredSections.length,
  };
}

function pitchCompleteness(version: PitchVersion): DimensionEval {
  const requiredSections = version.sections.filter((s) => s.required);
  if (requiredSections.length === 0) return { score: 0, presentSignals: 0, totalSignals: 1 };
  const complete = requiredSections.filter((s) => s.status === "complete" || hasContent(s)).length;
  return {
    score: clamp(Math.round((complete / requiredSections.length) * 100)),
    presentSignals: complete,
    totalSignals: requiredSections.length,
  };
}

const DIMENSION_EVALUATORS: Record<
  PitchReadinessDimensionKey,
  (version: PitchVersion, twin: StartupDigitalTwin) => DimensionEval
> = {
  narrative_clarity: (v) => narrativeClarity(v),
  problem_evidence: (v, t) => problemEvidence(v, t),
  solution_clarity: (v) => solutionClarity(v),
  market_story: (v, t) => marketStory(v, t),
  business_model: (v, t) => businessModelDimension(v, t),
  traction_story: (v, t) => tractionStory(v, t),
  differentiation: (v, t) => differentiation(v, t),
  team_story: (v, t) => teamStory(v, t),
  financial_funding_clarity: (v, t) => financialFundingClarity(v, t),
  ask_clarity: (v, t) => askClarity(v, t),
  evidence_coverage: (v) => evidenceCoverage(v),
  pitch_completeness: (v) => pitchCompleteness(v),
};

export const PITCH_READINESS_DIMENSION_KEYS: PitchReadinessDimensionKey[] = [
  "narrative_clarity",
  "problem_evidence",
  "solution_clarity",
  "market_story",
  "business_model",
  "traction_story",
  "differentiation",
  "team_story",
  "financial_funding_clarity",
  "ask_clarity",
  "evidence_coverage",
  "pitch_completeness",
];

/**
 * The one function that computes Pitch Readiness. Deterministic: same
 * (version, twin) input always yields the same output (no wall-clock
 * dependence except `computedAt`, which is metadata, not part of the score
 * or confidence math).
 */
export function computePitchReadiness(version: PitchVersion, twin: StartupDigitalTwin, nowIso: string): PitchReadinessResult {
  const evals = PITCH_READINESS_DIMENSION_KEYS.map((key) => ({ key, ...DIMENSION_EVALUATORS[key](version, twin) }));

  const overallScore = clamp(Math.round(evals.reduce((sum, e) => sum + e.score, 0) / evals.length));

  const totalSignals = evals.reduce((sum, e) => sum + e.totalSignals, 0);
  const presentSignals = evals.reduce((sum, e) => sum + e.presentSignals, 0);
  const overallConfidence = totalSignals === 0 ? 0 : clamp(Math.round((presentSignals / totalSignals) * 100));

  return {
    score: overallScore,
    confidence: overallConfidence,
    dimensions: evals.map((e) => ({ key: e.key, score: e.score })),
    computedAt: nowIso,
  };
}
