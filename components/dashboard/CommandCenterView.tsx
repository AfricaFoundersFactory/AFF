"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useStartup } from "./StartupContext";
import { DashboardSection } from "./DashboardSection";
import { ScoreRing } from "./ScoreRing";
import { ReadinessDimensionBar } from "./ReadinessDimensionBar";
import { MetricCard } from "./MetricCard";
import { ProgressCard } from "./ProgressCard";
import { TaskCard } from "./TaskCard";
import { ActivityItem } from "./ActivityItem";
import { OpportunityCard } from "./OpportunityCard";
import { EmptyState } from "./EmptyState";
import { ProfileCompletionBar, MissingInfoList } from "./twin/shared";
import { ButtonLink } from "@/components/ui/Button";
import type { CommandCenterData } from "@/lib/services/dashboard-data";
import type { TaskStatus } from "@/types/roadmap";
import type { SessionUser } from "@/lib/auth/session";

function greetingKey(hour: number): "morning" | "afternoon" | "evening" {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export function CommandCenterView({
  user,
  dataByStartupId,
}: {
  user: SessionUser;
  dataByStartupId: Record<string, CommandCenterData>;
}) {
  const { activeStartup } = useStartup();
  const data = dataByStartupId[activeStartup.id];

  const t = useTranslations("dashboard");
  const tStage = useTranslations("dashboard.stage");
  const tDim = useTranslations("dashboard.readiness.dimensions");
  const tFields = useTranslations("dashboard.digitalTwin.fields");
  const tPitch = useTranslations("dashboard.pitch");
  const format = useFormatter();

  if (!data) {
    return <EmptyState title={t("recentActivity.emptyTitle")} body={t("recentActivity.emptyBody")} />;
  }

  const {
    startup,
    readiness,
    profileCompletion,
    nextBestAction,
    weekTasks,
    roadmap,
    opportunity,
    recentActivity,
    upcomingEvents,
    pitch,
  } = data;

  const formatDate = (iso: string) =>
    format.dateTime(new Date(iso), { weekday: "short", month: "short", day: "numeric" });

  const statusLabel = (status: TaskStatus) => t(`thisWeek.status.${status}`);

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <p className="text-[12px] text-aff-muted">{t("demoDataNotice")}</p>

      {/* Section 1 — Welcome / context */}
      <div>
        <h1 className="font-heading text-2xl font-semibold text-aff-text sm:text-[28px]">
          {t(`greeting.${greetingKey(new Date().getHours())}`, { name: user.name.split(" ")[0] })}
        </h1>
        <p className="mt-1.5 text-[14.5px] text-aff-muted">
          {startup.twin.identity.name} · {tStage(startup.twin.identity.stage)} · {startup.twin.identity.industry} ·{" "}
          {startup.twin.identity.country}
        </p>
        <p className="mt-3 text-[14.5px] text-aff-text">{t("attentionLine")}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Section 2 — AFF Readiness Score */}
        <DashboardSection title={t("readiness.eyebrow")} className="lg:col-span-2">
          {readiness ? (
            <>
              <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
                <div className="flex shrink-0 items-center gap-5">
                  <ScoreRing value={readiness.overallScore ?? 0} />
                  <div>
                    <div className="font-heading text-[38px] font-semibold leading-none text-aff-text">
                      {readiness.overallScore ?? "—"}
                      <span className="text-lg font-medium text-aff-muted"> {t("readiness.scoreSuffix")}</span>
                    </div>
                    <div className="mt-2 text-[13px] font-semibold text-aff-cyan">
                      {t("readiness.confidenceLabel")} {readiness.overallConfidence}%
                    </div>
                    <div className="mt-2 text-[13px] text-aff-muted">
                      {t("readiness.lastAssessedLabel")} {formatDate(readiness.completedAt ?? readiness.startedAt)}
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-2.5">
                  {readiness.dimensions.slice(0, 4).map((dimension) => (
                    <ReadinessDimensionBar
                      key={dimension.dimension}
                      label={tDim(`${dimension.dimension}.label`)}
                      value={dimension.score ?? 0}
                    />
                  ))}
                </div>
              </div>
              <ButtonLink href="/dashboard/readiness" variant="secondary" className="mt-6 px-4 py-2.5 text-[13.5px]">
                {t("readiness.viewDiagnostic")}
              </ButtonLink>
            </>
          ) : (
            <div>
              <p className="mb-1 text-[15px] font-semibold text-aff-text">{t("readiness.notAssessedTitle")}</p>
              <p className="mb-5 text-[13.5px] text-aff-muted">{t("readiness.notAssessedBody")}</p>
              <ButtonLink href="/dashboard/readiness/assessment" className="px-4 py-2.5 text-[13.5px]">
                {t("readiness.startAssessment")}
              </ButtonLink>
            </div>
          )}
        </DashboardSection>

        {/* Section 3 — Next Best Action */}
        <DashboardSection title={t("nextBestAction.eyebrow")}>
          <h3 className="mb-2 font-heading text-[16px] font-semibold text-aff-text">
            {nextBestAction.title}
          </h3>
          <p className="mb-4 text-[13.5px] leading-relaxed text-aff-muted">
            {nextBestAction.description}
          </p>
          <div className="mb-5 grid grid-cols-2 gap-3">
            <MetricCard
              label={t("nextBestAction.effortLabel")}
              value={t("nextBestAction.minutes", { minutes: nextBestAction.estimatedEffortMinutes })}
            />
            <MetricCard
              label={t("nextBestAction.impactLabel")}
              value={t("nextBestAction.impactPoints", { points: nextBestAction.potentialImpactPoints })}
            />
          </div>
          <ButtonLink
            href={`/dashboard/${nextBestAction.linkedModule}`}
            className="w-full justify-center px-4 py-3 text-[13.5px]"
          >
            {t("nextBestAction.cta")}
          </ButtonLink>
        </DashboardSection>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile Completion — distinct from AFF Readiness above: this
            measures whether Digital Twin information EXISTS, never its
            quality, and must never be shown as if it were the same metric. */}
        <DashboardSection title={t("profileCompletion.eyebrow")}>
          <ProfileCompletionBar pct={profileCompletion.overallPct} label={t("profileCompletion.label")} />
          <p className="mt-3 text-[12.5px] text-aff-muted">{t("profileCompletion.disclaimer")}</p>
          <ButtonLink href="/dashboard/startup" variant="secondary" className="mt-5 px-4 py-2.5 text-[13.5px]">
            {t("profileCompletion.cta")}
          </ButtonLink>
        </DashboardSection>

        <DashboardSection title={t("profileCompletion.missingTitle")}>
          <MissingInfoList
            title={t("profileCompletion.missingCount", { count: profileCompletion.missingItems.length })}
            items={profileCompletion.missingItems.slice(0, 3).map((item) => tFields(item.fieldKey))}
            emptyLabel={t("profileCompletion.missingEmpty")}
            ctaLabel={t("profileCompletion.cta")}
            ctaHref="/dashboard/startup"
          />
        </DashboardSection>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Section 4 — This Week */}
        <DashboardSection
          title={t("thisWeek.title")}
          action={
            <Link
              href="/dashboard/roadmap"
              className="text-[12.5px] font-semibold text-aff-accent hover:text-aff-accent-hover"
            >
              {t("thisWeek.cta")}
            </Link>
          }
        >
          {weekTasks.length > 0 ? (
            <div>
              {weekTasks.slice(0, 3).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  dueLabel={task.dueDate ? formatDate(task.dueDate) : ""}
                  statusLabel={statusLabel(task.status)}
                />
              ))}
            </div>
          ) : (
            <EmptyState title={t("thisWeek.emptyTitle")} body={t("thisWeek.emptyBody")} />
          )}
        </DashboardSection>

        {/* Section 5 — Roadmap Progress */}
        <DashboardSection
          title={t("roadmapProgress.title")}
          action={
            <Link
              href="/dashboard/roadmap"
              className="text-[12.5px] font-semibold text-aff-accent hover:text-aff-accent-hover"
            >
              {t("roadmapProgress.cta")}
            </Link>
          }
        >
          {roadmap ? (
            <ProgressCard
              pct={roadmap.progressPct}
              completedLabel={t("roadmapProgress.completed", { count: roadmap.completedCount })}
              inProgressLabel={t("roadmapProgress.inProgress", { count: roadmap.inProgressCount })}
              remainingLabel={t("roadmapProgress.remaining", { count: roadmap.remainingCount })}
            />
          ) : (
            <EmptyState title={t("roadmapProgress.emptyTitle")} body={t("roadmapProgress.emptyBody")} />
          )}
        </DashboardSection>
      </div>

      {/* Section 6 — Readiness Dimensions */}
      {readiness ? (
        <DashboardSection title={t("readiness.dimensionsTitle")}>
          <div className="grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
            {readiness.dimensions
              .filter((dimension) => dimension.score !== null)
              .map((dimension) => (
                <ReadinessDimensionBar
                  key={dimension.dimension}
                  label={tDim(`${dimension.dimension}.label`)}
                  value={dimension.score ?? 0}
                />
              ))}
          </div>
        </DashboardSection>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Section 7 — Recent Progress */}
        <DashboardSection title={t("recentActivity.title")}>
          {recentActivity.length > 0 ? (
            <div>
              {recentActivity.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          ) : (
            <EmptyState title={t("recentActivity.emptyTitle")} body={t("recentActivity.emptyBody")} />
          )}
        </DashboardSection>

        {/* Section 8 — Upcoming */}
        <DashboardSection title={t("upcoming.title")}>
          {upcomingEvents.length > 0 ? (
            <div>
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start justify-between gap-3 border-b border-aff-line py-3.5 last:border-0 last:pb-0"
                >
                  <div>
                    <div className="text-[13.5px] font-semibold text-aff-text">{event.title}</div>
                    <div className="text-[12.5px] text-aff-muted">{t(`upcoming.kinds.${event.kind}`)}</div>
                  </div>
                  <div className="shrink-0 text-[12.5px] text-aff-muted">{formatDate(event.date)}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title={t("upcoming.emptyTitle")} body={t("upcoming.emptyBody")} />
          )}
        </DashboardSection>
      </div>

      {/* Pitch Preparation widget (Part 25) — a separate metric from AFF
          Readiness/profile completion/roadmap progress above; only shown
          once a Pitch Lab workspace exists. */}
      <DashboardSection title={tPitch("commandCenter.title")}>
        {pitch ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[14px] font-semibold text-aff-text">{pitch.title}</div>
              <div className="mt-1 text-[13px] text-aff-muted">
                {tPitch("overview.readinessLabel")}: {pitch.readinessScore !== undefined ? `${pitch.readinessScore}/100` : "—"} ·{" "}
                {tPitch("commandCenter.sectionsNeedAttention", { count: pitch.sectionsNeedingAttention })}
              </div>
            </div>
            <ButtonLink href="/dashboard/pitch" variant="secondary" className="px-4 py-2.5 text-[13px]">
              {tPitch("commandCenter.continueCta")}
            </ButtonLink>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13.5px] text-aff-muted">{tPitch("commandCenter.noPitchBody")}</p>
            <ButtonLink href="/dashboard/pitch" className="px-4 py-2.5 text-[13px]">
              {tPitch("commandCenter.startCta")}
            </ButtonLink>
          </div>
        )}
      </DashboardSection>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Section 9 — Opportunity Preview */}
        <DashboardSection title={t("opportunity.title")}>
          {opportunity ? (
            <OpportunityCard
              opportunity={opportunity}
              matchLabel={t("opportunity.match")}
              deadlineLabel={t("opportunity.deadline")}
              deadlineFormatted={formatDate(opportunity.deadline)}
              missingLabel={t("opportunity.missing")}
              ctaLabel={t("opportunity.cta")}
              ctaHref="/dashboard/opportunities"
            />
          ) : (
            <EmptyState title={t("opportunity.emptyTitle")} body={t("opportunity.emptyBody")} />
          )}
        </DashboardSection>

        {/* Section 10 — Quick Actions */}
        <DashboardSection title={t("quickActions.title")}>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <ButtonLink href="/dashboard/startup" variant="secondary" className="justify-center px-4 py-3 text-[13px]">
              {t("quickActions.updateStartup")}
            </ButtonLink>
            <ButtonLink href="/dashboard/data-room" variant="secondary" className="justify-center px-4 py-3 text-[13px]">
              {t("quickActions.uploadDocument")}
            </ButtonLink>
            <ButtonLink href="/dashboard/readiness" variant="secondary" className="justify-center px-4 py-3 text-[13px]">
              {t("quickActions.addMetric")}
            </ButtonLink>
            <ButtonLink href="/dashboard/experts" variant="secondary" className="justify-center px-4 py-3 text-[13px]">
              {t("quickActions.askExpertReview")}
            </ButtonLink>
            <ButtonLink
              href="/dashboard/pitch"
              variant="secondary"
              className="col-span-2 justify-center px-4 py-3 text-[13px]"
            >
              {t("quickActions.preparePitch")}
            </ButtonLink>
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}
