/**
 * Digital Twin → Pitch prefill (AFF-DASH-05 Part 5/6/9).
 *
 * Deterministic, one-way SNAPSHOT copy at import time — never a live
 * binding. Editing pitch section content must NEVER mutate the Digital
 * Twin (enforced structurally: this file has no write access to
 * lib/services/digital-twin.ts, only read access via the twin object
 * passed in). Conversely, editing the Digital Twin never silently rewrites
 * a founder's pitch narrative — see detectSourceUpdates() below, which is
 * how "SOURCE UPDATED" banners are computed instead.
 */
import { randomUUID } from "crypto";
import type { StartupDigitalTwin } from "@/types/digital-twin";
import type { PitchSection, PitchSectionStatus, PitchSectionType, SourceReference } from "@/types/pitch";
import { SECTION_DEFINITIONS, isSectionRequired } from "./section-config";
import type { PitchObjective, PitchType } from "@/types/pitch";

const FIELD_LABEL_KEYS: Record<string, string> = {
  "problem.statement": "dashboard.pitch.sourceFields.problemStatement",
  "problem.targetCustomer": "dashboard.pitch.sourceFields.targetCustomer",
  "problem.evidence": "dashboard.pitch.sourceFields.problemEvidence",
  "product.valueProposition": "dashboard.pitch.sourceFields.valueProposition",
  "product.description": "dashboard.pitch.sourceFields.productDescription",
  "product.coreFeatures": "dashboard.pitch.sourceFields.coreFeatures",
  "market.primaryMarket": "dashboard.pitch.sourceFields.primaryMarket",
  "market.sizing": "dashboard.pitch.sourceFields.marketSizing",
  "market.trends": "dashboard.pitch.sourceFields.marketTrends",
  "businessModel.types": "dashboard.pitch.sourceFields.businessModelTypes",
  "businessModel.pricingModel": "dashboard.pitch.sourceFields.pricingModel",
  "traction.narrative": "dashboard.pitch.sourceFields.tractionNarrative",
  "traction.metrics": "dashboard.pitch.sourceFields.tractionMetrics",
  "market.competitors": "dashboard.pitch.sourceFields.competitors",
  "market.competitiveAdvantage": "dashboard.pitch.sourceFields.competitiveAdvantage",
  "founders": "dashboard.pitch.sourceFields.founders",
  "team": "dashboard.pitch.sourceFields.team",
  "financials.summary": "dashboard.pitch.sourceFields.financialsSummary",
  "funding.ask": "dashboard.pitch.sourceFields.fundingAsk",
  "impact.thesis": "dashboard.pitch.sourceFields.impactThesis",
};

function ref(fieldKey: string, snapshot: string): SourceReference {
  return { fieldKey, labelKey: FIELD_LABEL_KEYS[fieldKey] ?? fieldKey, snapshot };
}

function nonEmpty(values: (string | undefined | null)[]): string[] {
  return values.filter((v): v is string => Boolean(v && v.trim().length > 0));
}

/**
 * Pure function: given a section type and a Digital Twin, returns the
 * deterministic PREFILL SNAPSHOT (content, key points, source references).
 * Returns undefined sourceable content for sections with no direct Digital
 * Twin mapping (hook, closing, go_to_market) — those are founder-authored
 * from the start.
 */
