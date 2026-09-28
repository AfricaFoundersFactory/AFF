/**
 * Deterministic Opportunity relevance engine — pure functions only, no
 * randomness, no Date.now(). NEVER produces a score or percentage; every
 * result is a list of human-readable MATCH/MISMATCH reasons (mirrors
 * lib/experts/matching.ts exactly).
 *
 * Primary inputs are Digital Twin fields (country/industry/stage/business
 * model) — Readiness/funding requirement is used ONLY where explicitly
 * relevant (a funding-amount-gated opportunity), never as a generic
 * ranking score, and nothing here mutates Digital Twin or Readiness (see
 * lib/services/opportunities-metric-separation.test.ts).
 */
import type { Opportunity, OpportunityMatch, OpportunityMatchReason } from "@/types/opportunity";
import type { BusinessModelType, StartupDigitalTwin } from "@/types/digital-twin";
import type { StartupStage } from "@/types/common";

export type OpportunityMatchContext = {
  country: string;
  operatingCountries: string[];
  industry?: string;
  stage: StartupStage;
  businessModelTypes: BusinessModelType[];
};

export function buildOpportunityMatchContext(twin: StartupDigitalTwin): OpportunityMatchContext {
  return {
    country: twin.identity.country,
    operatingCountries: twin.identity.operatingCountries ?? [],
    industry: twin.identity.industry,
    stage: twin.identity.stage,
    businessModelTypes: twin.businessModel.types,
  };
}

function countriesOf(ctx: OpportunityMatchContext): string[] {
  return [ctx.country, ...ctx.operatingCountries].filter(Boolean).map((c) => c.toLowerCase());
}

export function explainOpportunityMatch(opportunity: Opportunity, ctx: OpportunityMatchContext): OpportunityMatchReason[] {
  const reasons: OpportunityMatchReason[] = [];
  const founderCountries = countriesOf(ctx);

  // Geography
  if (opportunity.countries.length === 0) {
    reasons.push({ key: "geography_open", kind: "MATCH", labelKey: "dashboard.opportunities.matching.reasons.geographyOpen" });
  } else {
    const matchesCountry = opportunity.countries.some((c) => founderCountries.includes(c.toLowerCase()));
    if (matchesCountry) {
      reasons.push({
        key: "geography_match",
        kind: "MATCH",
        labelKey: "dashboard.opportunities.matching.reasons.geographyMatch",
        data: { country: ctx.country },
      });
    } else {
      reasons.push({
        key: "geography_mismatch",
        kind: "MISMATCH",
        labelKey: "dashboard.opportunities.matching.reasons.geographyMismatch",
        data: { countries: opportunity.countries.join(", ") },
      });
    }
  }

  // Stage
  if (opportunity.startupStages.length === 0 || opportunity.startupStages.includes(ctx.stage)) {
    reasons.push({
      key: "stage_match",
      kind: "MATCH",
      labelKey: "dashboard.opportunities.matching.reasons.stageMatch",
      data: { stage: ctx.stage },
    });
  } else {
    reasons.push({
      key: "stage_mismatch",
      kind: "MISMATCH",
      labelKey: "dashboard.opportunities.matching.reasons.stageMismatch",
      data: { stages: opportunity.startupStages.join(", ") },
    });
  }

  // Industry
  if (opportunity.industries.length === 0) {
    reasons.push({ key: "industry_open", kind: "MATCH", labelKey: "dashboard.opportunities.matching.reasons.industryOpen" });
  } else if (ctx.industry && opportunity.industries.some((i) => i.toLowerCase() === ctx.industry?.toLowerCase())) {
    reasons.push({
      key: "industry_match",
      kind: "MATCH",
      labelKey: "dashboard.opportunities.matching.reasons.industryMatch",
      data: { industry: ctx.industry },
    });
  } else if (ctx.industry) {
    reasons.push({
      key: "industry_mismatch",
      kind: "MISMATCH",
      labelKey: "dashboard.opportunities.matching.reasons.industryMismatch",
      data: { industries: opportunity.industries.join(", ") },
    });
  }

  // Business model — only surfaced when the opportunity restricts to a
  // specific business model AND the startup declares any at all.
  const requiresBusinessModel = opportunity.requirements.some((r) => r.key === "business_model_saas");
  if (requiresBusinessModel) {
    if (ctx.businessModelTypes.includes("saas") || ctx.businessModelTypes.includes("subscription")) {
      reasons.push({ key: "business_model_match", kind: "MATCH", labelKey: "dashboard.opportunities.matching.reasons.businessModelMatch" });
    } else {
      reasons.push({ key: "business_model_mismatch", kind: "MISMATCH", labelKey: "dashboard.opportunities.matching.reasons.businessModelMismatch" });
    }
  }

  return reasons;
}

function matchCount(reasons: OpportunityMatchReason[]): number {
  return reasons.filter((r) => r.kind === "MATCH").length;
}

/** Sorted by MATCH-reason count (never a score), most relevant first. */
export function matchOpportunities(opportunities: Opportunity[], ctx: OpportunityMatchContext): OpportunityMatch[] {
  return opportunities
    .map((opportunity) => ({ opportunity, reasons: explainOpportunityMatch(opportunity, ctx) }))
    .sort((a, b) => matchCount(b.reasons) - matchCount(a.reasons));
}
