/**
 * Data Room share service (AFF-DASH-10 §27-30). Access-intent/permission
 * metadata ONLY — no real external file access exists. A share is created
 * ONLY through an explicit founder action naming specific documentIds; it
 * is never created implicitly by shortlisting, entering the pipeline, or
 * requesting an introduction. There is no view/download tracking here —
 * doing so would fabricate investor engagement data that does not exist.
 */
import { randomUUID } from "crypto";
import type { DataRoomShare } from "@/types/investors";

const store = new Map<string, DataRoomShare[]>(); // keyed by startupId

function forStartup(startupId: string): DataRoomShare[] {
  return store.get(startupId) ?? [];
}

export function listShares(startupId: string): DataRoomShare[] {
  return [...forStartup(startupId)].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getShare(startupId: string, shareId: string): DataRoomShare | undefined {
  return forStartup(startupId).find((s) => s.id === shareId);
}

export function createShare(
  startupId: string,
  input: { investorId: string; pipelineEntryId?: string; documentIds: string[] },
  nowIso: string,
): DataRoomShare {
  if (input.documentIds.length === 0) throw new Error("At least one document must be selected to share");
  const share: DataRoomShare = {
    id: randomUUID(),
    startupId,
    investorId: input.investorId,
    pipelineEntryId: input.pipelineEntryId,
    documentIds: input.documentIds,
    status: "ACTIVE",
    createdAt: nowIso,
  };
  store.set(startupId, [...forStartup(startupId), share]);
  return share;
}

export function revokeShare(startupId: string, shareId: string, nowIso: string): DataRoomShare {
  const share = getShare(startupId, shareId);
  if (!share) throw new Error(`No Data Room share "${shareId}" for startup "${startupId}"`);
  const updated: DataRoomShare = { ...share, status: "REVOKED", revokedAt: nowIso };
  store.set(
    startupId,
    forStartup(startupId).map((s) => (s.id === shareId ? updated : s)),
  );
  return updated;
}

/** Test-only reset hook. */
export function __resetDataRoomSharesStoreForTests() {
  store.clear();
}