export function prefillSection(type: PitchSectionType, twin: StartupDigitalTwin): {
  content: string;
  keyPoints: string[];
  sourceReferences: SourceReference[];
} {
  switch (type) {
    case "problem": {
      const content = nonEmpty([twin.problem.statement, twin.problem.evidence]).join("\n\n");
      const keyPoints = nonEmpty([twin.problem.targetCustomer, twin.problem.whyNow]);
      const refs = [
        twin.problem.statement ? ref("problem.statement", twin.problem.statement) : null,
        twin.problem.targetCustomer ? ref("problem.targetCustomer", twin.problem.targetCustomer) : null,
        twin.problem.evidence ? ref("problem.evidence", twin.problem.evidence) : null,
      ].filter((r): r is SourceReference => r !== null);
      return { content, keyPoints, sourceReferences: refs };
    }
    case "solution": {
      const content = nonEmpty([twin.product.valueProposition, twin.product.description]).join("\n\n");
      const keyPoints = twin.product.coreFeatures ?? [];
      const refs = [
        twin.product.valueProposition ? ref("product.valueProposition", twin.product.valueProposition) : null,
        twin.product.description ? ref("product.description", twin.product.description) : null,
        twin.product.coreFeatures?.length ? ref("product.coreFeatures", twin.product.coreFeatures.join("|")) : null,
      ].filter((r): r is SourceReference => r !== null);
      return { content, keyPoints, sourceReferences: refs };
    }
    case "product": {
      const content = twin.product.description ?? "";
      const keyPoints = twin.product.coreFeatures ?? [];
      const refs = [
        twin.product.description ? ref("product.description", twin.product.description) : null,
        twin.product.coreFeatures?.length ? ref("product.coreFeatures", twin.product.coreFeatures.join("|")) : null,
      ].filter((r): r is SourceReference => r !== null);
      return { content, keyPoints, sourceReferences: refs };
    }
    case "market": {
      const sizing = [twin.market.tam, twin.market.sam, twin.market.som]
        .filter((m): m is NonNullable<typeof m> => Boolean(m))
        .map((m) => `${m.amount.amount} ${m.amount.currency}`)
        .join(" / ");
      const content = nonEmpty([twin.market.primaryMarket, sizing || undefined, twin.market.trends]).join("\n\n");
      const keyPoints = twin.market.customerSegments ?? [];
      const refs = [
        twin.market.primaryMarket ? ref("market.primaryMarket", twin.market.primaryMarket) : null,
        sizing ? ref("market.sizing", sizing) : null,
        twin.market.trends ? ref("market.trends", twin.market.trends) : null,
      ].filter((r): r is SourceReference => r !== null);
      return { content, keyPoints, sourceReferences: refs };
    }
    case "business_model": {
      const typesStr = twin.businessModel.types.join(", ");
      const content = nonEmpty([typesStr || undefined, twin.businessModel.pricingModel]).join("\n\n");
      const keyPoints = twin.businessModel.revenueStreams.map((r) => r.label);
      const refs = [
        typesStr ? ref("businessModel.types", typesStr) : null,
        twin.businessModel.pricingModel ? ref("businessModel.pricingModel", twin.businessModel.pricingModel) : null,
      ].filter((r): r is SourceReference => r !== null);
      return { content, keyPoints, sourceReferences: refs };
    }
    case "traction": {
      const metricsStr = twin.traction.metrics.map((m) => `${m.label}: ${m.value}${m.unit ?? ""}`).join("; ");
      const content = nonEmpty([twin.traction.narrative, metricsStr || undefined]).join("\n\n");
      const keyPoints = twin.traction.majorCustomers ?? [];
      const refs = [
        twin.traction.narrative ? ref("traction.narrative", twin.traction.narrative) : null,
        metricsStr ? ref("traction.metrics", metricsStr) : null,
      ].filter((r): r is SourceReference => r !== null);
      return { content, keyPoints, sourceReferences: refs };
    }
    case "competition": {
      const competitorsStr = twin.market.competitors.map((c) => c.name).join(", ");
      const content = nonEmpty([twin.market.competitiveAdvantage, competitorsStr || undefined]).join("\n\n");
      const keyPoints = twin.market.competitors.map((c) => c.name);
      const refs = [
        competitorsStr ? ref("market.competitors", competitorsStr) : null,
        twin.market.competitiveAdvantage ? ref("market.competitiveAdvantage", twin.market.competitiveAdvantage) : null,
      ].filter((r): r is SourceReference => r !== null);
      return { content, keyPoints, sourceReferences: refs };
    }
    case "team": {
      const foundersStr = twin.founders.map((f) => `${f.firstName} ${f.lastName} — ${f.role}`).join("; ");
      const content = foundersStr;
      const keyPoints = twin.team.map((m) => `${m.name} — ${m.role}`);
      const refs = foundersStr ? [ref("founders", foundersStr)] : [];
      return { content, keyPoints, sourceReferences: refs };
    }
    case "financials": {
      const parts = nonEmpty([
        twin.financials.annualRevenue !== undefined ? `Annual revenue: ${twin.financials.annualRevenue} ${twin.financials.currency}` : undefined,
        twin.financials.monthlyBurn !== undefined ? `Monthly burn: ${twin.financials.monthlyBurn} ${twin.financials.currency}` : undefined,
        twin.financials.runwayMonths !== undefined ? `Runway: ${twin.financials.runwayMonths} months` : undefined,
      ]);
      const content = parts.join("\n");
      const refs = content ? [ref("financials.summary", content)] : [];
      return { content, keyPoints: [], sourceReferences: refs };
    }
    case "fundraising_ask": {
      const parts = nonEmpty([
        twin.funding.targetRaise ? `Raising ${twin.funding.targetRaise.amount} ${twin.funding.targetRaise.currency}` : undefined,
        twin.funding.instrument,
        twin.funding.useOfFunds,
      ]);
      const content = parts.join("\n\n");
      const refs = content ? [ref("funding.ask", content)] : [];
      return { content, keyPoints: [], sourceReferences: refs };
    }
    case "vision_impact": {
      const content = twin.impact.enabled ? twin.impact.thesis ?? "" : "";
      const refs = content ? [ref("impact.thesis", content)] : [];
      return { content, keyPoints: [], sourceReferences: refs };
    }
    case "hook":
    case "go_to_market":
    case "closing":
    default:
      return { content: "", keyPoints: [], sourceReferences: [] };
  }
}

