/**
 * Pitch Workspace/Version service boundary — the only place a
 * PitchWorkspace or PitchVersion is created, read or mutated. Same
 * in-memory Map<startupId, ...> pattern as lib/services/roadmap.ts and
 * lib/services/digital-twin.ts.
 *
 * Nothing here ever calls into lib/services/digital-twin.ts's write
 * functions — prefill/refresh only READ the twin (see lib/pitch/prefill.ts)
 * and copy a snapshot into the pitch version. Editing a pitch section can
 * never mutate the Digital Twin. Nothing here calls into
 * lib/services/readiness.ts's score-mutating functions either — Pitch
 * Readiness is a wholly separate score (lib/pitch/readiness.ts) that never
 * touches AFF Readiness.
 */
import { randomUUID } from "crypto";
import type { StartupDigitalTwin } from "@/types/digital-twin";
import type {
  FundraisingContext,
  PitchAudience,
  PitchObjective,
  PitchSection,
  PitchType,
  PitchVersion,
  PitchWorkspace,
} from "@/types/pitch";
import { buildInitialSections, detectSourceUpdates, prefillSection } from "@/lib/pitch/prefill";
import { computePitchReadiness } from "@/lib/pitch/readiness";
import { getDigitalTwin } from "@/lib/services/digital-twin";

const store = new Map<string, PitchWorkspace>();

function requireWorkspace(startupId: string): PitchWorkspace {
  const workspace = store.get(startupId);
  if (!workspace) throw new Error(`No Pitch Workspace found for startup "${startupId}"`);
  return workspace;
}

function requireVersion(workspace: PitchWorkspace, versionId: string): PitchVersion {
  const version = workspace.versions.find((v) => v.id === versionId);
  if (!version) throw new Error(`No pitch version "${versionId}" found in workspace "${workspace.id}"`);
  return version;
}

function requireEditableVersion(version: PitchVersion): void {
  if (version.status === "final" || version.status === "archived") {
    throw new Error(`Pitch version "${version.id}" is ${version.status} and cannot be edited.`);
  }
}

function save(startupId: string, workspace: PitchWorkspace): PitchWorkspace {
  store.set(startupId, workspace);
  return workspace;
}

function saveVersion(startupId: string, workspace: PitchWorkspace, version: PitchVersion): PitchWorkspace {
  const versions = workspace.versions.map((v) => (v.id === version.id ? version : v));
  return save(startupId, { ...workspace, versions, updatedAt: version.updatedAt });
}

function withReadiness(version: PitchVersion, twin: StartupDigitalTwin | undefined, nowIso: string): PitchVersion {
  if (!twin) return version;
  return { ...version, readiness: computePitchReadiness(version, twin, nowIso) };
}

export function getWorkspace(startupId: string): PitchWorkspace | undefined {
  return store.get(startupId);
}

export function getActiveVersion(startupId: string): PitchVersion | undefined {
  const workspace = store.get(startupId);
  if (!workspace) return undefined;
  return workspace.versions.find((v) => v.id === workspace.activeVersionId);
}

export function getVersion(startupId: string, versionId: string): PitchVersion | undefined {
  return store.get(startupId)?.versions.find((v) => v.id === versionId);
}

/** Always recomputes fresh from the CURRENT Digital Twin — never trusts a stale cached value for anything determinism-sensitive (e.g. tests). */
export function getPitchReadiness(startupId: string, versionId: string, nowIso: string) {
  const version = getVersion(startupId, versionId);
  const twin = getDigitalTwin(startupId);
  if (!version || !twin) return undefined;
  return computePitchReadiness(version, twin, nowIso);
}

export function createWorkspace(
  startupId: string,
  input: { objective: PitchObjective; audience: PitchAudience; pitchType: PitchType; fundraisingContext?: FundraisingContext },
  nowIso: string,
): PitchWorkspace {
  if (store.has(startupId)) return requireWorkspace(startupId);
  const twin = getDigitalTwin(startupId);
  if (!twin) throw new Error(`No Digital Twin found for startup "${startupId}"`);

  const workspaceId = randomUUID();
  const version: PitchVersion = {
    id: randomUUID(),
    workspaceId,
    startupId,
    version: 1,
    title: "Version 1",
    status: "draft",
    sections: buildInitialSections(twin, input.pitchType, input.objective),
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  const versionWithReadiness = withReadiness(version, twin, nowIso);

  const workspace: PitchWorkspace = {
    id: workspaceId,
    startupId,
    objective: input.objective,
    audience: input.audience,
    pitchType: input.pitchType,
    fundraisingContext: input.fundraisingContext,
    activeVersionId: version.id,
    versions: [versionWithReadiness],
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  return save(startupId, workspace);
}

export function updateSection(
  startupId: string,
  versionId: string,
  sectionId: string,
  patch: Partial<Pick<PitchSection, "content" | "keyPoints" | "status">>,
  nowIso: string,
): PitchVersion {
  const workspace = requireWorkspace(startupId);
  const version = requireVersion(workspace, versionId);
  requireEditableVersion(version);

  const sections = version.sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s));
  const updated = { ...version, sections, updatedAt: nowIso };
  const twin = getDigitalTwin(startupId);
  const withScore = withReadiness(updated, twin, nowIso);
  saveVersion(startupId, workspace, withScore);
  return withScore;
}

