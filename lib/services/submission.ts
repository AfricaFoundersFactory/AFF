import type {
  ApplyToPitchFormData,
  JoinCommunityFormData,
  SubmissionResult,
} from "@/types/forms";

/**
 * Mock submission boundary for the V1 prototype.
 *
 * No backend exists yet. These functions simulate network latency and
 * always resolve successfully, but are isolated behind this module so
 * Phase 2 can swap in a real API call (fetch to a route handler / external
 * service) without touching any form component.
 */

const MOCK_LATENCY_MS = 650;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function submitCommunityApplication(
  data: JoinCommunityFormData,
): Promise<SubmissionResult> {
  await wait(MOCK_LATENCY_MS);

  if (process.env.NODE_ENV !== "production") {
    console.info("[mock] community application submitted", data);
  }

  return { ok: true };
}

export async function submitPitchApplication(
  data: ApplyToPitchFormData,
): Promise<SubmissionResult> {
  await wait(MOCK_LATENCY_MS);

  if (process.env.NODE_ENV !== "production") {
    console.info("[mock] pitch application submitted", data);
  }

  return { ok: true };
}
