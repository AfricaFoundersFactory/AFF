"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useStartup } from "@/components/dashboard/StartupContext";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";
import { ExpertCard } from "./ExpertCard";
import { declareFounderNeedAction } from "@/lib/actions/experts";
import {
  FOUNDER_HELP_CATEGORIES,
  EXPERTISE_CATEGORY_IDS,
  INDUSTRY_EXPERTISE_IDS,
  EXPERT_LANGUAGES,
  type ExpertiseCategoryId,
  type ExpertLanguage,
} from "@/lib/experts/taxonomy";
import type { ExpertAvailability, ExpertMatch, ExpertProfile, StartupNeed } from "@/types/experts";
import type { StartupStage } from "@/types/common";

const STAGES: StartupStage[] = ["idea", "mvp", "early_traction", "growth", "scale"];
const AVAILABILITIES: ExpertAvailability[] = ["AVAILABLE", "LIMITED", "UNAVAILABLE"];

export type ExpertDirectoryEntry = {
  needs: StartupNeed[];
  matches: ExpertMatch[];
};

export function ExpertDirectoryView({
  experts,
  dataByStartupId,
}: {
  experts: ExpertProfile[];
  dataByStartupId: Record<string, ExpertDirectoryEntry>;
}) {
  const { activeStartup } = useStartup();
  const entry = dataByStartupId[activeStartup.id];
  const t = useTranslations("dashboard.experts");
  const tStage = useTranslations("dashboard.stage");

  const [filters, setFilters] = useState<{
    expertise: ExpertiseCategoryId | "";
    industry: ExpertiseCategoryId | "";
    stage: StartupStage | "";
    language: ExpertLanguage | "";
    country: string;
    availability: ExpertAvailability | "";
  }>({ expertise: "", industry: "", stage: "", language: "", country: "", availability: "" });

  const filtered = useMemo(() => {
    return experts.filter((e) => {
      if (filters.expertise && !e.expertise.includes(filters.expertise)) return false;
      if (filters.industry && !e.industries.includes(filters.industry)) return false;
      if (filters.stage && !e.startupStages.includes(filters.stage)) return false;
      if (filters.language && !e.languages.includes(filters.language)) return false;
      if (filters.country && e.country.toLowerCase() !== filters.country.toLowerCase()) return false;
      if (filters.availability && e.availability !== filters.availability) return false;
      return true;
    });
  }, [experts, filters]);

  const countries = useMemo(() => Array.from(new Set(experts.map((e) => e.country))).sort(), [experts]);
  const openNeeds = entry?.needs.filter((n) => n.status === "OPEN") ?? [];
  const relevantMatches = entry?.matches.slice(0, 4) ?? [];

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-aff-text sm:text-[28px]">{t("pageTitle")}</h1>
        <p className="mt-1.5 text-[14.5px] text-aff-muted">{t("pageSubtitle")}</p>
        <p className="mt-2 text-[12px] text-aff-muted">{t("demoDisclaimer")}</p>
      </div>

      <FindHelpSection startupId={activeStartup.id} needs={openNeeds} onCategorySelect={(c) => setFilters((f) => ({ ...f, expertise: c }))} />

      <DashboardSection title={t("directory.relevantTitle")}>
        {relevantMatches.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relevantMatches.map((m) => (
              <div key={m.expert.id} className="flex flex-col gap-2">
                <ExpertCard expert={m.expert} />
                <p className="text-[11.5px] text-aff-muted">
                  {t("matching.relevantCount", { count: m.reasons.length })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title={t("directory.relevantEmpty")} />
        )}
        <p className="mt-3 text-[11.5px] text-aff-muted">{t("matching.disclaimer")}</p>
      </DashboardSection>

      <DashboardSection title={t("pageTitle")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <SelectField
            id="filter-expertise"
            label={t("directory.filters.expertise")}
            value={filters.expertise}
            onChange={(e) => setFilters((f) => ({ ...f, expertise: e.target.value as ExpertiseCategoryId | "" }))}
          >
            <option value="">{t("directory.filters.all")}</option>
            {EXPERTISE_CATEGORY_IDS.map((id) => (
              <option key={id} value={id}>
                {t(`expertise.${id}`)}
              </option>
            ))}
          </SelectField>
          <SelectField
            id="filter-industry"
            label={t("directory.filters.industry")}
            value={filters.industry}
            onChange={(e) => setFilters((f) => ({ ...f, industry: e.target.value as ExpertiseCategoryId | "" }))}
          >
            <option value="">{t("directory.filters.all")}</option>
            {INDUSTRY_EXPERTISE_IDS.map((id) => (
              <option key={id} value={id}>
                {t(`expertise.${id}`)}
              </option>
            ))}
          </SelectField>
          <SelectField
            id="filter-stage"
            label={t("directory.filters.stage")}
            value={filters.stage}
            onChange={(e) => setFilters((f) => ({ ...f, stage: e.target.value as StartupStage | "" }))}
          >
            <option value="">{t("directory.filters.all")}</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {tStage(s)}
              </option>
            ))}
          </SelectField>
          <SelectField
            id="filter-language"
            label={t("directory.filters.language")}
            value={filters.language}
            onChange={(e) => setFilters((f) => ({ ...f, language: e.target.value as ExpertLanguage | "" }))}
          >
            <option value="">{t("directory.filters.all")}</option>
            {EXPERT_LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {t(`languages.${l}`)}
              </option>
            ))}
          </SelectField>
          <SelectField
            id="filter-country"
            label={t("directory.filters.country")}
            value={filters.country}
            onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value }))}
          >
            <option value="">{t("directory.filters.all")}</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectField>
          <SelectField
            id="filter-availability"
            label={t("directory.filters.availability")}
            value={filters.availability}
            onChange={(e) => setFilters((f) => ({ ...f, availability: e.target.value as ExpertAvailability | "" }))}
          >
            <option value="">{t("directory.filters.all")}</option>
            {AVAILABILITIES.map((a) => (
              <option key={a} value={a}>
                {t(`availability.${a}`)}
              </option>
            ))}
          </SelectField>
        </div>

        {filters.expertise || filters.industry || filters.stage || filters.language || filters.country || filters.availability ? (
          <button
            type="button"
            onClick={() => setFilters({ expertise: "", industry: "", stage: "", language: "", country: "", availability: "" })}
            className="mt-3 text-[12.5px] font-semibold text-aff-accent hover:text-aff-accent-hover"
          >
            {t("directory.filters.reset")}
          </button>
        ) : null}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.length > 0 ? (
            filtered.map((expert) => <ExpertCard key={expert.id} expert={expert} />)
          ) : (
            <div className="sm:col-span-2 lg:col-span-3">
              <EmptyState title={t("directory.empty")} />
            </div>
          )}
        </div>
      </DashboardSection>
    </div>
  );
}

