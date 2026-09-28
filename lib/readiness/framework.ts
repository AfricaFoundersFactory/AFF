/**
 * AFF Readiness Framework — static configuration (data, not logic).
 *
 * This is the single source of truth for which criteria exist, which
 * dimension they belong to, and how important each one is at each startup
 * stage (and optionally for certain business models). Nothing here computes
 * a score — see lib/readiness/scoring.ts for that. Keeping this file
 * data-only is what makes the weighting "inspectable" and free of scattered
 * magic constants.
 */
import type { StartupStage } from "@/types/common";
import type { BusinessModelType } from "@/types/digital-twin";
import type { CriterionDefinition, DimensionDefinition, DimensionKey, ImportanceTier } from "@/types/readiness-engine";
import { DIMENSION_KEYS } from "@/types/readiness-engine";

function tiers(
  idea: ImportanceTier,
  mvp: ImportanceTier,
  early_traction: ImportanceTier,
  growth: ImportanceTier,
  scale: ImportanceTier,
): Record<StartupStage, ImportanceTier> {
  return { idea, mvp, early_traction, growth, scale };
}

function criterion(
  id: string,
  dimension: DimensionKey,
  stageApplicability: Record<StartupStage, ImportanceTier>,
  businessModelEmphasis?: Partial<Record<BusinessModelType, ImportanceTier>>,
): CriterionDefinition {
  return { id, dimension, stageApplicability, businessModelEmphasis };
}

const problemMarket: CriterionDefinition[] = [
  criterion("problem_clarity", "problem_market", tiers("critical", "high", "medium", "low", "low")),
  criterion("target_customer_definition", "problem_market", tiers("critical", "high", "medium", "medium", "low")),
  criterion("market_evidence", "problem_market", tiers("high", "high", "medium", "medium", "low")),
  criterion("competitive_understanding", "problem_market", tiers("medium", "medium", "high", "high", "medium")),
  criterion("market_sizing", "problem_market", tiers("medium", "medium", "medium", "high", "high")),
];

const product: CriterionDefinition[] = [
  criterion("solution_definition", "product", tiers("critical", "high", "medium", "low", "low")),
  criterion("development_stage", "product", tiers("high", "critical", "high", "medium", "low")),
  criterion("product_validation", "product", tiers("medium", "high", "critical", "high", "medium")),
  criterion("differentiation", "product", tiers("medium", "medium", "high", "high", "high")),
  criterion("technical_feasibility", "product", tiers("high", "high", "medium", "medium", "low")),
  criterion("adoption", "product", tiers("not_applicable", "medium", "high", "high", "medium")),
  criterion("product_roadmap", "product", tiers("low", "medium", "medium", "high", "high")),
];

const businessModel: CriterionDefinition[] = [
  criterion("revenue_model_clarity", "business_model", tiers("medium", "high", "critical", "high", "medium")),
  criterion("pricing_defined", "business_model", tiers("low", "medium", "high", "high", "medium")),
  criterion(
    "unit_economics_clarity",
    "business_model",
    tiers("not_applicable", "low", "medium", "critical", "critical"),
    { saas: "critical", subscription: "critical", marketplace: "high" },
  ),
  criterion("distribution_clarity", "business_model", tiers("low", "medium", "high", "high", "high")),
  criterion("key_partnerships", "business_model", tiers("low", "low", "medium", "medium", "high")),
];

const traction: CriterionDefinition[] = [
  criterion("customer_validation", "traction", tiers("high", "critical", "high", "medium", "low")),
  criterion("paying_customers", "traction", tiers("not_applicable", "medium", "critical", "high", "medium")),
  criterion("revenue_evidence", "traction", tiers("not_applicable", "low", "high", "critical", "critical")),
  criterion("growth", "traction", tiers("not_applicable", "not_applicable", "high", "critical", "critical")),
  criterion("retention", "traction", tiers("not_applicable", "low", "medium", "high", "critical"), {
    saas: "high",
    subscription: "high",
    b2c: "high",
  }),
  criterion("commercial_pipeline", "traction", tiers("low", "medium", "high", "high", "medium"), { b2b: "high" }),
  criterion("partnerships", "traction", tiers("low", "low", "medium", "medium", "high")),
];

