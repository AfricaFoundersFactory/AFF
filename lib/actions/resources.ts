"use server";

/**
 * Server Action boundary for the Founder Knowledge Hub — bookmark/unbookmark
 * and "add to tasks". Delegates to lib/services/resources.ts, same
 * guard()/revalidatePath pattern as lib/actions/experts.ts.
 */
import { revalidatePath } from "next/cache";
import * as resourcesService from "@/lib/services/resources";
import { isNonEmpty } from "@/lib/validation";
import type { ResourceBookmark } from "@/types/resources";
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

export async function bookmarkResourceAction(startupId: string, resourceId: string): Promise<Result<ResourceBookmark>> {
  if (!isNonEmpty(resourceId)) return { ok: false, error: "validation" };
  return guard(() => resourcesService.bookmarkResource(startupId, resourceId, nowIso()));
}

export async function unbookmarkResourceAction(startupId: string, resourceId: string): Promise<Result<null>> {
  if (!isNonEmpty(resourceId)) return { ok: false, error: "validation" };
  return guard(() => {
    resourcesService.unbookmarkResource(startupId, resourceId);
    return null;
  });
}

export async function createTaskFromResourceAction(startupId: string, resourceId: string): Promise<Result<{ task: Task }>> {
  if (!isNonEmpty(resourceId)) return { ok: false, error: "validation" };
  return guard(() => resourcesService.createTaskFromResource(startupId, resourceId, nowIso()));
}
