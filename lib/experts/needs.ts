/**
 * Startup Need derivation (AFF-DASH-07) — pure, deterministic, READ-ONLY
 * adapters that turn already-fetched domain snapshots into StartupNeed-
 * shaped data. Nothing here mutates lib/services/{readiness,financials,
 * pitch,data-room,roadmap}.ts, and nothing here auto-persists a StartupNeed
 * row for every minor warning — these are derivations produced on read, not
 * a background job.
 *
 * Each `deriveXNeeds` function is a pure function of an already-loaded
 * domain snapshot (so it's trivially unit-testable with fixtures). The
 * orchestrator `deriveAllNeeds` is the one place that actually calls the
 * read accessors of the five source services, exactly mirroring how
 * lib/services/roadmap.ts's generateOrRegenerateRoadmap() fetches inputs
 * before calling the pure lib/roadmap/generator.ts.
 */
import { randomUUID } from "crypto";
import type { ExpertiseCategoryId } from "./taxonomy";
import { READINESS_DIMENSION_TO_EXPERTISE } from "./taxonomy";
import type { StartupNeed, StartupNeedUrgency } from "@/types/experts";
import type { ReadinessAssessment } from "@/types/readiness-engine";
import type { FinancialSignal } from "@/types/financials";
import type { PitchReadinessResult, PitchVersion } from "@/types/pitch";
import type { DataRoomChecklist } from "@/types/data-room";
import type { Roadmap } from "@/types/roadmap";

import { getLatestAssessment } from "@/lib/services/readiness";
import { getFinancialSnapshot } from "@/lib/services/financials";
import { getActiveVersion, getPitchReadiness } from "@/lib/services/pitch";
import { getChecklist } from "@/lib/services/data-room";
import { getCurrentRoadmap } from "@/lib/services/roadmap";

function urgencyFromScore(score: number): StartupNeedUrgency {
  if (score < 30) return "CRITICAL";
  if (score < 50) return "HIGH";
  if (score < 70) return "MEDIUM";
  return "LOW";
}

const READINESS_GAP_THRESHOLD = 60;

/** READINESS_GAP: a weak AFF Readiness dimension -> its mapped expertise category. */
export function deriveReadinessGapNeeds(startupId: string, assessment: ReadinessAssessment | undefined): StartupNeed[] {
  if (!assessment) return [];
  const needs: StartupNeed[] = [];
  for (const dimension of assessment.dimensions) {
    if (dimension.score === null || dimension.score >= READINESS_GAP_THRESHOLD) continue;
    const categories = READINESS_DIMENSION_TO_EXPERTISE[dimension.dimension];
    if (!categories || categories.length === 0) continue;
    needs.push({
      id: `readiness-gap:${startupId}:${dimension.dimension}`,
      startupId,
      sourceType: "READINESS_GAP",
      sourceId: dimension.dimension,
      category: categories[0],
      title: `dashboard.experts.needs.readinessGap.title`,
      description: `dashboard.experts.needs.readinessGap.description`,
      urgency: urgencyFromScore(dimension.score),
      status: "OPEN",
      createdAt: assessment.completedAt ?? assessment.startedAt,
    });
  }
  return needs;
}

const FINANCIAL_SIGNAL_TO_CATEGORY: Record<FinancialSignal["key"], ExpertiseCategoryId | undefined> = {
  revenue_declining: "GROWTH",
  expenses_outpacing_revenue: "FINANCE",
  runway_below_3_months: "FUNDRAISING",
  runway_below_6_months: "FUNDRAISING",
  stale_financial_update: "FINANCIAL_MODELING",
  no_forecast: "FINANCIAL_MODELING",
  funding_exceeds_forecast_need: "FUNDRAISING",
  positive_operating_trend: undefined, // a positive signal is never a "need"
};

const FINANCIAL_SIGNAL_URGENCY: Record<FinancialSignal["severity"], StartupNeedUrgency> = {
  info: "LOW",
  warning: "MEDIUM",
  critical: "CRITICAL",
};

