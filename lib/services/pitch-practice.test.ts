import { describe, expect, it } from "vitest";
import { startAttempt, completeAttempt, listAttempts } from "./pitch-practice";
import { getActiveVersion, getPitchReadiness } from "./pitch";

describe("demo seed", () => {
  it("seeds startup-wakama with completed practice attempts", () => {
    const attempts = listAttempts("startup-wakama");
    expect(attempts.length).toBeGreaterThan(0);
    expect(attempts.every((a) => a.completedAt)).toBe(true);
  });
});

describe("practice attempt creation", () => {
  it("creates and completes an attempt with a founder self-rating", () => {
    const version = getActiveVersion("startup-solari")!;
    const started = startAttempt("startup-solari", version.id, "1min", "2026-03-01T00:00:00.000Z");
    expect(started.completedAt).toBeUndefined();

    const completed = completeAttempt(
      "startup-solari",
      started.id,
      { actualDurationSeconds: 58, founderRatings: { clarity: 4, confidence: 3, timing: 5, storytelling: 4 }, notes: "Felt good." },
      "2026-03-01T00:01:00.000Z",
    );
    expect(completed.completedAt).toBe("2026-03-01T00:01:00.000Z");
    expect(completed.founderRatings?.clarity).toBe(4);
  });
});

describe("self-assessment remains separate from Pitch Readiness", () => {
  it("does not change the deterministic Pitch Readiness score when a practice attempt (with self-ratings) is recorded", () => {
    const version = getActiveVersion("startup-wakama")!;
    const before = getPitchReadiness("startup-wakama", version.id, "2026-03-01T00:00:00.000Z")!;

    const attempt = startAttempt("startup-wakama", version.id, "3min", "2026-03-02T00:00:00.000Z");
    completeAttempt(
      "startup-wakama",
      attempt.id,
      { actualDurationSeconds: 300, founderRatings: { clarity: 1, confidence: 1, timing: 1, storytelling: 1 }, notes: "Rough run." },
      "2026-03-02T00:05:00.000Z",
    );

    const after = getPitchReadiness("startup-wakama", version.id, "2026-03-01T00:00:00.000Z")!;
    expect(after.score).toBe(before.score);
    expect(after.confidence).toBe(before.confidence);
  });
});
