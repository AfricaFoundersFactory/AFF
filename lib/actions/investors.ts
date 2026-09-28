"use server";

/**
 * Server Action boundary for the Investor Network + Fundraising Pipeline
 * module — the only way client components mutate shortlist/pipeline/
 * interaction/introduction/Data-Room-share state. Delegates entirely to the
 * lib/services/* investor services and revalidates the dashboard routes on
 * success, exactly like lib/actions/community.ts.
 */
import { revalidatePath } from "next/cache";
import * as investorsService from "@/lib/services/investors";
import * as shortlistService from "@/lib/services/investor-shortlist";
import * as pipelineService from "@/lib/services/fundraising-pipeline";
import * as interactionsService from "@/lib/services/investor-interactions";
import * as introductionsService from "@/lib/services/introduction-requests";
import * as sharesService from "@/lib/services/data-room-shares";
import { isNonEmpty, isValidCurrencyAmount } from "@/lib/validation";
import type {
  DataRoomShare,
  FundraisingPipelineEntry,
  FundraisingRound,
  FundraisingRoundStatus,
  IntroductionRequest,
  IntroductionStatus,
  InteractionType,
  InvestorFilters,
  InvestorInteraction,
  InvestorRecord,
  InvestorShortlistEntry,
  PipelineStage,
  ShortlistPriority,
} from "@/types/investors";

function nowIso(): string {
  return new Date().toISOString();
}

