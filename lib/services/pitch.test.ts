import { describe, expect, it } from "vitest";
import {
  getWorkspace,
  getActiveVersion,
  getVersion,
  createVersion,
  duplicateVersion,
  renameVersion,
  finalizeVersion,
  archiveVersion,
  updateSection,
  refreshSectionFromProfile,
  getSectionsWithSourceUpdates,
  getPitchReadiness,
} from "./pitch";
import { getDigitalTwin, updateProblem } from "./digital-twin";

describe("demo seed", () => {
  it("seeds startup-wakama with a multi-version workspace and startup-solari with an incomplete v1", () => {
    const wakama = getWorkspace("startup-wakama")!;
    expect(wakama.versions.length).toBeGreaterThanOrEqual(3);
    expect(wakama.versions.some((v) => v.status === "archived")).toBe(true);
    expect(wakama.versions.some((v) => v.status === "final")).toBe(true);

    const solari = getWorkspace("startup-solari")!;
    expect(solari.versions).toHaveLength(1);
    const marketSection = solari.versions[0].sections.find((s) => s.type === "market")!;
    expect(marketSection.status).toBe("empty");
  });
});

describe("pitch workspace startup isolation", () => {
  it("never lets a mutation on one startup's workspace affect another's", () => {
    const wakamaBefore = JSON.stringify(getWorkspace("startup-wakama"));
    const solariActive = getActiveVersion("startup-solari")!;
    const solariSection = solariActive.sections[0];

    updateSection("startup-solari", solariActive.id, solariSection.id, { content: "Isolated edit" }, "2026-02-01");

    expect(JSON.stringify(getWorkspace("startup-wakama"))).toBe(wakamaBefore);
    expect(getActiveVersion("startup-solari")!.sections.find((s) => s.id === solariSection.id)!.content).toBe("Isolated edit");
  });
});

describe("version creation", () => {
  it("creates a new version, bumping the version number and becoming the active version", () => {
    const before = getActiveVersion("startup-wakama")!;
    const created = createVersion("startup-wakama", "2026-02-02");
    expect(created.version).toBe(before.version + 1);
    expect(getActiveVersion("startup-wakama")!.id).toBe(created.id);
    expect(created.status).toBe("draft");
  });
});

describe("version duplication", () => {
  it("copies narrative and structure but starts with fresh section ids and no review state", () => {
    const source = getActiveVersion("startup-wakama")!;
    const duplicate = duplicateVersion("startup-wakama", source.id, "2026-02-03");
    expect(duplicate.id).not.toBe(source.id);
    expect(duplicate.sections.map((s) => s.content)).toEqual(source.sections.map((s) => s.content));
    expect(duplicate.sections.map((s) => s.id)).not.toEqual(source.sections.map((s) => s.id));
    expect(duplicate.status).toBe("draft");
    expect(duplicate.finalizedAt).toBeUndefined();
  });
});

describe("rename version", () => {
  it("renames the active draft version's title", () => {
    const active = getActiveVersion("startup-wakama")!;
    const renamed = renameVersion("startup-wakama", active.id, "Seed pitch — investor deck", "2026-02-03T12:00:00.000Z");
    expect(renamed.title).toBe("Seed pitch — investor deck");
  });
});

describe("finalized version preserved", () => {
  it("never allows a finalized version to be edited, and its content is untouched by later activity", () => {
    const draft = getActiveVersion("startup-wakama")!;
    const finalized = finalizeVersion("startup-wakama", draft.id, "2026-02-04");
    expect(finalized.status).toBe("final");
    const snapshot = JSON.stringify(finalized.sections);

    expect(() =>
      updateSection("startup-wakama", finalized.id, finalized.sections[0].id, { content: "Trying to overwrite" }, "2026-02-05"),
    ).toThrow();

    expect(JSON.stringify(getVersion("startup-wakama", finalized.id)!.sections)).toBe(snapshot);
  });
});

describe("archive behavior", () => {
  it("archiving the active version promotes another version to active rather than leaving the workspace pointing at an archived version", () => {
    const workspace = getWorkspace("startup-wakama")!;
    const active = getActiveVersion("startup-wakama")!;
    archiveVersion("startup-wakama", active.id, "2026-02-06");

    const archived = getVersion("startup-wakama", active.id)!;
    expect(archived.status).toBe("archived");

    if (workspace.versions.length > 1) {
      expect(getWorkspace("startup-wakama")!.activeVersionId).not.toBe(active.id);
    }
  });
});

describe("source update detection + refresh", () => {
  it("flags a section when the Digital Twin changes after prefill, and refresh re-imports only that section", () => {
    const twin = getDigitalTwin("startup-solari")!;
    const originalStatement = twin.problem.statement;
    const active = getActiveVersion("startup-solari")!;
    const problemSection = active.sections.find((s) => s.type === "problem")!;

    updateProblem("startup-solari", { statement: "A materially different problem statement for Solari." });
    const drifted = getSectionsWithSourceUpdates("startup-solari", active.id);
    expect(drifted[problemSection.id]).toContain("problem.statement");

    const refreshed = refreshSectionFromProfile("startup-solari", active.id, problemSection.id, "2026-02-07");
    const refreshedProblem = refreshed.sections.find((s) => s.id === problemSection.id)!;
    expect(refreshedProblem.content).toContain("materially different problem statement");

    // Restore so other tests in this file aren't affected by this mutation.
    updateProblem("startup-solari", { statement: originalStatement });
  });
});

describe("determinism at the service layer", () => {
  it("getPitchReadiness returns the same score for the same version + twin state", () => {
    const active = getActiveVersion("startup-wakama")!;
    const r1 = getPitchReadiness("startup-wakama", active.id, "2026-01-01T00:00:00.000Z");
    const r2 = getPitchReadiness("startup-wakama", active.id, "2026-06-01T00:00:00.000Z");
    expect(r1!.score).toBe(r2!.score);
    expect(r1!.confidence).toBe(r2!.confidence);
  });
});
