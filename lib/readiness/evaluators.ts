/**
 * Criterion evaluators — one pure, deterministic function per criterion id.
 *
 * Every evaluator reads only `ctx` (Digital Twin + assessment answers) and
 * returns a rawScore on the coarse 0/25/50/75/100 scale, or `null` when
 * there truly isn't enough information to evaluate it (never confused with
 * a real "0" — an explicit zero/false/empty-but-set value is always scored,
 * never treated as missing). Each evaluator also returns the evidence that
 * justifies its score and, when insufficient, which evidence is missing.
 *
 * Thresholds below are a deterministic V1 heuristic, not a benchmark
 * database — documented inline per evaluator so scores stay inspectable.
 */
import type { CriterionEvaluation, CriterionScoreValue, EvaluationContext } from "@/types/readiness-engine";
import { answerEvidence, twinEvidence } from "./evidence";

function insufficient(...missingEvidenceKeys: string[]): CriterionEvaluation {
  return { rawScore: null, evidence: [], missingEvidenceKeys };
}

function evaluated(rawScore: CriterionScoreValue, evidence: CriterionEvaluation["evidence"]): CriterionEvaluation {
  return { rawScore, evidence, missingEvidenceKeys: [] };
}

function bucket(value: number, breakpoints: [number, number, number, number]): CriterionScoreValue {
  const [b25, b50, b75, b100] = breakpoints;
  if (value >= b100) return 100;
  if (value >= b75) return 75;
  if (value >= b50) return 50;
  if (value >= b25) return 25;
  return 0;
}

function scaleAnswer(value: unknown): CriterionScoreValue | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  if (n <= 1) return 0;
  if (n === 2) return 25;
  if (n === 3) return 50;
  if (n === 4) return 75;
  return 100;
}

function isNonEmptyString(v: string | undefined | null): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function metricValue(ctx: EvaluationContext, types: string[]): { value: number; date: string; verified: boolean } | undefined {
  const metric = ctx.twin.traction.metrics.find((m) => types.includes(m.type));
  return metric ? { value: metric.value, date: metric.date, verified: metric.verified } : undefined;
}

type Evaluator = (ctx: EvaluationContext) => CriterionEvaluation;

// ---------------------------------------------------------------------------
// Problem & Market
// ---------------------------------------------------------------------------

const problem_clarity: Evaluator = (ctx) => {
  const { statement, evidence, whyNow } = ctx.twin.problem;
  if (!isNonEmptyString(statement)) return insufficient("problemStatement");
  const ev = [twinEvidence("problem.statement", ctx.assessedAt)];
  if (isNonEmptyString(evidence)) ev.push(twinEvidence("problem.evidence", ctx.assessedAt));
  if (isNonEmptyString(evidence) && isNonEmptyString(whyNow)) return evaluated(100, ev);
  if (isNonEmptyString(evidence)) return evaluated(75, ev);
  return evaluated(50, ev);
};

const target_customer_definition: Evaluator = (ctx) => {
  const value = ctx.twin.problem.targetCustomer;
  if (!isNonEmptyString(value)) return insufficient("problemTargetCustomer");
  const ev = [twinEvidence("problem.targetCustomer", ctx.assessedAt)];
  return evaluated(value.trim().length > 30 ? 100 : 50, ev);
};

const market_evidence: Evaluator = (ctx) => {
  const hasEvidence = isNonEmptyString(ctx.twin.problem.evidence);
  const hasTrends = isNonEmptyString(ctx.twin.market.trends);
  if (!hasEvidence && !hasTrends) return insufficient("problemEvidence", "marketTrends");
  const ev = [];
  if (hasEvidence) ev.push(twinEvidence("problem.evidence", ctx.assessedAt));
  if (hasTrends) ev.push(twinEvidence("market.trends", ctx.assessedAt));
  return evaluated(hasEvidence && hasTrends ? 100 : 75, ev);
};

