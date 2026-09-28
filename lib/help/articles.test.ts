import { describe, expect, it } from "vitest";
import { getHelpArticle, listHelpArticles } from "./articles";

describe("Help Center: article lookup + FR/EN completeness", () => {
  it("looks up a known article by id", () => {
    expect(getHelpArticle("help-readiness-scoring")?.category).toBe("READINESS");
  });

  it("returns undefined for an unknown id", () => {
    expect(getHelpArticle("nope")).toBeUndefined();
  });

  it("every article has non-empty EN and FR title/body and at least one keyword", () => {
    for (const article of listHelpArticles()) {
      expect(article.title.en.length).toBeGreaterThan(0);
      expect(article.title.fr.length).toBeGreaterThan(0);
      expect(article.body.en.length).toBeGreaterThan(0);
      expect(article.body.fr.length).toBeGreaterThan(0);
      expect(article.keywords.length).toBeGreaterThan(0);
    }
  });

  it("has unique stable, locale-neutral ids", () => {
    const ids = listHelpArticles().map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^help-[a-z0-9-]+$/);
    }
  });
});
