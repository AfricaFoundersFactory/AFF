import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getLatestAssessment } from "./readiness";
import { getDigitalTwin } from "./digital-twin";
import {
  __resetOpportunitiesStoreForTests,
  createOpportunity,
  createPrepTaskForApplication,
  saveOpportunity,
  upsertApplication,
} from "./opportunities";

// AFF-DASH-08 Part B: opportunity discovery/matching/saving/tracking must
// never mutate AFF Readiness or the Digital Twin. Only the explicit "Add
// preparation task" action may create a Task, via the guarded pattern.
describe("Opportunities never mutate Readiness or Digital Twin", () => {
  it("static check: no opportunities source file references a percentage/score concept or a readiness/twin-mutating function", () => {
    const forbidden = ["matchPct", "matchScore", "matchPercentage", "successProbability", "fundingProbability"];
    const mutatingFns = ["createAssessment", "reassess", "saveAssessmentAnswers", "completeAssessment", "replaceDigitalTwin"];
    const filesToCheck = [
      "lib/services/opportunities.ts",
      "lib/opportunities/matching.ts",
      "lib/opportunities/filtering.ts",
      "lib/actions/opportunities.ts",
      "types/opportunity.ts",
    ];
    for (const relPath of filesToCheck) {
      const source = readFileSync(join(process.cwd(), relPath), "utf8");
      for (const term of [...forbidden, ...mutatingFns]) {
        expect(source.includes(term), `${relPath} must not reference "${term}"`).toBe(false);
      }
    }
  });

  it("behavioral: saving, applying and adding a prep task leave Readiness and Digital Twin byte-identical", () => {
    __resetOpportunitiesStoreForTests();
    const opp = createOpportunity(
      {
        title: "T",
        organization: "O",
        description: { en: "e", fr: "f" },
        type: "GRANT",
        countries: [],
        regions: [],
        industries: [],
        startupStages: [],
        languages: ["en"],
        requirements: [],
        status: "OPEN",
        source: "DEMO",
        isDemo: true,
      },
      "2026-01-01T00:00:00.000Z",
    );

    const before = {
      readiness: JSON.stringify(getLatestAssessment("startup-wakama")),
      twin: JSON.stringify(getDigitalTwin("startup-wakama")),
    };

    saveOpportunity("startup-wakama", opp.id, "2026-01-01T00:00:00.000Z");
    const application = upsertApplication("startup-wakama", opp.id, { status: "PREPARING" }, "2026-01-02T00:00:00.000Z");
    createPrepTaskForApplication("startup-wakama", application.id, "2026-01-03T00:00:00.000Z");

    const after = {
      readiness: JSON.stringify(getLatestAssessment("startup-wakama")),
      twin: JSON.stringify(getDigitalTwin("startup-wakama")),
    };

    expect(after).toEqual(before);
  });
});
