/**
 * Deterministic Section Completion Engine.
 *
 * Computes what fraction of each Digital Twin section is filled in. This is
 * PROFILE COMPLETION — whether information exists — and must never be
 * confused with, or used to derive, the (separate, not-yet-built) AFF
 * Readiness Score, which will judge the quality of that information. Never
 * hardcode a completion percentage in a UI component; always call
 * computeProfileCompletion().
 *
 * Missing items carry a stable `fieldKey` (not a literal label) so the UI
 * can translate them via the `dashboard.digitalTwin.fields` namespace —
 * this is user-facing chrome, not startup-entered content, so it must be
 * bilingual like everything else in the dashboard.
 */
import type { DigitalTwinSectionKey, StartupDigitalTwin } from "@/types/digital-twin";
import type { MissingItem, ProfileCompletion, SectionCompletion } from "@/types/profile-completion";

type CheckResult = { fieldKey: string; ok: boolean };

function pct(checks: CheckResult[]): number {
  if (checks.length === 0) return 100;
  const done = checks.filter((c) => c.ok).length;
  return Math.round((done / checks.length) * 100);
}

function identityChecks(twin: StartupDigitalTwin): CheckResult[] {
  const i = twin.identity;
  return [
    { fieldKey: "identityName", ok: Boolean(i.name?.trim()) },
    { fieldKey: "identityTagline", ok: Boolean(i.tagline?.trim()) },
    { fieldKey: "identityShortDescription", ok: Boolean(i.shortDescription?.trim()) },
    { fieldKey: "identityWebsite", ok: Boolean(i.website?.trim()) },
    { fieldKey: "identityCountry", ok: Boolean(i.country?.trim()) },
    { fieldKey: "identityIndustry", ok: Boolean(i.industry?.trim()) },
    { fieldKey: "identityFoundedYear", ok: i.foundedYear != null },
    { fieldKey: "identityRegistration", ok: Boolean(i.registration?.status) },
    { fieldKey: "identityCurrency", ok: Boolean(i.preferredCurrency?.trim()) },
  ];
}

function foundersChecks(twin: StartupDigitalTwin): CheckResult[] {
  return [
    { fieldKey: "foundersAtLeastOne", ok: twin.founders.length > 0 },
    { fieldKey: "foundersPrimaryContact", ok: twin.founders.some((f) => f.isPrimaryContact) },
  ];
}

function teamChecks(twin: StartupDigitalTwin): CheckResult[] {
  return [{ fieldKey: "teamAtLeastOne", ok: twin.team.length > 0 }];
}

function problemChecks(twin: StartupDigitalTwin): CheckResult[] {
  const p = twin.problem;
  return [
    { fieldKey: "problemStatement", ok: Boolean(p.statement?.trim()) },
    { fieldKey: "problemTargetCustomer", ok: Boolean(p.targetCustomer?.trim()) },
    { fieldKey: "problemAlternatives", ok: Boolean(p.currentAlternatives?.trim()) },
    { fieldKey: "problemEvidence", ok: Boolean(p.evidence?.trim()) },
    { fieldKey: "problemWhyNow", ok: Boolean(p.whyNow?.trim()) },
  ];
}

function productChecks(twin: StartupDigitalTwin): CheckResult[] {
  const p = twin.product;
  return [
    { fieldKey: "productName", ok: Boolean(p.name?.trim()) },
    { fieldKey: "productDescription", ok: Boolean(p.description?.trim()) },
    { fieldKey: "productValueProposition", ok: Boolean(p.valueProposition?.trim()) },
    { fieldKey: "productDevelopmentStage", ok: Boolean(p.developmentStage) },
    { fieldKey: "productCoreFeatures", ok: p.coreFeatures.length > 0 },
  ];
}

function marketChecks(twin: StartupDigitalTwin): CheckResult[] {
  const m = twin.market;
  return [
    { fieldKey: "marketCustomerSegments", ok: m.customerSegments.length > 0 },
    { fieldKey: "marketGeographies", ok: m.geographies.length > 0 },
    { fieldKey: "marketSizingMethodology", ok: Boolean(m.tam || m.sam || m.som) },
    { fieldKey: "marketCompetitors", ok: m.competitors.length > 0 },
    { fieldKey: "marketCompetitiveAdvantage", ok: Boolean(m.competitiveAdvantage?.trim()) },
  ];
}

