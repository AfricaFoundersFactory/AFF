"use server";

/**
 * Server Action boundary for the Digital Twin — the only way client
 * components mutate Digital Twin data. Every action validates its payload,
 * delegates to lib/services/digital-twin.ts (the actual persistence
 * boundary), then revalidates the dashboard routes so the change is visible
 * immediately, including on the page that triggered it via router.refresh().
 */
import { revalidatePath } from "next/cache";
import * as twinService from "@/lib/services/digital-twin";
import type {
  Founder,
  StartupBusinessModel,
  StartupFinancials,
  StartupFunding,
  StartupGoal,
  StartupIdentity,
  StartupImpact,
  StartupMarket,
  StartupMilestone,
  StartupProblem,
  StartupProduct,
  StartupRisk,
  StartupTraction,
  TeamMember,
  TractionMetric,
  StartupDigitalTwin,
} from "@/types/digital-twin";
import { isNonEmpty } from "@/lib/validation";

export type ActionResult = { ok: true } | { ok: false; error: string };

function revalidateDashboard() {
  revalidatePath("/[locale]/dashboard", "layout");
}

function guard(fn: () => void): ActionResult {
  try {
    fn();
    revalidateDashboard();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ---------------------------------------------------------------------------
// Section patches
// ---------------------------------------------------------------------------

export async function updateIdentityAction(startupId: string, patch: Partial<StartupIdentity>): Promise<ActionResult> {
  if (patch.name !== undefined && !isNonEmpty(patch.name)) return { ok: false, error: "validation" };
  return guard(() => twinService.updateIdentity(startupId, patch));
}

export async function updateProblemAction(startupId: string, patch: Partial<StartupProblem>): Promise<ActionResult> {
  return guard(() => twinService.updateProblem(startupId, patch));
}

export async function updateProductAction(startupId: string, patch: Partial<StartupProduct>): Promise<ActionResult> {
  return guard(() => twinService.updateProduct(startupId, patch));
}

export async function updateMarketAction(startupId: string, patch: Partial<StartupMarket>): Promise<ActionResult> {
  return guard(() => twinService.updateMarket(startupId, patch));
}

export async function updateBusinessModelAction(
  startupId: string,
  patch: Partial<StartupBusinessModel>,
): Promise<ActionResult> {
  return guard(() => twinService.updateBusinessModel(startupId, patch));
}

export async function updateFinancialsAction(startupId: string, patch: Partial<StartupFinancials>): Promise<ActionResult> {
  return guard(() => twinService.updateFinancials(startupId, patch));
}

export async function updateFundingAction(startupId: string, patch: Partial<StartupFunding>): Promise<ActionResult> {
  return guard(() => twinService.updateFunding(startupId, patch));
}

export async function updateImpactAction(startupId: string, patch: Partial<StartupImpact>): Promise<ActionResult> {
  return guard(() => twinService.updateImpact(startupId, patch));
}

// ---------------------------------------------------------------------------
// Founders & team
// ---------------------------------------------------------------------------

export async function addFounderAction(startupId: string, founder: Omit<Founder, "id">): Promise<ActionResult> {
  if (!isNonEmpty(founder.firstName) || !isNonEmpty(founder.lastName)) return { ok: false, error: "validation" };
  return guard(() => twinService.addFounder(startupId, founder));
}

export async function updateFounderAction(
  startupId: string,
  founderId: string,
  patch: Partial<Founder>,
): Promise<ActionResult> {
  return guard(() => twinService.updateFounder(startupId, founderId, patch));
}

export async function removeFounderAction(startupId: string, founderId: string): Promise<ActionResult> {
  return guard(() => twinService.removeFounder(startupId, founderId));
}

export async function addTeamMemberAction(startupId: string, member: Omit<TeamMember, "id">): Promise<ActionResult> {
  if (!isNonEmpty(member.name) || !isNonEmpty(member.role)) return { ok: false, error: "validation" };
  return guard(() => twinService.addTeamMember(startupId, member));
}

export async function updateTeamMemberAction(
  startupId: string,
  memberId: string,
  patch: Partial<TeamMember>,
): Promise<ActionResult> {
  return guard(() => twinService.updateTeamMember(startupId, memberId, patch));
}

export async function removeTeamMemberAction(startupId: string, memberId: string): Promise<ActionResult> {
  return guard(() => twinService.removeTeamMember(startupId, memberId));
}

// ---------------------------------------------------------------------------
// Traction (narrative) & metrics
// ---------------------------------------------------------------------------

export async function updateTractionAction(
  startupId: string,
  patch: Partial<Omit<StartupTraction, "metrics">>,
): Promise<ActionResult> {
  return guard(() => twinService.updateTraction(startupId, patch));
}

export async function addTractionMetricAction(
  startupId: string,
  metric: Omit<TractionMetric, "id">,
): Promise<ActionResult> {
  if (!isNonEmpty(metric.label) || !Number.isFinite(metric.value)) return { ok: false, error: "validation" };
  return guard(() => twinService.addTractionMetric(startupId, metric));
}

export async function updateTractionMetricAction(
  startupId: string,
  metricId: string,
  patch: Partial<TractionMetric>,
): Promise<ActionResult> {
  return guard(() => twinService.updateTractionMetric(startupId, metricId, patch));
}

export async function removeTractionMetricAction(startupId: string, metricId: string): Promise<ActionResult> {
  return guard(() => twinService.removeTractionMetric(startupId, metricId));
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export async function addGoalAction(startupId: string, goal: Omit<StartupGoal, "id">): Promise<ActionResult> {
  if (!isNonEmpty(goal.title)) return { ok: false, error: "validation" };
  return guard(() => twinService.addGoal(startupId, goal));
}

export async function updateGoalAction(
  startupId: string,
  goalId: string,
  patch: Partial<StartupGoal>,
): Promise<ActionResult> {
  return guard(() => twinService.updateGoal(startupId, goalId, patch));
}

export async function removeGoalAction(startupId: string, goalId: string): Promise<ActionResult> {
  return guard(() => twinService.removeGoal(startupId, goalId));
}

// ---------------------------------------------------------------------------
// Risks
// ---------------------------------------------------------------------------

export async function addRiskAction(startupId: string, risk: Omit<StartupRisk, "id">): Promise<ActionResult> {
  if (!isNonEmpty(risk.title)) return { ok: false, error: "validation" };
  return guard(() => twinService.addRisk(startupId, risk));
}

export async function updateRiskAction(
  startupId: string,
  riskId: string,
  patch: Partial<StartupRisk>,
): Promise<ActionResult> {
  return guard(() => twinService.updateRisk(startupId, riskId, patch));
}

export async function removeRiskAction(startupId: string, riskId: string): Promise<ActionResult> {
  return guard(() => twinService.removeRisk(startupId, riskId));
}

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------

export async function addMilestoneAction(
  startupId: string,
  milestone: Omit<StartupMilestone, "id">,
): Promise<ActionResult> {
  if (!isNonEmpty(milestone.title) || !isNonEmpty(milestone.date)) return { ok: false, error: "validation" };
  return guard(() => twinService.addMilestone(startupId, milestone));
}

export async function updateMilestoneAction(
  startupId: string,
  milestoneId: string,
  patch: Partial<StartupMilestone>,
): Promise<ActionResult> {
  return guard(() => twinService.updateMilestone(startupId, milestoneId, patch));
}

export async function removeMilestoneAction(startupId: string, milestoneId: string): Promise<ActionResult> {
  return guard(() => twinService.removeMilestone(startupId, milestoneId));
}

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------

export async function saveOnboardingDraftAction(
  startupId: string,
  twin: StartupDigitalTwin,
  currentStep: number,
): Promise<ActionResult> {
  return guard(() => twinService.saveOnboardingProgress(startupId, twin, currentStep));
}

export async function completeOnboardingAction(startupId: string, twin: StartupDigitalTwin): Promise<ActionResult> {
  if (!isNonEmpty(twin.identity.name)) return { ok: false, error: "validation" };
  return guard(() => twinService.completeOnboarding(startupId, twin));
}
