import { describe, expect, it } from "vitest";
import {
  EXPERTISE_CATEGORY_IDS,
  INDUSTRY_EXPERTISE_IDS,
  READINESS_DIMENSION_TO_EXPERTISE,
  isValidExpertiseCategory,
  labelKeyForExpertise,
} from "./taxonomy";
import { DIMENSION_KEYS } from "@/types/readiness-engine";

describe("expertise taxonomy", () => {
  it("has no duplicate category ids", () => {
    expect(new Set(EXPERTISE_CATEGORY_IDS).size).toBe(EXPERTISE_CATEGORY_IDS.length);
  });

  it("industry subset is entirely contained in the full taxonomy", () => {
    for (const id of INDUSTRY_EXPERTISE_IDS) {
      expect(EXPERTISE_CATEGORY_IDS).toContain(id);
    }
  });

  it("validates known and unknown ids", () => {
    expect(isValidExpertiseCategory("FUNDRAISING")).toBe(true);
    expect(isValidExpertiseCategory("NOT_A_CATEGORY")).toBe(false);
  });

  it("produces a stable, locale-neutral i18n key per category", () => {
    expect(labelKeyForExpertise("FUNDRAISING")).toBe("dashboard.experts.expertise.FUNDRAISING");
  });

  it("maps every AFF Readiness dimension to at least one expertise category", () => {
    for (const dimension of DIMENSION_KEYS) {
      const mapped = READINESS_DIMENSION_TO_EXPERTISE[dimension];
      expect(mapped).toBeDefined();
      expect(mapped.length).toBeGreaterThan(0);
      for (const category of mapped) {
        expect(EXPERTISE_CATEGORY_IDS).toContain(category);
      }
    }
  });
});
