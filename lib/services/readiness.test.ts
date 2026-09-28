import { describe, expect, it } from "vitest";
import {
  completeAssessment,
  createAssessment,
  getAssessmentHistory,
  getDraftAssessment,
  getLatestAssessment,
  saveAssessmentAnswers,
} from "./readiness";
import { computeProfileCompletion } from "./profile-completion";
import { getDigitalTwin } from "./digital-twin";

describe("demo seed", () => {
  it("gives startup-wakama and startup-solari materially different assessments", () => {
    const wakama = getLatestAssessment("startup-wakama")!;
    const solari = getLatestAssessment("startup-solari")!;
    expect(wakama.overallScore).not.toBeNull();
    expect(solari.overallScore).not.toBeNull();
    expect(wakama.overallScore).not.toBe(solari.overallScore);
  });

  it("keeps a completed history entry immutable-ish across the module's lifetime", () => {
    const first = getAssessmentHistory("startup-wakama")[0];
    const firstAgain = getAssessmentHistory("startup-wakama")[0];
    expect(first).toEqual(firstAgain);
    expect(first.status).toBe("completed");
  });
});

describe("profile completion vs readiness", () => {
  it("are independent metrics, never derived from one another", () => {
    const twin = getDigitalTwin("startup-wakama")!;
    const completion = computeProfileCompletion(twin);
    const readiness = getLatestAssessment("startup-wakama")!;

    expect(completion.overallPct).not.toBe(readiness.overallScore);
    // Completion is a 0-100 percentage of filled-in fields; readiness is a
    // 0-100 diagnostic score — both happen to share a scale, but nothing in
    // either computation reads the other's output.
    expect(typeof completion.overallPct).toBe("number");
    expect(typeof readiness.overallScore).toBe("number");
  });
});

describe("startup isolation", () => {
  it("does not leak assessment state between startups", () => {
    const solariHistoryBefore = getAssessmentHistory("startup-solari").length;

    createAssessment("startup-wakama", "2026-09-28");
    saveAssessmentAnswers("startup-wakama", { q_forecasting: true }, "2026-09-28");
    completeAssessment("startup-wakama", "2026-09-28");

    const solariHistoryAfter = getAssessmentHistory("startup-solari").length;
    expect(solariHistoryAfter).toBe(solariHistoryBefore);
    expect(getDraftAssessment("startup-solari")).toBeUndefined();
  });
});

describe("assessment lifecycle", () => {
  it("creates a draft, accepts answers, and completes into a new immutable version", () => {
    const historyBefore = getAssessmentHistory("startup-solari");
    const versionBefore = historyBefore[historyBefore.length - 1].version;

    const draft = createAssessment("startup-solari", "2026-09-29");
    expect(draft.status).toBe("draft");
    expect(draft.version).toBe(versionBefore + 1);

    saveAssessmentAnswers("startup-solari", { q_forecasting: true, q_execution_capacity: 5 }, "2026-09-29");
    expect(getDraftAssessment("startup-solari")!.answers.some((a) => a.questionId === "q_forecasting")).toBe(true);

    const completed = completeAssessment("startup-solari", "2026-09-30");
    expect(completed.status).toBe("completed");
    expect(completed.overallScore).not.toBeNull();
    expect(getDraftAssessment("startup-solari")).toBeUndefined();

    const historyAfter = getAssessmentHistory("startup-solari");
    expect(historyAfter.length).toBe(historyBefore.length + 1);
    // Earlier completed versions must be untouched by the new completion.
    expect(historyAfter[0]).toEqual(historyBefore[0]);
  });

  it("preserves the previous score on the new snapshot for change-over-time display", () => {
    const history = getAssessmentHistory("startup-solari");
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    const dim = latest.dimensions.find((d) => d.dimension === "finance")!;
    expect(dim.previousScore).toBe(previous.dimensions.find((d) => d.dimension === "finance")!.score);
  });
});
