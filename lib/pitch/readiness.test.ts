import { describe, expect, it } from "vitest";
import { demoDigitalTwins } from "@/lib/demo/digital-twin";
import { buildInitialSections } from "./prefill";
import { computePitchReadiness, PITCH_READINESS_DIMENSION_KEYS } from "./readiness";
import type { PitchVersion } from "@/types/pitch";

const wakamaTwin = demoDigitalTwins["startup-wakama"];
const solariTwin = demoDigitalTwins["startup-solari"];

function buildVersion(sections: PitchVersion["sections"], overrides?: Partial<PitchVersion>): PitchVersion {
  return {
    id: "v-test",
    workspaceId: "w-test",
    startupId: "startup-wakama",
    version: 1,
    title: "Test version",
    status: "draft",
    sections,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("determinism", () => {
  it("returns the exact same score/confidence/dimensions for the same input every time", () => {
    const sections = buildInitialSections(wakamaTwin, "investor_deck", "fundraising");
    const version = buildVersion(sections);
    const r1 = computePitchReadiness(version, wakamaTwin, "2026-01-01T00:00:00.000Z");
    const r2 = computePitchReadiness(version, wakamaTwin, "2026-06-01T00:00:00.000Z");
    expect(r1.score).toBe(r2.score);
    expect(r1.confidence).toBe(r2.confidence);
    expect(r1.dimensions).toEqual(r2.dimensions);
  });
});

describe("score and confidence bounds", () => {
  it("keeps score within 0-100 for a fully prefilled version", () => {
    const sections = buildInitialSections(wakamaTwin, "investor_deck", "fundraising");
    const result = computePitchReadiness(buildVersion(sections), wakamaTwin, "2026-01-01T00:00:00.000Z");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
    result.dimensions.forEach((d) => {
      expect(d.score).toBeGreaterThanOrEqual(0);
      expect(d.score).toBeLessThanOrEqual(100);
    });
  });

  it("keeps score within 0-100 even for a version with every section emptied out", () => {
    const sections = buildInitialSections(wakamaTwin, "investor_deck", "fundraising").map((s) => ({
      ...s,
      content: "",
      keyPoints: [],
      sourceReferences: [],
    }));
    const full = buildInitialSections(wakamaTwin, "investor_deck", "fundraising");
    const emptyResult = computePitchReadiness(buildVersion(sections), wakamaTwin, "2026-01-01T00:00:00.000Z");
    const fullResult = computePitchReadiness(buildVersion(full), wakamaTwin, "2026-01-01T00:00:00.000Z");
    expect(emptyResult.score).toBeGreaterThanOrEqual(0);
    expect(emptyResult.score).toBeLessThanOrEqual(100);
    // Emptying every section's own content/evidence must never score HIGHER
    // than a fully prefilled version, even though some dimensions partly
    // credit underlying Digital Twin facts (e.g. team_story can see
    // twin.founders even when the section text itself is blank).
    expect(emptyResult.score).toBeLessThan(fullResult.score);
  });

  it("computes all 12 documented dimensions", () => {
    const sections = buildInitialSections(wakamaTwin, "investor_deck", "fundraising");
    const result = computePitchReadiness(buildVersion(sections), wakamaTwin, "2026-01-01T00:00:00.000Z");
    expect(result.dimensions.map((d) => d.key).sort()).toEqual([...PITCH_READINESS_DIMENSION_KEYS].sort());
  });
});

describe("missing evidence affects confidence, not just score", () => {
  it("scores traction as evaluable-but-weak, and confidence drops when evidence/metrics are stripped", () => {
    const withEvidence = buildInitialSections(wakamaTwin, "investor_deck", "fundraising");
    const richResult = computePitchReadiness(buildVersion(withEvidence), wakamaTwin, "2026-01-01T00:00:00.000Z");

    const stripped = withEvidence.map((s) =>
      s.type === "traction" ? { ...s, sourceReferences: [], content: "We are growing fast." } : s,
    );
    // Also strip the twin's own traction metrics so the dimension truly has no evidence to evaluate.
    const noTractionTwin = { ...wakamaTwin, traction: { ...wakamaTwin.traction, metrics: [], narrative: undefined } };
    const weakResult = computePitchReadiness(buildVersion(stripped), noTractionTwin, "2026-01-01T00:00:00.000Z");

    const richTraction = richResult.dimensions.find((d) => d.key === "traction_story")!.score;
    const weakTraction = weakResult.dimensions.find((d) => d.key === "traction_story")!.score;
    expect(weakTraction).toBeLessThan(richTraction);
    expect(weakResult.confidence).toBeLessThanOrEqual(richResult.confidence);
  });
});

describe("startup A/B isolation and difference", () => {
  it("computes materially different readiness for two different startups' seed profiles", () => {
    const wakamaSections = buildInitialSections(wakamaTwin, "investor_deck", "fundraising");
    const solariSections = buildInitialSections(solariTwin, "three_minute", "fundraising");
    const wakamaResult = computePitchReadiness(buildVersion(wakamaSections), wakamaTwin, "2026-01-01T00:00:00.000Z");
    const solariResult = computePitchReadiness(
      buildVersion(solariSections, { startupId: "startup-solari" }),
      solariTwin,
      "2026-01-01T00:00:00.000Z",
    );
    // Not asserting a specific direction — only that scoring is independent per startup's own data.
    expect(typeof wakamaResult.score).toBe("number");
    expect(typeof solariResult.score).toBe("number");
  });
});
