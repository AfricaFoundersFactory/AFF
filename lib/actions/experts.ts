"use server";

/**
 * Server Action boundary for the Expert Network — the only way client
 * components declare a need, send a support request, transition its status,
 * create/complete a mentoring session, or act on an expert recommendation.
 * Delegates to lib/services/{experts,support-requests,mentoring}.ts and
 * revalidates the dashboard routes on success, exactly like
 * lib/actions/roadmap.ts / lib/actions/pitch.ts.
 */
import { revalidatePath } from "next/cache";
import * as expertsService from "@/lib/services/experts";
import * as supportRequestsService from "@/lib/services/support-requests";
import * as mentoringService from "@/lib/services/mentoring";
import { isNonEmpty } from "@/lib/validation";
import type { ExpertiseCategoryId, ExpertLanguage } from "@/lib/experts/taxonomy";
import type {
  ExpertRecommendation,
  ExpertRecommendationStatus,
  MentoringFormat,
  MentoringSession,
  StartupNeed,
  SupportRequest,
  SupportRequestStatus,
} from "@/types/experts";
import type { Task } from "@/types/roadmap";

function nowIso(): string {
  return new Date().toISOString();
}

function revalidateDashboard() {
  revalidatePath("/[locale]/dashboard", "layout");
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function guard<T>(fn: () => T): Result<T> {
  try {
    const data = fn();
    revalidateDashboard();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ---------------------------------------------------------------------------
// Needs
// ---------------------------------------------------------------------------

export async function declareFounderNeedAction(
  startupId: string,
  input: { category: ExpertiseCategoryId; title: string; description?: string },
): Promise<Result<StartupNeed>> {
  if (!isNonEmpty(input.title)) return { ok: false, error: "validation" };
  return guard(() => expertsService.declareFounderNeed(startupId, input, nowIso()));
}

export async function updateNeedStatusAction(
  startupId: string,
  needId: string,
  status: StartupNeed["status"],
): Promise<Result<StartupNeed>> {
  if (!isNonEmpty(needId)) return { ok: false, error: "validation" };
  return guard(() => expertsService.updateNeedStatus(startupId, needId, status, nowIso()));
}

// ---------------------------------------------------------------------------
// Support requests
// ---------------------------------------------------------------------------

export async function createSupportRequestAction(
  startupId: string,
  input: {
    founderId: string;
    expertId: string;
    needId?: string;
    topic: string;
    message: string;
    preferredFormat: MentoringFormat;
    preferredLanguage: ExpertLanguage;
  },
): Promise<Result<SupportRequest>> {
  if (!isNonEmpty(input.expertId) || !isNonEmpty(input.topic) || !isNonEmpty(input.message)) {
    return { ok: false, error: "validation" };
  }
  return guard(() => supportRequestsService.createSupportRequest(startupId, input, nowIso()));
}

export async function updateSupportRequestStatusAction(
  startupId: string,
  requestId: string,
  status: SupportRequestStatus,
): Promise<Result<SupportRequest>> {
  if (!isNonEmpty(requestId)) return { ok: false, error: "validation" };
  return guard(() => supportRequestsService.updateSupportRequestStatus(startupId, requestId, status, nowIso()));
}

// ---------------------------------------------------------------------------
// Mentoring sessions
// ---------------------------------------------------------------------------

export async function createMentoringSessionAction(
  startupId: string,
  input: { supportRequestId: string; expertId: string; founderId: string; topic: string; format: MentoringFormat; scheduledAt?: string },
): Promise<Result<MentoringSession>> {
  return guard(() => mentoringService.createSession(startupId, input, nowIso()));
}

export async function completeMentoringSessionAction(
  startupId: string,
  sessionId: string,
  input: {
    founderNotes?: string;
    expertNotes?: string;
    actionItems?: string[];
    recommendations?: Array<Pick<ExpertRecommendation, "category" | "title" | "description" | "priority">>;
  },
): Promise<Result<{ session: MentoringSession; recommendations: ExpertRecommendation[] }>> {
  return guard(() => mentoringService.completeSession(startupId, sessionId, input, nowIso()));
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

export async function updateRecommendationStatusAction(
  startupId: string,
  recommendationId: string,
  status: ExpertRecommendationStatus,
): Promise<Result<ExpertRecommendation>> {
  return guard(() => mentoringService.updateRecommendationStatus(startupId, recommendationId, status, nowIso()));
}

export async function createTaskFromRecommendationAction(
  startupId: string,
  recommendationId: string,
): Promise<Result<{ task: Task }>> {
  return guard(() => {
    const { task } = mentoringService.createTaskFromRecommendation(startupId, recommendationId, nowIso());
    return { task };
  });
}

export async function addRecommendationToRoadmapAction(
  startupId: string,
  recommendationId: string,
): Promise<Result<ExpertRecommendation>> {
  return guard(() => mentoringService.addRecommendationToRoadmap(startupId, recommendationId, nowIso()));
}
