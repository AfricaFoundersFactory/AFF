import { beforeEach, describe, expect, it } from "vitest";
import { __resetInvestorInteractionsStoreForTests, listInteractions, recordInteraction } from "./investor-interactions";

const NOW = "2026-01-15T00:00:00.000Z";

beforeEach(() => {
  __resetInvestorInteractionsStoreForTests();
});

describe("investor-interactions service", () => {
  it("records a founder-entered interaction", () => {
    const interaction = recordInteraction(
      "startup-a",
      { investorId: "inv-1", type: "CALL", occurredAt: "2026-01-10T00:00:00.000Z", summary: "Intro call", createdBy: "founder-1" },
      NOW,
    );
    expect(interaction.type).toBe("CALL");
    expect(interaction.createdBy).toBe("founder-1");
  });

  it("orders interactions newest-occurred first", () => {
    recordInteraction("startup-a", { investorId: "inv-1", type: "NOTE", occurredAt: "2026-01-01T00:00:00.000Z", summary: "First", createdBy: "f" }, NOW);
    recordInteraction("startup-a", { investorId: "inv-1", type: "NOTE", occurredAt: "2026-01-10T00:00:00.000Z", summary: "Second", createdBy: "f" }, NOW);
    recordInteraction("startup-a", { investorId: "inv-1", type: "NOTE", occurredAt: "2026-01-05T00:00:00.000Z", summary: "Third", createdBy: "f" }, NOW);
    const ordered = listInteractions("startup-a").map((i) => i.summary);
    expect(ordered).toEqual(["Second", "Third", "First"]);
  });

  it("filters interactions by investor within a startup", () => {
    recordInteraction("startup-a", { investorId: "inv-1", type: "NOTE", occurredAt: NOW, summary: "For inv-1", createdBy: "f" }, NOW);
    recordInteraction("startup-a", { investorId: "inv-2", type: "NOTE", occurredAt: NOW, summary: "For inv-2", createdBy: "f" }, NOW);
    expect(listInteractions("startup-a", "inv-1")).toHaveLength(1);
  });

  it("isolates interactions per startup", () => {
    recordInteraction("startup-a", { investorId: "inv-1", type: "NOTE", occurredAt: NOW, summary: "A", createdBy: "f" }, NOW);
    recordInteraction("startup-b", { investorId: "inv-1", type: "NOTE", occurredAt: NOW, summary: "B", createdBy: "f" }, NOW);
    expect(listInteractions("startup-a")).toHaveLength(1);
    expect(listInteractions("startup-b")).toHaveLength(1);
    expect(listInteractions("startup-a")[0].summary).toBe("A");
  });
});
