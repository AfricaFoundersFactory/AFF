import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getLatestAssessment } from "./readiness";
import { getDigitalTwin } from "./digital-twin";
import { __resetResourcesStoreForTests, bookmarkResource, createTaskFromResource, listResources } from "./resources";

describe("Resources never mutate Readiness or Digital Twin", () => {
  it("static check: no resources source file references a percentage/popularity concept or a readiness/twin-mutating function", () => {
    const forbidden = ["viewCount", "popularity", "matchScore", "matchPercentage"];
    const mutatingFns = ["createAssessment", "reassess", "saveAssessmentAnswers", "completeAssessment", "replaceDigitalTwin"];
    const filesToCheck = [
      "lib/services/resources.ts",
      "lib/resources/recommendation.ts",
      "lib/resources/filtering.ts",
      "lib/actions/resources.ts",
      "types/resources.ts",
    ];
    for (const relPath of filesToCheck) {
      const source = readFileSync(join(process.cwd(), relPath), "utf8");
      for (const term of [...forbidden, ...mutatingFns]) {
        expect(source.includes(term), `${relPath} must not reference "${term}"`).toBe(false);
      }
    }
  });

  it("behavioral: bookmarking and adding a task leave Readiness and Digital Twin byte-identical", () => {
    __resetResourcesStoreForTests();
    const resource = listResources()[0];

    const before = {
      readiness: JSON.stringify(getLatestAssessment("startup-wakama")),
      twin: JSON.stringify(getDigitalTwin("startup-wakama")),
    };

    bookmarkResource("startup-wakama", resource.id, "2026-01-01T00:00:00.000Z");
    createTaskFromResource("startup-wakama", resource.id, "2026-01-02T00:00:00.000Z");

    const after = {
      readiness: JSON.stringify(getLatestAssessment("startup-wakama")),
      twin: JSON.stringify(getDigitalTwin("startup-wakama")),
    };

    expect(after).toEqual(before);
  });
});
