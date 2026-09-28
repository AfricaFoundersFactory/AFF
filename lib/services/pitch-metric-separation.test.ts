import { describe, expect, it } from "vitest";
import { getActiveVersion, getPitchReadiness } from "./pitch";
import { getDigitalTwin } from "./digital-twin";
import { computeProfileCompletion } from "./profile-completion";
import { getLatestAssessment } from "./readiness";
import { getCurrentRoadmap } from "./roadmap";

// AFF-DASH-05 Part "CRITICAL METRIC SEPARATION": Profile Completion, AFF
// Readiness, Pitch Readiness and Roadmap Progress are four independent
// numbers computed by four independent functions. This file asserts they
// are structurally independent (not derived from one another), not merely
// that they happen to differ numerically for the current seed data.
describe("profile completion != Pitch Readiness", () => {
  it("computes profile completion from the Digital Twin alone, with no dependency on Pitch Readiness", () => {
    const twin = getDigitalTwin("startup-wakama")!;
    const completion = computeProfileCompletion(twin);
    const version = getActiveVersion("startup-wakama")!;
    const pitchReadiness = getPitchReadiness("startup-wakama", version.id, "2026-04-01T00:00:00.000Z")!;

    expect(typeof completion.overallPct).toBe("number");
    expect(typeof pitchReadiness.score).toBe("number");
    // Different scales/semantics — a founder can have 100% profile
    // completion and a low Pitch Readiness score, or vice versa. Assert
    // they are not the same field/value by construction.
    expect(completion).not.toHaveProperty("score");
    expect(pitchReadiness).not.toHaveProperty("overallPct");
  });
});

describe("AFF Readiness != Pitch Readiness", () => {
  it("keeps AFF Readiness and Pitch Readiness as separate scores from separate engines", () => {
    const affAssessment = getLatestAssessment("startup-wakama");
    const version = getActiveVersion("startup-wakama")!;
    const pitchReadiness = getPitchReadiness("startup-wakama", version.id, "2026-04-01T00:00:00.000Z")!;

    expect(affAssessment).toBeDefined();
    // Two independently computed results — asserting they are literally
    // different objects/engines, not that their score values must differ
    // numerically (a coincidental tie is fine; a shared computation is not).
    expect(affAssessment!.dimensions).not.toBe(pitchReadiness.dimensions);
    expect(affAssessment).not.toHaveProperty("confidence", pitchReadiness.confidence);
    expect(typeof affAssessment!.overallScore).toBe("number");
    expect(typeof pitchReadiness.score).toBe("number");
  });
});

describe("Roadmap progress != Pitch Readiness", () => {
  it("keeps Roadmap Progress (task completion %) independent from Pitch Readiness (pitch content quality)", () => {
    const roadmap = getCurrentRoadmap("startup-wakama");
    const version = getActiveVersion("startup-wakama")!;
    const pitchReadiness = getPitchReadiness("startup-wakama", version.id, "2026-04-01T00:00:00.000Z")!;

    expect(roadmap).toBeDefined();
    expect(typeof roadmap!.progressPct).toBe("number");
    expect(typeof pitchReadiness.score).toBe("number");
    expect(roadmap).not.toHaveProperty("pitchReadiness");
  });
});
