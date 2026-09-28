/**
 * Opportunity Discovery service boundary — the only place an Opportunity,
 * SavedOpportunity or OpportunityApplication is created, read or mutated.
 *
 * Opportunities themselves are a shared catalog (not startup-scoped — like
 * lib/services/experts.ts's expert directory), while saved opportunities and
 * applications are Map<startupId, ...>-scoped and MUST stay isolated (see
 * opportunities-isolation.test.ts).
 *
 * Every seeded opportunity is FICTIONAL demo content (isDemo:true, source
 * "DEMO") — never a real external program. Application tracking is
 * founder-entered only; nothing here claims to know a real external status.
 *
 * Nothing here ever calls a Readiness/Pitch-Readiness/Digital-Twin
 * mutating function (see opportunities-metric-separation.test.ts).
 */
import { randomUUID } from "crypto";
import type { Opportunity, OpportunityApplication, OpportunityApplicationStatus, SavedOpportunity } from "@/types/opportunity";
import type { Task } from "@/types/roadmap";
import * as taskService from "@/lib/services/tasks";

const opportunitiesStore = new Map<string, Opportunity>();
const savedStore = new Map<string, SavedOpportunity[]>();
const applicationsStore = new Map<string, OpportunityApplication[]>();

function savedFor(startupId: string): SavedOpportunity[] {
  return savedStore.get(startupId) ?? [];
}
function saveSaved(startupId: string, items: SavedOpportunity[]) {
  savedStore.set(startupId, items);
}
function applicationsFor(startupId: string): OpportunityApplication[] {
  return applicationsStore.get(startupId) ?? [];
}
function saveApplications(startupId: string, items: OpportunityApplication[]) {
  applicationsStore.set(startupId, items);
}

export function listOpportunities(): Opportunity[] {
  return Array.from(opportunitiesStore.values());
}

export function getOpportunity(id: string): Opportunity | undefined {
  return opportunitiesStore.get(id);
}

export function createOpportunity(input: Omit<Opportunity, "id" | "createdAt" | "updatedAt">, nowIso: string): Opportunity {
  const opportunity: Opportunity = { ...input, id: randomUUID(), createdAt: nowIso, updatedAt: nowIso };
  opportunitiesStore.set(opportunity.id, opportunity);
  return opportunity;
}

// ---------------------------------------------------------------------------
// Saving — startup-specific, never shared across startups.
// ---------------------------------------------------------------------------

export function listSaved(startupId: string): SavedOpportunity[] {
  return savedFor(startupId);
}

export function isSaved(startupId: string, opportunityId: string): boolean {
  return savedFor(startupId).some((s) => s.opportunityId === opportunityId);
}

export function saveOpportunity(startupId: string, opportunityId: string, nowIso: string): SavedOpportunity {
  if (!getOpportunity(opportunityId)) throw new Error(`No opportunity "${opportunityId}" found`);
  const existing = savedFor(startupId).find((s) => s.opportunityId === opportunityId);
  if (existing) return existing;
  const saved: SavedOpportunity = { startupId, opportunityId, savedAt: nowIso };
  saveSaved(startupId, [...savedFor(startupId), saved]);
  return saved;
}

export function unsaveOpportunity(startupId: string, opportunityId: string): void {
  saveSaved(startupId, savedFor(startupId).filter((s) => s.opportunityId !== opportunityId));
}

// ---------------------------------------------------------------------------
// Application tracking — founder self-reported only.
// ---------------------------------------------------------------------------

const VALID_APPLICATION_TRANSITIONS: Record<OpportunityApplicationStatus, OpportunityApplicationStatus[]> = {
  INTERESTED: ["PREPARING", "APPLIED", "WITHDRAWN"],
  PREPARING: ["APPLIED", "WITHDRAWN"],
  APPLIED: ["SHORTLISTED", "REJECTED", "WITHDRAWN"],
  SHORTLISTED: ["ACCEPTED", "REJECTED", "WITHDRAWN"],
  ACCEPTED: ["WITHDRAWN"],
  REJECTED: [],
  WITHDRAWN: [],
};

function assertValidTransition(from: OpportunityApplicationStatus, to: OpportunityApplicationStatus) {
  if (from === to) return;
  if (!VALID_APPLICATION_TRANSITIONS[from].includes(to)) {
    throw new Error(`Cannot transition application from "${from}" to "${to}"`);
  }
}

export function listApplications(startupId: string): OpportunityApplication[] {
  return applicationsFor(startupId);
}

