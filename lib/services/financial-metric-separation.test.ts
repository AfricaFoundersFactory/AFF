import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getLatestAssessment } from "./readiness";
import { getFinancialSnapshot } from "./financials";
import { getCompletion } from "./data-room";
import { getDigitalTwin } from "./digital-twin";

// AFF-DASH-06 Part M / G / L: Financial Health Signals and Data Room
// Completion are informational only. Neither one is an investment
// recommendation, a valuation, a credit score, or an AFF Readiness
// modification, and Data Room Completion must never be merged into or
// reported as AFF Readiness. This file asserts that structurally, not just
// that today's numbers happen to differ.
describe("financials/data-room never mutate AFF Readiness", () => {
  it("static check: no financials/data-room source file imports any readiness-score-mutating function", () => {
    const mutatingFns = ["createAssessment", "reassess", "saveAssessmentAnswers", "completeAssessment"];
    const filesToCheck = [
      "lib/services/financials.ts",
      "lib/services/data-room.ts",
      "lib/financials/calculations.ts",
      "lib/financials/signals.ts",
      "lib/financials/funding.ts",
      "lib/data-room/checklist.ts",
      "lib/data-room/completion.ts",
      "lib/actions/financials.ts",
      "lib/actions/data-room.ts",
    ];
    for (const relPath of filesToCheck) {
      const source = readFileSync(join(process.cwd(), relPath), "utf8");
      for (const fnName of mutatingFns) {
        expect(source.includes(fnName), `${relPath} must not reference readiness-mutating function ${fnName}`).toBe(false);
      }
    }
  });

  it("computing a Financial Snapshot does not change the startup's AFF Readiness assessment", () => {
    const before = getLatestAssessment("startup-wakama");
    getFinancialSnapshot("startup-wakama", "2026-09-28T00:00:00.000Z");
    const after = getLatestAssessment("startup-wakama");
    expect(after).toEqual(before);
  });

  it("computing Data Room Completion does not change the startup's AFF Readiness assessment", () => {
    const before = getLatestAssessment("startup-wakama");
    getCompletion("startup-wakama");
    const after = getLatestAssessment("startup-wakama");
    expect(after).toEqual(before);
  });

  it("Data Room Completion is a distinct percentage, never exposed under a 'readiness' key", () => {
    const completion = getCompletion("startup-wakama");
    expect(completion).not.toHaveProperty("readinessScore");
    expect(completion).not.toHaveProperty("overallScore");
    expect(completion).toHaveProperty("completionPct");
  });

  it("reading financials/data-room never mutates the Digital Twin either", () => {
    const before = getDigitalTwin("startup-wakama");
    const beforeSnapshot = JSON.stringify(before);
    getFinancialSnapshot("startup-wakama", "2026-09-28T00:00:00.000Z");
    getCompletion("startup-wakama");
    const after = getDigitalTwin("startup-wakama");
    expect(JSON.stringify(after)).toBe(beforeSnapshot);
  });
});
