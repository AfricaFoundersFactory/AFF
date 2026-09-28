/**
 * Digital Twin service boundary.
 *
 * Backed by an in-memory store seeded from lib/demo/digital-twin.ts for now
 * — see PERSISTENCE_STATUS in the batch report for exactly what that does
 * and doesn't survive. A future batch replaces the Map below with real
 * database reads/writes; every function signature here is written so that
 * swap never touches a component or Server Action caller.
 *
 * Nothing outside this file (and lib/actions/digital-twin.ts, which only
 * calls these functions) may import lib/demo/digital-twin directly.
 */
import { randomUUID } from "crypto";
import type {
  Founder,
  StartupBusinessModel,
  StartupDigitalTwin,
  StartupFinancials,
  StartupFunding,
  StartupIdentity,
  StartupImpact,
  StartupGoal,
  StartupMarket,
  StartupMilestone,
  StartupProblem,
  StartupProduct,
  StartupRisk,
  StartupTraction,
  TeamMember,
  TractionMetric,
} from "@/types/digital-twin";
import { demoDigitalTwins } from "@/lib/demo/digital-twin";

const store = new Map<string, StartupDigitalTwin>(
  Object.entries(demoDigitalTwins).map(([id, twin]) => [id, structuredClone(twin)]),
);

function require_(startupId: string): StartupDigitalTwin {
  const twin = store.get(startupId);
  if (!twin) throw new Error(`No Digital Twin found for startup "${startupId}"`);
  return twin;
}

function save(startupId: string, twin: StartupDigitalTwin): StartupDigitalTwin {
  store.set(startupId, twin);
  return twin;
}

export function listStartupIds(): string[] {
  return Array.from(store.keys());
}

export function getDigitalTwin(startupId: string): StartupDigitalTwin | undefined {
  return store.get(startupId);
}

export function replaceDigitalTwin(startupId: string, twin: StartupDigitalTwin): StartupDigitalTwin {
  return save(startupId, twin);
}

// ---------------------------------------------------------------------------
// Section patches (identity, problem, product, market, business, financials,
// funding, impact) — each merges a partial patch into the existing section.
// ---------------------------------------------------------------------------

export function updateIdentity(startupId: string, patch: Partial<StartupIdentity>): StartupDigitalTwin {
  const twin = require_(startupId);
  return save(startupId, { ...twin, identity: { ...twin.identity, ...patch } });
}

export function updateProblem(startupId: string, patch: Partial<StartupProblem>): StartupDigitalTwin {
  const twin = require_(startupId);
  return save(startupId, { ...twin, problem: { ...twin.problem, ...patch } });
}

export function updateProduct(startupId: string, patch: Partial<StartupProduct>): StartupDigitalTwin {
  const twin = require_(startupId);
  return save(startupId, { ...twin, product: { ...twin.product, ...patch } });
}

export function updateMarket(startupId: string, patch: Partial<StartupMarket>): StartupDigitalTwin {
  const twin = require_(startupId);
  return save(startupId, { ...twin, market: { ...twin.market, ...patch } });
}

export function updateBusinessModel(startupId: string, patch: Partial<StartupBusinessModel>): StartupDigitalTwin {
  const twin = require_(startupId);
  return save(startupId, { ...twin, businessModel: { ...twin.businessModel, ...patch } });
}

export function updateFinancials(startupId: string, patch: Partial<StartupFinancials>): StartupDigitalTwin {
  const twin = require_(startupId);
  return save(startupId, { ...twin, financials: { ...twin.financials, ...patch } });
}

export function updateFunding(startupId: string, patch: Partial<StartupFunding>): StartupDigitalTwin {
  const twin = require_(startupId);
  return save(startupId, { ...twin, funding: { ...twin.funding, ...patch } });
}

export function updateImpact(startupId: string, patch: Partial<StartupImpact>): StartupDigitalTwin {
  const twin = require_(startupId);
  return save(startupId, { ...twin, impact: { ...twin.impact, ...patch } });
}

// ---------------------------------------------------------------------------
// Founders
// ---------------------------------------------------------------------------

export function addFounder(startupId: string, founder: Omit<Founder, "id">): StartupDigitalTwin {
  const twin = require_(startupId);
  const next: Founder = { ...founder, id: randomUUID() };
  return save(startupId, { ...twin, founders: [...twin.founders, next] });
}

export function updateFounder(startupId: string, founderId: string, patch: Partial<Founder>): StartupDigitalTwin {
  const twin = require_(startupId);
  return save(startupId, {
    ...twin,
    founders: twin.founders.map((f) => (f.id === founderId ? { ...f, ...patch } : f)),
  });
}

export function removeFounder(startupId: string, founderId: string): StartupDigitalTwin {
  const twin = require_(startupId);
  return save(startupId, { ...twin, founders: twin.founders.filter((f) => f.id !== founderId) });
}

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

export function addTeamMember(startupId: string, member: Omit<TeamMember, "id">): StartupDigitalTwin {
  const twin = require_(startupId);
  const next: TeamMember = { ...member, id: randomUUID() };
  return save(startupId, { ...twin, team: [...twin.team, next] });
}