export function getApplication(startupId: string, applicationId: string): OpportunityApplication | undefined {
  return applicationsFor(startupId).find((a) => a.id === applicationId);
}

export function getApplicationForOpportunity(startupId: string, opportunityId: string): OpportunityApplication | undefined {
  return applicationsFor(startupId).find((a) => a.opportunityId === opportunityId);
}

/**
 * Creates (INTERESTED) or updates the ONE application per
 * startup+opportunity pair — never creates a duplicate application row for
 * the same opportunity.
 */
export function upsertApplication(
  startupId: string,
  opportunityId: string,
  input: { status: OpportunityApplicationStatus; appliedAt?: string; deadline?: string; notes?: string; nextStep?: string },
  nowIso: string,
): OpportunityApplication {
  if (!getOpportunity(opportunityId)) throw new Error(`No opportunity "${opportunityId}" found`);
  const existing = getApplicationForOpportunity(startupId, opportunityId);

  if (!existing) {
    const application: OpportunityApplication = {
      id: randomUUID(),
      startupId,
      opportunityId,
      status: input.status,
      appliedAt: input.appliedAt,
      deadline: input.deadline,
      notes: input.notes,
      nextStep: input.nextStep,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    saveApplications(startupId, [...applicationsFor(startupId), application]);
    return application;
  }

  assertValidTransition(existing.status, input.status);
  const updated: OpportunityApplication = {
    ...existing,
    status: input.status,
    appliedAt: input.appliedAt ?? existing.appliedAt,
    deadline: input.deadline ?? existing.deadline,
    notes: input.notes ?? existing.notes,
    nextStep: input.nextStep ?? existing.nextStep,
    updatedAt: nowIso,
  };
  saveApplications(startupId, applicationsFor(startupId).map((a) => (a.id === existing.id ? updated : a)));
  return updated;
}

/**
 * Creates a preparation Task from an application. Throws if a task was
 * already created from this application (application.taskId already set)
 * — same dedup guard shape as
 * lib/services/mentoring.ts#createTaskFromRecommendation.
 */
export function createPrepTaskForApplication(startupId: string, applicationId: string, nowIso: string): { application: OpportunityApplication; task: Task } {
  const application = getApplication(startupId, applicationId);
  if (!application) throw new Error(`No application "${applicationId}" found for startup "${startupId}"`);
  if (application.taskId) throw new Error(`A preparation task already exists for application "${applicationId}".`);

  const opportunity = getOpportunity(application.opportunityId);
  const task = taskService.createTask(
    startupId,
    {
      title: opportunity ? `Prepare application: ${opportunity.title}` : "Prepare opportunity application",
      description: opportunity?.description.en,
      category: "opportunities",
      sourceType: "OPPORTUNITY_PREPARATION",
      createdBy: "FOUNDER",
      linkedModule: "opportunities",
      dueDate: application.deadline,
    },
    nowIso,
  );
  const taskWithSource = taskService.updateTask(startupId, task.id, { sourceReference: applicationId }, nowIso);

  const updatedApplication: OpportunityApplication = { ...application, taskId: task.id, updatedAt: nowIso };
  saveApplications(startupId, applicationsFor(startupId).map((a) => (a.id === applicationId ? updatedApplication : a)));
  return { application: updatedApplication, task: taskWithSource };
}

/** Test-only reset hook so isolated tests don't leak state across files. */
export function __resetOpportunitiesStoreForTests() {
  opportunitiesStore.clear();
  savedStore.clear();
  applicationsStore.clear();
}

/** Test-only: reset AND reseed the demo catalog (module-load seeding only runs once). */
export function __reseedDemoOpportunitiesForTests() {
  __resetOpportunitiesStoreForTests();
  seedDemoOpportunities();
}

// ---------------------------------------------------------------------------
// Seed: fictional demo programs only, clearly labeled. Never a real
// external accelerator/grant/fund presented as currently open.
// ---------------------------------------------------------------------------

function seedDemoOpportunities() {
  if (opportunitiesStore.size > 0) return;
  const seedIso = new Date().toISOString();

  const demo: Array<Omit<Opportunity, "id" | "createdAt" | "updatedAt">> = [
    {
      title: "Sahel Growth Accelerator (Demo)",
      organization: "Fictional Sahel Ventures",
      description: {
        en: "A fictional 12-week demo accelerator program for early-traction startups across West Africa.",
        fr: "Un programme d'accélération fictif de 12 semaines pour les startups en traction précoce en Afrique de l'Ouest.",
      },
      type: "ACCELERATOR",
      countries: ["Côte d'Ivoire", "Senegal", "Mali"],
      regions: ["West Africa"],
      industries: ["AgriTech", "FinTech"],
      startupStages: ["early_traction", "growth"],
      fundingAmount: { amount: 15000, currency: "USD" },
      equityRequired: true,
      deadline: "2026-11-15",
      applicationUrl: "https://example.org/demo-accelerator",
      languages: ["en", "fr"],
      remoteAllowed: false,
      requirements: [{ key: "incorporated", labelKey: "dashboard.opportunities.requirements.incorporated" }],
      status: "OPEN",
      source: "DEMO",
      isDemo: true,
    },
    {
      title: "Pan-African Impact Grant (Demo)",
      organization: "Fictional Impact Foundation",
      description: {
        en: "A fictional non-dilutive grant demo for impact-driven startups addressing climate or health challenges.",
        fr: "Une subvention fictive non dilutive pour les startups à impact traitant des enjeux climatiques ou de santé.",
      },
      type: "GRANT",
      countries: [],
      regions: ["Africa"],
      industries: ["CleanTech", "HealthTech"],
      startupStages: ["mvp", "early_traction"],
      fundingAmount: { amount: 25000, currency: "USD" },
      equityRequired: false,
      deadline: "2026-12-01",
      applicationUrl: "https://example.org/demo-grant",
      languages: ["en", "fr"],
      remoteAllowed: true,
      requirements: [],
      status: "OPEN",
      source: "DEMO",
      isDemo: true,
    },
    {
      title: "Founders Pitch Challenge (Demo)",
      organization: "Fictional Founders Guild",
      description: {
        en: "A fictional one-day pitch competition demo with a small cash prize for any-stage founders.",
        fr: "Un concours de pitch fictif d'une journée avec un petit prix en espèces pour les fondateurs à tout stade.",
      },
      type: "COMPETITION",
      countries: [],
      regions: [],
      industries: [],
      startupStages: [],
      fundingAmount: { amount: 5000, currency: "USD" },
      equityRequired: false,
      deadline: "2026-10-20",
      languages: ["en"],
      remoteAllowed: true,
      requirements: [],
      status: "CLOSING_SOON",
      source: "DEMO",
      isDemo: true,
    },
    {
      title: "SaaS Scale Fellowship (Demo)",
      organization: "Fictional Scale Labs",
      description: {
        en: "A fictional fellowship demo for growth-stage SaaS/subscription companies expanding regionally.",
        fr: "Une bourse fictive pour les entreprises SaaS/abonnement en phase de croissance qui s'étendent régionalement.",
      },
      type: "CORPORATE_PROGRAM",
      countries: ["Kenya", "Nigeria"],
      regions: ["East Africa", "West Africa"],
      industries: ["SaaS", "FinTech"],
      startupStages: ["growth", "scale"],
      equityRequired: false,
      deadline: "2027-01-31",
      languages: ["en"],
      remoteAllowed: true,
      requirements: [{ key: "business_model_saas", labelKey: "dashboard.opportunities.requirements.saasModel" }],
      status: "OPEN",
      source: "DEMO",
      isDemo: true,
    },
    {
      title: "Founders Basics Training (Demo)",
      organization: "Fictional AFF Academy",
      description: {
        en: "A fictional free training-only demo program for idea-stage founders, no funding involved.",
        fr: "Un programme de formation gratuit fictif pour les fondateurs en phase d'idée, sans financement.",
      },
      type: "TRAINING",
      countries: [],
      regions: ["Africa"],
      industries: [],
      startupStages: ["idea", "mvp"],
      equityRequired: false,
      languages: ["en", "fr"],
      remoteAllowed: true,
      requirements: [],
      status: "OPEN",
      source: "DEMO",
      isDemo: true,
    },
    {
      title: "Women Founders Funding Call (Demo)",
      organization: "Fictional EquiFund",
      description: {
        en: "A fictional funding call demo reserved for women-led early-stage startups across any industry.",
        fr: "Un appel à financement fictif réservé aux startups en phase précoce dirigées par des femmes.",
      },
      type: "FUNDING_CALL",
      countries: [],
      regions: ["Africa"],
      industries: [],
      startupStages: ["idea", "mvp", "early_traction"],
      fundingAmount: { amount: 10000, currency: "USD" },
      equityRequired: false,
      deadline: "2026-11-30",
      languages: ["en", "fr"],
      remoteAllowed: true,
      requirements: [],
      status: "OPEN",
      source: "DEMO",
      isDemo: true,
    },
  ];

  for (const item of demo) {
    createOpportunity(item, seedIso);
  }
}
seedDemoOpportunities();