/** FINANCIAL_SIGNAL: e.g. runway < 3 months -> Finance/Fundraising. */
export function deriveFinancialSignalNeeds(startupId: string, signals: FinancialSignal[], nowIso: string): StartupNeed[] {
  const needs: StartupNeed[] = [];
  for (const signal of signals) {
    const category = FINANCIAL_SIGNAL_TO_CATEGORY[signal.key];
    if (!category) continue;
    needs.push({
      id: `financial-signal:${startupId}:${signal.key}`,
      startupId,
      sourceType: "FINANCIAL_SIGNAL",
      sourceId: signal.key,
      category,
      title: `dashboard.experts.needs.financialSignal.title.${signal.key}`,
      description: `dashboard.experts.needs.financialSignal.description.${signal.key}`,
      urgency: FINANCIAL_SIGNAL_URGENCY[signal.severity],
      status: "OPEN",
      createdAt: nowIso,
    });
  }
  return needs;
}

const PITCH_DIMENSION_THRESHOLD = 55;
const PITCH_DIMENSION_TO_CATEGORY: Partial<Record<PitchReadinessResult["dimensions"][number]["key"], ExpertiseCategoryId>> = {
  ask_clarity: "FUNDRAISING",
  financial_funding_clarity: "FINANCIAL_MODELING",
  narrative_clarity: "PITCHING",
  problem_evidence: "PROBLEM_MARKET_VALIDATION",
  market_story: "PROBLEM_MARKET_VALIDATION",
  business_model: "BUSINESS_MODEL",
  traction_story: "GROWTH",
  team_story: "HR_TALENT",
};

/** PITCH_GAP: a weak Pitch Readiness dimension (e.g. ask clarity) -> Pitching/Fundraising. */
export function derivePitchGapNeeds(
  startupId: string,
  pitchVersion: PitchVersion | undefined,
  readiness: PitchReadinessResult | undefined,
): StartupNeed[] {
  if (!pitchVersion || !readiness) return [];
  const needs: StartupNeed[] = [];
  for (const dim of readiness.dimensions) {
    if (dim.score >= PITCH_DIMENSION_THRESHOLD) continue;
    const category = PITCH_DIMENSION_TO_CATEGORY[dim.key];
    if (!category) continue;
    needs.push({
      id: `pitch-gap:${startupId}:${pitchVersion.id}:${dim.key}`,
      startupId,
      sourceType: "PITCH_GAP",
      sourceId: `${pitchVersion.id}:${dim.key}`,
      category,
      title: `dashboard.experts.needs.pitchGap.title.${dim.key}`,
      description: `dashboard.experts.needs.pitchGap.description.${dim.key}`,
      urgency: urgencyFromScore(dim.score),
      status: "OPEN",
      createdAt: readiness.computedAt,
    });
  }
  return needs;
}

const DATA_ROOM_CATEGORY_TO_EXPERTISE: Record<string, ExpertiseCategoryId> = {
  corporate: "GOVERNANCE",
  legal: "LEGAL",
  finance: "FINANCIAL_MODELING",
  fundraising: "FUNDRAISING",
  product: "PRODUCT",
  commercial: "SALES",
  team: "HR_TALENT",
  ip: "IP",
  compliance: "COMPLIANCE",
  impact_esg: "IMPACT_ESG",
  other: "STRATEGY",
};

/** DATA_ROOM_GAP: a missing/outdated required document -> Legal/Governance (or the category's mapped expertise). */
export function deriveDataRoomGapNeeds(startupId: string, checklist: DataRoomChecklist | undefined, nowIso: string): StartupNeed[] {
  if (!checklist) return [];
  const needs: StartupNeed[] = [];
  for (const item of checklist.items) {
    if (item.status !== "missing" && item.status !== "outdated") continue;
    const category = DATA_ROOM_CATEGORY_TO_EXPERTISE[item.requirement.category] ?? "GOVERNANCE";
    needs.push({
      id: `data-room-gap:${startupId}:${item.requirement.key}`,
      startupId,
      sourceType: "DATA_ROOM_GAP",
      sourceId: item.requirement.key,
      category,
      title: `dashboard.experts.needs.dataRoomGap.title`,
      description: `dashboard.experts.needs.dataRoomGap.description`,
      urgency: item.status === "missing" ? "MEDIUM" : "LOW",
      status: "OPEN",
      createdAt: nowIso,
    });
  }
  return needs;
}

