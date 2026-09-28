/**
 * Roadmap generation engine — pure(ish): takes data in, returns a new
 * Roadmap value. It never talks to a store; lib/services/roadmap.ts is the
 * only place with side effects (reading/writing the in-memory Map).
 *
 * IMPORTANT: nothing in this file (or anything it imports) calls into
 * lib/services/readiness.ts's score-mutating functions
 * (createAssessment/reassess/saveAssessmentAnswers/completeAssessment).
 * Generating or regenerating a roadmap can never change a Readiness score —
 * it only READS the latest completed assessment.
 */
import { randomUUID } from "crypto";
import type { ReadinessAssessment } from "@/types/readiness-engine";
import type { StartupDigitalTwin } from "@/types/digital-twin";
import type { Roadmap, RoadmapItem } from "@/types/roadmap";
import { allCriteria } from "@/lib/readiness/framework";
import { ACTION_CATALOG, GOAL_CATEGORY_ACTION_MAP, getActionTemplateForCriterion } from "./action-catalog";
import { computePriority, inferImpact } from "./prioritization";
import { validateDependencies } from "./dependencies";

export class MissingAssessmentError extends Error {
  constructor() {
    super("Cannot generate a roadmap: no completed readiness assessment exists for this startup.");
    this.name = "MissingAssessmentError";
  }
}

export type GenerateRoadmapInput = {
  latestAssessment: ReadinessAssessment | undefined;
  digitalTwin: StartupDigitalTwin;
  previousRoadmap?: Roadmap;
};

const GAP_STATUSES = new Set(["weak", "insufficient_evidence"]);

