/**
 * Support Request service boundary — the only place a SupportRequest is
 * created, read or transitioned. Same in-memory Map<startupId, ...> pattern
 * as lib/services/tasks.ts — never lets one startup's request leak into
 * another's list (see support-requests.test.ts's isolation assertions).
 *
 * "SENT" means submitted inside AFF ONLY — no real email/notification
 * delivery exists. This module never sends anything externally; it only
 * flips a status field.
 */
import { randomUUID } from "crypto";
import type { ExpertLanguage } from "@/lib/experts/taxonomy";
import type { MentoringFormat, SupportRequest, SupportRequestStatus } from "@/types/experts";
import { getExpert } from "@/lib/services/experts";

const store = new Map<string, SupportRequest[]>();

function requestsFor(startupId: string): SupportRequest[] {
  return store.get(startupId) ?? [];
}

function save(startupId: string, requests: SupportRequest[]) {
  store.set(startupId, requests);
}

export function listSupportRequests(startupId: string): SupportRequest[] {
  return requestsFor(startupId);
}

export function getSupportRequest(startupId: string, requestId: string): SupportRequest | undefined {
  return requestsFor(startupId).find((r) => r.id === requestId);
}

function requireRequest(startupId: string, requestId: string): SupportRequest {
  const request = getSupportRequest(startupId, requestId);
  if (!request) throw new Error(`No support request "${requestId}" found for startup "${startupId}"`);
  return request;
}

export function createSupportRequest(
  startupId: string,
  input: {
    founderId: string;
    expertId: string;
    needId?: string;
    topic: string;
    message: string;
    preferredFormat: MentoringFormat;
    preferredLanguage: ExpertLanguage;
    status?: SupportRequestStatus; // defaults to SENT — a founder submitting the form has, by definition, sent it
  },
  nowIso: string,
): SupportRequest {
  if (!getExpert(input.expertId)) {
    throw new Error(`No expert profile "${input.expertId}" found`);
  }
  const request: SupportRequest = {
    id: randomUUID(),
    startupId,
    founderId: input.founderId,
    expertId: input.expertId,
    needId: input.needId,
    topic: input.topic,
    message: input.message,
    preferredFormat: input.preferredFormat,
    preferredLanguage: input.preferredLanguage,
    status: input.status ?? "SENT",
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  save(startupId, [...requestsFor(startupId), request]);
  return request;
}

const VALID_TRANSITIONS: Record<SupportRequestStatus, SupportRequestStatus[]> = {
  DRAFT: ["SENT", "CANCELLED"],
  SENT: ["ACCEPTED", "DECLINED", "CANCELLED"],
  ACCEPTED: ["COMPLETED", "CANCELLED"],
  DECLINED: [],
  CANCELLED: [],
  COMPLETED: [],
};

function assertValidTransition(from: SupportRequestStatus, to: SupportRequestStatus) {
  if (from === to) return;
  if (!VALID_TRANSITIONS[from].includes(to)) {
    throw new Error(`Cannot transition support request from "${from}" to "${to}"`);
  }
}

export function updateSupportRequestStatus(
  startupId: string,
  requestId: string,
  status: SupportRequestStatus,
  nowIso: string,
): SupportRequest {
  const existing = requireRequest(startupId, requestId);
  assertValidTransition(existing.status, status);
  const updated: SupportRequest = { ...existing, status, updatedAt: nowIso };
  save(
    startupId,
    requestsFor(startupId).map((r) => (r.id === requestId ? updated : r)),
  );
  return updated;
}

export function cancelSupportRequest(startupId: string, requestId: string, nowIso: string): SupportRequest {
  return updateSupportRequestStatus(startupId, requestId, "CANCELLED", nowIso);
}

/** Test-only reset hook so isolated tests don't leak state across files. */
export function __resetSupportRequestsStoreForTests() {
  store.clear();
}

// ---------------------------------------------------------------------------
// Seed: one accepted (in-flight) and one sent (pending) demo support request
// for the mature startup, one sent request for the early-stage startup.
// These reference real seeded expert ids from lib/services/experts.ts.
// ---------------------------------------------------------------------------
import { listExperts } from "@/lib/services/experts";
import { listStartupIds } from "@/lib/services/digital-twin";

function seedDemoSupportRequests() {
  const seedIso = new Date().toISOString();
  const experts = listExperts();
  const fundraisingExpert = experts.find((e) => e.expertise.includes("FUNDRAISING") && e.country === "Côte d'Ivoire");
  const productExpert = experts.find((e) => e.expertise.includes("PRODUCT"));

  if (listStartupIds().includes("startup-wakama") && requestsFor("startup-wakama").length === 0 && fundraisingExpert) {
    createSupportRequest(
      "startup-wakama",
      {
        founderId: "demo-founder-wakama",
        expertId: fundraisingExpert.id,
        topic: "Seed round narrative review",
        message: "We are preparing to reopen our seed round conversations and would love a second pair of eyes on our ask before we start outreach.",
        preferredFormat: "PITCH_REVIEW",
        preferredLanguage: "fr",
        status: "ACCEPTED",
      },
      seedIso,
    );
  }

  if (listStartupIds().includes("startup-solari") && requestsFor("startup-solari").length === 0 && productExpert) {
    createSupportRequest(
      "startup-solari",
      {
        founderId: "demo-founder-solari",
        expertId: productExpert.id,
        topic: "MVP scope sanity check",
        message: "We're deciding what to cut from our first pilot release and would value an experienced product perspective.",
        preferredFormat: "VIDEO_CALL",
        preferredLanguage: "en",
        status: "SENT",
      },
      seedIso,
    );
  }
}
seedDemoSupportRequests();
