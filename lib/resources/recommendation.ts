/**
 * Deterministic Resource recommendation engine — pure functions only.
 * Recommendations are derived from real Readiness dimension gaps, Pitch
 * Lab gaps, Financial signals and stage — NEVER an AI suggestion, never a
 * score. Each recommendation carries a plain-language reason (see
 * dashboard.resources.recommendation.reasons.* in messages/en.json).
 */
import type { Resource, ResourceCategory, ResourceRecommendation, ResourceRecommendationReason } from "@/types/resources";
import type { DimensionKey, DimensionStatus } from "@/types/readiness-engine";
import type { StartupStage } from "@/types/common";
import type { FinancialSignalKey } from "@/types/financials";

// Deterministic, explicit mapping — never inferred/guessed at runtime.
const DIMENSION_TO_CATEGORY: Record<DimensionKey, ResourceCategory> = {
  problem_market: "PROBLEM_VALIDATION",
  product: "PRODUCT",
  business_model: "BUSINESS_MODEL",
  traction: "SALES",
  team: "TEAM",
  finance: "FINANCE",
  fundraising: "FUNDRAISING",
  operations: "OPERATIONS",
  legal_governance: "LEGAL",
  impact_esg: "IMPACT_ESG",
};

const WEAK_STATUSES: DimensionStatus[] = ["weak", "developing"];

export type ResourceRecommendationSignals = {
  stage: StartupStage;
  weakDimensions: DimensionKey[];
  pitchGapCategories?: ResourceCategory[];
  financialSignalKeys?: FinancialSignalKey[];
};

const FINANCIAL_SIGNAL_TO_CATEGORY: Partial<Record<FinancialSignalKey, ResourceCategory>> = {
  runway_below_3_months: "FINANCE",
  runway_below_6_months: "FINANCE",
  no_forecast: "FUNDRAISING",
  funding_exceeds_forecast_need: "FUNDRAISING",
};

export function isWeakDimension(status: DimensionStatus): boolean {
  return WEAK_STATUSES.includes(status);
}

export function recommendResources(resources: Resource[], signals: ResourceRecommendationSignals): ResourceRecommendation[] {
  const results: ResourceRecommendation[] = [];

  for (const resource of resources) {
    const reasons: ResourceRecommendationReason[] = [];

    if (signals.weakDimensions.some((d) => DIMENSION_TO_CATEGORY[d] === resource.category)) {
      reasons.push({
        kind: "READINESS_GAP",
        labelKey: "dashboard.resources.recommendation.reasons.readinessGap",
        data: { category: resource.category },
      });
    }
    if (signals.pitchGapCategories?.includes(resource.category)) {
      reasons.push({ kind: "PITCH_GAP", labelKey: "dashboard.resources.recommendation.reasons.pitchGap", data: { category: resource.category } });
    }
    if (signals.financialSignalKeys?.some((key) => FINANCIAL_SIGNAL_TO_CATEGORY[key] === resource.category)) {
      reasons.push({
        kind: "FINANCIAL_SIGNAL",
        labelKey: "dashboard.resources.recommendation.reasons.financialSignal",
        data: { category: resource.category },
      });
    }
    if (reasons.length > 0) {
      results.push({ resource, reasons });
    }
  }

  // Deterministic order: most reasons first, then stable by resource id.
  return results.sort((a, b) => b.reasons.length - a.reasons.length || a.resource.id.localeCompare(b.resource.id));
}
