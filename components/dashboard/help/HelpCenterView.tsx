"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { searchHelpArticles } from "@/lib/help/search";
import type { ContextualHelpEntry, HelpArticle, HelpCategory } from "@/types/help";

const CATEGORIES: HelpCategory[] = [
  "GETTING_STARTED",
  "MY_STARTUP",
  "READINESS",
  "ROADMAP_TASKS",
  "PITCH",
  "FINANCIALS",
  "DATA_ROOM",
  "EXPERTS",
  "OPPORTUNITIES",
  "ACCOUNT",
];

const CONTACT_EMAIL = "contact@africafoundersfactory.com";

export function HelpCenterView({ articles, contextualHelpMap }: { articles: HelpArticle[]; contextualHelpMap: ContextualHelpEntry[] }) {
  const t = useTranslations("dashboard.help");
  const locale = useLocale() as "en" | "fr";
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<HelpCategory | "">("");
  const [expandedId, setExpandedId] = useState<string | undefined>(undefined);

  const contextualEntry = contextualHelpMap.find((e) => e.route === pathname);
  const contextualArticle = contextualEntry ? articles.find((a) => a.id === contextualEntry.articleId) : undefined;

  const results = useMemo(
    () => searchHelpArticles(articles, { search: search || undefined, category: category || undefined }),
    [articles, search, category],
  );

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-aff-text sm:text-[28px]">{t("pageTitle")}</h1>
        <p className="mt-1.5 text-[14.5px] text-aff-muted">{t("pageSubtitle")}</p>
      </div>

      {contextualArticle && (
        <DashboardSection title={t("relevantHereTitle")}>
          <ArticleRow article={contextualArticle} locale={locale} expanded expandedId={expandedId} setExpandedId={setExpandedId} />
        </DashboardSection>
      )}

      <DashboardSection title={t("searchTitle")}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-lg border border-aff-line bg-aff-bg2 px-4 py-3 text-[14px] text-aff-text focus:border-aff-accent"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as HelpCategory | "")}
            className="rounded-lg border border-aff-line bg-aff-bg2 px-3 py-3 text-[13.5px] text-aff-text"
          >
            <option value="">{t("allCategories")}</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`categories.${c}`)}
              </option>
            ))}
          </select>
        </div>
      </DashboardSection>

      <DashboardSection title={t("articlesTitle")}>
        {results.length === 0 ? (
          <EmptyState title={t("noResultsTitle")} body={t("noResultsBody")} />
        ) : (
          <div className="flex flex-col gap-2">
            {results.map((article) => (
              <ArticleRow
                key={article.id}
                article={article}
                locale={locale}
                expanded={expandedId === article.id}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
              />
            ))}
          </div>
        )}
      </DashboardSection>

      <DashboardSection title={t("contactTitle")}>
        <p className="text-[13.5px] text-aff-muted">{t("contactHonestCopy")}</p>
        <a href={`mailto:${CONTACT_EMAIL}`} className="mt-2 inline-block text-[13.5px] font-semibold text-aff-accent hover:text-aff-accent-hover">
          {CONTACT_EMAIL}
        </a>
      </DashboardSection>
    </div>
  );
}

function ArticleRow({
  article,
  locale,
  expanded,
  expandedId,
  setExpandedId,
}: {
  article: HelpArticle;
  locale: "en" | "fr";
  expanded: boolean;
  expandedId: string | undefined;
  setExpandedId: (id: string | undefined) => void;
}) {
  const isOpen = expanded || expandedId === article.id;
  return (
    <div className="rounded-xl border border-aff-line p-4">
      <button
        onClick={() => setExpandedId(isOpen ? undefined : article.id)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="text-[14px] font-semibold text-aff-text">{article.title[locale]}</span>
        <span className="text-[12px] text-aff-muted">{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && <p className="mt-2 text-[13px] leading-relaxed text-aff-muted">{article.body[locale]}</p>}
    </div>
  );
}
