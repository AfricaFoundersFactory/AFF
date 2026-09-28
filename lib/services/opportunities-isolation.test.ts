import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetOpportunitiesStoreForTests,
  createOpportunity,
  createPrepTaskForApplication,
  isSaved,
  listApplications,
  listSaved,
  saveOpportunity,
  upsertApplication,
} from "./opportunities";
import { getTasksForStartup } from "./tasks";

// Mirrors lib/services/financials-isolation.test.ts's pattern: saved
// opportunities, applications and opportunity-derived tasks must never leak
// across startups. lib/services/tasks.ts has no test-reset hook (task
// creation is additive/idempotent per startup), so this file only ever
// asserts on a startup id ("startup-b") it never writes to.
describe("opportunity data is startup-isolated", () => {
  beforeEach(() => {
    __resetOpportunitiesStoreForTests();
  });

  function seedOpp() {
    return createOpportunity(
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
  }

  it("does not let startup A's saved opportunity appear for startup B", () => {
    const opp = seedOpp();
    saveOpportunity("startup-a", opp.id, "2026-01-01T00:00:00.000Z");
    expect(listSaved("startup-b")).toHaveLength(0);
    expect(isSaved("startup-b", opp.id)).toBe(false);
  });

  it("does not let startup A's application appear for startup B", () => {
    const opp = seedOpp();
    upsertApplication("startup-a", opp.id, { status: "INTERESTED" }, "2026-01-01T00:00:00.000Z");
    expect(listApplications("startup-b")).toHaveLength(0);
  });

  it("does not let startup A's opportunity-derived task appear in startup B's task list", () => {
    const opp = seedOpp();
    const applicationA = upsertApplication("startup-a", opp.id, { status: "PREPARING" }, "2026-01-01T00:00:00.000Z");
    createPrepTaskForApplication("startup-a", applicationA.id, "2026-01-02T00:00:00.000Z");
    const tasksB = getTasksForStartup("startup-b").filter((t) => t.sourceType === "OPPORTUNITY_PREPARATION");
    expect(tasksB).toHaveLength(0);
  });
});
