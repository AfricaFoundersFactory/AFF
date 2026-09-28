"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useStartup } from "@/components/dashboard/StartupContext";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { ScoreRing } from "@/components/dashboard/ScoreRing";
import { ProfileCompletionBar } from "@/components/dashboard/twin/shared";
import { ButtonLink } from "@/components/ui/Button";
import { DimensionCard } from "./DimensionCard";
import { HistoryChart } from "./HistoryChart";
import { StrengthsGapsPanel } from "./StrengthsGapsPanel";
import { DIMENSION_KEYS } from "@/types/readiness-engine";
import type { ReadinessAssessment } from "@/types/readiness-engine";
import type { ProfileCompletion } from "@/types/profile-completion";
import { ACTION_CATALOG } from "@/lib/roadmap/action-catalog";
import { addGapToRoadmapAction } from "@/lib/actions/roadmap";

export type ReadinessEntry = {
  assessment: ReadinessAssessment | undefined;
  history: ReadinessAssessment[];
  completion: ProfileCompletion;
  hasDraft: boolean;
  /** Criterion ids that already have an active (non-done/dismissed) roadmap item. */
  roadmapCriterionIds: string[];
};

const CATALOG_CRITERION_IDS = new Set(ACTION_CATALOG.map((a) => a.criterionId));

export function ReadinessDashboardView({ dataByStartupId }: { dataByStartupId: Record<string, ReadinessEntry> }) {
  const { activeStartup } = useStartup();
  const entry = dataByStartupId[activeStartup.id];

  const t = useTranslations("dashboard.readiness");
  const tRoadmap = useTranslations("dashboard.roadmap");
  const tDim = useTranslations("dashboard.readiness.dimensions");
  const tCriteria = useTranslations("dashboard.readiness.criteria");
  const tStage = useTranslations("dashboard.stage");
  const format = useFormatter();
  const router = useRouter();
  const [, startTransition] = useTransition();

  if (!entry) return null;

  const { assessment, history, completion, hasDraft, roadmapCriterionIds } = entry;
  const formatDate = (iso: string) => format.dateTime(new Date(iso), { day: "numeric", month: "short", year: "numeric" });

  const handleAddToRoadmap = (criterionId: string) => {
    startTransition(async () => {
      await addGapToRoadmapAction(activeStartup.id, criterionId);
      router.refresh();
    });
  };

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-aff-text sm:text-[28px]">{t("pageTitle")}</h1>
        <p className="mt-1.5 text-[14.5px] text-aff-muted">{t("pageSubtitle")}</p>
      </div>

      {hasDraft ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-aff-line-strong bg-aff-bg2 px-5 py-4">
          <p className="text-[13.5px] text-aff-text">{t("draftInProgress")}</p>
          <ButtonLink href="/dashboard/readiness/assessment" className="px-4 py-2.5 text-[13px]">
            {t("resumeAssessment")}
          </ButtonLink>
        </div>
      ) : null}

      {!assessment ? (
        <DashboardSection title={t("eyebrow")}>
          <p className="mb-1 text-[15px] font-semibold text-aff-text">{t("notAssessedTitle")}</p>
          <p className="mb-5 text-[13.5px] text-aff-muted">{t("notAssessedBody")}</p>
          {!hasDraft ? (
            <ButtonLink href="/dashboard/readiness/assessment" className="px-4 py-2.5 text-[13.5px]">
              {t("startAssessment")}
            </ButtonLink>
          ) : null}
        </DashboardSection>
      ) : (
        <>
          <DashboardSection title={t("eyebrow")}>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5">
                <ScoreRing value={assessment.overallScore ?? 0} size={120} />
                <div>
                  <div className="font-heading text-[42px] font-semibold leading-none text-aff-text">
                    {assessment.overallScore ?? "—"}
                    <span className="text-lg font-medium text-aff-muted"> {t("scoreSuffix")}</span>
                  </div>
                  <div className="mt-2 text-[13.5px] font-semibold text-aff-cyan">
                    {t("confidenceLabel")} {assessment.overallConfidence}%
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-3 text-[13px] text-aff-muted sm:justify-end">
                <div>
                  <div className="font-semibold text-aff-muted">{t("profileCompletionLabel")}</div>
                  <div className="text-aff-text">{completion.overallPct}%</div>
                </div>
                <div>
                  <div className="font-semibold text-aff-muted">{t("lastAssessedLabel")}</div>
                  <div className="text-aff-text">{formatDate(assessment.completedAt ?? assessment.startedAt)}</div>
                </div>
                <div>
                  <div className="font-semibold text-aff-muted">{t("stageLabel")}</div>
                  <div className="text-aff-text">{tStage(assessment.startupStageAtAssessment)}</div>
                </div>
              </div>
            </div>
            <div className="mt-6 max-w-sm">
              <ProfileCompletionBar pct={completion.overallPct} label={t("profileCompletionCaption")} />
            </div>
            {!hasDraft ? (
              <ButtonLink href="/dashboard/readiness/assessment" variant="secondary" className="mt-6 px-4 py-2.5 text-[13.5px]">
                {t("reassess")}
              </ButtonLink>
            ) : null}
          </DashboardSection>

          <DashboardSection title={t("dimensionsTitle")}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {DIMENSION_KEYS.map((key) => {
                const result = assessment.dimensions.find((d) => d.dimension === key);
                if (!result) return null;
                return (
                  <DimensionCard
                    key={key}
                    result={result}
                    label={tDim(`${key}.label`)}
                    statusLabel={t(`status.${result.status}`)}
                    confidenceLabel={t("confidenceLabel")}
                    strengthsLabel={t("strengthsLabel")}
                    gapsLabel={t("gapsLabel")}
                    notApplicableLabel={t("status.not_applicable")}
                  />
                );
              })}
            </div>
          </DashboardSection>

          <DashboardSection title={t("strengthsGapsTitle")}>
            <StrengthsGapsPanel
              dimensions={assessment.dimensions}
              strengthsTitle={t("topStrengths")}
              gapsTitle={t("priorityGaps")}
              criterionLabel={(id) => tCriteria(`${id}.label`)}
              emptyStrengths={t("noStrengthsYet")}
              emptyGaps={t("noGapsYet")}
              catalogCriterionIds={CATALOG_CRITERION_IDS}
              roadmapCriterionIds={new Set(roadmapCriterionIds)}
              onAddToRoadmap={handleAddToRoadmap}
              addLabel={tRoadmap("addToRoadmap")}
              addedLabel={tRoadmap("alreadyInRoadmap")}
            />
          </DashboardSection>

          {history.length > 1 ? (
            <DashboardSection title={t("historyTitle")}>
              <HistoryChart history={history} formatDate={formatDate} />
              <p className="mt-3 text-[12px] text-aff-muted">{t("historyDisclaimer")}</p>
            </DashboardSection>
          ) : null}
        </>
      )}
    </div>
  );
}
