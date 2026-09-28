import type { HelpArticle, HelpCategory } from "@/types/help";

export type HelpFilters = {
  category?: HelpCategory;
  search?: string;
};

/**
 * Deterministic keyword search over title/body/keywords, both locales —
 * no ranking algorithm, no AI, just a case-insensitive substring match
 * across the article's searchable text.
 */
export function searchHelpArticles(articles: HelpArticle[], filters: HelpFilters): HelpArticle[] {
  return articles.filter((a) => {
    if (filters.category && a.category !== filters.category) return false;
    if (filters.search) {
      const needle = filters.search.toLowerCase();
      const haystack = `${a.title.en} ${a.title.fr} ${a.body.en} ${a.body.fr} ${a.keywords.join(" ")}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export function filterHelpByCategory(articles: HelpArticle[], category: HelpCategory): HelpArticle[] {
  return articles.filter((a) => a.category === category);
}
