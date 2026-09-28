import { describe, expect, it } from "vitest";
import { demoDigitalTwins } from "@/lib/demo/digital-twin";
import { buildInitialSections, detectSourceUpdates, prefillSection } from "./prefill";

const wakamaTwin = demoDigitalTwins["startup-wakama"];

describe("Digital Twin prefill", () => {
  it("copies the Digital Twin's problem statement into the problem section with traceability", () => {
    const { content, sourceReferences } = prefillSection("problem", wakamaTwin);
    expect(content).toContain(wakamaTwin.problem.statement);
    expect(sourceReferences.some((r) => r.fieldKey === "problem.statement")).toBe(true);
  });

  it("copies founders into the team section", () => {
    const { content } = prefillSection("team", wakamaTwin);
    expect(content).toContain(wakamaTwin.founders[0].firstName);
  });

  it("leaves hook/go_to_market/closing empty — no Digital Twin mapping exists for founder-authored sections", () => {
    expect(prefillSection("hook", wakamaTwin).content).toBe("");
    expect(prefillSection("go_to_market", wakamaTwin).content).toBe("");
    expect(prefillSection("closing", wakamaTwin).content).toBe("");
  });

  it("builds all 14 canonical sections for a new version", () => {
    const sections = buildInitialSections(wakamaTwin, "investor_deck", "fundraising");
    expect(sections).toHaveLength(14);
  });
});

describe("pitch edit does not mutate Digital Twin", () => {
  it("prefillSection is a pure read — the returned content is a new string, not a live reference mutation path", () => {
    const before = JSON.stringify(wakamaTwin);
    const sections = buildInitialSections(wakamaTwin, "investor_deck", "fundraising");
    // Simulate a founder heavily editing the prefilled narrative.
    sections[1].content = "Completely rewritten problem narrative that shares nothing with the original.";
    const after = JSON.stringify(wakamaTwin);
    expect(after).toBe(before);
  });
});

describe("source update detection", () => {
  it("detects no drift when nothing in the Digital Twin has changed since import", () => {
    const sections = buildInitialSections(wakamaTwin, "investor_deck", "fundraising");
    const problem = sections.find((s) => s.type === "problem")!;
    expect(detectSourceUpdates(problem, wakamaTwin)).toEqual([]);
  });

  it("detects drift when the Digital Twin's source field changes after import", () => {
    const sections = buildInitialSections(wakamaTwin, "investor_deck", "fundraising");
    const problem = sections.find((s) => s.type === "problem")!;
    const updatedTwin = { ...wakamaTwin, problem: { ...wakamaTwin.problem, statement: "A brand-new problem statement." } };
    const drifted = detectSourceUpdates(problem, updatedTwin);
    expect(drifted).toContain("problem.statement");
  });

  it("never mutates the section itself while checking for drift", () => {
    const sections = buildInitialSections(wakamaTwin, "investor_deck", "fundraising");
    const problem = sections.find((s) => s.type === "problem")!;
    const before = JSON.stringify(problem);
    const updatedTwin = { ...wakamaTwin, problem: { ...wakamaTwin.problem, statement: "Different." } };
    detectSourceUpdates(problem, updatedTwin);
    expect(JSON.stringify(problem)).toBe(before);
  });
});
