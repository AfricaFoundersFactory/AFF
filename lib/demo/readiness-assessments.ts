/**
 * Isolated demo assessment history.
 *
 * Every score below is COMPUTED by the real deterministic engine
 * (lib/readiness/scoring.ts) from a real (if hand-authored) Digital Twin
 * snapshot and answer set — nothing here is a hardcoded number. The
 * "3 months ago" snapshot is built by taking each startup's current twin and
 * rolling back a handful of fields to a plausible earlier state (fewer
 * traction metrics, earlier product stage, etc.), then running the same
 * engine against it, so the resulting history is real evidence-driven
 * output, not fabricated deltas. Clearly illustrative demo data.
 */
import { evaluateAssessment } from "@/lib/readiness/scoring";
import { FRAMEWORK_VERSION } from "@/types/readiness-engine";
import type {
  AssessmentAnswer,
  AssessmentAnswerValue,
  DimensionKey,
  DimensionResult,
  ReadinessAssessment,
} from "@/types/readiness-engine";
import type { StartupDigitalTwin } from "@/types/digital-twin";
import { demoDigitalTwins } from "./digital-twin";

function toAnswers(record: Record<string, AssessmentAnswerValue>, answeredAt: string): AssessmentAnswer[] {
  return Object.entries(record).map(([questionId, value]) => ({ questionId, value, answeredAt }));
}

function buildAssessment(
  startupId: string,
  version: number,
  twin: StartupDigitalTwin,
  answers: Record<string, AssessmentAnswerValue>,
  startedAt: string,
  completedAt: string,
  previous?: ReadinessAssessment,
): ReadinessAssessment {
  const previousByDim = previous
    ? (Object.fromEntries(previous.dimensions.map((d) => [d.dimension, d])) as Partial<
        Record<DimensionKey, DimensionResult>
      >)
    : undefined;

  const { overallScore, overallConfidence, dimensions } = evaluateAssessment(
    {
      twin,
      answers,
      stage: twin.identity.stage,
      businessModel: twin.businessModel.types,
      assessedAt: completedAt,
    },
    previousByDim,
  );

  return {
    id: `${startupId}-v${version}`,
    startupId,
    version,
    frameworkVersion: FRAMEWORK_VERSION,
    status: "completed",
    startupStageAtAssessment: twin.identity.stage,
    businessModelAtAssessment: twin.businessModel.types,
    startedAt,
    completedAt,
    overallScore,
    overallConfidence,
    dimensions,
    answers: toAnswers(answers, startedAt),
    evidenceSnapshot: dimensions.flatMap((d) => d.criteria.flatMap((c) => c.evidence)),
  };
}

// ---------------------------------------------------------------------------
// Wakama — MVP-stage AgriTech marketplace
// ---------------------------------------------------------------------------

const wakamaCurrentAnswers: Record<string, AssessmentAnswerValue> = {
  q_product_validation: true,
  q_technical_feasibility: 3,
  q_product_roadmap: false,
  q_execution_capacity: 3,
  q_domain_expertise: true,
  q_team_governance: false,
  q_generates_revenue: true,
  q_revenue_consistency: "mixed",
  q_forecasting: false,
  q_fundraising_readiness: true,
  q_operational_processes: false,
  q_delivery_capacity: 2,
  q_tooling_and_systems: false,
  q_scalability_readiness: 2,
  q_regulatory_compliance: true,
  q_contracts_and_agreements: false,
};

const wakamaPreviousAnswers: Record<string, AssessmentAnswerValue> = {
  q_product_validation: false,
  q_technical_feasibility: 2,
  q_execution_capacity: 2,
  q_domain_expertise: true,
  q_team_governance: false,
  q_generates_revenue: false,
  q_forecasting: false,
  q_fundraising_readiness: false,
  q_operational_processes: false,
  q_delivery_capacity: 1,
  q_tooling_and_systems: false,
  q_scalability_readiness: 1,
  q_regulatory_compliance: false,
  q_contracts_and_agreements: false,
};

