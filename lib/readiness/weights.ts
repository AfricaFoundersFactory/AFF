/**
 * Centralized weighting configuration — the ONLY place stage/dimension/
 * criterion weight numbers live. Nothing in lib/readiness/scoring.ts or any
 * UI component may hardcode a weight; they call the functions below.
 */
import type { StartupStage } from "@/types/common";
import type { BusinessModelType } from "@/types/digital-twin";
import type { CriterionDefinition, DimensionKey, ImportanceTier } from "@/types/readiness-engine";
import { DIMENSION_KEYS } from "@/types/readiness-engine";

// Base dimension weights per stage. Each row is a deliberate reflection of
// what matters most at that stage (see AFF-DASH-03 batch notes) and sums to
// 100 on its own — but the ACTUAL weight used at runtime is always
// recomputed by normalizeWeights() below over only the dimensions that are
// applicable for a given startup (e.g. impact_esg is excluded entirely, not
// zeroed, when the founder has opted out of impact tracking).
const BASE_DIMENSION_WEIGHTS: Record<StartupStage, Record<DimensionKey, number>> = {
  idea: {
    problem_market: 25,
    product: 15,
    business_model: 10,
    traction: 5,
    team: 20,
    finance: 5,
    fundraising: 5,
    operations: 5,
    legal_governance: 5,
    impact_esg: 5,
  },
  mvp: {
    problem_market: 18,
    product: 20,
    business_model: 12,
    traction: 12,
    team: 15,
    finance: 8,
    fundraising: 5,
    operations: 5,
    legal_governance: 3,
    impact_esg: 2,
  },
  early_traction: {
    problem_market: 10,
    product: 14,
    business_model: 16,
    traction: 20,
    team: 12,
    finance: 10,
    fundraising: 8,
    operations: 5,
    legal_governance: 3,
    impact_esg: 2,
  },
  growth: {
    problem_market: 6,
    product: 10,
    business_model: 14,
    traction: 18,
    team: 12,
    finance: 16,
    fundraising: 10,
    operations: 8,
    legal_governance: 4,
    impact_esg: 2,
  },
  scale: {
    problem_market: 4,
    product: 8,
    business_model: 12,
    traction: 16,
    team: 10,
    finance: 18,
    fundraising: 8,
    operations: 14,
    legal_governance: 6,
    impact_esg: 4,
  },
};

export function baseDimensionWeight(stage: StartupStage, dimension: DimensionKey): number {
  return BASE_DIMENSION_WEIGHTS[stage][dimension];
}

/**
 * Normalizes a set of base weights to sum to 1 over only the keys present in
 * `applicable`. Dimensions/criteria excluded from `applicable` get weight 0
 * — they are removed from the calculation, never silently scored as zero.
 */
export function normalizeWeights<K extends string>(base: Record<K, number>, applicable: Iterable<K>): Record<K, number> {
  const keys = Array.from(applicable);
  const total = keys.reduce((sum, key) => sum + (base[key] ?? 0), 0);
  const result = {} as Record<K, number>;
  for (const key of keys) {
    result[key] = total > 0 ? (base[key] ?? 0) / total : 0;
  }
  return result;
}

export function normalizedDimensionWeights(
  stage: StartupStage,
  applicableDimensions: DimensionKey[],
): Record<DimensionKey, number> {
  const base = DIMENSION_KEYS.reduce(
    (acc, key) => ({ ...acc, [key]: baseDimensionWeight(stage, key) }),
    {} as Record<DimensionKey, number>,
  );
  const normalized = normalizeWeights(base, applicableDimensions);
  // Ensure every key exists (0 for excluded dimensions) so callers never hit
  // `undefined`.
  return DIMENSION_KEYS.reduce(
    (acc, key) => ({ ...acc, [key]: normalized[key] ?? 0 }),
    {} as Record<DimensionKey, number>,
  );
}

const TIER_TO_NUMBER: Record<ImportanceTier, number> = {
  not_applicable: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const TIER_ORDER: ImportanceTier[] = ["not_applicable", "low", "medium", "high", "critical"];

function maxTier(a: ImportanceTier, b: ImportanceTier): ImportanceTier {
  return TIER_ORDER.indexOf(a) >= TIER_ORDER.indexOf(b) ? a : b;
}

/**
 * A criterion's importance tier is its stage-based tier, optionally boosted
 * (never reduced) by a business-model-specific emphasis if the startup's
 * business model matches one defined on the criterion. This is the whole of
 * the "business model adaptation" — a small, explicit override table on
 * individual criteria (see lib/readiness/framework.ts), not a parallel
 * scoring engine.
 */
export function resolveImportanceTier(
  criterionDef: CriterionDefinition,
  stage: StartupStage,
  businessModel: BusinessModelType[],
): ImportanceTier {
  let tier = criterionDef.stageApplicability[stage];
  if (criterionDef.businessModelEmphasis) {
    for (const model of businessModel) {
      const emphasis = criterionDef.businessModelEmphasis[model];
      if (emphasis) tier = maxTier(tier, emphasis);
    }
  }
  return tier;
}

export function tierWeight(tier: ImportanceTier): number {
  return TIER_TO_NUMBER[tier];
}

export function isApplicableTier(tier: ImportanceTier): boolean {
  return tier !== "not_applicable";
}
