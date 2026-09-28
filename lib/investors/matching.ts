/**
 * Deterministic, explainable investor↔startup matching engine.
 *
 * NO AI. NO embeddings. NO black-box score. NO percentage match. This module
 * must never compute or expose a single numeric "compatibility score" —
 * only a fixed set of named, checkable reasons (see types/investors.ts).
 *
 * Inputs are canonical startup facts only (Digital Twin + the canonical
 * FundingRequirement from Financials) — never Community popularity, expert
 * ratings, private messages, or the AFF Readiness score. This module reads
 * those facts but never mutates Readiness or the Digital Twin.
 */
import type { BusinessModelType, FundingInstrument } from "@/types/digital-twin";
import type { StartupStage } from "@/types/common";
import type { InvestmentThesis, InvestorMatch, InvestorRecord, MismatchReasonKey, SubstantiveMatchReasonKey } from "@/types/investors";

export type StartupMatchFacts = {
  startupId: string;
  stage?: StartupStage;
  industry?: string;
  countries: string[]; // startup HQ country + operating countries, as entered
  businessModels: BusinessModelType[];
  impactEnabled: boolean;
  impactThemes: string[]; // e.g. Digital Twin impact SDGs, founder-entered
  fundingRequirement?: {
    amount: number;
    currency: string;
    instrument?: FundingInstrument;
  };
};

function norm(value: string): string {
  return value.trim().toLowerCase();
}

function intersects(a: string[], b: string[]): boolean {
  const bSet = new Set(b.map(norm));
  return a.some((value) => bSet.has(norm(value)));
}

function ticketOutcome(
  requirement: StartupMatchFacts["fundingRequirement"],
  thesis: InvestmentThesis,
): "overlap" | "mismatch" | "unavailable" | "not_applicable" {
  if (!requirement) return "not_applicable";
  if (thesis.ticketMin === undefined && thesis.ticketMax === undefined) return "not_applicable";
  const min = thesis.ticketMin;
  const max = thesis.ticketMax;
  const thesisCurrency = min?.currency ?? max?.currency;
  if (thesisCurrency && thesisCurrency !== requirement.currency) {
    // §33 — never compare raw amounts across currencies as equivalent, and
    // no live FX conversion exists in this batch.
    return "unavailable";
  }
  const lowerOk = min === undefined || requirement.amount >= min.amount;
  const upperOk = max === undefined || requirement.amount <= max.amount;
  return lowerOk && upperOk ? "overlap" : "mismatch";
}

/**
 * Computes the explainable match between one startup and one investor.
 * Pure/deterministic: same inputs always produce the same output, and this
 * function has no side effects (no persistence, no Readiness/Twin writes).
 */
export function computeInvestorMatch(startup: StartupMatchFacts, investor: InvestorRecord): InvestorMatch {
  const thesis = investor.profile.thesis;
  const substantiveReasons: SubstantiveMatchReasonKey[] = [];
  const supplementaryReasons: InvestorMatch["supplementaryReasons"] = [];
  const mismatches: MismatchReasonKey[] = [];

  // STAGE
  if (startup.stage && thesis.stages.length > 0) {
    if (thesis.stages.includes(startup.stage)) substantiveReasons.push("STAGE_MATCH");
    else mismatches.push("STAGE_MISMATCH");
  }

  // INDUSTRY
  if (startup.industry && thesis.industries.length > 0 && intersects([startup.industry], thesis.industries)) {
    substantiveReasons.push("INDUSTRY_MATCH");
  }

  // GEOGRAPHY — only judged when both sides have country data; geographies
  // (regions) alone, with no country overlap data, are informational only
  // and never manufacture a match or mismatch.
  if (startup.countries.length > 0 && thesis.countries.length > 0) {
    if (intersects(startup.countries, thesis.countries)) substantiveReasons.push("GEOGRAPHY_MATCH");
    else mismatches.push("GEOGRAPHY_MISMATCH");
  }

  // TICKET — only when startup funding requirement AND investor ticket data
  // both exist (§32).
  const ticket = ticketOutcome(startup.fundingRequirement, thesis);
  if (ticket === "overlap") substantiveReasons.push("TICKET_OVERLAP");
  else if (ticket === "mismatch") mismatches.push("TICKET_MISMATCH");
  else if (ticket === "unavailable") mismatches.push("TICKET_COMPARISON_UNAVAILABLE");

  // INSTRUMENT
  if (startup.fundingRequirement?.instrument && thesis.instruments.length > 0) {
    if (thesis.instruments.includes(startup.fundingRequirement.instrument)) substantiveReasons.push("INSTRUMENT_MATCH");
    else mismatches.push("INSTRUMENT_MISMATCH");
  }

  // IMPACT — supplementary only. Never compensates for a stage mismatch or
  // any other complete thesis incompatibility (§13).
  if (startup.impactEnabled && startup.impactThemes.length > 0 && thesis.impactThemes.length > 0) {
    if (intersects(startup.impactThemes, thesis.impactThemes)) supplementaryReasons.push("IMPACT_MATCH");
  }

  // "Recommended" requires at least one substantive reason and no stage
  // mismatch (a hard thesis incompatibility supplementary reasons cannot
  // paper over). Still shown under Discover regardless.
  const recommended = substantiveReasons.length > 0 && !mismatches.includes("STAGE_MISMATCH");

  return {
    investorId: investor.organization.id,
    startupId: startup.startupId,
    substantiveReasons,
    supplementaryReasons,
    mismatches,
    recommended,
  };
}

// Reason weight used only for deterministic list ordering — NOT a score
// shown anywhere in the UI, purely a stable sort key.
const REASON_WEIGHT: Record<SubstantiveMatchReasonKey, number> = {
  STAGE_MATCH: 5,
  INDUSTRY_MATCH: 4,
  TICKET_OVERLAP: 3,
  GEOGRAPHY_MATCH: 2,
  INSTRUMENT_MATCH: 1,
};

function matchWeight(match: InvestorMatch): number {
  return match.substantiveReasons.reduce((sum, reason) => sum + REASON_WEIGHT[reason], 0) + match.supplementaryReasons.length * 0.5;
}

/**
 * Deterministic ordering for a list of matches (Recommended tab, etc.).
 * Tie-break order: (1) match weight desc, (2) substantive reason count
 * desc, (3) investor organization name (locale-neutral string compare)
 * asc, (4) investor id asc as the final, fully deterministic tiebreaker.
 */
export function sortInvestorMatches(matches: InvestorMatch[], investorsById: Map<string, InvestorRecord>): InvestorMatch[] {
  return [...matches].sort((a, b) => {
    const weightDiff = matchWeight(b) - matchWeight(a);
    if (weightDiff !== 0) return weightDiff;
    const countDiff = b.substantiveReasons.length - a.substantiveReasons.length;
    if (countDiff !== 0) return countDiff;
    const nameA = investorsById.get(a.investorId)?.organization.name ?? "";
    const nameB = investorsById.get(b.investorId)?.organization.name ?? "";
    const nameDiff = nameA.localeCompare(nameB);
    if (nameDiff !== 0) return nameDiff;
    return a.investorId.localeCompare(b.investorId);
  });
}
