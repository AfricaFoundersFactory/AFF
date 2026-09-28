/**
 * Fundraising Round + Pipeline service (AFF-DASH-10 §17-21). Founder-managed
 * relationship tracking, strictly startup-scoped. Stage transitions are
 * founder-entered states — AFF never implies external confirmation beyond
 * what was explicitly recorded here.
 */
import { randomUUID } from "crypto";
import type { FundraisingPipelineEntry, FundraisingRound, FundraisingRoundStatus, PipelineStage } from "@/types/investors";
import { TERMINAL_PIPELINE_STAGES } from "@/types/investors";

const roundsStore = new Map<string, FundraisingRound[]>(); // keyed by startupId
const pipelineStore = new Map<string, FundraisingPipelineEntry[]>(); // keyed by startupId

// ---------------------------------------------------------------------------
// Fundraising rounds
// ---------------------------------------------------------------------------

function roundsFor(startupId: string): FundraisingRound[] {
  return roundsStore.get(startupId) ?? [];
}

export function listRounds(startupId: string): FundraisingRound[] {
  return roundsFor(startupId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getRound(startupId: string, roundId: string): FundraisingRound | undefined {
  return roundsFor(startupId).find((r) => r.id === roundId);
}

export function getActiveRound(startupId: string): FundraisingRound | undefined {
  return roundsFor(startupId).find((r) => r.status === "ACTIVE");
}

export function createRound(
  startupId: string,
  input: { name: string; targetAmount: FundraisingRound["targetAmount"]; instrument?: FundraisingRound["instrument"]; openedAt?: string; targetCloseDate?: string; notes?: string },
  nowIso: string,
): FundraisingRound {
  const round: FundraisingRound = {
    id: randomUUID(),
    startupId,
    name: input.name,
    status: "PLANNING",
    targetAmount: input.targetAmount,
    instrument: input.instrument,
    openedAt: input.openedAt,
    targetCloseDate: input.targetCloseDate,
    notes: input.notes,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  roundsStore.set(startupId, [...roundsFor(startupId), round]);
  return round;
}

/**
 * Prevents a startup from having two ACTIVE fundraising rounds at once — a
 * founder has one active fundraising process at a time in this model. A
 * round that has moved to PAUSED/CLOSED/CANCELLED never blocks a new ACTIVE
 * round (that's a legitimate new round after the prior one finished).
 */
export function updateRoundStatus(startupId: string, roundId: string, status: FundraisingRoundStatus, nowIso: string): FundraisingRound {
  const round = getRound(startupId, roundId);
  if (!round) throw new Error(`No fundraising round "${roundId}" for startup "${startupId}"`);
  if (status === "ACTIVE") {
    const otherActive = roundsFor(startupId).find((r) => r.id !== roundId && r.status === "ACTIVE");
    if (otherActive) throw new Error(`Startup "${startupId}" already has an active fundraising round ("${otherActive.name}")`);
  }
  const updated: FundraisingRound = { ...round, status, updatedAt: nowIso };
  roundsStore.set(
    startupId,
    roundsFor(startupId).map((r) => (r.id === roundId ? updated : r)),
  );
  return updated;
}

export function updateRound(
  startupId: string,
  roundId: string,
  patch: { name?: string; targetAmount?: FundraisingRound["targetAmount"]; instrument?: FundraisingRound["instrument"]; targetCloseDate?: string; notes?: string },
  nowIso: string,
): FundraisingRound {
  const round = getRound(startupId, roundId);
  if (!round) throw new Error(`No fundraising round "${roundId}" for startup "${startupId}"`);
  const updated: FundraisingRound = { ...round, ...patch, updatedAt: nowIso };
  roundsStore.set(
    startupId,
    roundsFor(startupId).map((r) => (r.id === roundId ? updated : r)),
  );
  return updated;
}

// ---------------------------------------------------------------------------
// Pipeline entries
// ---------------------------------------------------------------------------

function pipelineFor(startupId: string): FundraisingPipelineEntry[] {
  return pipelineStore.get(startupId) ?? [];
}

export function listPipeline(startupId: string): FundraisingPipelineEntry[] {
  return pipelineFor(startupId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getPipelineEntry(startupId: string, entryId: string): FundraisingPipelineEntry | undefined {
  return pipelineFor(startupId).find((e) => e.id === entryId);
}

function isActiveStage(stage: PipelineStage): boolean {
  return !TERMINAL_PIPELINE_STAGES.includes(stage);
}

/**
 * §21 — prevents duplicate ACTIVE pipeline relationships for the same
 * startup + investor + fundraising round. A prior relationship that has
 * reached a terminal stage (PASSED/DECLINED/ARCHIVED) does not block a new
 * one — that models a legitimate separate/parallel process (e.g. a second
 * fundraising round with the same investor).
 */
export function createPipelineEntry(
  startupId: string,
  input: { investorId: string; fundraisingRoundId?: string; ownerFounderId: string; note?: string; nextAction?: string; nextActionAt?: string; stage?: PipelineStage },
  nowIso: string,
): FundraisingPipelineEntry {
  const duplicate = pipelineFor(startupId).find(
    (e) => e.investorId === input.investorId && e.fundraisingRoundId === input.fundraisingRoundId && isActiveStage(e.stage),
  );
  if (duplicate) throw new Error("An active pipeline relationship already exists for this investor and fundraising round");

  const entry: FundraisingPipelineEntry = {
    id: randomUUID(),
    startupId,
    investorId: input.investorId,
    fundraisingRoundId: input.fundraisingRoundId,
    stage: input.stage ?? "RESEARCH",
    ownerFounderId: input.ownerFounderId,
    note: input.note,
    nextAction: input.nextAction,
    nextActionAt: input.nextActionAt,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  pipelineStore.set(startupId, [...pipelineFor(startupId), entry]);
  return entry;
}

export function moveStage(startupId: string, entryId: string, stage: PipelineStage, nowIso: string): FundraisingPipelineEntry {
  const entry = getPipelineEntry(startupId, entryId);
  if (!entry) throw new Error(`No pipeline entry "${entryId}" for startup "${startupId}"`);
  const updated: FundraisingPipelineEntry = { ...entry, stage, updatedAt: nowIso };
  pipelineStore.set(
    startupId,
    pipelineFor(startupId).map((e) => (e.id === entryId ? updated : e)),
  );
  return updated;
}

export function updatePipelineEntry(
  startupId: string,
  entryId: string,
  patch: { note?: string; nextAction?: string; nextActionAt?: string },
  nowIso: string,
): FundraisingPipelineEntry {
  const entry = getPipelineEntry(startupId, entryId);
  if (!entry) throw new Error(`No pipeline entry "${entryId}" for startup "${startupId}"`);
  const updated: FundraisingPipelineEntry = { ...entry, ...patch, updatedAt: nowIso };
  pipelineStore.set(
    startupId,
    pipelineFor(startupId).map((e) => (e.id === entryId ? updated : e)),
  );
  return updated;
}

/** Test-only reset hook. */
export function __resetFundraisingPipelineStoreForTests() {
  roundsStore.clear();
  pipelineStore.clear();
}
