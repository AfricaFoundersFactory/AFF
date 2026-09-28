// AFF Help Center domain model (AFF-DASH-08 Part D).
//
// Product help only — distinct from Experts (human mentoring),
// Messages (founder inbox) and Resources (knowledge hub). Articles
// document the ACTUAL implemented behavior of each module (see each
// article's `id` naming and lib/help/articles.ts's file header for the
// source file each article was checked against).

export type HelpCategory =
  | "GETTING_STARTED"
  | "MY_STARTUP"
  | "READINESS"
  | "ROADMAP_TASKS"
  | "PITCH"
  | "FINANCIALS"
  | "DATA_ROOM"
  | "EXPERTS"
  | "OPPORTUNITIES"
  | "ACCOUNT";

export type LocalizedText = { en: string; fr: string };

export type HelpArticle = {
  id: string; // stable, locale-neutral
  category: HelpCategory;
  title: LocalizedText;
  body: LocalizedText;
  // Free-text keyword list (locale-neutral topic tags) used by the search
  // engine — not a full-text index, just a small deterministic match set.
  keywords: string[];
};

// A route -> help article lookup, so any future page can surface
// contextual help without re-deriving the mapping. Only the Help Center
// itself consumes this in this batch (see PART D of the spec — adding "?"
// links to every other page is explicitly out of scope).
export type ContextualHelpEntry = {
  route: string;
  articleId: string;
};
