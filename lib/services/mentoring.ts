/**
 * Mentoring Session + Expert Recommendation service boundary — the only
 * place a MentoringSession or ExpertRecommendation is created, read or
 * mutated. Same in-memory Map<startupId, ...> pattern as
 * lib/services/support-requests.ts.
 *
 * A MentoringSession is a live advisory interaction, distinct from a
 * PitchReview (which comments on a pitch document) — see types/experts.ts
 * and types/pitch.ts for the documented distinction. Demo session
 * notes/recommendations are always seeded with isDemo=true and MUST be
 * rendered with an explicit illustrative/demo label — never presented as
 * real human advice.
 *
 * ExpertRecommendation -> Task reuses the EXISTING lib/services/tasks.ts
 * (Task.sourceType = "EXPERT_RECOMMENDATION", already present in
 * types/roadmap.ts since AFF-DASH-05) — no second task system. Duplicate
 * creation is prevented by recommendation.taskId: once set, a repeat call
 * throws (mirroring lib/services/pitch-review.ts#createTaskFromComment's
 * comment.taskId check exactly).
 *
 * ExpertRecommendation -> Roadmap is founder-triggered ONLY, never
 * automatic, and deduplicated the same way via recommendation.roadmapItemId.
 * It calls lib/services/roadmap.ts#addFounderRoadmapItem (the existing,
 * unmodified founder-item path) rather than adding a new roadmap.ts
 * function — the roadmap item ends up sourceType "FOUNDER_CREATED" (that
 * function's only mode) with the recommendation referenced in its
 * description text; recommendation.roadmapItemId is the traceability link
 * back, documented here as a deliberate, small scope decision so
 * lib/services/roadmap.ts itself needed no changes this batch.
 *
 * Nothing here ever calls a Readiness/Pitch-Readiness-score-mutating
 * function, and completing a session or accepting a recommendation never
 * changes Roadmap Progress on its own (only an explicit "Add to roadmap"
 * click does, exactly like any founder-created roadmap item) — see
 * lib/services/expert-metric-separation.test.ts.
 */
import { randomUUID } from "crypto";
import type {
  ExpertRecommendation,
  ExpertRecommendationStatus,
  MentoringFormat,
  MentoringSession,
  MentoringSessionStatus,
  RecommendationFollowUp,
} from "@/types/experts";
import type { Task } from "@/types/roadmap";
import * as taskService from "@/lib/services/tasks";
import * as roadmapService from "@/lib/services/roadmap";
import { getExpert } from "@/lib/services/experts";

const sessionsStore = new Map<string, MentoringSession[]>();
const recommendationsStore = new Map<string, ExpertRecommendation[]>();

