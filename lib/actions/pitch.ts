"use server";

/**
 * Server Action boundary for the Pitch Lab — the only way client
 * components create/mutate a Pitch Workspace, version, section, practice
 * attempt, review comment or Q&A answer. Delegates to
 * lib/services/pitch*.ts and revalidates the dashboard routes on success,
 * exactly like lib/actions/roadmap.ts / lib/actions/tasks.ts.
 */
import { revalidatePath } from "next/cache";
import * as pitchService from "@/lib/services/pitch";
import * as practiceService from "@/lib/services/pitch-practice";
import * as reviewService from "@/lib/services/pitch-review";
import * as qnaService from "@/lib/services/pitch-qna";
import { isNonEmpty } from "@/lib/validation";
import type {
  FounderSelfRatings,
  FundraisingContext,
  PitchAudience,
  PitchObjective,
  PitchPracticeFormat,
  PitchType,
  PitchVersion,
  PitchWorkspace,
  QnaAnswerStatus,
} from "@/types/pitch";
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
// Workspace / versions
// ---------------------------------------------------------------------------

export async function createWorkspaceAction(
  startupId: string,
  input: { objective: PitchObjective; audience: PitchAudience; pitchType: PitchType; fundraisingContext?: FundraisingContext },
): Promise<Result<PitchWorkspace>> {
  return guard(() => pitchService.createWorkspace(startupId, input, nowIso()));
}

export async function createVersionAction(startupId: string): Promise<Result<PitchVersion>> {
  return guard(() => pitchService.createVersion(startupId, nowIso()));
}

export async function duplicateVersionAction(startupId: string, versionId: string): Promise<Result<PitchVersion>> {
  if (!isNonEmpty(versionId)) return { ok: false, error: "validation" };
  return guard(() => pitchService.duplicateVersion(startupId, versionId, nowIso()));
}

export async function renameVersionAction(startupId: string, versionId: string, title: string): Promise<Result<PitchVersion>> {
  if (!isNonEmpty(versionId) || !isNonEmpty(title)) return { ok: false, error: "validation" };
  return guard(() => pitchService.renameVersion(startupId, versionId, title, nowIso()));
}

export async function finalizeVersionAction(startupId: string, versionId: string): Promise<Result<PitchVersion>> {
  return guard(() => pitchService.finalizeVersion(startupId, versionId, nowIso()));
}

export async function archiveVersionAction(startupId: string, versionId: string): Promise<Result<PitchVersion>> {
  return guard(() => pitchService.archiveVersion(startupId, versionId, nowIso()));
}

export async function setActiveVersionAction(startupId: string, versionId: string): Promise<Result<PitchWorkspace>> {
  return guard(() => pitchService.setActiveVersion(startupId, versionId, nowIso()));
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export async function updateSectionAction(
  startupId: string,
  versionId: string,
  sectionId: string,
  patch: { content?: string; keyPoints?: string[]; status?: PitchVersion["sections"][number]["status"] },
): Promise<Result<PitchVersion>> {
  return guard(() => pitchService.updateSection(startupId, versionId, sectionId, patch, nowIso()));
}

export async function refreshSectionFromProfileAction(
  startupId: string,
  versionId: string,
  sectionId: string,
): Promise<Result<PitchVersion>> {
  return guard(() => pitchService.refreshSectionFromProfile(startupId, versionId, sectionId, nowIso()));
}

// ---------------------------------------------------------------------------
// Practice
// ---------------------------------------------------------------------------

export async function startPracticeAttemptAction(
  startupId: string,
  pitchVersionId: string,
  format: PitchPracticeFormat,
) {
  return guard(() => practiceService.startAttempt(startupId, pitchVersionId, format, nowIso()));
}

export async function completePracticeAttemptAction(
  startupId: string,
  attemptId: string,
  patch: { actualDurationSeconds?: number; founderRatings?: FounderSelfRatings; notes?: string },
) {
  return guard(() => practiceService.completeAttempt(startupId, attemptId, patch, nowIso()));
}

// ---------------------------------------------------------------------------
// Review / feedback
// ---------------------------------------------------------------------------

export async function resolveReviewCommentAction(startupId: string, reviewId: string, commentId: string) {
  return guard(() => reviewService.resolveComment(startupId, reviewId, commentId, nowIso()));
}

export async function dismissReviewCommentAction(startupId: string, reviewId: string, commentId: string) {
  return guard(() => reviewService.dismissComment(startupId, reviewId, commentId, nowIso()));
}

export async function createTaskFromCommentAction(
  startupId: string,
  reviewId: string,
  commentId: string,
): Promise<Result<{ task: Task }>> {
  return guard(() => {
    const { task } = reviewService.createTaskFromComment(startupId, reviewId, commentId, nowIso());
    return { task };
  });
}

export async function createPitchImprovementTaskAction(
  startupId: string,
  input: { gapKey: string; title: string; description?: string; pitchVersionId: string; pitchSectionId?: string },
): Promise<Result<Task>> {
  if (!isNonEmpty(input.gapKey) || !isNonEmpty(input.title)) return { ok: false, error: "validation" };
  return guard(() => reviewService.createPitchImprovementTask(startupId, input, nowIso()));
}

// ---------------------------------------------------------------------------
// Q&A
// ---------------------------------------------------------------------------

export async function saveQnaAnswerAction(startupId: string, questionId: string, answer: string) {
  return guard(() => qnaService.saveAnswer(startupId, questionId, answer, nowIso()));
}

export async function setQnaAnswerStatusAction(startupId: string, questionId: string, status: QnaAnswerStatus) {
  return guard(() => qnaService.setAnswerStatus(startupId, questionId, status, nowIso()));
}