const competitive_understanding: Evaluator = (ctx) => {
  const hasCompetitors = ctx.twin.market.competitors.length > 0;
  const hasAdvantage = isNonEmptyString(ctx.twin.market.competitiveAdvantage);
  if (!hasCompetitors && !hasAdvantage) return insufficient("marketCompetitors", "marketCompetitiveAdvantage");
  const ev = [];
  if (hasCompetitors) ev.push(twinEvidence("market.competitors", ctx.assessedAt));
  if (hasAdvantage) ev.push(twinEvidence("market.competitiveAdvantage", ctx.assessedAt));
  return evaluated(hasCompetitors && hasAdvantage ? 100 : 50, ev);
};

const market_sizing: Evaluator = (ctx) => {
  const { tam, sam, som } = ctx.twin.market;
  if (!tam) return insufficient("marketSizing");
  const ev = [twinEvidence("market.tam", ctx.assessedAt)];
  if (sam) ev.push(twinEvidence("market.sam", ctx.assessedAt));
  if (som) ev.push(twinEvidence("market.som", ctx.assessedAt));
  if (tam && sam && som) return evaluated(100, ev);
  if (tam && sam) return evaluated(75, ev);
  return evaluated(50, ev);
};

// ---------------------------------------------------------------------------
// Product
// ---------------------------------------------------------------------------

const solution_definition: Evaluator = (ctx) => {
  const hasDescription = isNonEmptyString(ctx.twin.product.description);
  const hasValueProp = isNonEmptyString(ctx.twin.product.valueProposition);
  if (!hasDescription && !hasValueProp) return insufficient("productDescription", "productValueProposition");
  const ev = [];
  if (hasDescription) ev.push(twinEvidence("product.description", ctx.assessedAt));
  if (hasValueProp) ev.push(twinEvidence("product.valueProposition", ctx.assessedAt));
  return evaluated(hasDescription && hasValueProp ? 100 : 50, ev);
};

const DEV_STAGE_SCORE: Record<string, CriterionScoreValue> = {
  concept: 25,
  prototype: 50,
  mvp: 75,
  live: 100,
  scaling: 100,
};

const development_stage: Evaluator = (ctx) => {
  const stage = ctx.twin.product.developmentStage;
  if (!stage) return insufficient("productDevelopmentStage");
  return evaluated(DEV_STAGE_SCORE[stage], [twinEvidence("product.developmentStage", ctx.assessedAt)]);
};

const product_validation: Evaluator = (ctx) => {
  const answer = ctx.answers["q_product_validation"];
  if (answer === undefined) return insufficient("assessmentAnswer");
  return evaluated(answer === true ? 100 : 25, [answerEvidence("q_product_validation", ctx.assessedAt)]);
};

const differentiation: Evaluator = (ctx) => {
  const value = ctx.twin.market.competitiveAdvantage;
  if (!isNonEmptyString(value)) return insufficient("marketCompetitiveAdvantage");
  const ev = [twinEvidence("market.competitiveAdvantage", ctx.assessedAt)];
  return evaluated(value.trim().length > 20 ? 100 : 50, ev);
};

const technical_feasibility: Evaluator = (ctx) => {
  const score = scaleAnswer(ctx.answers["q_technical_feasibility"]);
  if (score === null) return insufficient("assessmentAnswer");
  return evaluated(score, [answerEvidence("q_technical_feasibility", ctx.assessedAt)]);
};

const adoption: Evaluator = (ctx) => {
  const metric = metricValue(ctx, ["active_users", "retention"]);
  if (!metric) return insufficient("tractionMetric");
  return evaluated(bucket(metric.value, [1, 25, 60, 90]), [
    twinEvidence("traction.metrics.active_users", metric.date, metric.verified),
  ]);
};

const product_roadmap: Evaluator = (ctx) => {
  const answer = ctx.answers["q_product_roadmap"];
  if (answer === undefined) return insufficient("assessmentAnswer");
  return evaluated(answer === true ? 100 : 0, [answerEvidence("q_product_roadmap", ctx.assessedAt)]);
};

