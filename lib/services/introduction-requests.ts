/**
 * Introduction request service (AFF-DASH-10 §24-25). REQUESTED means the
 * founder submitted the request inside AFF — it never means the investor
 * has been contacted. INTRODUCED is only reachable via the explicit
 * transitionStatus() call below, never implied by any other action.
 */
import { randomUUID } from "crypto";
import type { IntroductionRequest, IntroductionStatus } from "@/types/investors";

const store = new Map<string, IntroductionRequest[]>(); // keyed by startupId

const ALLOWED_TRANSITIONS: Record<IntroductionStatus, IntroductionStatus[]> = {
  DRAFT: ["REQUESTED", "CANCELLED"],
  REQUESTED: ["UNDER_REVIEW", "CANCELLED"],
  UNDER_REVIEW: ["APPROVED", "DECLINED", "CANCELLED"],
  APPROVED: ["INTRODUCED", "CANCELLED"],
  DECLINED: [],
  INTRODUCED: [],
  CANCELLED: [],
};

function forStartup(startupId: string): IntroductionRequest[] {
  return store.get(startupId) ?? [];
}

export function listIntroductionRequests(startupId: string): IntroductionRequest[] {
  return [...forStartup(startupId)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getIntroductionRequest(startupId: string, requestId: string): IntroductionRequest | undefined {
  return forStartup(startupId).find((r) => r.id === requestId);
}

export function createIntroductionRequest(
  startupId: string,
  input: { investorId: string; fundraisingRoundId?: string; reason?: string; context?: string; createdBy: string },
  nowIso: string,
): IntroductionRequest {
  const request: IntroductionRequest = {
    id: randomUUID(),
    startupId,
    investorId: input.investorId,
    fundraisingRoundId: input.fundraisingRoundId,
    status: "REQUESTED",
    reason: input.reason,
    context: input.context,
    createdBy: input.createdBy,
    createdAt: nowIso,
    updatedAt: nowIso,
    history: [{ status: "REQUESTED", at: nowIso }],
  };
  store.set(startupId, [...forStartup(startupId), request]);
  return request;
}

/**
 * Prepares an introduction request as DRAFT — this is a private, founder-side
 * preparation step only. AFF has NOT received anything at this point; the
 * founder must call transitionStatus(..., "REQUESTED") explicitly (a
 * separate, deliberate action) for the request to actually be submitted.
 */
export function createIntroductionDraft(
  startupId: string,
  input: { investorId: string; fundraisingRoundId?: string; reason?: string; context?: string; createdBy: string },
  nowIso: string,
): IntroductionRequest {
  const request: IntroductionRequest = {
    id: randomUUID(),
    startupId,
    investorId: input.investorId,
    fundraisingRoundId: input.fundraisingRoundId,
    status: "DRAFT",
    reason: input.reason,
    context: input.context,
    createdBy: input.createdBy,
    createdAt: nowIso,
    updatedAt: nowIso,
    history: [{ status: "DRAFT", at: nowIso }],
  };
  store.set(startupId, [...forStartup(startupId), request]);
  return request;
}

/** Editing the reason/context is only meaningful while still DRAFT — once
 * submitted (REQUESTED or later) the request is a record of what was sent. */
export function updateIntroductionDraft(
  startupId: string,
  requestId: string,
  patch: { reason?: string; context?: string },
  nowIso: string,
): IntroductionRequest {
  const request = getIntroductionRequest(startupId, requestId);
  if (!request) throw new Error(`No introduction request "${requestId}" for startup "${startupId}"`);
  if (request.status !== "DRAFT") throw new Error(`Cannot edit an introduction request once it is "${request.status}" — only DRAFT requests are editable`);
  const updated: IntroductionRequest = { ...request, ...patch, updatedAt: nowIso };
  store.set(
    startupId,
    forStartup(startupId).map((r) => (r.id === requestId ? updated : r)),
  );
  return updated;
}

export function transitionStatus(startupId: string, requestId: string, next: IntroductionStatus, nowIso: string): IntroductionRequest {
  const request = getIntroductionRequest(startupId, requestId);
  if (!request) throw new Error(`No introduction request "${requestId}" for startup "${startupId}"`);
  const allowed = ALLOWED_TRANSITIONS[request.status];
  if (!allowed.includes(next)) {
    throw new Error(`Invalid introduction status transition from "${request.status}" to "${next}"`);
  }
  const updated: IntroductionRequest = { ...request, status: next, updatedAt: nowIso, history: [...request.history, { status: next, at: nowIso }] };
  store.set(
    startupId,
    forStartup(startupId).map((r) => (r.id === requestId ? updated : r)),
  );
  return updated;
}

export function cancelIntroductionRequest(startupId: string, requestId: string, nowIso: string): IntroductionRequest {
  return transitionStatus(startupId, requestId, "CANCELLED", nowIso);
}

/** Test-only reset hook. */
export function __resetIntroductionRequestsStoreForTests() {
  store.clear();
}
