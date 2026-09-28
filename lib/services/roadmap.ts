/**
 * Roadmap service boundary — the only place roadmap versions are created,
 * read or mutated. Same in-memory Map + startupId-scoped pattern as
 * lib/services/digital-twin.ts and lib/services/readiness.ts.
 *
 * History model: store keys a startupId to its FULL version history
 * (array, oldest first). Generating a new version marks the previous
 * "active" version as "superseded" in place (status flip only — its items
 * are never mutated or deleted) and appends the new version. Nothing here
 * ever calls lib/services/readiness.ts's score-mutating functions —
 * roadmap/task completion can never change a Readiness score.
 */
import { randomUUID } from "crypto";
import { getLatestAssessment } from "@/lib/services/readiness";
import { getDigitalTwin, listStartupIds } from "@/lib/services/digital-twin";
import { generateRoadmap, MissingAssessmentError } from "@/lib/roadmap/generator";
import { computeRoadmapProgress } from "@/lib/roadmap/progress";
import { wouldCreateCycle } from "@/lib/roadmap/dependencies";
import { getActionTemplateForCriterion } from "@/lib/roadmap/action-catalog";
import { computePriority, inferImpact } from "@/lib/roadmap/prioritization";
import { allCriteria } from "@/lib/readiness/framework";
import type { Roadmap, RoadmapItem, TaskStatus } from "@/types/roadmap";

const store = new Map<string, Roadmap[]>();

function historyFor(startupId: string): Roadmap[] {
  return store.get(startupId) ?? [];
}

function withDerivedCounts(roadmap: Roadmap): Roadmap {
  const progress = computeRoadmapProgress(roadmap);
  return {
    ...roadmap,
    progressPct: progress.pct,
    completedCount: progress.completedCount,
    inProgressCount: progress.inProgressCount,
    remainingCount: progress.remainingCount,
  };
}

export function getRoadmapHistory(startupId: string): Roadmap[] {
  return historyFor(startupId).map(withDerivedCounts);
}

export function getCurrentRoadmap(startupId: string): Roadmap | undefined {
  const history = historyFor(startupId);
  const active = [...history].reverse().find((r) => r.status === "active") ?? history[history.length - 1];
  return active ? withDerivedCounts(active) : undefined;
}

function requireRoadmap(startupId: string): Roadmap {
  const roadmap = getCurrentRoadmap(startupId);
  if (!roadmap) throw new Error(`No roadmap found for startup "${startupId}"`);
  return roadmap;
}

function save(startupId: string, roadmap: Roadmap) {
  const history = historyFor(startupId);
  const next = history.map((r) => (r.id === roadmap.id ? roadmap : r));
  store.set(startupId, next);
}

/**
 * Generates a new roadmap version (v1 if none exists yet) or regenerates
 * from the current one. Throws MissingAssessmentError if the startup has no
 * completed readiness assessment yet — callers (Server Actions) surface
 * this as "Complete your Readiness Assessment first", never a fabricated
 * roadmap.
 */
export function generateOrRegenerateRoadmap(startupId: string, nowIso: string): Roadmap {
  const latestAssessment = getLatestAssessment(startupId);
  if (!latestAssessment) throw new MissingAssessmentError();
  const twin = getDigitalTwin(startupId);
  if (!twin) throw new Error(`No Digital Twin found for startup "${startupId}"`);

  const previousRoadmap = getCurrentRoadmap(startupId);
  const next = generateRoadmap(startupId, { latestAssessment, digitalTwin: twin, previousRoadmap }, nowIso);

  const history = historyFor(startupId);
  const historyWithSuperseded = history.map((r) =>
    previousRoadmap && r.id === previousRoadmap.id ? { ...r, status: "superseded" as const, updatedAt: nowIso } : r,
  );
  store.set(startupId, [...historyWithSuperseded, next]);
  return withDerivedCounts(next);
}

export function updateRoadmapItemStatus(startupId: string, itemId: string, status: TaskStatus, nowIso: string): Roadmap {
  const roadmap = requireRoadmap(startupId);
  const items = roadmap.items.map((item): RoadmapItem => {
    if (item.id !== itemId) return item;
    const patch: Partial<RoadmapItem> = { status, updatedAt: nowIso };
    if (status === "in_progress" && !item.startedAt) patch.startedAt = nowIso;
    if (status === "done") patch.completedAt = nowIso;
    return { ...item, ...patch };
  });
  const updated = { ...roadmap, items, updatedAt: nowIso };
  save(startupId, updated);
  return withDerivedCounts(updated);
}

export function dismissRoadmapItem(startupId: string, itemId: string, nowIso: string): Roadmap {
  return updateRoadmapItemStatus(startupId, itemId, "cancelled", nowIso);
}

