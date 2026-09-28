"use server";

/**
 * Server Action boundary for the Roadmap — the only way client components
 * generate/regenerate a roadmap or mutate roadmap items. Delegates to
 * lib/services/roadmap.ts and revalidates the dashboard routes on success.
 */
import { revalidatePath } from "next/cache";
import * as roadmapService from "@/lib/services/roadmap";
import { MissingAssessmentError } from "@/lib/roadmap/generator";
import { isNonEmpty } from "@/lib/validation";
import type { Roadmap, RoadmapItem, TaskStatus } from "@/types/roadmap";

export type RoadmapActionResult = { ok: true; roadmap: Roadmap } | { ok: false; error: string };

function nowIso(): string {
  return new Date().toISOString();
}

function revalidateDashboard() {
  revalidatePath("/[locale]/dashboard", "layout");
}

function guard(fn: () => Roadmap): RoadmapActionResult {
  try {
    const roadmap = fn();
    revalidateDashboard();
    return { ok: true, roadmap };
  } catch (error) {
    if (error instanceof MissingAssessmentError) {
      return { ok: false, error: "missing_assessment" };
    }
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function generateRoadmapAction(startupId: string): Promise<RoadmapActionResult> {
  return guard(() => roadmapService.generateOrRegenerateRoadmap(startupId, nowIso()));
}

export async function updateRoadmapItemStatusAction(
  startupId: string,
  itemId: string,
  status: TaskStatus,
): Promise<RoadmapActionResult> {
  if (!isNonEmpty(itemId)) return { ok: false, error: "validation" };
  return guard(() => roadmapService.updateRoadmapItemStatus(startupId, itemId, status, nowIso()));
}

export async function dismissRoadmapItemAction(startupId: string, itemId: string): Promise<RoadmapActionResult> {
  if (!isNonEmpty(itemId)) return { ok: false, error: "validation" };
  return guard(() => roadmapService.dismissRoadmapItem(startupId, itemId, nowIso()));
}

export async function addFounderRoadmapItemAction(
  startupId: string,
  input: {
    title: string;
    description?: string;
    category?: string;
    priority?: RoadmapItem["priority"];
    effort?: RoadmapItem["effort"];
    dueDate?: string;
  },
): Promise<RoadmapActionResult> {
  if (!isNonEmpty(input.title)) return { ok: false, error: "validation" };
  return guard(() => roadmapService.addFounderRoadmapItem(startupId, input, nowIso()));
}

export async function addGapToRoadmapAction(startupId: string, criterionId: string): Promise<RoadmapActionResult> {
  if (!isNonEmpty(criterionId)) return { ok: false, error: "validation" };
  return guard(() => roadmapService.addGapToRoadmap(startupId, criterionId, nowIso()));
}

export async function addRoadmapItemDependencyAction(
  startupId: string,
  itemId: string,
  dependsOnId: string,
): Promise<RoadmapActionResult> {
  if (!isNonEmpty(itemId) || !isNonEmpty(dependsOnId)) return { ok: false, error: "validation" };
  return guard(() => roadmapService.addRoadmapItemDependency(startupId, itemId, dependsOnId, nowIso()));
}