// ---------------------------------------------------------------------------
// Business Model
// ---------------------------------------------------------------------------

const revenue_model_clarity: Evaluator = (ctx) => {
  const hasStreams = ctx.twin.businessModel.revenueStreams.length > 0;
  const hasPricing = isNonEmptyString(ctx.twin.businessModel.pricingModel);
  if (!hasStreams && !hasPricing) return insufficient("businessRevenueStreams", "businessPricingModel");
  const ev = [];
  if (hasStreams) ev.push(twinEvidence("businessModel.revenueStreams", ctx.assessedAt));
  if (hasPricing) ev.push(twinEvidence("businessModel.pricingModel", ctx.assessedAt));
  return evaluated(hasStreams && hasPricing ? 100 : 50, ev);
};

const pricing_defined: Evaluator = (ctx) => {
  const value = ctx.twin.businessModel.pricingModel;
  if (!isNonEmptyString(value)) return insufficient("businessPricingModel");
  return evaluated(100, [twinEvidence("businessModel.pricingModel", ctx.assessedAt)]);
};

const unit_economics_clarity: Evaluator = (ctx) => {
  const value = ctx.twin.businessModel.averageRevenuePerCustomer;
  if (!value) return insufficient("businessAvgRevenuePerCustomer");
  return evaluated(75, [twinEvidence("businessModel.averageRevenuePerCustomer", ctx.assessedAt)]);
};

const distribution_clarity: Evaluator = (ctx) => {
  const value = ctx.twin.businessModel.distributionModel;
  if (!isNonEmptyString(value)) return insufficient("businessDistributionModel");
  return evaluated(100, [twinEvidence("businessModel.distributionModel", ctx.assessedAt)]);
};

const key_partnerships_bm: Evaluator = (ctx) => {
  const count = ctx.twin.businessModel.keyPartnerships.length;
  if (count === 0) return insufficient("businessKeyPartnerships");
  const ev = [twinEvidence("businessModel.keyPartnerships", ctx.assessedAt)];
  return evaluated(bucket(count, [1, 2, 4, 6]), ev);
};

// ---------------------------------------------------------------------------
// Traction
// ---------------------------------------------------------------------------

const customer_validation: Evaluator = (ctx) => {
  const hasNarrative = isNonEmptyString(ctx.twin.traction.narrative);
  const hasEvidence = isNonEmptyString(ctx.twin.problem.evidence);
  if (!hasNarrative && !hasEvidence) return insufficient("tractionNarrative");
  const ev = [];
  if (hasNarrative) ev.push(twinEvidence("traction.narrative", ctx.assessedAt));
  if (hasEvidence) ev.push(twinEvidence("problem.evidence", ctx.assessedAt));
  return evaluated(hasNarrative && hasEvidence ? 100 : 75, ev);
};

const paying_customers: Evaluator = (ctx) => {
  const metric = metricValue(ctx, ["customers", "active_customers"]);
  if (!metric) return insufficient("tractionMetric");
  return evaluated(bucket(metric.value, [1, 10, 100, 1000]), [
    twinEvidence("traction.metrics.customers", metric.date, metric.verified),
  ]);
};

const revenue_evidence: Evaluator = (ctx) => {
  const metric = metricValue(ctx, ["revenue", "mrr", "arr", "gmv"]);
  if (!metric) return insufficient("tractionMetric");
  return evaluated(bucket(metric.value, [1, 1000, 10000, 100000]), [
    twinEvidence("traction.metrics.revenue", metric.date, metric.verified),
  ]);
};

const growth: Evaluator = (ctx) => {
  const metric = metricValue(ctx, ["revenue_growth"]);
  if (!metric) return insufficient("tractionMetric");
  return evaluated(bucket(metric.value, [0.01, 10, 30, 60]), [
    twinEvidence("traction.metrics.revenue_growth", metric.date, metric.verified),
  ]);
};

