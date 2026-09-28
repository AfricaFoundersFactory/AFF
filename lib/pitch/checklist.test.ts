import { describe, expect, it } from "vitest";
import { demoDigitalTwins } from "@/lib/demo/digital-twin";
import { buildInitialSections } from "./prefill";
import { deriveChecklist } from "./checklist";
import type { PitchVersion } from "@/types/pitch";

const wakamaTwin = demoDigitalTwins["startup-wakama"];

function buildVersion(sections: PitchVersion["sections"]): PitchVersion {
  return {
    id: "v-test",
    workspaceId: "w-test",
    startupId: "startup-wakama",
    version: 1,
    title: "Test",
    status: "draft",
    sections,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("checklist derivation", () => {
  it("derives checklist items from actual pitch content, not a hardcoded list", () => {
    const full = buildInitialSections(wakamaTwin, "investor_deck", "fundraising");
    const empty = full.map((s) => ({ ...s, content: "", keyPoints: [], sourceReferences: [] }));

    const fullChecklist = deriveChecklist(buildVersion(full));
    const emptyChecklist = deriveChecklist(buildVersion(empty));

    // Same keys (a stable, deterministic checklist shape)...
    expect(fullChecklist.map((c) => c.key)).toEqual(emptyChecklist.map((c) => c.key));
    // ...but DIFFERENT computed states — proving it's derived from data, not hardcoded.
    expect(fullChecklist).not.toEqual(emptyChecklist);
    expect(emptyChecklist.find((c) => c.key === "problem_defined")!.state).toBe("fail");
    expect(fullChecklist.find((c) => c.key === "problem_defined")!.state).toBe("pass");
  });

  it("flags traction evidence as only a warning (not a hard fail) when content exists but has no source reference", () => {
    const full = buildInitialSections(wakamaTwin, "investor_deck", "fundraising");
    const noEvidence = full.map((s) => (s.type === "traction" ? { ...s, sourceReferences: [] } : s));
    const checklist = deriveChecklist(buildVersion(noEvidence));
    expect(checklist.find((c) => c.key === "traction_evidence")!.state).toBe("warn");
  });
});
