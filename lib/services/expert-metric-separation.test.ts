import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getLatestAssessment } from "./readiness";
import { getCurrentRoadmap } from "./roadmap";
import { getPitchReadiness, getActiveVersion } from "./pitch";
import { createExpertProfile, __resetExpertsStoreForTests, listStartupNeeds } from "./experts";
import { createSupportRequest, __resetSupportRequestsStoreForTests } from "./support-requests";
import {
  completeSession,
  createSession,
  __resetMentoringStoreForTests,
  createTaskFromRecommendation,
  addRecommendationToRoadmap,
} from "./mentoring";

// AFF-DASH-07: Expert Matching, Expert Recommendation and Mentoring
// Follow-up are informational/advisory only. None of them is an AFF
// Readiness result, a Pitch Readiness result, or an automatic Roadmap
// mutation. This file asserts that structurally (static grep) AND
// behaviorally (before/after snapshots), mirroring
// lib/services/financial-metric-separation.test.ts.
describe("expert network / mentoring never mutate AFF Readiness, Pitch Readiness, or the Roadmap automatically", () => {
  it("static check: no expert/mentoring source file imports a readiness/pitch-readiness-mutating function", () => {
    const mutatingFns = [
      "createAssessment",
      "reassess",
      "saveAssessmentAnswers",
      "completeAssessment",
      "updateSection", // pitch section mutation — recommendations must never write pitch content
      "finalizeVersion",
    ];
    const filesToCheck = [
      "lib/services/experts.ts",
      "lib/services/support-requests.ts",
      "lib/services/mentoring.ts",
      "lib/experts/needs.ts",
      "lib/experts/matching.ts",
      "lib/experts/taxonomy.ts",
      "lib/actions/experts.ts",
    ];
    for (const relPath of filesToCheck) {
      const source = readFileSync(join(process.cwd(), relPath), "utf8");
      for (const fnName of mutatingFns) {
        expect(source.includes(fnName), `${relPath} must not reference mutating function ${fnName}`).toBe(false);
      }
    }
  });

  it("static check: no expert/mentoring file references a star rating, score, or percentage concept for experts", () => {
    const forbidden = ["starRating", "expertScore", "matchPercentage", "matchScore", "successProbability", "fundingProbability"];
    const filesToCheck = [
      "lib/services/experts.ts",
      "lib/services/support-requests.ts",
      "lib/services/mentoring.ts",
      "lib/experts/needs.ts",
      "lib/experts/matching.ts",
      "types/experts.ts",
    ];
    for (const relPath of filesToCheck) {
      const source = readFileSync(join(process.cwd(), relPath), "utf8");
      for (const term of forbidden) {
        expect(source.includes(term), `${relPath} must not reference forbidden concept ${term}`).toBe(false);
      }
    }
  });

  it("computing Startup Needs (derivation) does not change the startup's AFF Readiness assessment", () => {
    const before = getLatestAssessment("startup-wakama");
    listStartupNeeds("startup-wakama", "2026-09-28T00:00:00.000Z");
    const after = getLatestAssessment("startup-wakama");
    expect(after).toEqual(before);
  });

  it("computing Startup Needs (derivation) does not change Pitch Readiness", () => {
    const activeVersion = getActiveVersion("startup-wakama");
    const before = activeVersion ? getPitchReadiness("startup-wakama", activeVersion.id, "2026-09-28T00:00:00.000Z") : undefined;
    listStartupNeeds("startup-wakama", "2026-09-28T00:00:00.000Z");
    const after = activeVersion ? getPitchReadiness("startup-wakama", activeVersion.id, "2026-09-28T00:00:00.000Z") : undefined;
    expect(after).toEqual(before);
  });

  it("completing a mentoring session (with recommendations) does not change AFF Readiness or Roadmap Progress on its own", () => {
    __resetExpertsStoreForTests();
    __resetSupportRequestsStoreForTests();
    __resetMentoringStoreForTests();

    const expert = createExpertProfile(
      {
        displayName: "Sep Test Expert",
        headline: "h",
        bio: "b",
        country: "Kenya",
        languages: ["en"],
        expertise: ["GROWTH"],
        industries: [],
        startupStages: ["growth"],
        markets: [],
        availability: "AVAILABLE",
        mentoringFormats: ["VIDEO_CALL"],
      },
      "2026-01-01T00:00:00.000Z",
    );
    const request = createSupportRequest(
      "startup-wakama",
      { founderId: "f1", expertId: expert.id, topic: "t", message: "m", preferredFormat: "VIDEO_CALL", preferredLanguage: "en" },
      "2026-01-01T00:00:00.000Z",
    );

    const readinessBefore = getLatestAssessment("startup-wakama");
    const roadmapBefore = getCurrentRoadmap("startup-wakama");

    const session = createSession(
      "startup-wakama",
      { supportRequestId: request.id, expertId: expert.id, founderId: "f1", topic: "t", format: "VIDEO_CALL" },
      "2026-01-02T00:00:00.000Z",
    );
    const { recommendations } = completeSession(
      "startup-wakama",
      session.id,
      { recommendations: [{ category: "GROWTH", title: "Do X", description: "d", priority: "high" }] },
      "2026-01-03T00:00:00.000Z",
    );

    const readinessAfter = getLatestAssessment("startup-wakama");
    const roadmapAfter = getCurrentRoadmap("startup-wakama");

    expect(readinessAfter).toEqual(readinessBefore);
    // Roadmap Progress is untouched by completing a session — only an
    // explicit, separate "Add to roadmap" call changes it (asserted next).
    expect(roadmapAfter).toEqual(roadmapBefore);

    // Even converting the recommendation to a Task must not touch Readiness.
    createTaskFromRecommendation("startup-wakama", recommendations[0].id, "2026-01-04T00:00:00.000Z");
    expect(getLatestAssessment("startup-wakama")).toEqual(readinessBefore);

    // Only the explicit, founder-triggered "Add to roadmap" call changes the
    // roadmap — and even then, Readiness stays untouched.
    addRecommendationToRoadmap("startup-wakama", recommendations[0].id, "2026-01-05T00:00:00.000Z");
    expect(getLatestAssessment("startup-wakama")).toEqual(readinessBefore);
    expect(getCurrentRoadmap("startup-wakama")?.items.length).toBe((roadmapBefore?.items.length ?? 0) + 1);
  });
});