function wakamaPreviousTwin(current: StartupDigitalTwin): StartupDigitalTwin {
  const twin = structuredClone(current);
  twin.product.developmentStage = "prototype";
  twin.traction.metrics = twin.traction.metrics.filter((m) => m.type === "active_users");
  if (twin.traction.metrics[0]) twin.traction.metrics[0].value = 150;
  twin.traction.narrative = undefined;
  twin.financials.runwayMonths = 3;
  twin.financials.monthlyRevenue = undefined;
  twin.team = [];
  twin.funding.previousRounds = [];
  twin.funding.totalRaised = undefined;
  twin.milestones = twin.milestones.filter((m) => m.title !== "First pilot region live");
  return twin;
}

// ---------------------------------------------------------------------------
// Solari — Early-traction CleanTech PAYG solar
// ---------------------------------------------------------------------------

const solariCurrentAnswers: Record<string, AssessmentAnswerValue> = {
  q_product_validation: true,
  q_technical_feasibility: 4,
  q_product_roadmap: true,
  q_execution_capacity: 4,
  q_domain_expertise: true,
  q_team_governance: true,
  q_generates_revenue: true,
  q_revenue_consistency: "recurring",
  q_forecasting: true,
  q_fundraising_readiness: true,
  q_operational_processes: true,
  q_delivery_capacity: 3,
  q_tooling_and_systems: true,
  q_scalability_readiness: 3,
  q_regulatory_compliance: true,
  q_contracts_and_agreements: true,
  q_board_governance: true,
};

const solariPreviousAnswers: Record<string, AssessmentAnswerValue> = {
  q_product_validation: true,
  q_technical_feasibility: 3,
  q_product_roadmap: true,
  q_execution_capacity: 3,
  q_domain_expertise: true,
  q_team_governance: true,
  q_generates_revenue: true,
  q_revenue_consistency: "recurring",
  q_forecasting: false,
  q_fundraising_readiness: false,
  q_operational_processes: true,
  q_delivery_capacity: 2,
  q_tooling_and_systems: true,
  q_scalability_readiness: 2,
  q_regulatory_compliance: true,
  q_contracts_and_agreements: true,
};

function solariPreviousTwin(current: StartupDigitalTwin): StartupDigitalTwin {
  const twin = structuredClone(current);
  const metrics = twin.traction.metrics;
  const activeCustomers = metrics.find((m) => m.type === "active_customers");
  if (activeCustomers) activeCustomers.value = 3000;
  const mrr = metrics.find((m) => m.type === "mrr");
  if (mrr) mrr.value = 15000;
  twin.traction.metrics = metrics.filter((m) => m.type !== "retention" && m.type !== "churn");
  twin.traction.commercialEvidence = undefined;
  twin.financials.runwayMonths = 24;
  twin.financials.annualRevenue = undefined;
  twin.funding.status = "not_raising";
  twin.funding.targetRaise = undefined;
  twin.milestones = twin.milestones.filter(
    (m) => m.title !== "8,000th household connected" && m.title !== "Uganda expansion launch",
  );
  return twin;
}

// ---------------------------------------------------------------------------

export function seedReadinessAssessments(): Record<string, ReadinessAssessment[]> {
  const wakamaTwin = demoDigitalTwins["startup-wakama"];
  const solariTwin = demoDigitalTwins["startup-solari"];

  const wakamaV1 = buildAssessment(
    "startup-wakama",
    1,
    wakamaPreviousTwin(wakamaTwin),
    wakamaPreviousAnswers,
    "2026-06-15",
    "2026-06-20",
  );
  const wakamaV2 = buildAssessment(
    "startup-wakama",
    2,
    wakamaTwin,
    wakamaCurrentAnswers,
    "2026-09-22",
    "2026-09-27",
    wakamaV1,
  );

  const solariV1 = buildAssessment(
    "startup-solari",
    1,
    solariPreviousTwin(solariTwin),
    solariPreviousAnswers,
    "2026-06-10",
    "2026-06-14",
  );
  const solariV2 = buildAssessment(
    "startup-solari",
    2,
    solariTwin,
    solariCurrentAnswers,
    "2026-09-20",
    "2026-09-25",
    solariV1,
  );

  return {
    "startup-wakama": [wakamaV1, wakamaV2],
    "startup-solari": [solariV1, solariV2],
  };
}
