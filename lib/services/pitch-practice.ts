/**
 * Pitch Practice service boundary (Part 15/16). Same in-memory
 * Map<startupId, ...> pattern as the other pitch services.
 *
 * Founder self-ratings recorded here are explicitly SELF-ASSESSMENT and are
 * never read by lib/pitch/readiness.ts — there is no import from this file
 * into that one, and no function here writes into a PitchVersion's
 * `readiness` field. That structural separation is what keeps a founder's
 * own rating from ever influencing the deterministic Pitch Readiness score.
 */
import { randomUUID } from "crypto";
import type { FounderSelfRatings, PitchPracticeAttempt, PitchPracticeFormat } from "@/types/pitch";
import { getActiveVersion } from "@/lib/services/pitch";

const store = new Map<string, PitchPracticeAttempt[]>();

function attemptsFor(startupId: string): PitchPracticeAttempt[] {
  return store.get(startupId) ?? [];
}

function save(startupId: string, attempts: PitchPracticeAttempt[]) {
  store.set(startupId, attempts);
}

export function listAttempts(startupId: string, pitchVersionId?: string): PitchPracticeAttempt[] {
  const attempts = attemptsFor(startupId);
  return pitchVersionId ? attempts.filter((a) => a.pitchVersionId === pitchVersionId) : attempts;
}

export function startAttempt(
  startupId: string,
  pitchVersionId: string,
  format: PitchPracticeFormat,
  nowIso: string,
): PitchPracticeAttempt {
  const attempt: PitchPracticeAttempt = {
    id: randomUUID(),
    startupId,
    pitchVersionId,
    format,
    startedAt: nowIso,
  };
  save(startupId, [...attemptsFor(startupId), attempt]);
  return attempt;
}

export function completeAttempt(
  startupId: string,
  attemptId: string,
  patch: { actualDurationSeconds?: number; founderRatings?: FounderSelfRatings; notes?: string },
  nowIso: string,
): PitchPracticeAttempt {
  const attempts = attemptsFor(startupId);
  const existing = attempts.find((a) => a.id === attemptId);
  if (!existing) throw new Error(`No practice attempt "${attemptId}" found for startup "${startupId}"`);
  const updated: PitchPracticeAttempt = { ...existing, ...patch, completedAt: nowIso };
  save(
    startupId,
    attempts.map((a) => (a.id === attemptId ? updated : a)),
  );
  return updated;
}

/** Test-only reset hook so isolated tests don't leak state across files. */
export function __resetPitchPracticeStoreForTests() {
  store.clear();
}

// ---------------------------------------------------------------------------
// Seed: startup-wakama gets a couple of completed practice attempts on its
// active version (Part 30 — "several practice attempts"). startup-solari
// intentionally gets none, since it has no practice history yet.
// ---------------------------------------------------------------------------
function seedDemoPracticeData() {
  if (store.has("startup-wakama")) return;
  const version = getActiveVersion("startup-wakama");
  if (!version) return;

  const start1 = new Date(Date.now() - 5 * 86400000).toISOString();
  const end1 = new Date(Date.now() - 5 * 86400000 + 3 * 60 * 1000).toISOString();
  const a1 = startAttempt("startup-wakama", version.id, "3min", start1);
  completeAttempt(
    "startup-wakama",
    a1.id,
    { actualDurationSeconds: 190, founderRatings: { clarity: 3, confidence: 3, timing: 2, storytelling: 3 }, notes: "Ran long on traction." },
    end1,
  );

  const start2 = new Date(Date.now() - 2 * 86400000).toISOString();
  const end2 = new Date(Date.now() - 2 * 86400000 + 3 * 60 * 1000).toISOString();
  const a2 = startAttempt("startup-wakama", version.id, "3min", start2);
  completeAttempt(
    "startup-wakama",
    a2.id,
    { actualDurationSeconds: 178, founderRatings: { clarity: 4, confidence: 4, timing: 4, storytelling: 3 }, notes: "Better pacing this time." },
    end2,
  );
}
seedDemoPracticeData();
