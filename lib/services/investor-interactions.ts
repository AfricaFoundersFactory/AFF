/**
 * Investor interaction log (AFF-DASH-10 §22-23). Strictly founder-recorded:
 * selecting EMAIL/CALL/MEETING records that the FOUNDER did this outside
 * AFF — it never means AFF sent anything or that the interaction is
 * verified. Startup-scoped; no Community exposure.
 */
import { randomUUID } from "crypto";
import type { InteractionType, InvestorInteraction } from "@/types/investors";

const store = new Map<string, InvestorInteraction[]>(); // keyed by startupId

function forStartup(startupId: string): InvestorInteraction[] {
  return store.get(startupId) ?? [];
}

/** Ordered newest-first by occurrence time, then by creation order as a stable tiebreaker. */
export function listInteractions(startupId: string, investorId?: string): InvestorInteraction[] {
  const all = investorId ? forStartup(startupId).filter((i) => i.investorId === investorId) : forStartup(startupId);
  return [...all].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.createdAt.localeCompare(a.createdAt));
}

export function recordInteraction(
  startupId: string,
  input: {
    investorId: string;
    pipelineEntryId?: string;
    type: InteractionType;
    occurredAt: string;
    summary: string;
    nextAction?: string;
    nextActionAt?: string;
    createdBy: string;
  },
  nowIso: string,
): InvestorInteraction {
  const interaction: InvestorInteraction = {
    id: randomUUID(),
    startupId,
    investorId: input.investorId,
    pipelineEntryId: input.pipelineEntryId,
    type: input.type,
    occurredAt: input.occurredAt,
    summary: input.summary,
    nextAction: input.nextAction,
    nextActionAt: input.nextActionAt,
    createdBy: input.createdBy,
    createdAt: nowIso,
  };
  store.set(startupId, [...forStartup(startupId), interaction]);
  return interaction;
}

/** Test-only reset hook. */
export function __resetInvestorInteractionsStoreForTests() {
  store.clear();
}