const team: CriterionDefinition[] = [
  criterion("founder_commitment", "team", tiers("critical", "critical", "high", "high", "medium")),
  criterion("complementary_skills", "team", tiers("high", "high", "medium", "medium", "medium")),
  criterion("key_roles", "team", tiers("medium", "medium", "high", "high", "high")),
  criterion("execution_capacity", "team", tiers("medium", "high", "high", "high", "high")),
  criterion("domain_expertise", "team", tiers("high", "medium", "medium", "medium", "medium")),
  criterion("governance_structure", "team", tiers("low", "medium", "medium", "high", "high")),
];

const finance: CriterionDefinition[] = [
  criterion("financial_visibility", "finance", tiers("low", "medium", "high", "critical", "critical")),
  criterion("revenue_quality", "finance", tiers("not_applicable", "low", "medium", "high", "critical")),
  criterion("cost_structure", "finance", tiers("low", "medium", "high", "high", "critical")),
  criterion("burn_control", "finance", tiers("medium", "high", "high", "critical", "critical")),
  criterion("runway", "finance", tiers("medium", "high", "high", "critical", "critical")),
  criterion("forecasting", "finance", tiers("low", "low", "medium", "high", "high")),
  criterion(
    "unit_economics",
    "finance",
    tiers("not_applicable", "low", "medium", "critical", "critical"),
    { saas: "critical", subscription: "critical" },
  ),
];

const fundraising: CriterionDefinition[] = [
  criterion("funding_history_clarity", "fundraising", tiers("low", "medium", "medium", "high", "high")),
  criterion("fundraising_readiness", "fundraising", tiers("low", "medium", "high", "high", "medium")),
  criterion("use_of_funds_clarity", "fundraising", tiers("low", "medium", "high", "high", "medium")),
  criterion("instrument_clarity", "fundraising", tiers("low", "medium", "medium", "medium", "medium")),
  criterion("investor_readiness", "fundraising", tiers("low", "low", "medium", "high", "high")),
];

const operations: CriterionDefinition[] = [
  criterion("operational_processes", "operations", tiers("not_applicable", "low", "medium", "high", "critical")),
  criterion("delivery_capacity", "operations", tiers("not_applicable", "medium", "high", "high", "critical")),
  criterion("tooling_and_systems", "operations", tiers("low", "medium", "medium", "high", "high")),
  criterion("scalability_readiness", "operations", tiers("not_applicable", "low", "medium", "critical", "critical")),
];

const legalGovernance: CriterionDefinition[] = [
  criterion("legal_entity_status", "legal_governance", tiers("medium", "high", "high", "high", "high")),
  criterion("ip_protection", "legal_governance", tiers("low", "medium", "medium", "high", "high")),
  criterion("regulatory_compliance", "legal_governance", tiers("low", "medium", "high", "high", "critical")),
  criterion("contracts_and_agreements", "legal_governance", tiers("medium", "high", "high", "high", "high")),
  criterion("board_governance", "legal_governance", tiers("not_applicable", "low", "medium", "high", "critical")),
];

const impactEsg: CriterionDefinition[] = [
  criterion("impact_thesis_clarity", "impact_esg", tiers("medium", "medium", "medium", "medium", "medium")),
  criterion("impact_metrics_tracked", "impact_esg", tiers("low", "low", "medium", "medium", "high")),
  criterion("beneficiary_evidence", "impact_esg", tiers("low", "low", "medium", "medium", "high")),
  criterion("esg_considerations", "impact_esg", tiers("low", "low", "low", "medium", "high")),
];

export const READINESS_FRAMEWORK: Record<DimensionKey, DimensionDefinition> = {
  problem_market: { key: "problem_market", criteria: problemMarket },
  product: { key: "product", criteria: product },
  business_model: { key: "business_model", criteria: businessModel },
  traction: { key: "traction", criteria: traction },
  team: { key: "team", criteria: team },
  finance: { key: "finance", criteria: finance },
  fundraising: { key: "fundraising", criteria: fundraising },
  operations: { key: "operations", criteria: operations },
  legal_governance: { key: "legal_governance", criteria: legalGovernance },
  impact_esg: { key: "impact_esg", criteria: impactEsg },
};

export function allCriteria(): CriterionDefinition[] {
  return DIMENSION_KEYS.flatMap((key) => READINESS_FRAMEWORK[key].criteria);
}

export function criteriaForDimension(dimension: DimensionKey): CriterionDefinition[] {
  return READINESS_FRAMEWORK[dimension].criteria;
}
