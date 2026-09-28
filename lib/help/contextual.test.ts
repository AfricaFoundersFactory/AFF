import { describe, expect, it } from "vitest";
import { contextualHelpMap, getContextualHelpArticle } from "./contextual";
import { getHelpArticle } from "./articles";

describe("Help Center: contextual help mapping", () => {
  it("maps every listed route to an article that actually exists", () => {
    for (const entry of contextualHelpMap) {
      expect(getHelpArticle(entry.articleId), `missing article for route ${entry.route}`).toBeDefined();
    }
  });

  it("returns the expected article for known routes", () => {
    expect(getContextualHelpArticle("/dashboard/readiness")?.id).toBe("help-readiness-scoring");
    expect(getContextualHelpArticle("/dashboard/financials")?.id).toBe("help-financials-runway");
    expect(getContextualHelpArticle("/dashboard/data-room")?.id).toBe("help-data-room-completion");
    expect(getContextualHelpArticle("/dashboard/experts")?.id).toBe("help-expert-matching");
    expect(getContextualHelpArticle("/dashboard/opportunities")?.id).toBe("help-opportunities-matching");
  });

  it("returns undefined for an unmapped route", () => {
    expect(getContextualHelpArticle("/dashboard/nonexistent")).toBeUndefined();
  });
});
