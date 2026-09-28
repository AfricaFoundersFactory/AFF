/**
 * Founder Analytics service boundary — assembles a FounderAnalyticsSnapshot
 * PURELY by reading existing canonical services. No Map store of its own,
 * no recomputation of a canonical calculation, no second source of truth.
 *
 * Reads from: lib/services/readiness.ts, lib/services/roadmap.ts,
 * lib/services/tasks.ts, lib/services/pitch.ts, lib/services/pitch-practice.ts,
 * lib/services/financials.ts, lib/services/data-room.ts,
 * lib/services/support-requests.ts, lib/services/mentoring.ts,
 * lib/services/opportunities.ts, lib/services/community.ts,
 * lib/services/profile-completion.ts (via digital-twin.ts).
 *
 * CRITICAL — no master/global score. See analytics-no-master-score.test.ts.
 */
import type { AnalyticsRange, FounderAnalyticsSnapshot, ProgressTimelineEvent } from "@/types/analytics";
import { filterByRange, sortTimelineDesc } from "@/lib/analytics/timeline";
import { computeRoadmapProgress, computeTaskCounts } from "@/lib/roadmap/progress";
import { getDigitalTwin } from "@/lib/services/digital-twin";
import { computeProfileCompletion } from "@/lib/services/profile-completion";
import { getAssessmentHistory } from "@/lib/services/readiness";
import { getCurrentRoadmap } from "@/lib/services/roadmap";
import { getTasksForStartup } from "@/lib/services/tasks";
import { getWorkspace } from "@/lib/services/pitch";
import { listAttempts } from "@/lib/services/pitch-practice";
import { countUnresolvedComments } from "@/lib/services/pitch-review";
import { getFinancialProfile, getFinancialSnapshot } from "@/lib/services/financials";
import { getCompletion as getDataRoomCompletion, getDataRoom } from "@/lib/services/data-room";
import { listSupportRequests } from "@/lib/services/support-requests";
import { listSessions, listRecommendations } from "@/lib/services/mentoring";
import { listApplications, listSaved } from "@/lib/services/opportunities";
import { listPostsByStartup, listReactions, listRegistrationsForStartup } from "@/lib/services/community";

function toTimelineEvent(
  id: string,
  type: ProgressTimelineEvent["type"],
  occurredAt: string,
  labelKey: string,
  data?: Record<string, string>,
  isDemo?: boolean,
): ProgressTimelineEvent {
  return { id, type, occurredAt, labelKey, data, isDemo };
}

