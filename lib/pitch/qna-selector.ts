/**
 * Contextual Q&A selection (Part 18) — a deterministic FUNCTION over the
 * Digital Twin and the pitch workspace's objective, never an AI call. Given
 * the same twin + workspace, always returns the same question set.
 *
 * Rules implemented (all explicit, all inspectable here):
 *  - No revenue (twin.financials has neither monthlyRevenue nor
 *    annualRevenue, and traction has no "revenue"/"mrr"/"arr" metric) =>
 *    skip MRR-growth questions, surface a monetization-timing question
 *    instead (via `fallbackForId`).
 *  - objective === "fundraising" => include fundraising-specific questions.
 *  - businessModel.types includes "marketplace" => include supply/demand
 *    (marketplace dynamics) question.
 *  - Any question requiring a business model type the startup doesn't have
 *    is skipped.
 */
import type { StartupDigitalTwin } from "@/types/digital-twin";
import type { PitchObjective, QnaQuestionTemplate } from "@/types/pitch";
import { QNA_CATALOG } from "./qna-catalog";

function hasRevenue(twin: StartupDigitalTwin): boolean {
  if (twin.financials.monthlyRevenue !== undefined || twin.financials.annualRevenue !== undefined) return true;
  return twin.traction.metrics.some((m) => m.type === "revenue" || m.type === "mrr" || m.type === "arr");
}

export function selectContextualQuestions(twin: StartupDigitalTwin, objective: PitchObjective): QnaQuestionTemplate[] {
  const revenue = hasRevenue(twin);
  const fundraising = objective === "fundraising";

  const skippedIds = new Set<string>();
  if (!revenue) skippedIds.add("traction_mrr_growth");
  if (!fundraising) {
    QNA_CATALOG.filter((q) => q.requiresFundraising).forEach((q) => skippedIds.add(q.id));
  }

  return QNA_CATALOG.filter((q) => {
    if (skippedIds.has(q.id)) return false;
    // A fallback question only appears when the question it replaces was skipped.
    if (q.fallbackForId) return skippedIds.has(q.fallbackForId);
    if (q.requiresRevenue && !revenue) return false;
    if (q.requiresFundraising && !fundraising) return false;
    if (q.requiresBusinessModel && !q.requiresBusinessModel.some((bm) => twin.businessModel.types.includes(bm))) return false;
    return true;
  });
}
