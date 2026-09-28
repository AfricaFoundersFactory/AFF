/**
 * Founder-private investor shortlist service (AFF-DASH-10 §15-16). Strictly
 * startup-scoped and never exposed to Community, other startups, or other
 * founders — there is no cross-startup read path in this file at all.
 */
import { randomUUID } from "crypto";
import type { InvestorShortlistEntry, ShortlistPriority } from "@/types/investors";

const store = new Map<string, InvestorShortlistEntry[]>(); // keyed by startupId

function forStartup(startupId: string): InvestorShortlistEntry[] {
  return store.get(startupId) ?? [];
}

export function listShortlist(startupId: string): InvestorShortlistEntry[] {
  return forStartup(startupId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getShortlistEntry(startupId: string, investorId: string): InvestorShortlistEntry | undefined {
  return forStartup(startupId).find((e) => e.investorId === investorId);
}

export function isShortlisted(startupId: string, investorId: string): boolean {
  return getShortlistEntry(startupId, investorId) !== undefined;
}

export function addToShortlist(
  startupId: string,
  investorId: string,
  input: { priority?: ShortlistPriority; note?: string; nextAction?: string; nextActionAt?: string },
  nowIso: string,
): InvestorShortlistEntry {
  const existing = getShortlistEntry(startupId, investorId);
  if (existing) return existing; // duplicate prevention: idempotent add
  const entry: InvestorShortlistEntry = {
    id: randomUUID(),
    startupId,
    investorId,
    priority: input.priority ?? "MEDIUM",
    note: input.note,
    nextAction: input.nextAction,
    nextActionAt: input.nextActionAt,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  store.set(startupId, [...forStartup(startupId), entry]);
  return entry;
}

export function updateShortlistEntry(
  startupId: string,
  investorId: string,
  patch: { priority?: ShortlistPriority; note?: string; nextAction?: string; nextActionAt?: string },
  nowIso: string,
): InvestorShortlistEntry {
  const existing = getShortlistEntry(startupId, investorId);
  if (!existing) throw new Error(`No shortlist entry for investor "${investorId}" on startup "${startupId}"`);
  const updated: InvestorShortlistEntry = { ...existing, ...patch, updatedAt: nowIso };
  store.set(
    startupId,
    forStartup(startupId).map((e) => (e.investorId === investorId ? updated : e)),
  );
  return updated;
}

export function removeFromShortlist(startupId: string, investorId: string): void {
  store.set(
    startupId,
    forStartup(startupId).filter((e) => e.investorId !== investorId),
  );
}

/** Test-only reset hook. */
export function __resetShortlistStoreForTests() {
  store.clear();
}