const ROADMAP_CATEGORY_TO_EXPERTISE: Record<string, ExpertiseCategoryId> = {
  problem_market: "PROBLEM_MARKET_VALIDATION",
  product: "PRODUCT",
  business_model: "BUSINESS_MODEL",
  traction: "GROWTH",
  team: "HR_TALENT",
  finance: "FINANCE",
  fundraising: "FUNDRAISING",
  operations: "OPERATIONS",
  legal_governance: "LEGAL",
  impact_esg: "IMPACT_ESG",
  general: "STRATEGY",
};

/** ROADMAP_ITEM: a high/critical priority open GTM-shaped roadmap item -> Go-to-Market (or its category's mapped expertise). */
export function deriveRoadmapItemNeeds(startupId: string, roadmap: Roadmap | undefined): StartupNeed[] {
  if (!roadmap) return [];
  const needs: StartupNeed[] = [];
  for (const item of roadmap.items) {
    if (item.status === "done" || item.status === "cancelled") continue;
    if (item.priority !== "high" && item.priority !== "critical") continue;
    const category =
      item.category === "traction" || item.category === "business_model"
        ? "GO_TO_MARKET"
        : (ROADMAP_CATEGORY_TO_EXPERTISE[item.category ?? "general"] ?? "STRATEGY");
    needs.push({
      id: `roadmap-item:${startupId}:${item.id}`,
      startupId,
      sourceType: "ROADMAP_ITEM",
      sourceId: item.id,
      category,
      title: item.title || `dashboard.experts.needs.roadmapItem.title`,
      description: item.description || `dashboard.experts.needs.roadmapItem.description`,
      urgency: item.priority === "critical" ? "CRITICAL" : "HIGH",
      status: "OPEN",
      createdAt: item.createdAt ?? new Date().toISOString(),
    });
  }
  return needs;
}

/** FOUNDER_DECLARED: a founder manually says "I need help with X" — always valid, no live data required. */
export function buildFounderDeclaredNeed(
  startupId: string,
  input: { category: ExpertiseCategoryId; title: string; description?: string },
  nowIso: string,
): StartupNeed {
  return {
    id: randomUUID(),
    startupId,
    sourceType: "FOUNDER_DECLARED",
    category: input.category,
    title: input.title,
    description: input.description ?? "",
    urgency: "MEDIUM",
    status: "OPEN",
    createdAt: nowIso,
  };
}

/**
 * Orchestrator — fetches live inputs from the five source services (read
 * accessors only, never a mutating call) and runs every pure deriver above.
 * Does NOT persist anything; callers (lib/services/experts.ts) decide
 * whether/how to combine this with any persisted founder-declared needs.
 */
export function deriveAllNeeds(startupId: string, nowIso: string): StartupNeed[] {
  const assessment = getLatestAssessment(startupId);
  const financialSnapshot = getFinancialSnapshot(startupId, nowIso);
  const activeVersion = getActiveVersion(startupId);
  const pitchReadiness = activeVersion ? getPitchReadiness(startupId, activeVersion.id, nowIso) : undefined;
  const checklist = getChecklist(startupId);
  const roadmap = getCurrentRoadmap(startupId);

  return [
    ...deriveReadinessGapNeeds(startupId, assessment),
    ...deriveFinancialSignalNeeds(startupId, financialSnapshot.signals, nowIso),
    ...derivePitchGapNeeds(startupId, activeVersion, pitchReadiness),
    ...deriveDataRoomGapNeeds(startupId, checklist, nowIso),
    ...deriveRoadmapItemNeeds(startupId, roadmap),
  ];
}