const retention: Evaluator = (ctx) => {
  const metric = metricValue(ctx, ["retention"]);
  if (!metric) return insufficient("tractionMetric");
  return evaluated(bucket(metric.value, [40, 60, 75, 90]), [
    twinEvidence("traction.metrics.retention", metric.date, metric.verified),
  ]);
};

const commercial_pipeline: Evaluator = (ctx) => {
  const metric = metricValue(ctx, ["pilots", "contracts"]);
  if (!metric) return insufficient("tractionMetric");
  return evaluated(bucket(metric.value, [1, 3, 6, 10]), [
    twinEvidence("traction.metrics.pilots", metric.date, metric.verified),
  ]);
};

const partnerships_traction: Evaluator = (ctx) => {
  const count = ctx.twin.traction.majorCustomers.length + ctx.twin.businessModel.keyPartnerships.length;
  if (count === 0) return insufficient("tractionMajorCustomers");
  const ev = [twinEvidence("traction.majorCustomers", ctx.assessedAt)];
  return evaluated(bucket(count, [1, 2, 4, 6]), ev);
};

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

const founder_commitment: Evaluator = (ctx) => {
  const founders = ctx.twin.founders;
  if (founders.length === 0) return insufficient("foundersAtLeastOne");
  const fullTimeRatio = founders.filter((f) => f.engagement === "full_time").length / founders.length;
  const ev = [twinEvidence("founders.engagement", ctx.assessedAt)];
  if (fullTimeRatio === 1) return evaluated(100, ev);
  if (fullTimeRatio >= 0.5) return evaluated(75, ev);
  if (fullTimeRatio > 0) return evaluated(50, ev);
  return evaluated(25, ev);
};

const complementary_skills: Evaluator = (ctx) => {
  const founders = ctx.twin.founders;
  if (founders.length < 2) return insufficient("foundersAtLeastTwo");
  const distinctRoles = new Set(founders.map((f) => f.role.trim().toLowerCase())).size;
  const ev = [twinEvidence("founders.role", ctx.assessedAt)];
  return evaluated(distinctRoles >= 2 ? 100 : 25, ev);
};

const key_roles: Evaluator = (ctx) => {
  const headcount = ctx.twin.founders.length + ctx.twin.team.length;
  if (headcount === 0) return insufficient("foundersAtLeastOne");
  const ev = [twinEvidence("founders+team.count", ctx.assessedAt)];
  return evaluated(bucket(headcount, [1, 2, 4, 7]), ev);
};

const execution_capacity: Evaluator = (ctx) => {
  const score = scaleAnswer(ctx.answers["q_execution_capacity"]);
  if (score === null) return insufficient("assessmentAnswer");
  return evaluated(score, [answerEvidence("q_execution_capacity", ctx.assessedAt)]);
};

const domain_expertise: Evaluator = (ctx) => {
  const answer = ctx.answers["q_domain_expertise"];
  if (answer === undefined) return insufficient("assessmentAnswer");
  return evaluated(answer === true ? 100 : 25, [answerEvidence("q_domain_expertise", ctx.assessedAt)]);
};

const governance_structure_team: Evaluator = (ctx) => {
  const answer = ctx.answers["q_team_governance"];
  if (answer === undefined) return insufficient("assessmentAnswer");
  return evaluated(answer === true ? 100 : 25, [answerEvidence("q_team_governance", ctx.assessedAt)]);
};

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

const financial_visibility: Evaluator = (ctx) => {
  const { monthlyRevenue, monthlyExpenses } = ctx.twin.financials;
  if (monthlyRevenue == null && monthlyExpenses == null) return insufficient("financialsMonthlyRevenue", "financialsMonthlyExpenses");
  const ev = [];
  if (monthlyRevenue != null) ev.push(twinEvidence("financials.monthlyRevenue", ctx.assessedAt));
  if (monthlyExpenses != null) ev.push(twinEvidence("financials.monthlyExpenses", ctx.assessedAt));
  return evaluated(monthlyRevenue != null && monthlyExpenses != null ? 100 : 50, ev);
};