function revalidateDashboard() {
  revalidatePath("/[locale]/dashboard", "layout");
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function guard<T>(fn: () => T): Result<T> {
  try {
    const data = fn();
    revalidateDashboard();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ---------------------------------------------------------------------------
// Investor directory search — read-only, no revalidation needed. Delegates
// entirely to searchInvestors() so filter logic lives in exactly one place.
// ---------------------------------------------------------------------------

export async function searchInvestorsAction(filters: InvestorFilters): Promise<Result<InvestorRecord[]>> {
  try {
    return { ok: true, data: investorsService.searchInvestors(filters) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ---------------------------------------------------------------------------
// Shortlist
// ---------------------------------------------------------------------------

export async function addToShortlistAction(startupId: string, investorId: string, priority?: ShortlistPriority): Promise<Result<InvestorShortlistEntry>> {
  return guard(() => shortlistService.addToShortlist(startupId, investorId, { priority }, nowIso()));
}

export async function removeFromShortlistAction(startupId: string, investorId: string): Promise<Result<null>> {
  return guard(() => {
    shortlistService.removeFromShortlist(startupId, investorId);
    return null;
  });
}

export async function updateShortlistEntryAction(
  startupId: string,
  investorId: string,
  patch: { priority?: ShortlistPriority; note?: string; nextAction?: string; nextActionAt?: string },
): Promise<Result<InvestorShortlistEntry>> {
  return guard(() => shortlistService.updateShortlistEntry(startupId, investorId, patch, nowIso()));
}

// ---------------------------------------------------------------------------
// Fundraising rounds + pipeline
// ---------------------------------------------------------------------------

export async function createRoundAction(
  startupId: string,
  input: { name: string; targetAmount: { amount: number; currency: string }; instrument?: FundraisingRound["instrument"]; targetCloseDate?: string; notes?: string },
): Promise<Result<FundraisingRound>> {
  if (!isNonEmpty(input.name)) return { ok: false, error: "validation" };
  if (!isValidCurrencyAmount(input.targetAmount.amount) || !isNonEmpty(input.targetAmount.currency)) return { ok: false, error: "validation" };
  return guard(() => pipelineService.createRound(startupId, input, nowIso()));
}

export async function updateRoundStatusAction(startupId: string, roundId: string, status: FundraisingRoundStatus): Promise<Result<FundraisingRound>> {
  return guard(() => pipelineService.updateRoundStatus(startupId, roundId, status, nowIso()));
}

export async function updateRoundAction(
  startupId: string,
  roundId: string,
  patch: { name?: string; targetAmount?: { amount: number; currency: string }; instrument?: FundraisingRound["instrument"]; targetCloseDate?: string; notes?: string },
): Promise<Result<FundraisingRound>> {
  if (patch.name !== undefined && !isNonEmpty(patch.name)) return { ok: false, error: "validation" };
  if (patch.targetAmount !== undefined && !isValidCurrencyAmount(patch.targetAmount.amount)) return { ok: false, error: "validation" };
  return guard(() => pipelineService.updateRound(startupId, roundId, patch, nowIso()));
}

export async function createPipelineEntryAction(
  startupId: string,
  input: { investorId: string; fundraisingRoundId?: string; ownerFounderId: string; note?: string },
): Promise<Result<FundraisingPipelineEntry>> {
  return guard(() => pipelineService.createPipelineEntry(startupId, input, nowIso()));
}

export async function moveStageAction(startupId: string, entryId: string, stage: PipelineStage): Promise<Result<FundraisingPipelineEntry>> {
  return guard(() => pipelineService.moveStage(startupId, entryId, stage, nowIso()));
}

export async function updatePipelineEntryAction(
  startupId: string,
  entryId: string,
  patch: { note?: string; nextAction?: string; nextActionAt?: string },
): Promise<Result<FundraisingPipelineEntry>> {
  return guard(() => pipelineService.updatePipelineEntry(startupId, entryId, patch, nowIso()));
}

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

export async function recordInteractionAction(
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
): Promise<Result<InvestorInteraction>> {
  if (!isNonEmpty(input.summary)) return { ok: false, error: "validation" };
  return guard(() => interactionsService.recordInteraction(startupId, input, nowIso()));
}

// ---------------------------------------------------------------------------
// Introduction requests
// ---------------------------------------------------------------------------

export async function createIntroductionRequestAction(
  startupId: string,
  input: { investorId: string; fundraisingRoundId?: string; reason?: string; context?: string; createdBy: string },
): Promise<Result<IntroductionRequest>> {
  return guard(() => introductionsService.createIntroductionRequest(startupId, input, nowIso()));
}

/** Prepares a DRAFT only — AFF has not received anything yet. See §5 of
 * AFF-DASH-10R: DRAFT must never be presented as submitted. */
export async function createIntroductionDraftAction(
  startupId: string,
  input: { investorId: string; fundraisingRoundId?: string; reason?: string; context?: string; createdBy: string },
): Promise<Result<IntroductionRequest>> {
  return guard(() => introductionsService.createIntroductionDraft(startupId, input, nowIso()));
}

export async function updateIntroductionDraftAction(
  startupId: string,
  requestId: string,
  patch: { reason?: string; context?: string },
): Promise<Result<IntroductionRequest>> {
  return guard(() => introductionsService.updateIntroductionDraft(startupId, requestId, patch, nowIso()));
}

/** The explicit, deliberate action that actually submits a DRAFT request to
 * AFF — this is the ONLY thing that transitions DRAFT → REQUESTED. */
export async function submitIntroductionRequestAction(startupId: string, requestId: string): Promise<Result<IntroductionRequest>> {
  return guard(() => introductionsService.transitionStatus(startupId, requestId, "REQUESTED", nowIso()));
}

export async function transitionIntroductionStatusAction(
  startupId: string,
  requestId: string,
  status: IntroductionStatus,
): Promise<Result<IntroductionRequest>> {
  return guard(() => introductionsService.transitionStatus(startupId, requestId, status, nowIso()));
}

export async function cancelIntroductionRequestAction(startupId: string, requestId: string): Promise<Result<IntroductionRequest>> {
  return guard(() => introductionsService.cancelIntroductionRequest(startupId, requestId, nowIso()));
}

// ---------------------------------------------------------------------------
// Data Room shares
// ---------------------------------------------------------------------------

export async function createDataRoomShareAction(
  startupId: string,
  input: { investorId: string; pipelineEntryId?: string; documentIds: string[] },
): Promise<Result<DataRoomShare>> {
  if (input.documentIds.length === 0) return { ok: false, error: "validation" };
  return guard(() => sharesService.createShare(startupId, input, nowIso()));
}

export async function revokeDataRoomShareAction(startupId: string, shareId: string): Promise<Result<DataRoomShare>> {
  return guard(() => sharesService.revokeShare(startupId, shareId, nowIso()));
}
