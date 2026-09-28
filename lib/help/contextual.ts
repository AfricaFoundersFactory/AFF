/**
 * Route -> Help Article lookup foundation (Part D of AFF-DASH-08). Only the
 * Help Center itself consumes this in this batch — adding "?" links to
 * every other page is explicitly out of scope (see the batch spec).
 */
import type { ContextualHelpEntry } from "@/types/help";
import { getHelpArticle } from "./articles";
import type { HelpArticle } from "@/types/help";

export const contextualHelpMap: ContextualHelpEntry[] = [
  { route: "/dashboard", articleId: "help-getting-started" },
  { route: "/dashboard/startup", articleId: "help-digital-twin" },
  { route: "/dashboard/readiness", articleId: "help-readiness-scoring" },
  { route: "/dashboard/roadmap", articleId: "help-roadmap-tasks" },
  { route: "/dashboard/tasks", articleId: "help-roadmap-tasks" },
  { route: "/dashboard/pitch", articleId: "help-pitch-lab" },
  { route: "/dashboard/financials", articleId: "help-financials-runway" },
  { route: "/dashboard/data-room", articleId: "help-data-room-completion" },
  { route: "/dashboard/experts", articleId: "help-expert-matching" },
  { route: "/dashboard/opportunities", articleId: "help-opportunities-matching" },
];

export function getContextualHelpArticle(route: string): HelpArticle | undefined {
  const entry = contextualHelpMap.find((e) => e.route === route);
  return entry ? getHelpArticle(entry.articleId) : undefined;
}
