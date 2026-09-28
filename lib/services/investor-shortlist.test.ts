import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetShortlistStoreForTests,
  addToShortlist,
  getShortlistEntry,
  isShortlisted,
  listShortlist,
  removeFromShortlist,
  updateShortlistEntry,
} from "./investor-shortlist";

const NOW = "2026-01-15T00:00:00.000Z";

beforeEach(() => {
  __resetShortlistStoreForTests();
});

describe("investor-shortlist service", () => {
  it("adds an investor to a startup's shortlist", () => {
    const entry = addToShortlist("startup-a", "inv-1", {}, NOW);
    expect(entry.startupId).toBe("startup-a");
    expect(entry.priority).toBe("MEDIUM");
    expect(isShortlisted("startup-a", "inv-1")).toBe(true);
  });

  it("prevents duplicate shortlist entries for the same investor", () => {
    const first = addToShortlist("startup-a", "inv-1", { priority: "HIGH" }, NOW);
    const second = addToShortlist("startup-a", "inv-1", { priority: "LOW" }, NOW);
    expect(second.id).toBe(first.id);
    expect(listShortlist("startup-a")).toHaveLength(1);
  });

  it("removes an investor from the shortlist", () => {
    addToShortlist("startup-a", "inv-1", {}, NOW);
    removeFromShortlist("startup-a", "inv-1");
    expect(isShortlisted("startup-a", "inv-1")).toBe(false);
  });

  it("stores founder notes, priority, and next action", () => {
    addToShortlist("startup-a", "inv-1", {}, NOW);
    const updated = updateShortlistEntry("startup-a", "inv-1", { priority: "HIGH", note: "Warm intro via demo day", nextAction: "Send deck", nextActionAt: "2026-02-01" }, NOW);
    expect(updated.priority).toBe("HIGH");
    expect(updated.note).toBe("Warm intro via demo day");
    expect(updated.nextAction).toBe("Send deck");
  });

  it("keeps shortlists strictly isolated per startup", () => {
    addToShortlist("startup-a", "inv-1", {}, NOW);
    addToShortlist("startup-b", "inv-2", {}, NOW);

    expect(listShortlist("startup-a").map((e) => e.investorId)).toEqual(["inv-1"]);
    expect(listShortlist("startup-b").map((e) => e.investorId)).toEqual(["inv-2"]);
    expect(getShortlistEntry("startup-a", "inv-2")).toBeUndefined();
    expect(getShortlistEntry("startup-b", "inv-1")).toBeUndefined();

    // Removing from one startup never affects the other.
    removeFromShortlist("startup-a", "inv-1");
    expect(listShortlist("startup-b")).toHaveLength(1);
  });
});