function businessModelChecks(twin: StartupDigitalTwin): CheckResult[] {
  const b = twin.businessModel;
  return [
    { fieldKey: "businessModelType", ok: b.types.length > 0 },
    { fieldKey: "businessRevenueStreams", ok: b.revenueStreams.length > 0 },
    { fieldKey: "businessPricingModel", ok: Boolean(b.pricingModel?.trim()) },
    { fieldKey: "businessSalesChannels", ok: b.salesChannels.length > 0 },
  ];
}

function tractionChecks(twin: StartupDigitalTwin): CheckResult[] {
  const t = twin.traction;
  return [
    { fieldKey: "tractionAtLeastOneMetric", ok: t.metrics.length > 0 },
    { fieldKey: "tractionNarrative", ok: Boolean(t.narrative?.trim()) },
    { fieldKey: "tractionCommercialEvidence", ok: Boolean(t.commercialEvidence?.trim()) },
  ];
}

function financialsChecks(twin: StartupDigitalTwin): CheckResult[] {
  const f = twin.financials;
  return [
    { fieldKey: "financialsMonthlyRevenue", ok: f.monthlyRevenue != null },
    { fieldKey: "financialsMonthlyBurn", ok: f.monthlyBurn != null },
    { fieldKey: "financialsCashBalance", ok: f.cashBalance != null },
    { fieldKey: "financialsRunway", ok: f.runwayMonths != null },
  ];
}

function fundingChecks(twin: StartupDigitalTwin): CheckResult[] {
  const f = twin.funding;
  return [
    { fieldKey: "fundingStatus", ok: Boolean(f.status) },
    { fieldKey: "fundingInstrument", ok: Boolean(f.instrument) },
    { fieldKey: "fundingUseOfFunds", ok: Boolean(f.useOfFunds?.trim()) },
  ];
}

function impactChecks(twin: StartupDigitalTwin): CheckResult[] {
  const im = twin.impact;
  if (!im.enabled) return [{ fieldKey: "impactDecision", ok: true }];
  return [
    { fieldKey: "impactThesis", ok: Boolean(im.thesis?.trim()) },
    { fieldKey: "impactSdgs", ok: im.sdgs.length > 0 },
    { fieldKey: "impactBeneficiaries", ok: im.beneficiaries != null },
  ];
}

function goalsChecks(twin: StartupDigitalTwin): CheckResult[] {
  return [{ fieldKey: "goalsAtLeastOne", ok: twin.goals.length > 0 }];
}

function risksChecks(twin: StartupDigitalTwin): CheckResult[] {
  return [{ fieldKey: "risksAtLeastOne", ok: twin.risks.length > 0 }];
}

function milestonesChecks(twin: StartupDigitalTwin): CheckResult[] {
  return [{ fieldKey: "milestonesAtLeastOne", ok: twin.milestones.length > 0 }];
}

const sectionCheckers: Record<DigitalTwinSectionKey, (twin: StartupDigitalTwin) => CheckResult[]> = {
  identity: identityChecks,
  founders: foundersChecks,
  team: teamChecks,
  problem: problemChecks,
  product: productChecks,
  market: marketChecks,
  businessModel: businessModelChecks,
  traction: tractionChecks,
  financials: financialsChecks,
  funding: fundingChecks,
  impact: impactChecks,
  goals: goalsChecks,
  risks: risksChecks,
  milestones: milestonesChecks,
};

// Priority order for surfacing "missing items" — roughly matches
// investor-readiness importance. Purely a display ordering, not a weighting.
const sectionOrder: DigitalTwinSectionKey[] = [
  "identity",
  "problem",
  "product",
  "market",
  "businessModel",
  "traction",
  "financials",
  "funding",
  "founders",
  "team",
  "impact",
  "goals",
  "risks",
  "milestones",
];

export function computeProfileCompletion(twin: StartupDigitalTwin): ProfileCompletion {
  const bySection: SectionCompletion[] = sectionOrder.map((section) => ({
    section,
    pct: pct(sectionCheckers[section](twin)),
  }));

  const missingItems: MissingItem[] = sectionOrder.flatMap((section) =>
    sectionCheckers[section](twin)
      .filter((check) => !check.ok)
      .map((check) => ({ section, fieldKey: check.fieldKey })),
  );

  const overallPct =
    bySection.length === 0 ? 0 : Math.round(bySection.reduce((sum, s) => sum + s.pct, 0) / bySection.length);

  return { overallPct, bySection, missingItems };
}
