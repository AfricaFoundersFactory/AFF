"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useStartup } from "@/components/dashboard/StartupContext";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ProfileCompletionBar } from "@/components/dashboard/twin/shared";
import { CriterionStatusBadge, DimensionStatusLabel } from "./shared";
import type { DimensionKey, DimensionResult } from "@/types/readiness-engine";

export function DimensionDrillDownView({
  dimension,
  dataByStartupId,
}: {
  dimension: DimensionKey;
  dataByStartupId: Record<string, DimensionResult | undefined>;
}) {
  const { activeStartup } = useStartup();
  const result = dataByStartupId[activeStartup.id];

  const t = useTranslations("dashboard.readiness");
  const tDim = useTranslations("dashboard.readiness.dimensions");
  const tCriteria = useTranslations("dashboard.readiness.criteria");
  const tMissing = useTranslations("dashboard.readiness.missingEvidence");
  const tSource = useTranslations("dashboard.readiness.evidenceSource");
  const tVerification = useTranslations("dashboard.readiness.verification");
  const tCritStatus = useTranslations("dashboard.readiness.criterionStatus");

  if (!result) {
    return <EmptyState title={t("notAssessedTitle")} body={t("notAssessedBody")} />;
  }

  return (
    <div className="mx-auto flex max-w-[820px] flex-col gap-6">
      <div>
        <Link href="/dashboard/readiness" className="mb-3 inline-block text-[13px] font-semibold text-aff-accent no-underline">
          ← {t("backToReadiness")}
        </Link>
        <h1 className="font-heading text-2xl font-semibold text-aff-text sm:text-[28px]">{tDim(`${dimension}.label`)}</h1>
        <p className="mt-1.5 text-[14.5px] text-aff-muted">{tDim(`${dimension}.description`)}</p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-aff-line bg-aff-bg2 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-4">
          <div className="font-heading text-4xl font-semibold text-aff-text">
            {result.score ?? "—"}
            <span className="text-base font-medium text-aff-muted"> {t("scoreSuffix")}</span>
          </div>
          <DimensionStatusLabel status={result.status} label={t(`status.${result.status}`)} />
        </div>
        <div className="flex flex-col gap-2 sm:w-56">
          <ProfileCompletionBar pct={result.confidence} label={t("confidenceLabel")} />
          {result.potentialImprovement > 0 ? (
            <p className="text-[12px] text-aff-muted">
              {t("potentialImprovement")}: {t("potentialImprovementValue", { points: result.potentialImprovement })}
            </p>
          ) : null}
        </div>
      </div>
      {result.potentialImprovement > 0 ? (
        <p className="-mt-3 text-[12px] text-aff-muted">{t("potentialImprovementHint")}</p>
      ) : null}

      <div className="flex flex-col gap-4">
        {result.criteria.map((criterion) => (
          <div key={criterion.criterionId} className="rounded-xl border border-aff-line bg-aff-bg p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="font-heading text-[15px] font-semibold text-aff-text">
                {tCriteria(`${criterion.criterionId}.label`)}
              </h2>
              <div className="flex shrink-0 items-center gap-2">
                {criterion.rawScore != null ? (
                  <span className="font-heading text-lg font-semibold text-aff-text">{criterion.rawScore}</span>
                ) : null}
                <CriterionStatusBadge status={criterion.status} label={tCritStatus(criterion.status)} />
              </div>
            </div>

            <div className="mb-3">
              <div className="mb-1 text-[11.5px] font-semibold tracking-[0.04em] text-aff-muted">{t("whyThisScore")}</div>
              <p className="text-[13.5px] text-aff-text">
                {tCriteria(`${criterion.criterionId}.explanation`, {
                  status: criterion.status,
                  score: criterion.rawScore ?? 0,
                })}
              </p>
            </div>

            {criterion.evidence.length > 0 ? (
              <div className="mb-3">
                <div className="mb-1 text-[11.5px] font-semibold tracking-[0.04em] text-aff-muted">{t("evidenceUsed")}</div>
                <ul className="flex flex-col gap-1">
                  {criterion.evidence.map((ev) => (
                    <li key={ev.id} className="text-[13px] text-aff-muted">
                      {tSource(ev.sourceType)} — {tVerification(ev.verificationStatus)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {criterion.missingEvidence.length > 0 ? (
              <div className="mb-3">
                <div className="mb-1 text-[11.5px] font-semibold tracking-[0.04em] text-aff-muted">
                  {t("missingEvidenceTitle")}
                </div>
                <ul className="flex flex-col gap-1">
                  {criterion.missingEvidence.map((key) => (
                    <li key={key} className="text-[13px] text-amber-400">
                      {tMissing(key)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {criterion.status !== "not_applicable" ? (
              <div>
                <div className="mb-1 text-[11.5px] font-semibold tracking-[0.04em] text-aff-muted">{t("howToImprove")}</div>
                <p className="text-[13px] text-aff-muted">{tCriteria(`${criterion.criterionId}.improvementHint`)}</p>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
