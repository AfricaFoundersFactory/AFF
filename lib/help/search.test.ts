import { describe, expect, it } from "vitest";
import { filterHelpByCategory, searchHelpArticles } from "./search";
import { listHelpArticles } from "./articles";

describe("Help Center: search + category filtering", () => {
  const articles = listHelpArticles();

  it("finds the runway article by keyword", () => {
    const results = searchHelpArticles(articles, { search: "runway" });
    expect(results.some((a) => a.id === "help-financials-runway")).toBe(true);
  });

  it("finds articles in French too", () => {
    const results = searchHelpArticles(articles, { search: "trésorerie" });
    expect(results.some((a) => a.id === "help-financials-runway")).toBe(true);
  });

  it("filters by category", () => {
    const results = filterHelpByCategory(articles, "FINANCIALS");
    expect(results.every((a) => a.category === "FINANCIALS")).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  it("returns no results for a nonsense query", () => {
    expect(searchHelpArticles(articles, { search: "zzzznonexistentzzz" })).toHaveLength(0);
  });
});
