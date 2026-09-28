"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useStartup } from "@/components/dashboard/StartupContext";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import type { AnalyticsRange, FounderAnalyticsSnapshot } from "@/types/analytics";

const RANGES: AnalyticsRange[] = ["30D", "90D", "ALL"];

export function AnalyticsView({
  dataByStartupId,
  range,
}: {
  dataByStartupId: Record<string, FounderAnalyticsSnapshot>;
  range: AnalyticsRange;
}) {
  const t = useTranslations("dashboard.analytics");
  const { activeStartup } = useStartup();
  const router = useRouter();
  const pathname = usePathname();
  const snapshot = dataByStartupId[activeStartup.id];

  if (!snapshot) return <EmptyState title={t("noData")} />;

  function setRange(next: AnalyticsRange) {
    router.replace(`${pathname}?range=${next}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-dashed border-aff-line bg-aff-bg2 px-4 py-2.5 text-[12.5px] text-aff-muted">
        {t("observationOnlyNotice")}
      </div>

      <div className="flex gap-2">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={
              "rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors " +
              (range === r ? "border-aff-accent text-aff-accent" : "border-aff-line text-aff-muted hover:text-aff-text")
            }
          >
            {t(`ranges.${r}`)}
          </button>
        ))}
      </div>

      <DashboardSection title={t("sections.overview")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <MetricCard label={t("metrics.profileCompletion")} value={`${Math.round(snapshot.profileCompletion.completionPct * 100)}%`} />
          <MetricCard
            label={t("metrics.readiness")}
            value={snapshot.readiness.available ? String(snapshot.readiness.data.currentScore) : t("noData")}
            hint={snapshot.readiness.available ? t(`trend.${snapshot.readiness.data.trend}`) : undefined}
          />
          <MetricCard label={t("metrics.roadmapProgress")} value={snapshot.execution.roadmapProgressPct !== null ? `${snapshot.execution.roadmapProgressPct}%` : t("noData")} />
          <MetricCard label={t("metrics.tasksCompleted")} value={`${snapshot.execution.tasksCompleted}/${snapshot.execution.tasksTotal}`} hint={t("metrics.tasksOverdueHint", { count: snapshot.execution.tasksOverdue })} />
          <MetricCard
            label={t("metrics.pitchVersions")}
            value={snapshot.pitch.available ? String(snapshot.pitch.data.versionCount) : t("noData")}
            hint={snapshot.pitch.available ? t("metrics.pitchPracticeHint", { count: snapshot.pitch.data.practiceSessionCount }) : undefined}
          />
          <MetricCard
            label={t("metrics.runway")}
            value={
              snapshot.financials.available
                ? snapshot.financials.data.runway.status === "calculated"
                  ? t("metrics.months", { count: snapshot.financials.data.runway.months })
                  : snapshot.financials.data.runway.status === "sustainable"
                    ? t("metrics.runwaySustainable")
                    : t("noData")
                : t("noData")
            }
          />
          <MetricCard label={t("metrics.dataRoomCompletion")} value={`${Math.round(snapshot.dataRoom.completionPct * 100)}%`} />
          <MetricCard
            label={t("metrics.expertSupport")}
            value={`${snapshot.expertSupport.sessionsCompleted}`}
            hint={t("metrics.recommendationsHint", { count: snapshot.expertSupport.recommendationsCompleted })}
          />
        </div>
      </DashboardSection>

      <DashboardSection title={t("sections.opportunities")}>
        <p className="mb-3 text-[12px] text-aff-muted">{t("sections.opportunitiesHint")}</p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          <MetricCard label={t("metrics.saved")} value={String(snapshot.opportunities.saved)} />
          <MetricCard label={t("metrics.preparing")} value={String(snapshot.opportunities.preparing)} />
          <MetricCard label={t("metrics.applied")} value={String(snapshot.opportunities.applied)} />
          <MetricCard label={t("metrics.shortlisted")} value={String(snapshot.opportunities.shortlisted)} />
          <MetricCard label={t("metrics.accepted")} value={String(snapshot.opportunities.accepted)} />
          <MetricCard label={t("metrics.rejected")} value={String(snapshot.opportunities.rejected)} />
        </div>
      </DashboardSection>

      <DashboardSection title={t("sections.community")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard label={t("metrics.postsCreated")} value={String(snapshot.community.postsCreated)} />
          <MetricCard label={t("metrics.questionsAsked")} value={String(snapshot.community.questionsAsked)} />
          <MetricCard label={t("metrics.helpfulContributions")} value={String(snapshot.community.helpfulContributions)} />
          <MetricCard label={t("metrics.eventsRegistered")} value={String(snapshot.community.eventsRegistered)} />
        </div>
      </DashboardSection>

      <DashboardSection title={t("sections.timeline")}>
        {snapshot.timeline.length === 0 ? (
          <EmptyState title={t("timeline.empty")} />
        ) : (
          <ul className="flex flex-col gap-2">
            {snapshot.timeline.map((event) => (
              <li key={event.id} className="flex items-center justify-between gap-3 rounded-lg border border-aff-line bg-aff-bg px-3 py-2 text-[12.5px]">
                <span className="text-aff-text">{t(`timeline.events.${event.labelKey}`, event.data)}</span>
                <span className="text-aff-muted">{new Date(event.occurredAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>
    </div>
  );
}
