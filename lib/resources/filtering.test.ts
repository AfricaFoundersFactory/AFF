import { describe, expect, it } from "vitest";
import { filterResources } from "./filtering";
import type { Resource } from "@/types/resources";

function res(overrides: Partial<Resource>): Resource {
  return {
    id: "res-a",
    title: { en: "Fundraising Checklist", fr: "Liste de vérification" },
    description: { en: "d", fr: "d" },
    category: "FUNDRAISING",
    format: "CHECKLIST",
    stages: ["mvp"],
    origin: "AFF_RESOURCE",
    languages: ["en", "fr"],
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("filterResources", () => {
  it("filters by category, format and stage", () => {
    const resources = [res({ id: "a" }), res({ id: "b", category: "LEGAL", format: "TEMPLATE", stages: ["growth"] })];
    expect(filterResources(resources, { category: "LEGAL" }).map((r) => r.id)).toEqual(["b"]);
    expect(filterResources(resources, { format: "CHECKLIST" }).map((r) => r.id)).toEqual(["a"]);
    expect(filterResources(resources, { stage: "mvp" }).map((r) => r.id)).toEqual(["a"]);
  });

  it("stage:ANY resources always pass a stage filter", () => {
    const resources = [res({ id: "any", stages: ["ANY"] })];
    expect(filterResources(resources, { stage: "growth" }).map((r) => r.id)).toEqual(["any"]);
  });

  it("searches title/description case-insensitively", () => {
    const resources = [res({ id: "a" })];
    expect(filterResources(resources, { search: "fundraising" }).map((r) => r.id)).toEqual(["a"]);
    expect(filterResources(resources, { search: "zzz" })).toHaveLength(0);
  });
});
