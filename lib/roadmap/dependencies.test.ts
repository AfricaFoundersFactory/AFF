import { describe, expect, it } from "vitest";
import { wouldCreateCycle, validateDependencies } from "./dependencies";
import type { RoadmapItem } from "@/types/roadmap";

function item(id: string, dependencies: string[] = []): Pick<RoadmapItem, "id" | "dependencies"> {
  return { id, dependencies };
}

describe("wouldCreateCycle", () => {
  it("rejects a direct 2-node cycle (A depends on B, B would depend on A)", () => {
    const items = [item("A", ["B"]), item("B")];
    expect(wouldCreateCycle(items, "B", "A")).toBe(true);
  });

  it("rejects a 3+ node cycle (A -> B -> C, C would depend on A)", () => {
    const items = [item("A", ["B"]), item("B", ["C"]), item("C")];
    expect(wouldCreateCycle(items, "C", "A")).toBe(true);
  });

  it("allows a non-cyclic dependency", () => {
    const items = [item("A"), item("B")];
    expect(wouldCreateCycle(items, "A", "B")).toBe(false);
  });

  it("rejects an item depending on itself", () => {
    const items = [item("A")];
    expect(wouldCreateCycle(items, "A", "A")).toBe(true);
  });
});

describe("validateDependencies", () => {
  it("flags items that are part of a cycle", () => {
    const items = [
      { id: "A", dependencies: ["B"] },
      { id: "B", dependencies: ["A"] },
    ] as RoadmapItem[];
    const result = validateDependencies(items);
    expect(result.valid).toBe(false);
    expect(result.cycleItemIds).toContain("A");
  });

  it("passes a valid dependency graph", () => {
    const items = [
      { id: "A", dependencies: [] },
      { id: "B", dependencies: ["A"] },
      { id: "C", dependencies: ["B"] },
    ] as RoadmapItem[];
    expect(validateDependencies(items).valid).toBe(true);
  });
});