const REVENUE_QUALITY_SCORE: Record<string, CriterionScoreValue> = {
  recurring: 100,
  mixed: 50,
  one_off: 25,
  no_revenue: 0,
};

const revenue_quality: Evaluator = (ctx) => {
  const generates = ctx.answers["q_generates_revenue"];
  if (generates === undefined) return insufficient("assessmentAnswer");
  if (generates === false) return evaluated(0, [answerEvidence("q_generates_revenue", ctx.assessedAt)]);
  const consistency = ctx.answers["q_revenue_consistency"];
  if (typeof consistency !== "string" || !(consistency in REVENUE_QUALITY_SCORE)) {
    return insufficient("assessmentAnswer");
  }
  return evaluated(REVENUE_QUALITY_SCORE[consistency], [
    answerEvidence("q_generates_revenue", ctx.assessedAt),
    answerEvidence("q_revenue_consistency", ctx.assessedAt),
  ]);
};

const cost_structure: Evaluator = (ctx) => {
  if (ctx.twin.financials.monthlyExpenses == null) return insufficient("financialsMonthlyExpenses");
  return evaluated(75, [twinEvidence("financials.monthlyExpenses", ctx.assessedAt)]);
};

const burn_control: Evaluator = (ctx) => {
  const { monthlyBurn, monthlyRevenue } = ctx.twin.financials;
  if (monthlyBurn == null) return insufficient("financialsMonthlyBurn");
  const ev = [twinEvidence("financials.monthlyBurn", ctx.assessedAt)];
  if (monthlyRevenue == null) return evaluated(50, ev);
  if (monthlyBurn <= 0 || monthlyRevenue >= monthlyBurn) return evaluated(100, ev);
  const ratio = monthlyBurn / Math.max(monthlyRevenue, 1);
  if (ratio <= 2) return evaluated(75, ev);
  if (ratio <= 5) return evaluated(50, ev);
  if (ratio <= 10) return evaluated(25, ev);
  return evaluated(0, ev);
};

const runway: Evaluator = (ctx) => {
  const value = ctx.twin.financials.runwayMonths;
  if (value == null) return insufficient("financialsRunway");
  return evaluated(bucket(value, [3, 6, 12, 18]), [twinEvidence("financials.runwayMonths", ctx.assessedAt)]);
};

const forecasting: Evaluator = (ctx) => {
  const answer = ctx.answers["q_forecasting"];
  if (answer === undefined) return insufficient("assessmentAnswer");
  return evaluated(answer === true ? 100 : 0, [answerEvidence("q_forecasting", ctx.assessedAt)]);
};

const unit_economics_finance: Evaluator = (ctx) => {
  const cac = metricValue(ctx, ["cac"]);
  const ltv = metricValue(ctx, ["ltv"]);
  if (!cac && !ltv) return insufficient("tractionMetric");
  if (!cac || !ltv) {
    return evaluated(25, [twinEvidence("traction.metrics.cac_or_ltv", ctx.assessedAt)]);
  }
  const ratio = cac.value > 0 ? ltv.value / cac.value : 0;
  const ev = [twinEvidence("traction.metrics.cac", cac.date, cac.verified), twinEvidence("traction.metrics.ltv", ltv.date, ltv.verified)];
  if (ratio >= 3) return evaluated(100, ev);
  if (ratio >= 2) return evaluated(75, ev);
  if (ratio >= 1) return evaluated(50, ev);
  return evaluated(25, ev);
};

// ---------------------------------------------------------------------------
// Fundraising
// ---------------------------------------------------------------------------

const funding_history_clarity: Evaluator = (ctx) => {
  const { status, totalRaised, previousRounds } = ctx.twin.funding;
  const hasHistory = Boolean(totalRaised) || previousRounds.length > 0;
  const ev = [twinEvidence("funding.status", ctx.assessedAt)];
  if (hasHistory) return evaluated(100, ev);
  if (status === "not_raising") return evaluated(75, ev);
  return evaluated(25, ev);
};