function daysBetween(fromIso: string, toIso: string): number {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/** Active (still-open, non-terminal) roadmap item — used for dedup lookups. */
function isActiveItem(item: RoadmapItem): boolean {
  return item.status !== "done" && item.status !== "cancelled";
}

export function generateRoadmap(startupId: string, input: GenerateRoadmapInput, nowIso: string): Roadmap {
  const { latestAssessment, digitalTwin, previousRoadmap } = input;

  if (!latestAssessment) {
    throw new MissingAssessmentError();
  }

  const stage = digitalTwin.identity.stage;
  const criteriaDefs = new Map(allCriteria().map((c) => [c.id, c]));

  const previousActiveByCriterion = new Map<string, RoadmapItem>();
  const previousActiveByGoal = new Map<string, RoadmapItem>();
  const preserved: RoadmapItem[] = [];

  for (const item of previousRoadmap?.items ?? []) {
    // Founder-created items and already-completed items are carried forward
    // unmodified regardless of regeneration.
    if (item.sourceType === "FOUNDER_CREATED" || item.status === "done") {
      preserved.push(item);
      continue;
    }
    if (isActiveItem(item)) {
      if (item.readinessCriterion) previousActiveByCriterion.set(item.readinessCriterion, item);
      if (item.goalId) previousActiveByGoal.set(item.goalId, item);
    }
  }

  const generated: RoadmapItem[] = [];

  // --- READINESS_GAP items ---------------------------------------------
  for (const dimension of latestAssessment.dimensions) {
    for (const criterion of dimension.criteria) {
      const isGap =
        GAP_STATUSES.has(criterion.status) || (criterion.evaluability === false && criterion.status !== "not_applicable");
      if (!isGap) continue;

      const template = getActionTemplateForCriterion(criterion.criterionId);
      if (!template) continue; // no deterministic catalog entry — skip, never fabricate

      const existing = previousActiveByCriterion.get(criterion.criterionId);
      if (existing) {
        preserved.push(existing);
        continue;
      }

      const def = criteriaDefs.get(criterion.criterionId);
      const importance = def?.stageApplicability[stage];

      const { priority, priorityReasons } = computePriority({
        criterionStatus: criterion.status,
        importance,
        weight: criterion.weight,
        confidence: criterion.confidence,
        effort: template.defaultEffort,
      });

      const id = randomUUID();
      const item: RoadmapItem = {
        id,
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
        impact: inferImpact({ importance, criterionStatus: criterion.status }),
        effort: template.defaultEffort,
        estimatedDuration: template.estimatedDuration,
        expectedOutcome: template.descriptionKey,
        readinessDimension: dimension.dimension,
        readinessCriterion: criterion.criterionId,
        dependencies: [],
        taskIds: [],
        evidenceRequirement: template.evidenceRequirementKey,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      // sourceReference above stores the assessment id (per spec); the
      // criterion id used for de-duplication is tracked via readinessCriterion.
      generated.push(item);
      previousActiveByCriterion.set(criterion.criterionId, item);
    }
  }

  // --- FOUNDER_GOAL items -------------------------------------------------
  for (const goal of digitalTwin.goals) {
    if (goal.status === "achieved" || goal.status === "missed") continue;
    const templateIds = GOAL_CATEGORY_ACTION_MAP[goal.category];
    if (!templateIds || templateIds.length === 0) continue; // no mapping — never guess

    const existingForGoal = previousActiveByGoal.get(goal.id);
    if (existingForGoal) {
      preserved.push(existingForGoal);
      continue;
    }

    // One action per goal (the first unmapped/uncovered template) keeps the
    // roadmap from ballooning with redundant items per goal.
    const template = templateIds.map((id) => ACTION_CATALOG.find((a) => a.id === id)).find(Boolean);
    if (!template) continue;

    const dueInDays = goal.targetDate ? daysBetween(nowIso, goal.targetDate) : undefined;
    const { priority, priorityReasons } = computePriority({
      supportsActiveGoal: true,
      goalId: goal.id,
      dueInDays,
      effort: template.defaultEffort,
    });

    const id = randomUUID();
    const item: RoadmapItem = {
      id,
      startupId,
      title: "",
      titleKey: template.titleKey,
      description: "",
      descriptionKey: template.descriptionKey,
      sourceType: "FOUNDER_GOAL",
      sourceReference: goal.id,
      category: template.category,
      priority,
      priorityReasons,
      status: "todo",
      impact: template.defaultImpact,
      effort: template.defaultEffort,
      estimatedDuration: template.estimatedDuration,
      expectedOutcome: template.descriptionKey,
      goalId: goal.id,
      dueDate: goal.targetDate,
      dependencies: [],
      taskIds: [],
      evidenceRequirement: template.evidenceRequirementKey,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    generated.push(item);
    previousActiveByGoal.set(goal.id, item);
  }

  const items = [...preserved, ...generated];
  const { valid } = validateDependencies(items);
  if (!valid) {
    // Defensive: this engine never generates cross-references, so this
    // should be unreachable, but never publish a roadmap with a cycle.
    for (const item of items) item.dependencies = [];
  }

  const version = previousRoadmap ? (previousRoadmap.version ?? 1) + 1 : 1;

  return {
    id: `${startupId}-roadmap-v${version}`,
    startupId,
    version,
    title: `Roadmap v${version}`,
    status: "active",
    sourceAssessmentId: latestAssessment.id,
    createdAt: nowIso,
    updatedAt: nowIso,
    items,
    milestones: previousRoadmap?.milestones ?? [],
    // Precomputed counts kept for the legacy Roadmap shape; always derived
    // fresh here (never stale) — see lib/roadmap/progress.ts for the
    // canonical formula this mirrors.
    progressPct: items.length === 0 ? 0 : Math.round((items.filter((i) => i.status === "done").length / items.filter((i) => i.status !== "cancelled").length) * 100) || 0,
    completedCount: items.filter((i) => i.status === "done").length,
    inProgressCount: items.filter((i) => i.status === "in_progress").length,
    remainingCount: items.filter((i) => i.status !== "done" && i.status !== "in_progress" && i.status !== "cancelled").length,
  };
}
