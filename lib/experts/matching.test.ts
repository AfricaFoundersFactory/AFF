import { describe, expect, it } from "vitest";
import { matchExperts, matchExpertsForCategory, type StartupMatchContext } from "./matching";
import type { ExpertProfile, StartupNeed } from "@/types/experts";

function expert(overrides: Partial<ExpertProfile>): ExpertProfile {
  return {
    id: "e-default",
    displayName: "Demo Expert",
    headline: "Demo headline",
    bio: "Demo bio",
    country: "Nigeria",
    languages: ["en"],
    expertise: [],
    industries: [],
    startupStages: [],
    markets: [],
    availability: "AVAILABLE",
    mentoringFormats: [],
    profileStatus: "ACTIVE",
    verificationStatus: "UNVERIFIED",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function need(category: StartupNeed["category"]): StartupNeed {
  return {
    id: `need-${category}`,
    startupId: "startup-x",
    sourceType: "FOUNDER_DECLARED",
    category,
    title: "",
    description: "",
    urgency: "MEDIUM",
    status: "OPEN",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

const baseCtx: StartupMatchContext = {
  stage: "mvp",
  industries: [],
  languages: ["en"],
  markets: [],
  needs: [],
};

describe("matchExperts", () => {
  it("is deterministic — same inputs always produce the same output", () => {
    const directory = [
      expert({ id: "e1", expertise: ["FUNDRAISING"], startupStages: ["mvp"] }),
      expert({ id: "e2", expertise: ["FUNDRAISING", "PITCHING"], startupStages: ["mvp"] }),
    ];
    const ctx: StartupMatchContext = { ...baseCtx, needs: [need("FUNDRAISING")] };
    const run1 = matchExperts(directory, ctx);
    const run2 = matchExperts(directory, ctx);
    expect(run1).toEqual(run2);
  });

  it("orders experts with more matching reasons first, ties broken by expert id", () => {
    const directory = [
      expert({ id: "e-zzz", expertise: ["FUNDRAISING"], startupStages: ["mvp"] }),
      expert({ id: "e-aaa", expertise: ["FUNDRAISING"], startupStages: ["mvp"] }),
      // e-bbb matches BOTH needed categories, so it has one more substantive
      // reason than e-zzz/e-aaa (who tie and are broken by id).
      expert({ id: "e-bbb", expertise: ["FUNDRAISING", "PITCHING"], startupStages: ["mvp"] }),
    ];
    const ctx: StartupMatchContext = { ...baseCtx, needs: [need("FUNDRAISING"), need("PITCHING")] };
    const result = matchExperts(directory, ctx);
    expect(result[0].expert.id).toBe("e-bbb");
    expect(result[1].expert.id).toBe("e-aaa");
    expect(result[2].expert.id).toBe("e-zzz");
  });

  it("excludes non-active profiles and experts with no SUBSTANTIVE matching reason", () => {
    const directory = [
      expert({ id: "inactive", expertise: ["FUNDRAISING"], profileStatus: "INACTIVE" }),
      // Shares a language and is available, but has no expertise/stage/
      // industry/market overlap — language+availability alone must never
      // count as "relevant to your needs".
      expert({ id: "unrelated", expertise: ["LEGAL"], startupStages: [] }),
    ];
    const ctx: StartupMatchContext = { ...baseCtx, needs: [need("FUNDRAISING")] };
    expect(matchExperts(directory, ctx)).toEqual([]);
  });

  it("never counts language/availability alone as a match, but includes them alongside a substantive reason", () => {
    const directory = [expert({ id: "e1", expertise: ["FUNDRAISING"], startupStages: ["mvp"] })];
    const ctx: StartupMatchContext = { ...baseCtx, needs: [need("FUNDRAISING")] };
    const [match] = matchExperts(directory, ctx);
    const keys = match.reasons.map((r) => r.key);
    expect(keys).toContain("language:en");
    expect(keys).toContain("availability");
  });

  it("generates a human-readable reason per matching factor, never a score or percentage", () => {
    const directory = [
      expert({
        id: "e1",
        expertise: ["FUNDRAISING"],
        startupStages: ["mvp"],
        industries: ["FINTECH"],
        markets: ["Senegal"],
        languages: ["fr"],
        availability: "AVAILABLE",
      }),
    ];
    const ctx: StartupMatchContext = {
      stage: "mvp",
      industries: ["FINTECH"],
      languages: ["fr"],
      markets: ["Senegal"],
      needs: [need("FUNDRAISING")],
    };
    const [match] = matchExperts(directory, ctx);
    const keys = match.reasons.map((r) => r.key);
    expect(keys).toContain("expertise:FUNDRAISING");
    expect(keys).toContain("stage");
    expect(keys).toContain("industry:FINTECH");
    expect(keys).toContain("market:Senegal");
    expect(keys).toContain("language:fr");
    expect(keys).toContain("availability");
    // Never a numeric score/percentage anywhere on the match result.
    expect(match).not.toHaveProperty("score");
    expect(match).not.toHaveProperty("percentage");
    expect(JSON.stringify(match)).not.toMatch(/%/);
  });

  it("never reads or reasons about a sensitive attribute (none exists on ExpertProfile)", () => {
    const profileKeys = Object.keys(
      expert({ id: "e1", expertise: ["FUNDRAISING"] }),
    );
    for (const forbidden of ["gender", "ethnicity", "religion", "age", "race"]) {
      expect(profileKeys).not.toContain(forbidden);
    }
  });
});

describe("matchExpertsForCategory", () => {
  it("matches on a single manually-picked category without requiring a StartupNeed list", () => {
    const directory = [expert({ id: "e1", expertise: ["LEGAL"] })];
    const result = matchExpertsForCategory(directory, "LEGAL", { stage: "mvp", industries: [], languages: [], markets: [] });
    expect(result).toHaveLength(1);
    expect(result[0].reasons.some((r) => r.key === "expertise:LEGAL")).toBe(true);
  });
});
