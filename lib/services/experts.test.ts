import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetExpertsStoreForTests,
  createExpertProfile,
  declareFounderNeed,
  getExpert,
  listExperts,
  listStartupNeeds,
  markProfileReviewed,
  updateNeedStatus,
  verifyExpert,
} from "./experts";

describe("expert directory", () => {
  beforeEach(() => {
    __resetExpertsStoreForTests();
  });

  function seed() {
    const nowIso = "2026-01-01T00:00:00.000Z";
    const a = createExpertProfile(
      {
        displayName: "A",
        headline: "h",
        bio: "b",
        country: "Kenya",
        languages: ["en"],
        expertise: ["FUNDRAISING"],
        industries: ["FINTECH"],
        startupStages: ["mvp"],
        markets: ["Kenya"],
        availability: "AVAILABLE",
        mentoringFormats: ["VIDEO_CALL"],
      },
      nowIso,
    );
    const b = createExpertProfile(
      {
        displayName: "B",
        headline: "h",
        bio: "b",
        country: "Ghana",
        languages: ["fr"],
        expertise: ["LEGAL"],
        industries: [],
        startupStages: ["growth"],
        markets: ["Ghana"],
        availability: "UNAVAILABLE",
        mentoringFormats: ["CHAT"],
      },
      nowIso,
    );
    return { a, b };
  }

  it("retrieves a created profile by id", () => {
    const { a } = seed();
    expect(getExpert(a.id)?.displayName).toBe("A");
  });

  it("new profiles start UNVERIFIED without any explicit action", () => {
    const { a } = seed();
    expect(getExpert(a.id)?.verificationStatus).toBe("UNVERIFIED");
  });

  it("verifyExpert is the only path to AFF_VERIFIED", () => {
    const { a } = seed();
    expect(getExpert(a.id)?.verificationStatus).toBe("UNVERIFIED");
    const verified = verifyExpert(a.id, "2026-01-02T00:00:00.000Z");
    expect(verified.verificationStatus).toBe("AFF_VERIFIED");
  });

  it("markProfileReviewed sets PROFILE_REVIEWED, distinct from AFF_VERIFIED", () => {
    const { b } = seed();
    const reviewed = markProfileReviewed(b.id, "2026-01-02T00:00:00.000Z");
    expect(reviewed.verificationStatus).toBe("PROFILE_REVIEWED");
  });

  it("filters by expertise", () => {
    seed();
    const results = listExperts({ expertise: "FUNDRAISING" });
    expect(results.map((e) => e.displayName)).toEqual(["A"]);
  });

  it("filters by language", () => {
    seed();
    expect(listExperts({ language: "fr" }).map((e) => e.displayName)).toEqual(["B"]);
  });

  it("filters by startup stage", () => {
    seed();
    expect(listExperts({ stage: "growth" }).map((e) => e.displayName)).toEqual(["B"]);
  });

  it("filters by availability", () => {
    seed();
    expect(listExperts({ availability: "AVAILABLE" }).map((e) => e.displayName)).toEqual(["A"]);
  });

  it("filters by industry", () => {
    seed();
    expect(listExperts({ industry: "FINTECH" }).map((e) => e.displayName)).toEqual(["A"]);
  });
});

describe("startup needs", () => {
  beforeEach(() => {
    __resetExpertsStoreForTests();
  });

  it("a founder-declared need is a valid path even with no live derived data for an unknown startup", () => {
    const need = declareFounderNeed("startup-unknown", { category: "PRODUCT", title: "Help" }, "2026-01-01T00:00:00.000Z");
    expect(need.status).toBe("OPEN");
    const needs = listStartupNeeds("startup-unknown", "2026-01-01T00:00:00.000Z");
    expect(needs.find((n) => n.id === need.id)).toBeDefined();
  });

  it("updateNeedStatus transitions a founder-declared need and stamps resolvedAt", () => {
    const need = declareFounderNeed("startup-unknown", { category: "PRODUCT", title: "Help" }, "2026-01-01T00:00:00.000Z");
    const updated = updateNeedStatus("startup-unknown", need.id, "RESOLVED", "2026-01-02T00:00:00.000Z");
    expect(updated.status).toBe("RESOLVED");
    expect(updated.resolvedAt).toBe("2026-01-02T00:00:00.000Z");
  });

  it("throws when trying to change the status of a need id that does not exist (e.g. a derived need)", () => {
    expect(() => updateNeedStatus("startup-unknown", "not-a-real-id", "DISMISSED", "2026-01-01T00:00:00.000Z")).toThrow();
  });
});