function sessionsFor(startupId: string): MentoringSession[] {
  return sessionsStore.get(startupId) ?? [];
}
function saveSessions(startupId: string, sessions: MentoringSession[]) {
  sessionsStore.set(startupId, sessions);
}
function recommendationsFor(startupId: string): ExpertRecommendation[] {
  return recommendationsStore.get(startupId) ?? [];
}
function saveRecommendations(startupId: string, recs: ExpertRecommendation[]) {
  recommendationsStore.set(startupId, recs);
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export function listSessions(startupId: string): MentoringSession[] {
  return sessionsFor(startupId);
}

export function getSession(startupId: string, sessionId: string): MentoringSession | undefined {
  return sessionsFor(startupId).find((s) => s.id === sessionId);
}

function requireSession(startupId: string, sessionId: string): MentoringSession {
  const session = getSession(startupId, sessionId);
  if (!session) throw new Error(`No mentoring session "${sessionId}" found for startup "${startupId}"`);
  return session;
}

export function createSession(
  startupId: string,
  input: {
    supportRequestId: string;
    expertId: string;
    founderId: string;
    topic: string;
    format: MentoringFormat;
    scheduledAt?: string;
  },
  nowIso: string,
): MentoringSession {
  if (!getExpert(input.expertId)) throw new Error(`No expert profile "${input.expertId}" found`);
  const session: MentoringSession = {
    id: randomUUID(),
    startupId,
    supportRequestId: input.supportRequestId,
    expertId: input.expertId,
    founderId: input.founderId,
    topic: input.topic,
    format: input.format,
    scheduledAt: input.scheduledAt,
    recommendationIds: [],
    actionItems: [],
    status: "PLANNED",
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  saveSessions(startupId, [...sessionsFor(startupId), session]);
  return session;
}

export function startSession(startupId: string, sessionId: string, nowIso: string): MentoringSession {
  const existing = requireSession(startupId, sessionId);
  const updated: MentoringSession = { ...existing, startedAt: existing.startedAt ?? nowIso, updatedAt: nowIso };
  saveSessions(startupId, sessionsFor(startupId).map((s) => (s.id === sessionId ? updated : s)));
  return updated;
}

/**
 * Completes a session and creates its ExpertRecommendation rows in one
 * step. `isDemo` should be true for every seeded demo session (see bottom
 * of this file) so the UI can label the notes/recommendations as
 * illustrative — never presented as real human advice.
 */
export function completeSession(
  startupId: string,
  sessionId: string,
  input: {
    founderNotes?: string;
    expertNotes?: string;
    actionItems?: string[];
    recommendations?: Array<Pick<ExpertRecommendation, "category" | "title" | "description" | "priority">>;
    isDemo?: boolean;
  },
  nowIso: string,
): { session: MentoringSession; recommendations: ExpertRecommendation[] } {
  const existing = requireSession(startupId, sessionId);
  if (existing.status !== "PLANNED") {
    throw new Error(`Mentoring session "${sessionId}" is already "${existing.status}" and cannot be completed again.`);
  }

  const newRecommendations: ExpertRecommendation[] = (input.recommendations ?? []).map((r) => ({
    id: randomUUID(),
    sessionId,
    startupId,
    expertId: existing.expertId,
    category: r.category,
    title: r.title,
    description: r.description,
    priority: r.priority,
    status: "OPEN",
    createdAt: nowIso,
    updatedAt: nowIso,
  }));
  saveRecommendations(startupId, [...recommendationsFor(startupId), ...newRecommendations]);

  const updated: MentoringSession = {
    ...existing,
    founderNotes: input.founderNotes ?? existing.founderNotes,
    expertNotes: input.expertNotes ?? existing.expertNotes,
    actionItems: input.actionItems ?? existing.actionItems,
    isDemo: input.isDemo ?? existing.isDemo,
    recommendationIds: [...existing.recommendationIds, ...newRecommendations.map((r) => r.id)],
    status: "COMPLETED",
    completedAt: nowIso,
    updatedAt: nowIso,
  };
  saveSessions(startupId, sessionsFor(startupId).map((s) => (s.id === sessionId ? updated : s)));
  return { session: updated, recommendations: newRecommendations };
}

export function cancelSession(startupId: string, sessionId: string, nowIso: string): MentoringSession {
  const existing = requireSession(startupId, sessionId);
  const updated: MentoringSession = { ...existing, status: "CANCELLED" as MentoringSessionStatus, updatedAt: nowIso };
  saveSessions(startupId, sessionsFor(startupId).map((s) => (s.id === sessionId ? updated : s)));
  return updated;
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

export function listRecommendations(startupId: string, sessionId?: string): ExpertRecommendation[] {
  const all = recommendationsFor(startupId);
  return sessionId ? all.filter((r) => r.sessionId === sessionId) : all;
}

export function getRecommendation(startupId: string, recommendationId: string): ExpertRecommendation | undefined {
  return recommendationsFor(startupId).find((r) => r.id === recommendationId);
}

function requireRecommendation(startupId: string, recommendationId: string): ExpertRecommendation {
  const rec = getRecommendation(startupId, recommendationId);
  if (!rec) throw new Error(`No expert recommendation "${recommendationId}" found for startup "${startupId}"`);
  return rec;
}

export function updateRecommendationStatus(
  startupId: string,
  recommendationId: string,
  status: ExpertRecommendationStatus,
  nowIso: string,
): ExpertRecommendation {
  const existing = requireRecommendation(startupId, recommendationId);
  const updated: ExpertRecommendation = { ...existing, status, updatedAt: nowIso };
  saveRecommendations(startupId, recommendationsFor(startupId).map((r) => (r.id === recommendationId ? updated : r)));
  return updated;
}

/**
 * Creates a Task from a recommendation. sourceType is always
 * "EXPERT_RECOMMENDATION" (the existing, previously-unused value in
 * types/roadmap.ts's Task.sourceType union). Throws if a task was already
 * created from this recommendation (recommendation.taskId already set) —
 * exact same dedup shape as
 * lib/services/pitch-review.ts#createTaskFromComment's comment.taskId check.
 */
export function createTaskFromRecommendation(
  startupId: string,
  recommendationId: string,
  nowIso: string,
): { recommendation: ExpertRecommendation; task: Task } {
  const rec = requireRecommendation(startupId, recommendationId);
  if (rec.taskId) {
    throw new Error(`A task already exists for expert recommendation "${recommendationId}".`);
  }

  const task = taskService.createTask(
    startupId,
    {
      title: rec.title,
      description: rec.description,
      category: "experts",
      sourceType: "EXPERT_RECOMMENDATION",
      createdBy: "FOUNDER",
      linkedModule: "experts",
    },
    nowIso,
  );
  const taskWithSource = taskService.updateTask(startupId, task.id, { sourceReference: recommendationId }, nowIso);

  const updatedRec: ExpertRecommendation = { ...rec, taskId: task.id, updatedAt: nowIso };
  saveRecommendations(startupId, recommendationsFor(startupId).map((r) => (r.id === recommendationId ? updatedRec : r)));
  return { recommendation: updatedRec, task: taskWithSource };
}

/**
 * Adds a recommendation to the Roadmap — founder-triggered ONLY, never
 * automatic. Throws if this recommendation was already added
 * (recommendation.roadmapItemId already set). See file header for why this
 * calls the existing addFounderRoadmapItem() path rather than a new
 * roadmap.ts function.
 */
export function addRecommendationToRoadmap(startupId: string, recommendationId: string, nowIso: string): ExpertRecommendation {
  const rec = requireRecommendation(startupId, recommendationId);
  if (rec.roadmapItemId) {
    throw new Error(`Expert recommendation "${recommendationId}" is already on the roadmap.`);
  }

  const roadmap = roadmapService.addFounderRoadmapItem(
    startupId,
    {
      title: rec.title,
      description: `${rec.description}\n\n(Added from an expert recommendation, ref: ${recommendationId})`,
      category: "general",
      priority: rec.priority,
    },
    nowIso,
  );
  const createdItem = roadmap.items[roadmap.items.length - 1];

  const updatedRec: ExpertRecommendation = { ...rec, roadmapItemId: createdItem.id, updatedAt: nowIso };
  saveRecommendations(startupId, recommendationsFor(startupId).map((r) => (r.id === recommendationId ? updatedRec : r)));
  return updatedRec;
}

/**
 * Lightweight aggregate: e.g. "3 recommendations — 2 accepted, 1 converted
 * to task, 1 completed." This measures RECOMMENDATION EXECUTION, never an
 * expert rating — no star rating, no expert quality score anywhere.
 */
export function getFollowUp(startupId: string, sessionId: string): RecommendationFollowUp {
  const recs = listRecommendations(startupId, sessionId);
  return {
    sessionId,
    total: recs.length,
    accepted: recs.filter((r) => r.status === "ACCEPTED").length,
    convertedToTask: recs.filter((r) => Boolean(r.taskId)).length,
    completed: recs.filter((r) => r.status === "COMPLETED").length,
    dismissed: recs.filter((r) => r.status === "DISMISSED").length,
  };
}

/** Test-only reset hook so isolated tests don't leak state across files. */
export function __resetMentoringStoreForTests() {
  sessionsStore.clear();
  recommendationsStore.clear();
}

// ---------------------------------------------------------------------------
// Seed: one demo-completed mentoring session for the mature startup
// (startup-wakama), with clearly illustrative recommendations/action items,
// linked to its seeded ACCEPTED support request. startup-solari intentionally
// gets none yet (its request is still just SENT — nothing to mentor on).
// ---------------------------------------------------------------------------
import { listSupportRequests } from "@/lib/services/support-requests";
import { listStartupIds } from "@/lib/services/digital-twin";

function seedDemoMentoring() {
  const seedIso = new Date().toISOString();
  if (!listStartupIds().includes("startup-wakama")) return;
  if (sessionsFor("startup-wakama").length > 0) return;

  const acceptedRequest = listSupportRequests("startup-wakama").find((r) => r.status === "ACCEPTED");
  if (!acceptedRequest) return;

  const session = createSession(
    "startup-wakama",
    {
      supportRequestId: acceptedRequest.id,
      expertId: acceptedRequest.expertId,
      founderId: acceptedRequest.founderId,
      topic: acceptedRequest.topic,
      format: acceptedRequest.preferredFormat,
    },
    seedIso,
  );

  completeSession(
    "startup-wakama",
    session.id,
    {
      isDemo: true,
      founderNotes: "Illustrative demo notes: walked through our current ask and traction slide.",
      expertNotes:
        "Illustrative/demo expert notes — not real advice. The ask slide should state the instrument and amount explicitly; traction should lead with one hard number.",
      actionItems: [
        "State the exact amount sought and instrument on the ask slide.",
        "Replace the general traction claim with month-over-month GMV growth.",
      ],
      recommendations: [
        {
          category: "FUNDRAISING",
          title: "State a specific ask amount and instrument",
          description: "Illustrative/demo recommendation: investors will ask about this immediately if it's left implicit.",
          priority: "high",
        },
        {
          category: "GROWTH",
          title: "Lead traction with a specific growth metric",
          description: "Illustrative/demo recommendation: quote month-over-month GMV growth instead of a general claim.",
          priority: "medium",
        },
      ],
    },
    seedIso,
  );
}
seedDemoMentoring();
