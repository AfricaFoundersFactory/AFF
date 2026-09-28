/**
 * Founder Command Center data boundary.
 *
 * Startup identity, profile completion, readiness, roadmap and tasks all
 * come from LIVE services (Digital Twin + Readiness Engine + Roadmap/Task
 * engines, see lib/roadmap/*.ts and lib/services/{roadmap,tasks}.ts);
 * opportunities/activity are still backed by lib/demo/* for this batch.
 * Dashboard components only ever import from here, never from lib/demo or
 * the underlying services directly, so any of them can be swapped for a
 * real backend without touching the UI.
 */
import { getTranslations } from "next-intl/server";
import type { Startup } from "@/types/domain";
import type { NextBestAction } from "@/types/readiness";
import type { ReadinessAssessment } from "@/types/readiness-engine";
import type { Roadmap, Task } from "@/types/roadmap";
import type { OpportunityMatch } from "@/types/opportunity";
import type { Activity, UpcomingEvent } from "@/types/activity";
import type { ProfileCompletion } from "@/types/profile-completion";
import {
  demoNextBestActionByStartup,
  demoRecentActivityByStartup,
  demoUpcomingEventsByStartup,
} from "@/lib/demo";
import { getDigitalTwin } from "@/lib/services/digital-twin";
import { computeProfileCompletion } from "@/lib/services/profile-completion";
import { getLatestAssessment } from "@/lib/services/readiness";
import { getCurrentRoadmap } from "@/lib/services/roadmap";
import { getTasksForStartup } from "@/lib/services/tasks";
import { listOpportunities } from "@/lib/services/opportunities";
import { buildOpportunityMatchContext, matchOpportunities } from "@/lib/opportunities/matching";
import { getWorkspace, getActiveVersion } from "@/lib/services/pitch";
import { getFinancialProfile, getFinancialSnapshot } from "@/lib/services/financials";
import { getDataRoom, getCompletion } from "@/lib/services/data-room";
import { listStartupNeeds } from "@/lib/services/experts";
import { listPipeline, getActiveRound } from "@/lib/services/fundraising-pipeline";
import { listIntroductionRequests } from "@/lib/services/introduction-requests";
import { TERMINAL_PIPELINE_STAGES } from "@/types/investors";
import type { RunwayResult } from "@/lib/financials/calculations";
import type { ExpertiseCategoryId } from "@/lib/experts/taxonomy";

// Pitch Lab summary for the Command Center widget (Part 25) — deliberately
// minimal: title, Pitch Readiness %, and a count of sections needing
// attention. NEVER the same metric as AFF Readiness/profileCompletion/
// roadmap progress above — see lib/pitch/readiness.ts for why they must
// stay separate.
export type PitchSummary = {
  title: string;
  readinessScore: number | undefined;
  sectionsNeedingAttention: number;
};

// Financial Command Center + Data Room summary for the Command Center
// widget (AFF-DASH-06 part M) — same conditional-rendering convention as
// PitchSummary: undefined means "nothing entered yet", so the UI offers a
// CTA rather than fabricating a runway or completion figure. Runway itself
// stays a RunwayResult (never a bare number) so "unavailable"/"sustainable"
// are never silently collapsed into a fake numeric value.
export type FinancialCommandCenterSummary = {
  runway: RunwayResult;
  lastUpdatedAt: string | undefined;
  dataRoomCompletionPct: number;
  dataRoomRequiredTotal: number;
};

// Expert Support widget (AFF-DASH-07) — a lightweight, honest summary of
// derived+declared open needs. Never a score/ranking of experts, and never
// manufactures urgency: an empty needsCategories list means "explore the
// network" rather than a fabricated need count.
export type ExpertSupportSummary = {
  openNeedsCount: number;
  topCategories: ExpertiseCategoryId[];
};

// Fundraising Pipeline widget (AFF-DASH-10 part L) — deliberately narrow:
// counts and the single next follow-up, never a composite fundraising
// score, never a fabricated investor recommendation.
export type FundraisingPipelineSummary = {
  activeRelationshipsCount: number;
  nextFollowUpAt: string | undefined;
  pendingIntroductionRequestsCount: number;
  currentRoundName: string | undefined;
};

export type CommandCenterData = {
  startup: Startup;
  // undefined means "not assessed yet" — the UI must show that state
  // honestly rather than a fabricated score.
  readiness: ReadinessAssessment | undefined;
  profileCompletion: ProfileCompletion;
  nextBestAction: NextBestAction;
  weekTasks: Task[];
  // undefined means "no roadmap generated yet" (e.g. no completed
  // assessment) — the UI must offer to generate one rather than fabricate
  // progress numbers.
  roadmap: Roadmap | undefined;
  opportunity: OpportunityMatch | undefined;
  recentActivity: Activity[];
  upcomingEvents: UpcomingEvent[];
  // undefined means "no Pitch Lab workspace created yet" — the widget must
  // offer "Start Pitch Lab" rather than fabricate a pitch.
  pitch: PitchSummary | undefined;
  // undefined means neither the Financial Command Center nor the Data Room
  // has any founder-entered data yet — the widget must offer a CTA rather
  // than a fabricated runway or completion figure.
  financials: FinancialCommandCenterSummary | undefined;
  // Never undefined — even zero open needs is a valid, honestly-rendered
  // state ("explore the network" rather than a missing widget).
  expertSupport: ExpertSupportSummary;
  // Never undefined — zero active relationships is a valid, honestly
  // rendered state pointing the founder at Investor Network.
  fundraisingPipeline: FundraisingPipelineSummary;
};

