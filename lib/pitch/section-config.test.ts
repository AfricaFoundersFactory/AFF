import { describe, expect, it } from "vitest";
import { applicableSectionTypes, ALL_SECTION_TYPES } from "./section-config";

describe("applicable sections by pitch type", () => {
  it("does not force all 14 sections on a short elevator/one-minute pitch", () => {
    const sections = applicableSectionTypes("elevator", "general");
    expect(sections.length).toBeLessThan(ALL_SECTION_TYPES.length);
    expect(sections).toContain("hook");
    expect(sections).toContain("problem");
    expect(sections).not.toContain("financials");
  });

  it("requires nearly all sections for an investor deck", () => {
    const sections = applicableSectionTypes("investor_deck", "fundraising");
    expect(sections.length).toBe(ALL_SECTION_TYPES.length);
  });

  it("always includes the ask when the objective is fundraising, even for a short format", () => {
    const sections = applicableSectionTypes("elevator", "fundraising");
    expect(sections).toContain("fundraising_ask");
  });

  it("gives the 3-minute format a materially different section set than the 5-minute format", () => {
    const three = applicableSectionTypes("three_minute", "general");
    const five = applicableSectionTypes("five_minute", "general");
    expect(three.length).toBeLessThan(five.length);
  });
});