const fundraising_readiness: Evaluator = (ctx) => {
  const answer = ctx.answers["q_fundraising_readiness"];
  if (answer === undefined) return insufficient("assessmentAnswer");
  return evaluated(answer === true ? 100 : 0, [answerEvidence("q_fundraising_readiness", ctx.assessedAt)]);
};

const use_of_funds_clarity: Evaluator = (ctx) => {
  const value = ctx.twin.funding.useOfFunds;
  if (!isNonEmptyString(value)) return insufficient("fundingUseOfFunds");
  return evaluated(100, [twinEvidence("funding.useOfFunds", ctx.assessedAt)]);
};

const instrument_clarity: Evaluator = (ctx) => {
  const value = ctx.twin.funding.instrument;
  if (!value) return insufficient("fundingInstrument");
  return evaluated(100, [twinEvidence("funding.instrument", ctx.assessedAt)]);
};

const investor_readiness: Evaluator = (ctx) => {
  const { targetRaise, minimumTicket } = ctx.twin.funding;
  if (!targetRaise && !minimumTicket) return insufficient("fundingTargetRaise");
  const ev = [twinEvidence("funding.targetRaise", ctx.assessedAt)];
  return evaluated(targetRaise && minimumTicket ? 100 : 50, ev);
};

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

const operational_processes: Evaluator = (ctx) => {
  const answer = ctx.answers["q_operational_processes"];
  if (answer === undefined) return insufficient("assessmentAnswer");
  return evaluated(answer === true ? 100 : 0, [answerEvidence("q_operational_processes", ctx.assessedAt)]);
};

const delivery_capacity: Evaluator = (ctx) => {
  const score = scaleAnswer(ctx.answers["q_delivery_capacity"]);
  if (score === null) return insufficient("assessmentAnswer");
  return evaluated(score, [answerEvidence("q_delivery_capacity", ctx.assessedAt)]);
};

const tooling_and_systems: Evaluator = (ctx) => {
  const answer = ctx.answers["q_tooling_and_systems"];
  if (answer === undefined) return insufficient("assessmentAnswer");
  return evaluated(answer === true ? 100 : 25, [answerEvidence("q_tooling_and_systems", ctx.assessedAt)]);
};

const scalability_readiness: Evaluator = (ctx) => {
  const score = scaleAnswer(ctx.answers["q_scalability_readiness"]);
  if (score === null) return insufficient("assessmentAnswer");
  return evaluated(score, [answerEvidence("q_scalability_readiness", ctx.assessedAt)]);
};

// ---------------------------------------------------------------------------
// Legal & Governance
// ---------------------------------------------------------------------------

const REGISTRATION_SCORE: Record<string, CriterionScoreValue> = {
  registered: 100,
  in_progress: 50,
  not_registered: 0,
};

const legal_entity_status: Evaluator = (ctx) => {
  const registration = ctx.twin.identity.registration;
  if (!registration) return insufficient("identityRegistration");
  return evaluated(REGISTRATION_SCORE[registration.status], [twinEvidence("identity.registration", ctx.assessedAt)]);
};

const IP_STATUS_SCORE: Record<string, CriterionScoreValue> = {
  none: 25,
  pending: 50,
  filed: 75,
  granted: 100,
  not_applicable: 100,
};

const ip_protection: Evaluator = (ctx) => {
  const status = ctx.twin.product.ipStatus;
  if (!status) return insufficient("productIpStatus");
  return evaluated(IP_STATUS_SCORE[status], [twinEvidence("product.ipStatus", ctx.assessedAt)]);
};

const regulatory_compliance: Evaluator = (ctx) => {
  const answer = ctx.answers["q_regulatory_compliance"];
  if (answer === undefined) return insufficient("assessmentAnswer");
  return evaluated(answer === true ? 100 : 0, [answerEvidence("q_regulatory_compliance", ctx.assessedAt)]);
};

