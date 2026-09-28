/**
 * Adaptive questionnaire — only asks what the Digital Twin cannot already
 * answer (see lib/readiness/evaluators.ts for which ~35 criteria are
 * derived purely from twin data with zero questions). Grouped by dimension
 * for the assessment UI's dimension-by-dimension navigation.
 */
import type { QuestionDefinition } from "@/types/readiness-engine";

export const READINESS_QUESTIONS: QuestionDefinition[] = [
  {
    id: "q_product_validation",
    dimension: "product",
    criterionId: "product_validation",
    type: "yes_no",
    labelKey: "q_product_validation",
    required: true,
  },
  {
    id: "q_technical_feasibility",
    dimension: "product",
    criterionId: "technical_feasibility",
    type: "scale",
    labelKey: "q_technical_feasibility",
    required: true,
  },
  {
    id: "q_product_roadmap",
    dimension: "product",
    criterionId: "product_roadmap",
    type: "yes_no",
    labelKey: "q_product_roadmap",
    required: false,
  },
  {
    id: "q_execution_capacity",
    dimension: "team",
    criterionId: "execution_capacity",
    type: "scale",
    labelKey: "q_execution_capacity",
    required: true,
  },
  {
    id: "q_domain_expertise",
    dimension: "team",
    criterionId: "domain_expertise",
    type: "yes_no",
    labelKey: "q_domain_expertise",
    required: true,
  },
  {
    id: "q_team_governance",
    dimension: "team",
    criterionId: "governance_structure",
    type: "yes_no",
    labelKey: "q_team_governance",
    required: false,
  },
  {
    id: "q_generates_revenue",
    dimension: "finance",
    criterionId: "revenue_quality",
    type: "yes_no",
    labelKey: "q_generates_revenue",
    required: true,
  },
  {
    id: "q_revenue_consistency",
    dimension: "finance",
    criterionId: "revenue_quality",
    type: "single_select",
    labelKey: "q_revenue_consistency",
    required: true,
    options: [
      { value: "recurring", labelKey: "revenueConsistency.recurring" },
      { value: "mixed", labelKey: "revenueConsistency.mixed" },
      { value: "one_off", labelKey: "revenueConsistency.one_off" },
    ],
    // Adaptive skip: don't ask HOW consistent revenue is when there isn't
    // any yet — this is the "NO -> skip" example from the batch brief.
    applicableIf: ({ answers }) => answers["q_generates_revenue"] === true,
  },
  {
    id: "q_forecasting",
    dimension: "finance",
    criterionId: "forecasting",
    type: "yes_no",
    labelKey: "q_forecasting",
    required: false,
  },
  {
    id: "q_fundraising_readiness",
    dimension: "fundraising",
    criterionId: "fundraising_readiness",
    type: "yes_no",
    labelKey: "q_fundraising_readiness",
    required: false,
  },
  {
    id: "q_operational_processes",
    dimension: "operations",
    criterionId: "operational_processes",
    type: "yes_no",
    labelKey: "q_operational_processes",
    required: false,
  },
  {
    id: "q_delivery_capacity",
    dimension: "operations",
    criterionId: "delivery_capacity",
    type: "scale",
    labelKey: "q_delivery_capacity",
    required: false,
    // Not meaningful before there's anything to deliver at volume.
    applicableIf: ({ stage }) => stage !== "idea",
  },
  {
    id: "q_tooling_and_systems",
    dimension: "operations",
    criterionId: "tooling_and_systems",
    type: "yes_no",
    labelKey: "q_tooling_and_systems",
    required: false,
  },
  {
    id: "q_scalability_readiness",
    dimension: "operations",
    criterionId: "scalability_readiness",
    type: "scale",
    labelKey: "q_scalability_readiness",
    required: false,
    applicableIf: ({ stage }) => stage !== "idea",
  },
  {
    id: "q_regulatory_compliance",
    dimension: "legal_governance",
    criterionId: "regulatory_compliance",
    type: "yes_no",
    labelKey: "q_regulatory_compliance",
    required: false,
  },
  {
    id: "q_contracts_and_agreements",
    dimension: "legal_governance",
    criterionId: "contracts_and_agreements",
    type: "yes_no",
    labelKey: "q_contracts_and_agreements",
    required: false,
  },
  {
    id: "q_board_governance",
    dimension: "legal_governance",
    criterionId: "board_governance",
    type: "yes_no",
    labelKey: "q_board_governance",
    required: false,
    applicableIf: ({ stage }) => stage !== "idea" && stage !== "mvp",
  },
];

export function questionsForDimension(dimension: string): QuestionDefinition[] {
  return READINESS_QUESTIONS.filter((q) => q.dimension === dimension);
}
