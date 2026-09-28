/**
 * Deterministic Action Catalog — the single static mapping from a readiness
 * criterion (see lib/readiness/framework.ts for the real 55 criterion ids)
 * to a roadmap action template. No AI/LLM call is involved anywhere in this
 * file or anything that consumes it: every template is hand-authored data.
 *
 * Coverage is meaningful, not exhaustive — two criteria per dimension (20
 * templates across all 10 dimensions) chosen because they are the ones that
 * most clearly warrant a concrete founder action, not a mechanical sweep of
 * all 55 criteria.
 *
 * All founder-facing copy is a translation key (never a hardcoded English
 * string) under messages/{en,fr}.json → dashboard.roadmap.catalog.<id>.*.
 */
import type { DimensionKey } from "@/types/readiness-engine";
import type { GoalCategory } from "@/types/digital-twin";
import type { Effort, Impact } from "@/types/roadmap";

export type ActionTaskTemplate = {
  titleKey: string;
  estimatedEffort: Effort;
};

export type ActionTemplate = {
  id: string;
  dimension: DimensionKey;
  criterionId: string;
  category: string;
  titleKey: string;
  descriptionKey: string;
  defaultImpact: Impact;
  defaultEffort: Effort;
  estimatedDuration?: string;
  evidenceRequirementKey: string;
  taskTemplates: ActionTaskTemplate[];
};

const T = "dashboard.roadmap.catalog";