const contracts_and_agreements: Evaluator = (ctx) => {
  const answer = ctx.answers["q_contracts_and_agreements"];
  if (answer === undefined) return insufficient("assessmentAnswer");
  return evaluated(answer === true ? 100 : 0, [answerEvidence("q_contracts_and_agreements", ctx.assessedAt)]);
};

const board_governance: Evaluator = (ctx) => {
  const answer = ctx.answers["q_board_governance"];
  if (answer === undefined) return insufficient("assessmentAnswer");
  return evaluated(answer === true ? 100 : 25, [answerEvidence("q_board_governance", ctx.assessedAt)]);
};

// ---------------------------------------------------------------------------
// Impact & ESG — evaluators still run even when the dimension is excluded
// (twin.impact.enabled === false); scoring.ts marks the whole dimension
// not_applicable in that case so these results simply go unused.
// ---------------------------------------------------------------------------

const impact_thesis_clarity: Evaluator = (ctx) => {
  if (!ctx.twin.impact.enabled || !isNonEmptyString(ctx.twin.impact.thesis)) return insufficient("impactThesis");
  return evaluated(100, [twinEvidence("impact.thesis", ctx.assessedAt)]);
};

const impact_metrics_tracked: Evaluator = (ctx) => {
  const impact = ctx.twin.impact;
  if (!impact.enabled) return insufficient("impactDecision");
  const hasAny = impact.beneficiaries != null || impact.jobsCreated != null || impact.metrics.length > 0;
  if (!hasAny) return insufficient("impactBeneficiaries");
  return evaluated(100, [twinEvidence("impact.metrics", ctx.assessedAt)]);
};

const beneficiary_evidence: Evaluator = (ctx) => {
  const impact = ctx.twin.impact;
  if (!impact.enabled || impact.beneficiaries == null) return insufficient("impactBeneficiaries");
  return evaluated(bucket(impact.beneficiaries, [1, 100, 1000, 10000]), [twinEvidence("impact.beneficiaries", ctx.assessedAt)]);
};

const esg_considerations: Evaluator = (ctx) => {
  const impact = ctx.twin.impact;
  if (!impact.enabled) return insufficient("impactDecision");
  const hasAny = isNonEmptyString(impact.environmentalImpact) || isNonEmptyString(impact.socialImpact);
  if (!hasAny) return insufficient("impactEnvironmentalOrSocial");
  return evaluated(100, [twinEvidence("impact.environmentalOrSocial", ctx.assessedAt)]);
};

export const CRITERION_EVALUATORS: Record<string, Evaluator> = {
  problem_clarity,
  target_customer_definition,
  market_evidence,
  competitive_understanding,
  market_sizing,
  solution_definition,
  development_stage,
  product_validation,
  differentiation,
  technical_feasibility,
  adoption,
  product_roadmap,
  revenue_model_clarity,
  pricing_defined,
  unit_economics_clarity,
  distribution_clarity,
  key_partnerships: key_partnerships_bm,
  customer_validation,
  paying_customers,
  revenue_evidence,
  growth,
  retention,
  commercial_pipeline,
  partnerships: partnerships_traction,
  founder_commitment,
  complementary_skills,
  key_roles,
  execution_capacity,
  domain_expertise,
  governance_structure: governance_structure_team,
  financial_visibility,
  revenue_quality,
  cost_structure,
  burn_control,
  runway,
  forecasting,
  unit_economics: unit_economics_finance,
  funding_history_clarity,
  fundraising_readiness,
  use_of_funds_clarity,
  instrument_clarity,
  investor_readiness,
  operational_processes,
  delivery_capacity,
  tooling_and_systems,
  scalability_readiness,
  legal_entity_status,
  ip_protection,
  regulatory_compliance,
  contracts_and_agreements,
  board_governance,
  impact_thesis_clarity,
  impact_metrics_tracked,
  beneficiary_evidence,
  esg_considerations,
};