function FindHelpSection({
  startupId,
  needs,
  onCategorySelect,
}: {
  startupId: string;
  needs: StartupNeed[];
  onCategorySelect: (category: ExpertiseCategoryId) => void;
}) {
  const t = useTranslations("dashboard.experts");
  const [declaring, setDeclaring] = useState(false);
  const [saving, startSaving] = useTransition();
  const [form, setForm] = useState<{ category: ExpertiseCategoryId; title: string; description: string }>({
    category: "STRATEGY",
    title: "",
    description: "",
  });

  function handleDeclare() {
    if (!form.title.trim()) return;
    startSaving(async () => {
      await declareFounderNeedAction(startupId, form);
      setDeclaring(false);
      setForm({ category: "STRATEGY", title: "", description: "" });
      onCategorySelect(form.category);
    });
  }

  return (
    <DashboardSection title={t("directory.findHelpTitle")}>
      <p className="mb-4 text-[13.5px] text-aff-muted">{t("directory.findHelpBody")}</p>

      <div className="flex flex-wrap gap-2">
        {FOUNDER_HELP_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onCategorySelect(category)}
            className="rounded-full border border-aff-line px-3 py-1.5 text-[12.5px] font-semibold text-aff-text hover:border-aff-accent hover:text-aff-accent"
          >
            {t(`expertise.${category}`)}
          </button>
        ))}
      </div>

      {needs.length > 0 ? (
        <div className="mt-5">
          <p className="mb-2 text-[12px] font-semibold tracking-[0.06em] text-aff-muted">
            {t("directory.detectedNeedsTitle").toUpperCase()}
          </p>
          <div className="flex flex-wrap gap-2">
            {needs.map((need) => (
              <button
                key={need.id}
                type="button"
                onClick={() => onCategorySelect(need.category)}
                className="rounded-full bg-aff-cyan/10 px-3 py-1.5 text-[12.5px] font-semibold text-aff-cyan hover:bg-aff-cyan/20"
                title={t(`needs.sourceLabels.${need.sourceType}`)}
              >
                {t(`expertise.${need.category}`)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5">
        {!declaring ? (
          <Button variant="secondary" className="px-4 py-2.5 text-[13px]" onClick={() => setDeclaring(true)}>
            {t("directory.declareNeedCta")}
          </Button>
        ) : (
          <div className="flex flex-col gap-3 rounded-xl border border-aff-line bg-aff-bg p-4">
            <SelectField
              id="declare-need-category"
              label={t("directory.declareNeedCategoryLabel")}
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExpertiseCategoryId }))}
            >
              {FOUNDER_HELP_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`expertise.${c}`)}
                </option>
              ))}
            </SelectField>
            <TextField
              id="declare-need-title"
              label={t("directory.declareNeedTitleLabel")}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <TextField
              id="declare-need-description"
              label={t("directory.declareNeedDescriptionLabel")}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <div className="flex gap-2">
              <Button className="px-4 py-2.5 text-[13px]" disabled={saving || !form.title.trim()} onClick={handleDeclare}>
                {t("directory.declareNeedSubmit")}
              </Button>
              <Button variant="ghost" className="px-4 py-2.5 text-[13px]" onClick={() => setDeclaring(false)}>
                {t("request.cancel")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardSection>
  );
}
