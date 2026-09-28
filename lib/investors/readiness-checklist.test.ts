import { describe, expect, it } from "vitest";
import { computeIntroductionReadiness } from "./readiness-checklist";

const fullyReady = {
  profileCompletionPct: 100,
  hasPitch: true,
  hasFundingRequirement: true,
  dataRoomCompletionPct: 100,
  hasFinancialData: true,
  hasReadinessAssessment: true,
};

describe("computeIntroductionReadiness", () => {
  it("reports profile completion indicator", () => {
    const result = computeIntroductionReadiness({ ...fullyReady, profileCompletionPct: 10 });
    expect(result.items.find((i) => i.key === "profileCompleted")?.met).toBe(false);
    const okResult = computeIntroductionReadiness(fullyReady);
    expect(okResult.items.find((i) => i.key === "profileCompleted")?.met).toBe(true);
  });

  it("reports pitch availability", () => {
    expect(computeIntroductionReadiness({ ...fullyReady, hasPitch: false }).items.find((i) => i.key === "pitchExists")?.met).toBe(false);
  });

  it("reports funding requirement presence", () => {
    expect(
      computeIntroductionReadiness({ ...fullyReady, hasFundingRequirement: false }).items.find((i) => i.key === "fundingRequirementEntered")?.met,
    ).toBe(false);
  });

  it("reports Data Room completion", () => {
    expect(computeIntroductionReadiness({ ...fullyReady, dataRoomCompletionPct: 0 }).items.find((i) => i.key === "dataRoomReady")?.met).toBe(false);
  });

  it("reports financial data availability", () => {
    expect(computeIntroductionReadiness({ ...fullyReady, hasFinancialData: false }).items.find((i) => i.key === "financialsAvailable")?.met).toBe(
      false,
    );
  });

  it("reports Readiness assessment availability", () => {
    expect(
      computeIntroductionReadiness({ ...fullyReady, hasReadinessAssessment: false }).items.find((i) => i.key === "readinessAssessmentAvailable")
        ?.met,
    ).toBe(false);
  });

  it("never returns a composite score field", () => {
    const result = computeIntroductionReadiness(fullyReady);
    expect(Object.keys(result)).toEqual(["items"]);
    for (const item of result.items) {
      expect(Object.keys(item).sort()).toEqual(["key", "met"]);
    }
  });
});
