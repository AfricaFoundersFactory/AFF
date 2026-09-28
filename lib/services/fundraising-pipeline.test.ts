import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetFundraisingPipelineStoreForTests,
  createPipelineEntry,
  createRound,
  getPipelineEntry,
  listPipeline,
  listRounds,
  moveStage,
  updatePipelineEntry,
  updateRound,
  updateRoundStatus,
} from "./fundraising-pipeline";

const NOW = "2026-01-15T00:00:00.000Z";

beforeEach(() => {
  __resetFundraisingPipelineStoreForTests();
});

describe("fundraising rounds", () => {
  it("creates a round in PLANNING status", () => {
    const round = createRound("startup-a", { name: "Seed", targetAmount: { amount: 300_000, currency: "USD" } }, NOW);
    expect(round.status).toBe("PLANNING");
  });

  it("transitions round status explicitly", () => {
    const round = createRound("startup-a", { name: "Seed", targetAmount: { amount: 300_000, currency: "USD" } }, NOW);
    const updated = updateRoundStatus("startup-a", round.id, "ACTIVE", NOW);
    expect(updated.status).toBe("ACTIVE");
  });

  it("isolates rounds per startup", () => {
    createRound("startup-a", { name: "Seed A", targetAmount: { amount: 1, currency: "USD" } }, NOW);
    createRound("startup-b", { name: "Seed B", targetAmount: { amount: 1, currency: "USD" } }, NOW);
    expect(listRounds("startup-a")).toHaveLength(1);
    expect(listRounds("startup-b")).toHaveLength(1);
    expect(listRounds("startup-a")[0].name).toBe("Seed A");
  });

  it("prevents a second ACTIVE round for the same startup", () => {
    const first = createRound("startup-a", { name: "Seed", targetAmount: { amount: 300_000, currency: "USD" } }, NOW);
    const second = createRound("startup-a", { name: "Bridge", targetAmount: { amount: 100_000, currency: "USD" } }, NOW);
    updateRoundStatus("startup-a", first.id, "ACTIVE", NOW);
    expect(() => updateRoundStatus("startup-a", second.id, "ACTIVE", NOW)).toThrow();
  });

  it("allows a new ACTIVE round once the prior one is CLOSED", () => {
    const first = createRound("startup-a", { name: "Seed", targetAmount: { amount: 300_000, currency: "USD" } }, NOW);
    const second = createRound("startup-a", { name: "Series A", targetAmount: { amount: 1_000_000, currency: "USD" } }, NOW);
    updateRoundStatus("startup-a", first.id, "ACTIVE", NOW);
    updateRoundStatus("startup-a", first.id, "CLOSED", NOW);
    expect(() => updateRoundStatus("startup-a", second.id, "ACTIVE", NOW)).not.toThrow();
  });

  it("does not let two startups' active-round rules collide with each other", () => {
    const roundA = createRound("startup-a", { name: "Seed A", targetAmount: { amount: 1, currency: "USD" } }, NOW);
    const roundB = createRound("startup-b", { name: "Seed B", targetAmount: { amount: 1, currency: "USD" } }, NOW);
    updateRoundStatus("startup-a", roundA.id, "ACTIVE", NOW);
    expect(() => updateRoundStatus("startup-b", roundB.id, "ACTIVE", NOW)).not.toThrow();
  });

  it("edits round fields via updateRound", () => {
    const round = createRound("startup-a", { name: "Seed", targetAmount: { amount: 300_000, currency: "USD" } }, NOW);
    const updated = updateRound("startup-a", round.id, { name: "Seed Extension", notes: "Extended after bridge interest" }, NOW);
    expect(updated.name).toBe("Seed Extension");
    expect(updated.notes).toBe("Extended after bridge interest");
    expect(updated.targetAmount).toEqual({ amount: 300_000, currency: "USD" });
  });
});

describe("fundraising pipeline entries", () => {
  it("creates a relationship defaulting to RESEARCH stage", () => {
    const entry = createPipelineEntry("startup-a", { investorId: "inv-1", ownerFounderId: "founder-1" }, NOW);
    expect(entry.stage).toBe("RESEARCH");
  });

  it("moves a relationship's stage", () => {
    const entry = createPipelineEntry("startup-a", { investorId: "inv-1", ownerFounderId: "founder-1" }, NOW);
    const moved = moveStage("startup-a", entry.id, "CONTACTED", NOW);
    expect(moved.stage).toBe("CONTACTED");
  });

  it("prevents a duplicate ACTIVE pipeline relationship for the same startup+investor+round", () => {
    createPipelineEntry("startup-a", { investorId: "inv-1", ownerFounderId: "founder-1" }, NOW);
    expect(() => createPipelineEntry("startup-a", { investorId: "inv-1", ownerFounderId: "founder-1" }, NOW)).toThrow();
  });

  it("allows a new relationship once the prior one reached a terminal stage", () => {
    const first = createPipelineEntry("startup-a", { investorId: "inv-1", ownerFounderId: "founder-1" }, NOW);
    moveStage("startup-a", first.id, "PASSED", NOW);
    expect(() => createPipelineEntry("startup-a", { investorId: "inv-1", ownerFounderId: "founder-1" }, NOW)).not.toThrow();
  });

  it("allows parallel relationships with the same investor under different fundraising rounds", () => {
    createPipelineEntry("startup-a", { investorId: "inv-1", ownerFounderId: "founder-1", fundraisingRoundId: "round-1" }, NOW);
    expect(() =>
      createPipelineEntry("startup-a", { investorId: "inv-1", ownerFounderId: "founder-1", fundraisingRoundId: "round-2" }, NOW),
    ).not.toThrow();
  });

  it("sets and updates next action", () => {
    const entry = createPipelineEntry("startup-a", { investorId: "inv-1", ownerFounderId: "founder-1" }, NOW);
    const updated = updatePipelineEntry("startup-a", entry.id, { nextAction: "Send follow-up", nextActionAt: "2026-02-01" }, NOW);
    expect(updated.nextAction).toBe("Send follow-up");
  });

  it("isolates pipeline entries per startup", () => {
    createPipelineEntry("startup-a", { investorId: "inv-1", ownerFounderId: "founder-1" }, NOW);
    createPipelineEntry("startup-b", { investorId: "inv-1", ownerFounderId: "founder-2" }, NOW);
    expect(listPipeline("startup-a")).toHaveLength(1);
    expect(listPipeline("startup-b")).toHaveLength(1);
    const crossLookup = getPipelineEntry("startup-a", listPipeline("startup-b")[0].id);
    expect(crossLookup).toBeUndefined();
  });
});