function isDueThisWeek(dueDate: string | undefined, nowIso: string): boolean {
  if (!dueDate) return false;
  const diffDays = (new Date(dueDate).getTime() - new Date(nowIso).getTime()) / (1000 * 60 * 60 * 24);
  // Includes overdue tasks (negative diff) up to 7 days out — "this week"
  // means "needs attention now or very soon", not a strict calendar window.
  return diffDays <= 7;
}

export async function getCommandCenterData(startupId: string): Promise<CommandCenterData | undefined> {
  const twin = getDigitalTwin(startupId);
  if (!twin) return undefined;

  const nowIso = new Date().toISOString();
  const roadmap = getCurrentRoadmap(startupId);
  const allTasks = getTasksForStartup(startupId);
  const weekTasks = allTasks.filter(
    (task) => task.status !== "done" && task.status !== "cancelled" && isDueThisWeek(task.dueDate, nowIso),
  );

  let nextBestAction = demoNextBestActionByStartup[startupId];
  if (!roadmap) {
    // No roadmap yet (most likely: no completed readiness assessment) —
    // the Next Best Action becomes a CTA pointing at generating one, rather
    // than a fabricated recommendation.
    const t = await getTranslations("dashboard.roadmap.generateCta");
    nextBestAction = {
      id: `${startupId}-generate-roadmap-cta`,
      title: t("title"),
      description: t("description"),
      estimatedEffortMinutes: 2,
      potentialImpactPoints: 0,
      linkedModule: "roadmap",
    };
  }
  if (!nextBestAction) return undefined;

  const activeVersion = getActiveVersion(startupId);
  const workspace = getWorkspace(startupId);
  const pitch: PitchSummary | undefined =
    workspace && activeVersion
      ? {
          title: activeVersion.title,
          readinessScore: activeVersion.readiness?.score,
          sectionsNeedingAttention: activeVersion.sections.filter(
            (s) => s.required && s.status !== "complete" && s.content.trim().length === 0,
          ).length,
        }
      : undefined;

  const financialProfile = getFinancialProfile(startupId, twin.identity.preferredCurrency);
  const dataRoom = getDataRoom(startupId);
  const hasFinancialData =
    financialProfile.periods.length > 0 || financialProfile.cashPosition !== undefined || financialProfile.fundingRequirement !== undefined;
  const hasDataRoomData = dataRoom.documents.length > 0;
  const financials: FinancialCommandCenterSummary | undefined =
    hasFinancialData || hasDataRoomData
      ? (() => {
          const snapshot = getFinancialSnapshot(startupId, nowIso);
          const completion = getCompletion(startupId);
          return {
            runway: snapshot.runway,
            lastUpdatedAt: snapshot.lastUpdatedAt,
            dataRoomCompletionPct: completion.completionPct,
            dataRoomRequiredTotal: completion.requiredTotal,
          };
        })()
      : undefined;

  const openNeeds = listStartupNeeds(startupId, nowIso).filter((n) => n.status === "OPEN");
  const topCategories = Array.from(new Set(openNeeds.map((n) => n.category))).slice(0, 3);
  const expertSupport: ExpertSupportSummary = { openNeedsCount: openNeeds.length, topCategories };

  const pipelineEntries = listPipeline(startupId).filter((e) => !TERMINAL_PIPELINE_STAGES.includes(e.stage));
  const nextFollowUpAt = pipelineEntries
    .map((e) => e.nextActionAt)
    .filter((d): d is string => Boolean(d))
    .sort()[0];
  const pendingIntroductionRequestsCount = listIntroductionRequests(startupId).filter(
    (r) => r.status === "REQUESTED" || r.status === "UNDER_REVIEW",
  ).length;
  const fundraisingPipeline: FundraisingPipelineSummary = {
    activeRelationshipsCount: pipelineEntries.length,
    nextFollowUpAt,
    pendingIntroductionRequestsCount,
    currentRoundName: getActiveRound(startupId)?.name,
  };

  const opportunityMatchCtx = buildOpportunityMatchContext(twin);
  const rankedOpportunities = matchOpportunities(
    listOpportunities().filter((o) => o.status !== "CLOSED"),
    opportunityMatchCtx,
  );
  const opportunity = rankedOpportunities[0];

  return {
    startup: { id: startupId, twin },
    readiness: getLatestAssessment(startupId),
    profileCompletion: computeProfileCompletion(twin),
    nextBestAction,
    roadmap,
    weekTasks,
    opportunity,
    recentActivity: demoRecentActivityByStartup[startupId] ?? [],
    upcomingEvents: demoUpcomingEventsByStartup[startupId] ?? [],
    pitch,
    financials,
    expertSupport,
    fundraisingPipeline,
  };
}
