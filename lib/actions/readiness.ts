"use server";

/**
 * Server Action boundary for the Readiness assessment flow — the only way
 * client components create drafts, save answers or complete an assessment.
 * Delegates to lib/services/readiness.ts (the actual persistence boundary)
 * and revalidates the dashboard routes so results are visible immediately.
 */
import { revalidatePath } from "next/cache";
import * as readinessService from "@/lib/services/readiness";
import type { AssessmentAnswerValue, ReadinessAssessment } from "@/types/readiness-engine";

export type ReadinessActionResult = { ok: true; assessment: ReadinessAssessment } | { ok: false; error: string };

function nowIso(): string {
  return new Date().toISOString();
}

function revalidateReadiness() {
  revalidatePath("/[locale]/dashboard", "layout");
}

function guard(fn: () => ReadinessAssessment): ReadinessActionResult {
  try {
    const assessment = fn();
    revalidateReadiness();
    return { ok: true, assessment };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function startAssessmentAction(startupId: string): Promise<ReadinessActionResult> {
  return guard(() => readinessService.createAssessment(startupId, nowIso()));
}

export async function reassessAction(startupId: string): Promise<ReadinessActionResult> {
  return guard(() => readinessService.reassess(startupId, nowIso()));
}

export async function saveAssessmentAnswersAction(
  startupId: string,
  answers: Record<string, AssessmentAnswerValue>,
): Promise<ReadinessActionResult> {
  return guard(() => readinessService.saveAssessmentAnswers(startupId, answers, nowIso()));
}

export async function completeAssessmentAction(startupId: string): Promise<ReadinessActionResult> {
  return guard(() => readinessService.completeAssessment(startupId, nowIso()));
}
