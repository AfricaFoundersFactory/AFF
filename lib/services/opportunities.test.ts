import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetOpportunitiesStoreForTests,
  __reseedDemoOpportunitiesForTests,
  createOpportunity,
  createPrepTaskForApplication,
  isSaved,
  listApplications,
  listOpportunities,
  listSaved,
  saveOpportunity,
  unsaveOpportunity,
  upsertApplication,
} from "./opportunities";

describe("Opportunities: saving", () => {
  beforeEach(() => __resetOpportunitiesStoreForTests());

  it("saves and unsaves without duplicates", () => {
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

    saveOpportunity("startup-a", opp.id, "2026-01-01T00:00:00.000Z");
    saveOpportunity("startup-a", opp.id, "2026-01-02T00:00:00.000Z"); // duplicate save is a no-op
    expect(listSaved("startup-a")).toHaveLength(1);
    expect(isSaved("startup-a", opp.id)).toBe(true);

    unsaveOpportunity("startup-a", opp.id);
    expect(listSaved("startup-a")).toHaveLength(0);
    expect(isSaved("startup-a", opp.id)).toBe(false);
  });
});

describe("Opportunities: startup isolation", () => {
  beforeEach(() => __resetOpportunitiesStoreForTests());

  it("does not let startup A's saved opportunities or applications leak into startup B", () => {
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
    saveOpportunity("startup-a", opp.id, "2026-01-01T00:00:00.000Z");
    upsertApplication("startup-a", opp.id, { status: "INTERESTED" }, "2026-01-01T00:00:00.000Z");

    expect(listSaved("startup-b")).toHaveLength(0);
    expect(listApplications("startup-b")).toHaveLength(0);
    expect(isSaved("startup-b", opp.id)).toBe(false);
  });
});

describe("Opportunities: application tracking", () => {
  beforeEach(() => __resetOpportunitiesStoreForTests());

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

  it("creates a single application per opportunity and updates it in place on repeat calls", () => {
    const opp = seedOpp();
    const first = upsertApplication("startup-a", opp.id, { status: "INTERESTED" }, "2026-01-01T00:00:00.000Z");
    const second = upsertApplication("startup-a", opp.id, { status: "PREPARING" }, "2026-01-02T00:00:00.000Z");
    expect(first.id).toBe(second.id);
    expect(listApplications("startup-a")).toHaveLength(1);
    expect(second.status).toBe("PREPARING");
  });

  it("rejects an invalid status transition", () => {
    const opp = seedOpp();
    upsertApplication("startup-a", opp.id, { status: "REJECTED" }, "2026-01-01T00:00:00.000Z");
    expect(() => upsertApplication("startup-a", opp.id, { status: "APPLIED" }, "2026-01-02T00:00:00.000Z")).toThrow();
  });

  it("allows a valid forward transition", () => {
    const opp = seedOpp();
    upsertApplication("startup-a", opp.id, { status: "INTERESTED" }, "2026-01-01T00:00:00.000Z");
    const updated = upsertApplication("startup-a", opp.id, { status: "PREPARING" }, "2026-01-02T00:00:00.000Z");
    expect(updated.status).toBe("PREPARING");
  });

  it("creates a preparation task and prevents duplicate task creation", () => {
    const opp = seedOpp();
    const application = upsertApplication("startup-a", opp.id, { status: "PREPARING" }, "2026-01-01T00:00:00.000Z");
    const { task, application: updated } = createPrepTaskForApplication("startup-a", application.id, "2026-01-02T00:00:00.000Z");
    expect(updated.taskId).toBe(task.id);
    expect(task.sourceType).toBe("OPPORTUNITY_PREPARATION");

    expect(() => createPrepTaskForApplication("startup-a", application.id, "2026-01-03T00:00:00.000Z")).toThrow();
  });
});

describe("Opportunities: deterministic demo seeding", () => {
  it("seeds a non-empty catalog of fictional, clearly labeled demo opportunities", () => {
    __reseedDemoOpportunitiesForTests();
    const opportunities = listOpportunities();
    expect(opportunities.length).toBeGreaterThanOrEqual(5);
    for (const o of opportunities) {
      expect(o.isDemo).toBe(true);
      expect(o.source).toBe("DEMO");
    }
  });
});