export function getFounderAnalytics(startupId: string, range: AnalyticsRange, nowIso: string): FounderAnalyticsSnapshot {
  const twin = getDigitalTwin(startupId);

  // --- Profile completion (reused, never recomputed) ---
  const profileCompletion = twin ? computeProfileCompletion(twin) : undefined;

  // --- Readiness ---
  const assessments = getAssessmentHistory(startupId).filter((a) => a.status === "completed");
  const sortedAssessments = [...assessments].sort((a, b) => (a.completedAt ?? a.startedAt).localeCompare(b.completedAt ?? b.startedAt));
  const latest = sortedAssessments.at(-1);
  const previous = sortedAssessments.at(-2);
  const readiness: FounderAnalyticsSnapshot["readiness"] =
    latest && latest.overallScore !== null
      ? {
          available: true,
          data: {
            currentScore: latest.overallScore,
            previousScore: previous?.overallScore ?? undefined,
            trend:
              previous?.overallScore == null || latest.overallScore === null
                ? "unknown"
                : latest.overallScore > previous.overallScore
                  ? "up"
                  : latest.overallScore < previous.overallScore
                    ? "down"
                    : "flat",
            assessmentCount: sortedAssessments.length,
          },
        }
      : { available: false };

  // --- Execution (tasks + roadmap) ---
  const tasks = getTasksForStartup(startupId);
  const taskCounts = computeTaskCounts(tasks);
  const overdue = tasks.filter(
    (t) => t.status !== "done" && t.status !== "cancelled" && t.dueDate && new Date(t.dueDate).getTime() < new Date(nowIso).getTime(),
  ).length;
  const roadmap = getCurrentRoadmap(startupId);
  const roadmapProgress = roadmap ? computeRoadmapProgress(roadmap) : undefined;
  const priorities = ["low", "medium", "high", "critical"] as const;
  const priorityCompletion = priorities.map((priority) => {
    const withPriority = tasks.filter((t) => t.priority === priority && t.status !== "cancelled");
    return { priority, total: withPriority.length, completed: withPriority.filter((t) => t.status === "done").length };
  });
  const execution: FounderAnalyticsSnapshot["execution"] = {
    tasksTotal: taskCounts.total,
    tasksCompleted: taskCounts.done,
    tasksOverdue: overdue,
    roadmapProgressPct: roadmapProgress?.pct ?? null,
    priorityCompletion,
  };

  // --- Pitch ---
  const pitchWorkspace = getWorkspace(startupId);
  const attempts = listAttempts(startupId).filter((a) => a.completedAt);
  const activeVersion = pitchWorkspace?.versions.find((v) => v.id === pitchWorkspace.activeVersionId);
  const pitch: FounderAnalyticsSnapshot["pitch"] = pitchWorkspace
    ? {
        available: true,
        data: {
          versionCount: pitchWorkspace.versions.length,
          practiceSessionCount: attempts.length,
          currentReadinessAvailable: Boolean(activeVersion?.readiness),
          // Reuses the canonical pitch-review count — never recomputed here.
          unresolvedReviewComments: countUnresolvedComments(startupId),
        },
      }
    : { available: false };

  // --- Financials ---
  const financialProfile = getFinancialProfile(startupId);
  const financialSnapshot = getFinancialSnapshot(startupId, nowIso);
  const financials: FounderAnalyticsSnapshot["financials"] =
    financialProfile.periods.length > 0 || financialProfile.cashPosition
      ? {
          available: true,
          data: {
            periodCount: financialProfile.periods.length,
            latestPeriodLabel: [...financialProfile.periods].sort((a, b) => (a.month < b.month ? 1 : -1))[0]?.month,
            runway:
              financialSnapshot.runway.status === "calculated"
                ? { status: "calculated", months: financialSnapshot.runway.months }
                : financialSnapshot.runway.status === "sustainable"
                  ? { status: "sustainable" }
                  : { status: "unavailable" },
            forecastCoverageMonths: financialProfile.forecast?.periods.length ?? 0,
          },
        }
      : { available: false };

  // --- Data Room ---
  const dataRoomCompletion = getDataRoomCompletion(startupId);
  const dataRoom = getDataRoom(startupId);
  const dataRoomAnalytics: FounderAnalyticsSnapshot["dataRoom"] = {
    completionPct: dataRoomCompletion.completionPct,
    availableCount: dataRoomCompletion.availableCount,
    verifiedCount: dataRoom.documents.filter((d) => d.status === "verified").length,
    missingCount: dataRoomCompletion.missingCount,
    outdatedCount: dataRoomCompletion.outdatedCount,
  };

  // --- Expert support ---
  const supportRequests = listSupportRequests(startupId);
  const sessions = listSessions(startupId);
  const recommendations = listRecommendations(startupId);
  const expertSupport: FounderAnalyticsSnapshot["expertSupport"] = {
    supportRequestCount: supportRequests.length,
    sessionsCompleted: sessions.filter((s) => s.status === "COMPLETED").length,
    recommendationsReceived: recommendations.length,
    recommendationsAccepted: recommendations.filter((r) => r.status === "ACCEPTED" || r.status === "COMPLETED").length,
    recommendationsCompleted: recommendations.filter((r) => r.status === "COMPLETED").length,
    recommendationsConvertedToTasks: recommendations.filter((r) => Boolean(r.taskId)).length,
  };

  // --- Opportunities (founder-entered statuses only) ---
  const applications = listApplications(startupId);
  const opportunities: FounderAnalyticsSnapshot["opportunities"] = {
    saved: listSaved(startupId).length,
    preparing: applications.filter((a) => a.status === "PREPARING").length,
    applied: applications.filter((a) => a.status === "APPLIED").length,
    shortlisted: applications.filter((a) => a.status === "SHORTLISTED").length,
    accepted: applications.filter((a) => a.status === "ACCEPTED").length,
    rejected: applications.filter((a) => a.status === "REJECTED").length,
  };

  // --- Community (lightweight, no ranking) ---
  // Only posts explicitly attached to THIS startup count toward its
  // analytics — a founder's posts made in the context of another startup
  // (or with no startup attached) never leak in here (see
  // analytics-isolation.test.ts).
  const startupPosts = listPostsByStartup(startupId);
  const helpfulContributions = startupPosts.reduce((sum, p) => sum + listReactions("POST", p.id).filter((r) => r.type === "HELPFUL").length, 0);
  const community: FounderAnalyticsSnapshot["community"] = {
    postsCreated: startupPosts.length,
    questionsAsked: startupPosts.filter((p) => p.type === "QUESTION").length,
    helpfulContributions,
    eventsRegistered: listRegistrationsForStartup(startupId).length,
  };

  // --- Timeline (deterministic, from real timestamps only) ---
  const events: ProgressTimelineEvent[] = [];
  for (const a of sortedAssessments) {
    if (a.completedAt) events.push(toTimelineEvent(`readiness-${a.id}`, "READINESS_ASSESSMENT_COMPLETED", a.completedAt, "readinessAssessmentCompleted", { version: String(a.version) }));
  }
  if (roadmap?.createdAt) events.push(toTimelineEvent(`roadmap-${roadmap.id}`, "ROADMAP_GENERATED", roadmap.createdAt, "roadmapGenerated"));
  for (const t of tasks) {
    if (t.status === "done" && t.completedAt) events.push(toTimelineEvent(`task-${t.id}`, "TASK_COMPLETED", t.completedAt, "taskCompleted", { title: t.title }));
  }
  for (const v of pitchWorkspace?.versions ?? []) {
    events.push(toTimelineEvent(`pitch-version-${v.id}`, "PITCH_VERSION_CREATED", v.createdAt, "pitchVersionCreated", { version: String(v.version) }));
  }
  for (const a of attempts) {
    if (a.completedAt) events.push(toTimelineEvent(`pitch-practice-${a.id}`, "PITCH_PRACTICE_COMPLETED", a.completedAt, "pitchPracticeCompleted"));
  }
  for (const p of financialProfile.periods) {
    if (p.updatedAt) events.push(toTimelineEvent(`financial-period-${p.id}`, "FINANCIAL_PERIOD_ADDED", p.updatedAt, "financialPeriodAdded", { month: p.month }));
  }
  for (const d of dataRoom.documents) {
    events.push(toTimelineEvent(`dataroom-doc-${d.id}`, "DATA_ROOM_DOCUMENT_UPDATED", d.updatedAt, "dataRoomDocumentUpdated", { title: d.title }));
  }
  for (const r of recommendations) {
    if (r.status === "COMPLETED") events.push(toTimelineEvent(`recommendation-${r.id}`, "EXPERT_RECOMMENDATION_COMPLETED", r.updatedAt, "expertRecommendationCompleted", { title: r.title }));
  }
  for (const app of applications) {
    if (app.status === "APPLIED" && app.appliedAt) events.push(toTimelineEvent(`opportunity-${app.id}`, "OPPORTUNITY_APPLIED", app.appliedAt, "opportunityApplied"));
  }
  const timeline = sortTimelineDesc(filterByRange(events, range, nowIso));

  return {
    startupId,
    range,
    generatedAt: nowIso,
    profileCompletion: { completionPct: profileCompletion?.overallPct ?? 0 },
    readiness,
    execution,
    pitch,
    financials,
    dataRoom: dataRoomAnalytics,
    expertSupport,
    opportunities,
    community,
    timeline,
  };
}