export function updateTeamMember(startupId: string, memberId: string, patch: Partial<TeamMember>): StartupDigitalTwin {
  const twin = require_(startupId);
  return save(startupId, {
    ...twin,
    team: twin.team.map((m) => (m.id === memberId ? { ...m, ...patch } : m)),
  });
}

export function removeTeamMember(startupId: string, memberId: string): StartupDigitalTwin {
  const twin = require_(startupId);
  return save(startupId, { ...twin, team: twin.team.filter((m) => m.id !== memberId) });
}

// ---------------------------------------------------------------------------
// Traction (narrative fields; metrics handled separately below)
// ---------------------------------------------------------------------------

export function updateTraction(
  startupId: string,
  patch: Partial<Omit<StartupTraction, "metrics">>,
): StartupDigitalTwin {
  const twin = require_(startupId);
  return save(startupId, { ...twin, traction: { ...twin.traction, ...patch } });
}

// ---------------------------------------------------------------------------
// Traction metrics
// ---------------------------------------------------------------------------

export function addTractionMetric(startupId: string, metric: Omit<TractionMetric, "id">): StartupDigitalTwin {
  const twin = require_(startupId);
  const next: TractionMetric = { ...metric, id: randomUUID() };
  return save(startupId, { ...twin, traction: { ...twin.traction, metrics: [...twin.traction.metrics, next] } });
}

export function updateTractionMetric(
  startupId: string,
  metricId: string,
  patch: Partial<TractionMetric>,
): StartupDigitalTwin {
  const twin = require_(startupId);
  return save(startupId, {
    ...twin,
    traction: {
      ...twin.traction,
      metrics: twin.traction.metrics.map((m) => (m.id === metricId ? { ...m, ...patch } : m)),
    },
  });
}

export function removeTractionMetric(startupId: string, metricId: string): StartupDigitalTwin {
  const twin = require_(startupId);
  return save(startupId, {
    ...twin,
    traction: { ...twin.traction, metrics: twin.traction.metrics.filter((m) => m.id !== metricId) },
  });
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export function addGoal(startupId: string, goal: Omit<StartupGoal, "id">): StartupDigitalTwin {
  const twin = require_(startupId);
  const next: StartupGoal = { ...goal, id: randomUUID() };
  return save(startupId, { ...twin, goals: [...twin.goals, next] });
}

export function updateGoal(startupId: string, goalId: string, patch: Partial<StartupGoal>): StartupDigitalTwin {
  const twin = require_(startupId);
  return save(startupId, { ...twin, goals: twin.goals.map((g) => (g.id === goalId ? { ...g, ...patch } : g)) });
}

export function removeGoal(startupId: string, goalId: string): StartupDigitalTwin {
  const twin = require_(startupId);
  return save(startupId, { ...twin, goals: twin.goals.filter((g) => g.id !== goalId) });
}

// ---------------------------------------------------------------------------
// Risks
// ---------------------------------------------------------------------------

export function addRisk(startupId: string, risk: Omit<StartupRisk, "id">): StartupDigitalTwin {
  const twin = require_(startupId);
  const next: StartupRisk = { ...risk, id: randomUUID() };
  return save(startupId, { ...twin, risks: [...twin.risks, next] });
}

export function updateRisk(startupId: string, riskId: string, patch: Partial<StartupRisk>): StartupDigitalTwin {
  const twin = require_(startupId);
  return save(startupId, { ...twin, risks: twin.risks.map((r) => (r.id === riskId ? { ...r, ...patch } : r)) });
}

export function removeRisk(startupId: string, riskId: string): StartupDigitalTwin {
  const twin = require_(startupId);
  return save(startupId, { ...twin, risks: twin.risks.filter((r) => r.id !== riskId) });
}

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------

export function addMilestone(startupId: string, milestone: Omit<StartupMilestone, "id">): StartupDigitalTwin {
  const twin = require_(startupId);
  const next: StartupMilestone = { ...milestone, id: randomUUID() };
  return save(startupId, { ...twin, milestones: [...twin.milestones, next] });
}

export function updateMilestone(
  startupId: string,
  milestoneId: string,
  patch: Partial<StartupMilestone>,
): StartupDigitalTwin {
  const twin = require_(startupId);
  return save(startupId, {
    ...twin,
    milestones: twin.milestones.map((m) => (m.id === milestoneId ? { ...m, ...patch } : m)),
  });
}

export function removeMilestone(startupId: string, milestoneId: string): StartupDigitalTwin {
  const twin = require_(startupId);
  return save(startupId, { ...twin, milestones: twin.milestones.filter((m) => m.id !== milestoneId) });
}

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------

export function saveOnboardingProgress(
  startupId: string,
  twin: StartupDigitalTwin,
  currentStep: number,
): StartupDigitalTwin {
  return save(startupId, { ...twin, onboarding: { completed: false, currentStep } });
}

export function completeOnboarding(startupId: string, twin: StartupDigitalTwin): StartupDigitalTwin {
  return save(startupId, { ...twin, onboarding: { completed: true, currentStep: 12 } });
}
