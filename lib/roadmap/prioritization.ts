/**
 * Deterministic, transparent prioritization engine.
 *
 * `computePriority` is a pure function: same inputs always produce the same
 * {priority, priorityReasons} output (see lib/roadmap/prioritization.test.ts
 * for the determinism assertion). It may compute an internal numeric score
 * to decide the tier, but that number is NEVER returned or rendered — only
 * the final tier ("critical"|"high"|"medium"|"low") and the human-readable
 * reason list are user-facing.
 *
 * priorityReasons entries are translation-key identifiers (resolved by the
 * UI against dashboard.roadmap.reasons.*), never hardcoded English strings.
 * A reason that needs a parameter (e.g. which goal it supports) is encoded
 * as "reasonKey::param" — the UI splits on "::" and looks the param up
 * itself (e.g. the goal's own title), so this module never needs to know
 * about translation.
 */
import type { CriterionStatus, ImportanceTier } from "@/types/readiness-engine";
import type { Effort, TaskPriority } from "@/types/roadmap";

export type PriorityInput = {
  /** Only present for READINESS_GAP-sourced items. */
  criterionStatus?: CriterionStatus;
  /** stageApplicability of the criterion's dimension at the startup's current stage. */
  importance?: ImportanceTier;
  /** Criterion weight, 0..1 (higher = matters more to the overall score). */
  weight?: number;
  /** Criterion confidence, 0..100 (lower confidence = more urgent to resolve). */
  confidence?: number;
  /** Whether this action supports an active (not achieved/missed) founder goal. */
  supportsActiveGoal?: boolean;
  goalId?: string;
  /** Days until due date, if one is set; undefined if no due date. */
  dueInDays?: number;
  /** Whether this item currently has unmet (not-done) dependencies. */
  hasUnmetDependencies?: boolean;
  effort: Effort;
};

export type PriorityResult = {
  priority: TaskPriority;
  priorityReasons: string[];
};

function importanceScore(importance?: ImportanceTier): number {
  switch (importance) {
    case "critical":
      return 40;
    case "high":
      return 30;
    case "medium":
      return 15;
    case "low":
      return 5;
    default:
      return 0;
  }
}

function statusScore(status?: CriterionStatus): number {
  switch (status) {
    case "weak":
      return 25;
    case "insufficient_evidence":
      return 20;
    case "developing":
      return 10;
    default:
      return 0;
  }
}

function effortScore(effort: Effort): number {
  return effort === "quick" || effort === "short" ? 5 : effort === "long" ? -5 : 0;
}

export function computePriority(input: PriorityInput): PriorityResult {
  const reasons: string[] = [];
  let score = 0;

  const imp = importanceScore(input.importance);
  score += imp;
  if (input.importance === "critical") reasons.push("stageImportanceCritical");
  else if (input.importance === "high") reasons.push("stageImportanceHigh");
  else if (input.importance === "medium") reasons.push("stageImportanceMedium");

  const stat = statusScore(input.criterionStatus);
  score += stat;
  if (input.criterionStatus === "weak") reasons.push("criterionWeak");
  else if (input.criterionStatus === "insufficient_evidence") reasons.push("criterionInsufficientEvidence");
  else if (input.criterionStatus === "developing") reasons.push("criterionDeveloping");

  if (typeof input.weight === "number") {
    score += input.weight * 10;
    if (input.weight >= 0.7) reasons.push("highWeightCriterion");
  }

  if (typeof input.confidence === "number") {
    const confidenceGap = (100 - input.confidence) / 100;
    score += confidenceGap * 10;
    if (input.confidence < 40) reasons.push("lowConfidenceEvidence");
  }

  if (input.supportsActiveGoal) {
    score += 15;
    reasons.push(input.goalId ? `supportsGoal::${input.goalId}` : "supportsGoal");
  }

  if (typeof input.dueInDays === "number") {
    if (input.dueInDays <= 7) {
      score += 20;
      reasons.push("dueSoon");
    } else if (input.dueInDays <= 30) {
      score += 10;
      reasons.push("dueThisMonth");
    }
  }

  if (input.hasUnmetDependencies) {
    score -= 10;
    reasons.push("blockedByDependency");
  }

  score += effortScore(input.effort);
  if (input.effort === "quick" || input.effort === "short") reasons.push("lowEffort");

  let priority: TaskPriority;
  if (score >= 60) priority = "critical";
  else if (score >= 40) priority = "high";
  else if (score >= 20) priority = "medium";
  else priority = "low";

  return { priority, priorityReasons: reasons };
}

// ---------------------------------------------------------------------------
// Impact / effort / quick wins
// ---------------------------------------------------------------------------
import type { Impact, RoadmapItem } from "@/types/roadmap";

export function isQuickWin(item: Pick<RoadmapItem, "impact" | "effort">): boolean {
  const impactOk = item.impact === "high" || item.impact === "medium";
  const effortOk = item.effort === "quick" || item.effort === "short";
  return Boolean(impactOk && effortOk);
}

export function getQuickWins(roadmap: { items: RoadmapItem[] }): RoadmapItem[] {
  return roadmap.items.filter(
    (item) => item.status !== "done" && item.status !== "cancelled" && isQuickWin(item),
  );
}

export function inferImpact(input: Pick<PriorityInput, "importance" | "criterionStatus">): Impact {
  if (input.importance === "critical" || input.criterionStatus === "weak") return "high";
  if (input.importance === "high" || input.criterionStatus === "insufficient_evidence") return "medium";
  return "low";
}