export function reorderSections(startupId: string, versionId: string, orderedSectionIds: string[], nowIso: string): PitchVersion {
  const workspace = requireWorkspace(startupId);
  const version = requireVersion(workspace, versionId);
  requireEditableVersion(version);

  const order = new Map(orderedSectionIds.map((id, idx) => [id, idx + 1]));
  const sections = version.sections
    .map((s) => ({ ...s, order: order.get(s.id) ?? s.order }))
    .sort((a, b) => a.order - b.order);
  const updated = { ...version, sections, updatedAt: nowIso };
  saveVersion(startupId, workspace, updated);
  return updated;
}

/** "SOURCE UPDATED" detection (Part 9) — read-only, never auto-applies. */
export function getSectionsWithSourceUpdates(startupId: string, versionId: string): Record<string, string[]> {
  const twin = getDigitalTwin(startupId);
  const version = getVersion(startupId, versionId);
  if (!twin || !version) return {};
  const result: Record<string, string[]> = {};
  for (const s of version.sections) {
    const drifted = detectSourceUpdates(s, twin);
    if (drifted.length > 0) result[s.id] = drifted;
  }
  return result;
}

/** Founder-triggered explicit re-import of ONE section from the current Digital Twin. Never automatic. */
export function refreshSectionFromProfile(startupId: string, versionId: string, sectionId: string, nowIso: string): PitchVersion {
  const workspace = requireWorkspace(startupId);
  const version = requireVersion(workspace, versionId);
  requireEditableVersion(version);
  const twin = getDigitalTwin(startupId);
  if (!twin) throw new Error(`No Digital Twin found for startup "${startupId}"`);

  const target = version.sections.find((s) => s.id === sectionId);
  if (!target) throw new Error(`No section "${sectionId}" found in version "${versionId}"`);
  const fresh = prefillSection(target.type, twin);

  const sections = version.sections.map((s) =>
    s.id === sectionId
      ? { ...s, content: fresh.content, keyPoints: fresh.keyPoints, sourceReferences: fresh.sourceReferences }
      : s,
  );
  const updated = withReadiness({ ...version, sections, updatedAt: nowIso }, twin, nowIso);
  saveVersion(startupId, workspace, updated);
  return updated;
}

/**
 * Creates a new pitch version. When `fromVersionId` is given, DUPLICATES
 * that version's narrative + structure (content, key points, source
 * references) into a brand-new version id — review state is NOT copied
 * (reviews are keyed by pitchVersionId in lib/services/pitch-review.ts, so
 * a new version simply starts with none). Otherwise builds a fresh
 * version prefilled from the current Digital Twin (Part 10).
 */
export function createVersion(startupId: string, nowIso: string, fromVersionId?: string): PitchVersion {
  const workspace = requireWorkspace(startupId);
  const twin = getDigitalTwin(startupId);
  if (!twin) throw new Error(`No Digital Twin found for startup "${startupId}"`);

  const nextNumber = Math.max(0, ...workspace.versions.map((v) => v.version)) + 1;
  let sections: PitchSection[];
  if (fromVersionId) {
    const source = requireVersion(workspace, fromVersionId);
    sections = source.sections.map((s) => ({ ...s, id: randomUUID() }));
  } else {
    sections = buildInitialSections(twin, workspace.pitchType, workspace.objective);
  }

  const version: PitchVersion = {
    id: randomUUID(),
    workspaceId: workspace.id,
    startupId,
    version: nextNumber,
    title: `Version ${nextNumber}`,
    status: "draft",
    sections,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  const withScore = withReadiness(version, twin, nowIso);
  const updated: PitchWorkspace = {
    ...workspace,
    versions: [...workspace.versions, withScore],
    activeVersionId: withScore.id,
    updatedAt: nowIso,
  };
  save(startupId, updated);
  return withScore;
}

export function duplicateVersion(startupId: string, versionId: string, nowIso: string): PitchVersion {
  return createVersion(startupId, nowIso, versionId);
}

export function renameVersion(startupId: string, versionId: string, title: string, nowIso: string): PitchVersion {
  const workspace = requireWorkspace(startupId);
  const version = requireVersion(workspace, versionId);
  requireEditableVersion(version);
  const updated = { ...version, title, updatedAt: nowIso };
  saveVersion(startupId, workspace, updated);
  return updated;
}

/**
 * Finalizes a version — status becomes FINAL and it is thereafter immutable
 * (requireEditableVersion rejects further edits). A previously-finalized
 * version is NEVER overwritten or demoted by this or any other function.
 */
export function finalizeVersion(startupId: string, versionId: string, nowIso: string): PitchVersion {
  const workspace = requireWorkspace(startupId);
  const version = requireVersion(workspace, versionId);
  requireEditableVersion(version);
  const twin = getDigitalTwin(startupId);
  const updated = withReadiness({ ...version, status: "final", finalizedAt: nowIso, updatedAt: nowIso }, twin, nowIso);
  saveVersion(startupId, workspace, updated);
  return updated;
}

export function archiveVersion(startupId: string, versionId: string, nowIso: string): PitchVersion {
  const workspace = requireWorkspace(startupId);
  const version = requireVersion(workspace, versionId);
  if (workspace.activeVersionId === versionId && workspace.versions.length > 1) {
    // Promote the most recently updated other version as active so the
    // workspace never ends up pointing at an archived version.
    const nextActive = [...workspace.versions]
      .filter((v) => v.id !== versionId)
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0];
    save(startupId, { ...workspace, activeVersionId: nextActive.id, updatedAt: nowIso });
  }
  const updated = { ...version, status: "archived" as const, updatedAt: nowIso };
  saveVersion(startupId, requireWorkspace(startupId), updated);
  return updated;
}