function statusForContent(content: string, keyPoints: string[]): PitchSectionStatus {
  if (!content.trim() && keyPoints.length === 0) return "empty";
  if (content.trim().length < 40) return "draft";
  return "draft"; // founder must explicitly mark "complete" — never auto-promoted
}

/**
 * Builds the full ordered PitchSection[] for a brand-new version, prefilled
 * from the Digital Twin wherever a mapping exists. `required` reflects
 * pitch-type/objective applicability (Part 4), computed once at creation
 * time and NOT recomputed automatically if the workspace's type/objective
 * later changes (the founder can regenerate applicability explicitly).
 */
export function buildInitialSections(twin: StartupDigitalTwin, pitchType: PitchType, objective: PitchObjective): PitchSection[] {
  return SECTION_DEFINITIONS.map((def) => {
    const prefilled = prefillSection(def.type, twin);
    return {
      id: randomUUID(),
      type: def.type,
      content: prefilled.content,
      keyPoints: prefilled.keyPoints,
      sourceReferences: prefilled.sourceReferences,
      status: statusForContent(prefilled.content, prefilled.keyPoints),
      order: def.order,
      required: isSectionRequired(def.type, pitchType, objective),
    };
  });
}

/**
 * Detects "SOURCE UPDATED" — whether the Digital Twin's current value for
 * any of a section's source fields differs from the snapshot stored at
 * import time. Returns the field keys that drifted; an empty array means
 * nothing changed. Never mutates anything — the founder chooses whether to
 * re-import (see refreshSectionFromProfile in lib/services/pitch.ts).
 */
export function detectSourceUpdates(section: PitchSection, twin: StartupDigitalTwin): string[] {
  if (section.sourceReferences.length === 0) return [];
  const fresh = prefillSection(section.type, twin);
  const freshByField = new Map(fresh.sourceReferences.map((r) => [r.fieldKey, r.snapshot]));
  return section.sourceReferences
    .filter((existing) => freshByField.has(existing.fieldKey) && freshByField.get(existing.fieldKey) !== existing.snapshot)
    .map((r) => r.fieldKey);
}
