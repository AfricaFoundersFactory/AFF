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
import type { Opportunity } from "@/types/opportunity";
import type { Activity, UpcomingEvent } from "@/types/activity";
import type { ProfileCompletion } from "@/types/profile-completion";
import {
  demoNextBestActionByStartup,
  demoOpportunityByStartup,
  demoRecentActivityByStartup,
  demoUpcomingEventsByStartup,
} from "@/lib/demo";
import { getDigitalTwin } from "@/lib/services/digital-twin";
import { computeProfileCompletion } from "@/lib/services/profile-completion";
import { getLatestAssessment } from "@/lib/services/readiness";
import { getCurrentRoadmap } from "@/lib/services/roadmap";
import { getTasksForStartup } from "@/lib/services/tasks";
import { getWorkspace, getActiveVersion } from "@/lib/services/pitch";

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
  opportunity: Opportunity | undefined;
  recentActivity: Activity[];
  upcomingEvents: UpcomingEvent[];
  // undefined means "no Pitch Lab workspace created yet" — the widget must
  // offer "Start Pitch Lab" rather than fabricate a pitch.
  pitch: PitchSummary | undefined;
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

  return {
    startup: { id: startupId, twin },
    readiness: getLatestAssessment(startupId),
    profileCompletion: computeProfileCompletion(twin),
    nextBestAction,
    roadmap,
    weekTasks,
    opportunity: demoOpportunityByStartup[startupId],
    recentActivity: demoRecentActivityByStartup[startupId] ?? [],
    upcomingEvents: demoUpcomingEventsByStartup[startupId] ?? [],
    pitch,
  };
}