export const ACTION_CATALOG: ActionTemplate[] = [
  // problem_market
  {
    id: "validate_market_evidence",
    dimension: "problem_market",
    criterionId: "market_evidence",
    category: "problem_market",
    titleKey: `${T}.validate_market_evidence.title`,
    descriptionKey: `${T}.validate_market_evidence.description`,
    defaultImpact: "high",
    defaultEffort: "medium",
    estimatedDuration: "1 week",
    evidenceRequirementKey: `${T}.validate_market_evidence.evidenceRequirement`,
    taskTemplates: [
      { titleKey: `${T}.validate_market_evidence.task1`, estimatedEffort: "short" },
      { titleKey: `${T}.validate_market_evidence.task2`, estimatedEffort: "medium" },
    ],
  },
  {
    id: "competitive_landscape_map",
    dimension: "problem_market",
    criterionId: "competitive_understanding",
    category: "problem_market",
    titleKey: `${T}.competitive_landscape_map.title`,
    descriptionKey: `${T}.competitive_landscape_map.description`,
    defaultImpact: "medium",
    defaultEffort: "short",
    estimatedDuration: "2 days",
    evidenceRequirementKey: `${T}.competitive_landscape_map.evidenceRequirement`,
    taskTemplates: [{ titleKey: `${T}.competitive_landscape_map.task1`, estimatedEffort: "short" }],
  },

  // product
  {
    id: "run_product_validation",
    dimension: "product",
    criterionId: "product_validation",
    category: "product",
    titleKey: `${T}.run_product_validation.title`,
    descriptionKey: `${T}.run_product_validation.description`,
    defaultImpact: "high",
    defaultEffort: "medium",
    estimatedDuration: "2 weeks",
    evidenceRequirementKey: `${T}.run_product_validation.evidenceRequirement`,
    taskTemplates: [
      { titleKey: `${T}.run_product_validation.task1`, estimatedEffort: "medium" },
      { titleKey: `${T}.run_product_validation.task2`, estimatedEffort: "short" },
    ],
  },
  {
    id: "clarify_differentiation",
    dimension: "product",
    criterionId: "differentiation",
    category: "product",
    titleKey: `${T}.clarify_differentiation.title`,
    descriptionKey: `${T}.clarify_differentiation.description`,
    defaultImpact: "medium",
    defaultEffort: "short",
    estimatedDuration: "1 hour",
    evidenceRequirementKey: `${T}.clarify_differentiation.evidenceRequirement`,
    taskTemplates: [{ titleKey: `${T}.clarify_differentiation.task1`, estimatedEffort: "quick" }],
  },

  // business_model
  {
    id: "define_unit_economics",
    dimension: "business_model",
    criterionId: "unit_economics_clarity",
    category: "business_model",
    titleKey: `${T}.define_unit_economics.title`,
    descriptionKey: `${T}.define_unit_economics.description`,
    defaultImpact: "high",
    defaultEffort: "medium",
    estimatedDuration: "3 days",
    evidenceRequirementKey: `${T}.define_unit_economics.evidenceRequirement`,
    taskTemplates: [
      { titleKey: `${T}.define_unit_economics.task1`, estimatedEffort: "short" },
      { titleKey: `${T}.define_unit_economics.task2`, estimatedEffort: "medium" },
    ],
  },
  {
    id: "define_pricing",
    dimension: "business_model",
    criterionId: "pricing_defined",
    category: "business_model",
    titleKey: `${T}.define_pricing.title`,
    descriptionKey: `${T}.define_pricing.description`,
    defaultImpact: "medium",
    defaultEffort: "short",
    estimatedDuration: "2 days",
    evidenceRequirementKey: `${T}.define_pricing.evidenceRequirement`,
    taskTemplates: [{ titleKey: `${T}.define_pricing.task1`, estimatedEffort: "short" }],
  },

  // traction
  {
    id: "measure_retention",
    dimension: "traction",
    criterionId: "retention",
    category: "traction",
    titleKey: `${T}.measure_retention.title`,
    descriptionKey: `${T}.measure_retention.description`,
    defaultImpact: "high",
    defaultEffort: "short",
    estimatedDuration: "3 days",
    evidenceRequirementKey: `${T}.measure_retention.evidenceRequirement`,
    taskTemplates: [
      { titleKey: `${T}.measure_retention.task1`, estimatedEffort: "short" },
      { titleKey: `${T}.measure_retention.task2`, estimatedEffort: "quick" },
    ],
  },
  {
    id: "track_growth_metrics",
    dimension: "traction",
    criterionId: "growth",
    category: "traction",
    titleKey: `${T}.track_growth_metrics.title`,
    descriptionKey: `${T}.track_growth_metrics.description`,
    defaultImpact: "high",
    defaultEffort: "short",
    estimatedDuration: "2 days",
    evidenceRequirementKey: `${T}.track_growth_metrics.evidenceRequirement`,
    taskTemplates: [{ titleKey: `${T}.track_growth_metrics.task1`, estimatedEffort: "short" }],
  },

  // team
  {
    id: "fill_key_roles",
    dimension: "team",
    criterionId: "key_roles",
    category: "team",
    titleKey: `${T}.fill_key_roles.title`,
    descriptionKey: `${T}.fill_key_roles.description`,
    defaultImpact: "high",
    defaultEffort: "long",
    estimatedDuration: "1 month",
    evidenceRequirementKey: `${T}.fill_key_roles.evidenceRequirement`,
    taskTemplates: [
      { titleKey: `${T}.fill_key_roles.task1`, estimatedEffort: "medium" },
      { titleKey: `${T}.fill_key_roles.task2`, estimatedEffort: "long" },
    ],
  },
  {
    id: "formalize_governance",
    dimension: "team",
    criterionId: "governance_structure",
    category: "team",
    titleKey: `${T}.formalize_governance.title`,
    descriptionKey: `${T}.formalize_governance.description`,
    defaultImpact: "medium",
    defaultEffort: "medium",
    estimatedDuration: "1 week",
    evidenceRequirementKey: `${T}.formalize_governance.evidenceRequirement`,
    taskTemplates: [{ titleKey: `${T}.formalize_governance.task1`, estimatedEffort: "medium" }],
  },

  // finance
  {
    id: "build_financial_forecast",
    dimension: "finance",
    criterionId: "forecasting",
    category: "finance",
    titleKey: `${T}.build_financial_forecast.title`,
    descriptionKey: `${T}.build_financial_forecast.description`,
    defaultImpact: "high",
    defaultEffort: "medium",
    estimatedDuration: "1 week",
    evidenceRequirementKey: `${T}.build_financial_forecast.evidenceRequirement`,
    taskTemplates: [
      { titleKey: `${T}.build_financial_forecast.task1`, estimatedEffort: "medium" },
      { titleKey: `${T}.build_financial_forecast.task2`, estimatedEffort: "short" },
    ],
  },
  {
    id: "improve_burn_control",
    dimension: "finance",
    criterionId: "burn_control",
    category: "finance",
    titleKey: `${T}.improve_burn_control.title`,
    descriptionKey: `${T}.improve_burn_control.description`,
    defaultImpact: "high",
    defaultEffort: "short",
    estimatedDuration: "2 days",
    evidenceRequirementKey: `${T}.improve_burn_control.evidenceRequirement`,
    taskTemplates: [{ titleKey: `${T}.improve_burn_control.task1`, estimatedEffort: "short" }],
  },

  // fundraising
  {
    id: "clarify_use_of_funds",
    dimension: "fundraising",
    criterionId: "use_of_funds_clarity",
    category: "fundraising",
    titleKey: `${T}.clarify_use_of_funds.title`,
    descriptionKey: `${T}.clarify_use_of_funds.description`,
    defaultImpact: "medium",
    defaultEffort: "short",
    estimatedDuration: "2 days",
    evidenceRequirementKey: `${T}.clarify_use_of_funds.evidenceRequirement`,
    taskTemplates: [{ titleKey: `${T}.clarify_use_of_funds.task1`, estimatedEffort: "short" }],
  },
  {
    id: "prepare_investor_materials",
    dimension: "fundraising",
    criterionId: "investor_readiness",
    category: "fundraising",
    titleKey: `${T}.prepare_investor_materials.title`,
    descriptionKey: `${T}.prepare_investor_materials.description`,
    defaultImpact: "high",
    defaultEffort: "medium",
    estimatedDuration: "1 week",
    evidenceRequirementKey: `${T}.prepare_investor_materials.evidenceRequirement`,
    taskTemplates: [
      { titleKey: `${T}.prepare_investor_materials.task1`, estimatedEffort: "medium" },
      { titleKey: `${T}.prepare_investor_materials.task2`, estimatedEffort: "short" },
    ],
  },

  // operations
  {
    id: "adopt_core_tooling",
    dimension: "operations",
    criterionId: "tooling_and_systems",
    category: "operations",
    titleKey: `${T}.adopt_core_tooling.title`,
    descriptionKey: `${T}.adopt_core_tooling.description`,
    defaultImpact: "medium",
    defaultEffort: "short",
    estimatedDuration: "3 days",
    evidenceRequirementKey: `${T}.adopt_core_tooling.evidenceRequirement`,
    taskTemplates: [{ titleKey: `${T}.adopt_core_tooling.task1`, estimatedEffort: "short" }],
  },
  {
    id: "plan_scalability",
    dimension: "operations",
    criterionId: "scalability_readiness",
    category: "operations",
    titleKey: `${T}.plan_scalability.title`,
    descriptionKey: `${T}.plan_scalability.description`,
    defaultImpact: "medium",
    defaultEffort: "medium",
    estimatedDuration: "1 week",
    evidenceRequirementKey: `${T}.plan_scalability.evidenceRequirement`,
    taskTemplates: [{ titleKey: `${T}.plan_scalability.task1`, estimatedEffort: "medium" }],
  },

  // legal_governance
  {
    id: "formalize_legal_entity",
    dimension: "legal_governance",
    criterionId: "legal_entity_status",
    category: "legal_governance",
    titleKey: `${T}.formalize_legal_entity.title`,
    descriptionKey: `${T}.formalize_legal_entity.description`,
    defaultImpact: "high",
    defaultEffort: "medium",
    estimatedDuration: "2 weeks",
    evidenceRequirementKey: `${T}.formalize_legal_entity.evidenceRequirement`,
    taskTemplates: [{ titleKey: `${T}.formalize_legal_entity.task1`, estimatedEffort: "medium" }],
  },
  {
    id: "standardize_contracts",
    dimension: "legal_governance",
    criterionId: "contracts_and_agreements",
    category: "legal_governance",
    titleKey: `${T}.standardize_contracts.title`,
    descriptionKey: `${T}.standardize_contracts.description`,
    defaultImpact: "medium",
    defaultEffort: "short",
    estimatedDuration: "3 days",
    evidenceRequirementKey: `${T}.standardize_contracts.evidenceRequirement`,
    taskTemplates: [{ titleKey: `${T}.standardize_contracts.task1`, estimatedEffort: "short" }],
  },

  // impact_esg
  {
    id: "track_impact_metrics",
    dimension: "impact_esg",
    criterionId: "impact_metrics_tracked",
    category: "impact_esg",
    titleKey: `${T}.track_impact_metrics.title`,
    descriptionKey: `${T}.track_impact_metrics.description`,
    defaultImpact: "medium",
    defaultEffort: "short",
    estimatedDuration: "3 days",
    evidenceRequirementKey: `${T}.track_impact_metrics.evidenceRequirement`,
    taskTemplates: [{ titleKey: `${T}.track_impact_metrics.task1`, estimatedEffort: "short" }],
  },
  {
    id: "collect_beneficiary_evidence",
    dimension: "impact_esg",
    criterionId: "beneficiary_evidence",
    category: "impact_esg",
    titleKey: `${T}.collect_beneficiary_evidence.title`,
    descriptionKey: `${T}.collect_beneficiary_evidence.description`,
    defaultImpact: "medium",
    defaultEffort: "medium",
    estimatedDuration: "1 week",
    evidenceRequirementKey: `${T}.collect_beneficiary_evidence.evidenceRequirement`,
    taskTemplates: [{ titleKey: `${T}.collect_beneficiary_evidence.task1`, estimatedEffort: "medium" }],
  },
];

export function getActionTemplate(id: string): ActionTemplate | undefined {
  return ACTION_CATALOG.find((a) => a.id === id);
}

export function getActionTemplateForCriterion(criterionId: string): ActionTemplate | undefined {
  return ACTION_CATALOG.find((a) => a.criterionId === criterionId);
}

/**
 * Goal-category → action-template mapping foundation used by the roadmap
 * generator to add FOUNDER_GOAL-sourced items. Intentionally partial: a
 * goal category with no deterministic, clearly-relevant mapping (e.g.
 * "other") is left unmapped rather than guessing at an action.
 */
export const GOAL_CATEGORY_ACTION_MAP: Partial<Record<GoalCategory, string[]>> = {
  fundraising: ["build_financial_forecast", "prepare_investor_materials", "clarify_use_of_funds"],
  growth: ["track_growth_metrics", "measure_retention"],
  product: ["run_product_validation", "clarify_differentiation"],
  market: ["validate_market_evidence", "competitive_landscape_map"],
  team: ["fill_key_roles"],
};