export function addFounderRoadmapItem(
  startupId: string,
  input: {
    title: string;
    description?: string;
    category?: string;
    priority?: RoadmapItem["priority"];
    effort?: RoadmapItem["effort"];
    dueDate?: string;
  },
  nowIso: string,
): Roadmap {
  const roadmap = requireRoadmap(startupId);
  const item: RoadmapItem = {
    id: randomUUID(),
    startupId,
    roadmapId: roadmap.id,
    title: input.title,
    description: input.description ?? "",
    sourceType: "FOUNDER_CREATED",
    category: input.category ?? "general",
    priority: input.priority ?? "medium",
    priorityReasons: [],
    status: "todo",
    effort: input.effort ?? "short",
    expectedOutcome: input.description ?? input.title,
    dueDate: input.dueDate,
    dependencies: [],
    taskIds: [],
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  const updated = { ...roadmap, items: [...roadmap.items, item], updatedAt: nowIso };
  save(startupId, updated);
  return withDerivedCounts(updated);
}

export function addRoadmapItemDependency(startupId: string, itemId: string, dependsOnId: string, nowIso: string): Roadmap {
  const roadmap = requireRoadmap(startupId);
  if (itemId === dependsOnId) throw new Error("An item cannot depend on itself.");
  if (wouldCreateCycle(roadmap.items, itemId, dependsOnId)) {
    throw new Error("This dependency would create a circular reference.");
  }
  const items = roadmap.items.map((item) =>
    item.id === itemId
      ? { ...item, dependencies: [...new Set([...(item.dependencies ?? []), dependsOnId])], updatedAt: nowIso }
      : item,
  );
  const updated = { ...roadmap, items, updatedAt: nowIso };
  save(startupId, updated);
  return withDerivedCounts(updated);
}

export function linkTaskToRoadmapItem(startupId: string, itemId: string, taskId: string, nowIso: string): Roadmap {
  const roadmap = requireRoadmap(startupId);
  const items = roadmap.items.map((item) =>
    item.id === itemId ? { ...item, taskIds: [...new Set([...(item.taskIds ?? []), taskId])], updatedAt: nowIso } : item,
  );
  const updated = { ...roadmap, items, updatedAt: nowIso };
  save(startupId, updated);
  return withDerivedCounts(updated);
}

/**
 * Readiness-gap → roadmap wiring used by the Readiness page's "Add to
 * roadmap" / "Already in roadmap" affordance (StrengthsGapsPanel). Reuses
 * the exact same catalog + prioritization logic as the generator so a gap
 * added this way is indistinguishable from one produced during generation,
 * and is deduplicated the same way (one active item per criterionId).
 */
export function findActiveRoadmapItemForCriterion(startupId: string, criterionId: string): RoadmapItem | undefined {
  const roadmap = getCurrentRoadmap(startupId);
  return roadmap?.items.find(
    (item) => item.readinessCriterion === criterionId && item.status !== "done" && item.status !== "cancelled",
  );
}

export function addGapToRoadmap(startupId: string, criterionId: string, nowIso: string): Roadmap {
  const existing = findActiveRoadmapItemForCriterion(startupId, criterionId);
  if (existing) return requireRoadmap(startupId);

  const latestAssessment = getLatestAssessment(startupId);
  if (!latestAssessment) throw new MissingAssessmentError();
  const twin = getDigitalTwin(startupId);
  if (!twin) throw new Error(`No Digital Twin found for startup "${startupId}"`);

  const template = getActionTemplateForCriterion(criterionId);
  if (!template) throw new Error(`No action template mapped for criterion "${criterionId}"`);

  const criterionResult = latestAssessment.dimensions
    .flatMap((d) => d.criteria)
    .find((c) => c.criterionId === criterionId);

  const def = allCriteria().find((c) => c.id === criterionId);
  const importance = def?.stageApplicability[twin.identity.stage];

  const { priority, priorityReasons } = computePriority({
    criterionStatus: criterionResult?.status,
    importance,
    weight: criterionResult?.weight,
    confidence: criterionResult?.confidence,
    effort: template.defaultEffort,
  });

  const item: RoadmapItem = {
    id: randomUUID(),
    startupId,
    title: "",
    titleKey: template.titleKey,
    description: "",
    descriptionKey: template.descriptionKey,
    sourceType: "READINESS_GAP",
    sourceReference: latestAssessment.id,
    category: template.category,
    priority,
    priorityReasons,
    status: "todo",
    impact: inferImpact({ importance, criterionStatus: criterionResult?.status }),
    effort: template.defaultEffort,
    estimatedDuration: template.estimatedDuration,
    expectedOutcome: template.descriptionKey,
    readinessDimension: template.dimension,
    readinessCriterion: criterionId,
    dependencies: [],
    taskIds: [],
    evidenceRequirement: template.evidenceRequirementKey,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const roadmap = requireRoadmap(startupId);
  const updated = { ...roadmap, items: [...roadmap.items, item], updatedAt: nowIso };
  save(startupId, updated);
  return withDerivedCounts(updated);
}

/** Test-only reset hook so isolated tests don't leak state across files. */
export function __resetRoadmapStoreForTests() {
  store.clear();
}

// ---------------------------------------------------------------------------
// Seed: give every existing demo startup an initial (v1) roadmap generated
// live from its completed readiness assessment, exactly the way a real
// founder's "Generate roadmap" action would. A startup with no completed
// assessment yet is simply left unseeded — see MissingAssessmentError.
// ---------------------------------------------------------------------------
for (const startupId of listStartupIds()) {
  try {
    generateOrRegenerateRoadmap(startupId, new Date().toISOString());
  } catch {
    // No completed assessment for this startup yet — nothing to seed.
  }
}
