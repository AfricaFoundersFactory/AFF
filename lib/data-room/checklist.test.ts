import { describe, expect, it } from "vitest";
import { buildChecklist, requirementsForStage } from "./checklist";
import type { DataRoomDocument } from "@/types/data-room";

describe("requirementsForStage", () => {
  it("does not require Series-A-only documents (cap table, previous investment docs) at idea stage", () => {
    const requirements = requirementsForStage("idea");
    const keys = requirements.map((r) => r.key);
    expect(keys).not.toContain("cap_table");
    expect(keys).not.toContain("previous_investment_docs");
    expect(keys).not.toContain("historical_financials");
    // But universally-relevant items are still expected.
    expect(keys).toContain("pitch_deck");
    expect(keys).toContain("founder_info");
    expect(keys).toContain("forecast");
  });

  it("requires more documents at growth stage than idea stage", () => {
    const idea = requirementsForStage("idea");
    const growth = requirementsForStage("growth");
    expect(growth.length).toBeGreaterThan(idea.length);
    expect(requirementsForStage("growth").map((r) => r.key)).toContain("previous_investment_docs");
  });
});

describe("buildChecklist", () => {
  it("marks a requirement missing when no document exists for it", () => {
    const checklist = buildChecklist("s1", "idea", []);
    expect(checklist.items.every((i) => i.status === "missing")).toBe(true);
  });

  it("uses a document's actual status when one is linked via requirementKey", () => {
    const documents: DataRoomDocument[] = [
      {
        id: "doc1",
        startupId: "s1",
        category: "fundraising",
        title: "Pitch Deck",
        status: "available",
        visibility: "private",
        requirementKey: "pitch_deck",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        versions: [],
        source: "founder_upload",
      },
    ];
    const checklist = buildChecklist("s1", "idea", documents);
    const item = checklist.items.find((i) => i.requirement.key === "pitch_deck");
    expect(item?.status).toBe("available");
    expect(item?.documentId).toBe("doc1");
  });
});
