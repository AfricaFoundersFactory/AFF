"use server";

/**
 * Server Action boundary for Opportunity Discovery — save/unsave, upsert an
 * application, and convert an application into a preparation Task.
 * Delegates to lib/services/opportunities.ts, same guard()/revalidatePath
 * pattern as lib/actions/experts.ts.
 */
import { revalidatePath } from "next/cache";
import * as opportunitiesService from "@/lib/services/opportunities";
import { isNonEmpty } from "@/lib/validation";
import type { OpportunityApplication, OpportunityApplicationStatus, SavedOpportunity } from "@/types/opportunity";
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

export async function saveOpportunityAction(startupId: string, opportunityId: string): Promise<Result<SavedOpportunity>> {
  if (!isNonEmpty(opportunityId)) return { ok: false, error: "validation" };
  return guard(() => opportunitiesService.saveOpportunity(startupId, opportunityId, nowIso()));
}

export async function unsaveOpportunityAction(startupId: string, opportunityId: string): Promise<Result<null>> {
  if (!isNonEmpty(opportunityId)) return { ok: false, error: "validation" };
  return guard(() => {
    opportunitiesService.unsaveOpportunity(startupId, opportunityId);
    return null;
  });
}

export async function upsertApplicationAction(
  startupId: string,
  opportunityId: string,
  input: { status: OpportunityApplicationStatus; appliedAt?: string; deadline?: string; notes?: string; nextStep?: string },
): Promise<Result<OpportunityApplication>> {
  if (!isNonEmpty(opportunityId)) return { ok: false, error: "validation" };
  return guard(() => opportunitiesService.upsertApplication(startupId, opportunityId, input, nowIso()));
}

export async function createPrepTaskAction(startupId: string, applicationId: string): Promise<Result<{ task: Task }>> {
  if (!isNonEmpty(applicationId)) return { ok: false, error: "validation" };
  return guard(() => {
    const { task } = opportunitiesService.createPrepTaskForApplication(startupId, applicationId, nowIso());
    return { task };
  });
}
