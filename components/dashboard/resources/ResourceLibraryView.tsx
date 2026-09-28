"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useStartup } from "@/components/dashboard/StartupContext";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";
import { filterResources, type ResourceFilters } from "@/lib/resources/filtering";
import { bookmarkResourceAction, createTaskFromResourceAction, unbookmarkResourceAction } from "@/lib/actions/resources";
import type { Resource, ResourceCategory, ResourceFormat, ResourceRecommendation } from "@/types/resources";

export type ResourceLibraryEntry = {
  recommendations: ResourceRecommendation[];
  bookmarkedIds: string[];
  taskedIds: string[];
};

const CATEGORIES: ResourceCategory[] = [
  "STARTUP_BASICS",
  "PROBLEM_VALIDATION",
  "PRODUCT",
  "MARKET",
  "BUSINESS_MODEL",
  "SALES",
  "MARKETING",
  "FINANCE",
  "FUNDRAISING",
  "PITCH",
  "LEGAL",
  "OPERATIONS",
  "TEAM",
  "IMPACT_ESG",
];
const FORMATS: ResourceFormat[] = ["GUIDE", "CHECKLIST", "TEMPLATE", "VIDEO", "ARTICLE", "TOOL", "FRAMEWORK"];

type Tab = "recommended" | "all" | "saved";

export function ResourceLibraryView({
  resources,
  dataByStartupId,
}: {
  resources: Resource[];
  dataByStartupId: Record<string, ResourceLibraryEntry>;
}) {
  const { activeStartup } = useStartup();
  const entry = dataByStartupId[activeStartup.id];
  const t = useTranslations("dashboard.resources");
  const tRoot = useTranslations();
  const [tab, setTab] = useState<Tab>("recommended");
  const [filters, setFilters] = useState<ResourceFilters>({});
  const [bookmarkOverrides, setBookmarkOverrides] = useState<Record<string, boolean>>({});

  const bookmarkedIds = new Set(entry?.bookmarkedIds ?? []);
  const taskedIds = new Set(entry?.taskedIds ?? []);
  const isBookmarked = (id: string) => bookmarkOverrides[id] ?? bookmarkedIds.has(id);

  const filteredResources = useMemo(() => filterResources(resources, filters), [resources, filters]);
  const filteredIds = new Set(filteredResources.map((r) => r.id));

  const recommendedIds = new Set((entry?.recommendations ?? []).map((r) => r.resource.id));
  const reasonsByResourceId = new Map((entry?.recommendations ?? []).map((r) => [r.resource.id, r.reasons]));

  let visible: Resource[];
  if (tab === "recommended") {
    visible = resources.filter((r) => filteredIds.has(r.id) && recommendedIds.has(r.id));
  } else if (tab === "saved") {
    visible = resources.filter((r) => filteredIds.has(r.id) && isBookmarked(r.id));
  } else {
    visible = resources.filter((r) => filteredIds.has(r.id));
  }

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-aff-text sm:text-[28px]">{t("pageTitle")}</h1>
        <p className="mt-1.5 text-[14.5px] text-aff-muted">{t("pageSubtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["recommended", "all", "saved"] as Tab[]).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
              tab === tabKey ? "border-aff-accent text-aff-accent" : "border-aff-line text-aff-muted hover:text-aff-text"
            }`}
          >
            {t(`tabs.${tabKey}`)}
          </button>
        ))}
      </div>

      <DashboardSection title={t("filtersTitle")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <TextField
            id="res-search"
            label={t("filters.search")}
            value={filters.search ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))}
          />
          <SelectField
            id="res-category"
            label={t("filters.category")}
            value={filters.category ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, category: (e.target.value || undefined) as ResourceCategory | undefined }))}
          >
            <option value="">{t("filters.any")}</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`categories.${c}`)}
              </option>
            ))}
          </SelectField>
          <SelectField
            id="res-format"
            label={t("filters.format")}
            value={filters.format ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, format: (e.target.value || undefined) as ResourceFormat | undefined }))}
          >
            <option value="">{t("filters.any")}</option>
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {t(`formats.${f}`)}
              </option>
            ))}
          </SelectField>
        </div>
      </DashboardSection>

      <DashboardSection title={t(`tabs.${tab}`)}>
        {visible.length === 0 ? (
          <EmptyState title={t("emptyTitle")} body={t("emptyBody")} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                startupId={activeStartup.id}
                bookmarked={isBookmarked(resource.id)}
                tasked={taskedIds.has(resource.id)}
                reasons={reasonsByResourceId.get(resource.id) ?? []}
                onToggleBookmark={(bookmarked) => setBookmarkOverrides((prev) => ({ ...prev, [resource.id]: bookmarked }))}
                t={t}
                tRoot={tRoot}
              />
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  );
}

function ResourceCard({
  resource,
  startupId,
  bookmarked,
  tasked,
  reasons,
  onToggleBookmark,
  t,
  tRoot,
}: {
  resource: Resource;
  startupId: string;
  bookmarked: boolean;
  tasked: boolean;
  reasons: ResourceRecommendation["reasons"];
  onToggleBookmark: (bookmarked: boolean) => void;
  t: ReturnType<typeof useTranslations>;
  tRoot: ReturnType<typeof useTranslations>;
}) {
  const [pending, startTransition] = useTransition();
  const [taskCreated, setTaskCreated] = useState(tasked);

  function toggleBookmark() {
    startTransition(async () => {
      const result = bookmarked
        ? await unbookmarkResourceAction(startupId, resource.id)
        : await bookmarkResourceAction(startupId, resource.id);
      if (result.ok) onToggleBookmark(!bookmarked);
    });
  }

  function addToTasks() {
    startTransition(async () => {
      const result = await createTaskFromResourceAction(startupId, resource.id);
      if (result.ok) setTaskCreated(true);
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-aff-line p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-heading text-[14.5px] font-semibold text-aff-text">{resource.title.en}</h3>
        <button
          onClick={toggleBookmark}
          disabled={pending}
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
            bookmarked ? "border-aff-accent text-aff-accent" : "border-aff-line text-aff-muted hover:text-aff-text"
          }`}
        >
          {bookmarked ? t("saved") : t("save")}
        </button>
      </div>
      <p className="text-[12.5px] text-aff-muted">{resource.description.en}</p>
      <div className="flex flex-wrap gap-2 text-[11px] text-aff-muted">
        <span className="rounded-full border border-aff-line px-2 py-0.5">{t(`categories.${resource.category}`)}</span>
        <span className="rounded-full border border-aff-line px-2 py-0.5">{t(`formats.${resource.format}`)}</span>
        {resource.estimatedMinutes && <span className="rounded-full border border-aff-line px-2 py-0.5">{resource.estimatedMinutes} min</span>}
        <span className="rounded-full border border-aff-line px-2 py-0.5">{t(`origin.${resource.origin}`)}</span>
      </div>
      {reasons.length > 0 && (
        <p className="text-[12px] text-aff-text">
          {t("recommendedBecause")} {tRoot(reasons[0].labelKey, reasons[0].data)}
        </p>
      )}
      <div className="mt-1 flex items-center gap-2">
        {!taskCreated ? (
          <Button variant="secondary" className="px-3 py-1.5 text-[12px]" disabled={pending} onClick={addToTasks}>
            {t("addToTasks")}
          </Button>
        ) : (
          <span className="text-[11.5px] text-aff-accent">{t("taskAdded")}</span>
        )}
      </div>
    </div>
  );
}
