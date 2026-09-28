import { describe, expect, it } from "vitest";
import { computePitchLiveReadiness } from "./pitch-live-readiness";
import type { PitchReview, PitchPracticeAttempt, PitchVersion } from "@/types/pitch";

function version(overrides: Partial<PitchVersion> = {}): PitchVersion {
  return {
    id: "v1",
    workspaceId: "w1",
    startupId: "startup-x",
    version: 1,
    title: "V1",
    status: "final",
    sections: [
      { id: "s1", type: "problem", content: "Problem text", keyPoints: [], sourceReferences: [], status: "complete", order: 1, required: true },
      { id: "s2", type: "fundraising_ask", content: "Ask text", keyPoints: [], sourceReferences: [], status: "complete", order: 2, required: true },
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("Pitch Live requirements", () => {
  it("is ready when all four transparent requirements are met", () => {
    const attempt: PitchPracticeAttempt = {
      id: "a1",
      startupId: "startup-x",
      pitchVersionId: "v1",
      format: "3min",
      startedAt: "2026-01-01T00:00:00.000Z",
      completedAt: "2026-01-01T00:03:00.000Z",
    };
    const result = computePitchLiveReadiness(version(), [], [attempt]);
    expect(result.ready).toBe(true);
    expect(result.requirements).toEqual({
      versionFinalized: true,
      requiredSectionsComplete: true,
      noCriticalUnresolvedIssue: true,
      hasPracticeAttempt: true,
    });
  });

  it("is NOT ready when the version isn't finalized, regardless of score", () => {
    const result = computePitchLiveReadiness(version({ status: "draft" }), [], []);
    expect(result.ready).toBe(false);
    expect(result.requirements.versionFinalized).toBe(false);
  });

  it("is NOT ready with an open critical review issue", () => {
    const review: PitchReview = {
      id: "r1",
      startupId: "startup-x",
      pitchVersionId: "v1",
      reviewerId: "demo",
      reviewerName: "Demo Reviewer",
      isDemo: true,
      status: "completed",
      createdAt: "2026-01-01T00:00:00.000Z",
      comments: [
        {
          id: "c1",
          reviewId: "r1",
          authorId: "demo",
          type: "critical_issue",
          message: "Critical gap",
          status: "open",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    };
    const result = computePitchLiveReadiness(version(), [review], []);
    expect(result.ready).toBe(false);
    expect(result.requirements.noCriticalUnresolvedIssue).toBe(false);
  });

  it("is deterministic — same inputs always produce the same result", () => {
    const r1 = computePitchLiveReadiness(version(), [], []);
    const r2 = computePitchLiveReadiness(version(), [], []);
    expect(r1).toEqual(r2);
  });

  it("returns not-ready with no version at all, without throwing", () => {
    const result = computePitchLiveReadiness(undefined, [], []);
    expect(result.ready).toBe(false);
  });
});