export function setActiveVersion(startupId: string, versionId: string, nowIso: string): PitchWorkspace {
  const workspace = requireWorkspace(startupId);
  requireVersion(workspace, versionId); // throws if not found
  return save(startupId, { ...workspace, activeVersionId: versionId, updatedAt: nowIso });
}

export function updateWorkspaceContext(
  startupId: string,
  patch: Partial<Pick<PitchWorkspace, "objective" | "audience" | "pitchType" | "fundraisingContext">>,
  nowIso: string,
): PitchWorkspace {
  const workspace = requireWorkspace(startupId);
  return save(startupId, { ...workspace, ...patch, updatedAt: nowIso });
}

/** Test-only reset hook so isolated tests don't leak state across files. */
export function __resetPitchStoreForTests() {
  store.clear();
}

// ---------------------------------------------------------------------------
// Seed: two demo startups in materially different pitch states (Part 30).
// Built by calling the SAME functions a founder's own actions would call
// (createWorkspace/createVersion/updateSection/finalizeVersion/...), not a
// hand-rolled object bypassing this service's own rules — so Pitch
// Readiness for the seeded data is genuinely COMPUTED, never hardcoded.
// ---------------------------------------------------------------------------
function seedDemoPitchData() {
  const seedIso = new Date().toISOString();

  // startup-wakama: mature investor-deck history — v1 (archived), v2
  // (finalized), v3 (active draft, mostly complete with a deliberately thin
  // ask + traction so gaps are real and visible, not fabricated).
  if (getDigitalTwin("startup-wakama") && !store.has("startup-wakama")) {
    createWorkspace(
      "startup-wakama",
      {
        objective: "fundraising",
        audience: "investors",
        pitchType: "investor_deck",
        fundraisingContext: {
          round: "Seed",
          useOfFunds: "Expand aggregation points and logistics network across Côte d'Ivoire.",
        },
      },
      seedIso,
    );
    const v1 = getActiveVersion("startup-wakama");
    if (v1) {
      finalizeVersion("startup-wakama", v1.id, seedIso);
      archiveVersion("startup-wakama", v1.id, seedIso);

      const v2 = createVersion("startup-wakama", seedIso, v1.id);
      finalizeVersion("startup-wakama", v2.id, seedIso);

      const v3 = createVersion("startup-wakama", seedIso, v2.id);
      const ask = v3.sections.find((s) => s.type === "fundraising_ask");
      if (ask) updateSection("startup-wakama", v3.id, ask.id, { content: "We are raising a seed round.", keyPoints: [] }, seedIso);
      const traction = v3.sections.find((s) => s.type === "traction");
      if (traction) updateSection("startup-wakama", v3.id, traction.id, { keyPoints: [] }, seedIso);
      setActiveVersion("startup-wakama", v3.id, seedIso);
    }
  }

  // startup-solari: early first draft — v1 only, market + business model
  // sections left incomplete, no finalized version, no other versions.
  if (getDigitalTwin("startup-solari") && !store.has("startup-solari")) {
    createWorkspace("startup-solari", { objective: "fundraising", audience: "investors", pitchType: "three_minute" }, seedIso);
    const v1 = getActiveVersion("startup-solari");
    if (v1) {
      const market = v1.sections.find((s) => s.type === "market");
      if (market) updateSection("startup-solari", v1.id, market.id, { content: "", keyPoints: [], status: "empty" }, seedIso);
      const bm = v1.sections.find((s) => s.type === "business_model");
      if (bm) updateSection("startup-solari", v1.id, bm.id, { content: "", keyPoints: [], status: "empty" }, seedIso);
    }
  }
}
seedDemoPitchData();
