"use client";

import { useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useStartup } from "@/components/dashboard/StartupContext";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/Button";
import {
  createTaskFromRecommendationAction,
  addRecommendationToRoadmapAction,
  updateRecommendationStatusAction,
} from "@/lib/actions/experts";
import type { ExpertProfile, ExpertRecommendation, MentoringSession, RecommendationFollowUp, SupportRequest } from "@/types/experts";

export type SessionEntry = {
  session: MentoringSession;
  recommendations: ExpertRecommendation[];
  followUp: RecommendationFollowUp;
};

export type ExpertRequestsEntry = {
  requests: SupportRequest[];
  sessions: SessionEntry[];
  expertsById: Record<string, ExpertProfile>;
};

export function ExpertRequestsView({ dataByStartupId }: { dataByStartupId: Record<string, ExpertRequestsEntry> }) {
  const { activeStartup } = useStartup();
  const entry = dataByStartupId[activeStartup.id];
  const t = useTranslations("dashboard.experts.requestsPage");
  const format = useFormatter();

  const formatDate = (iso: string) => format.dateTime(new Date(iso), { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-aff-text sm:text-[28px]">{t("pageTitle")}</h1>
        <p className="mt-1.5 text-[14.5px] text-aff-muted">{t("pageSubtitle")}</p>
      </div>

      <DashboardSection title={t("requestsTitle")}>
        {!entry || entry.requests.length === 0 ? (
          <EmptyState title={t("empty")} />
        ) : (
          <div className="flex flex-col gap-3">
            {entry.requests.map((request) => {
              const expert = entry.expertsById[request.expertId];
              return (
                <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-aff-line bg-aff-bg p-4">
                  <div>
                    <div className="text-[14px] font-semibold text-aff-text">{request.topic}</div>
                    <div className="mt-1 text-[12.5px] text-aff-muted">
                      {expert ? (
                        <Link href={`/dashboard/experts/${expert.id}`} className="font-semibold text-aff-accent hover:text-aff-accent-hover">
                          {expert.displayName}
                        </Link>
                      ) : null}
                      {" · "}
                      {formatDate(request.createdAt)}
                    </div>
                    <div className="mt-1 text-[12.5px] text-aff-muted">{t(`nextStep.${request.status}`)}</div>
                  </div>
                  <span className="rounded-full border border-aff-line px-3 py-1 text-[11.5px] font-semibold text-aff-text">
                    {t(`status.${request.status}`)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </DashboardSection>

      <DashboardSection title={t("sessionsTitle")}>
        {!entry || entry.sessions.length === 0 ? (
          <EmptyState title={t("sessionsEmpty")} />
        ) : (
          <div className="flex flex-col gap-5">
            {entry.sessions.map(({ session, recommendations, followUp }) => (
              <SessionCard
                key={session.id}
                startupId={activeStartup.id}
                session={session}
                recommendations={recommendations}
                followUp={followUp}
                expert={entry.expertsById[session.expertId]}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  );
}

function SessionCard({
  startupId,
  session,
  recommendations,
  followUp,
  expert,
  formatDate,
}: {
  startupId: string;
  session: MentoringSession;
  recommendations: ExpertRecommendation[];
  followUp: RecommendationFollowUp;
  expert: ExpertProfile | undefined;
  formatDate: (iso: string) => string;
}) {
  const t = useTranslations("dashboard.experts.requestsPage");

  if (session.status !== "COMPLETED") {
    return (
      <div className="rounded-xl border border-aff-line bg-aff-bg p-4">
        <div className="text-[14px] font-semibold text-aff-text">{session.topic}</div>
        <div className="mt-1 text-[12.5px] text-aff-muted">{expert?.displayName}</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-aff-line bg-aff-bg p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[14px] font-semibold text-aff-text">{session.topic}</div>
          <div className="mt-1 text-[12.5px] text-aff-muted">
            {expert?.displayName} · {session.completedAt ? formatDate(session.completedAt) : ""}
          </div>
        </div>
        {session.isDemo ? (
          <span className="rounded-full border border-dashed border-aff-line-strong px-2.5 py-1 text-[10.5px] font-semibold tracking-[0.04em] text-aff-muted">
            {t("demoLabel")}
          </span>
        ) : null}
      </div>

      {session.expertNotes ? <p className="mt-3 text-[13.5px] leading-relaxed text-aff-text">{session.expertNotes}</p> : null}

      {recommendations.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-[12px] font-semibold tracking-[0.06em] text-aff-muted">{t("recommendationsTitle").toUpperCase()}</p>
          <ol className="flex flex-col gap-2.5">
            {recommendations.map((rec, i) => (
              <RecommendationRow key={rec.id} index={i + 1} startupId={startupId} recommendation={rec} />
            ))}
          </ol>
          <p className="mt-3 text-[12.5px] text-aff-muted">
            {t("followUp", {
              total: followUp.total,
              accepted: followUp.accepted,
              convertedToTask: followUp.convertedToTask,
              completed: followUp.completed,
            })}
          </p>
        </div>
      ) : null}

      {session.actionItems.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-[12px] font-semibold tracking-[0.06em] text-aff-muted">{t("actionItemsTitle").toUpperCase()}</p>
          <ul className="list-disc pl-5 text-[13px] text-aff-text">
            {session.actionItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function RecommendationRow({ index, startupId, recommendation }: { index: number; startupId: string; recommendation: ExpertRecommendation }) {
  const t = useTranslations("dashboard.experts.requestsPage");
  const [pending, startTransition] = useTransition();
  const [taskCreated, setTaskCreated] = useState(Boolean(recommendation.taskId));
  const [addedToRoadmap, setAddedToRoadmap] = useState(Boolean(recommendation.roadmapItemId));
  const [dismissed, setDismissed] = useState(recommendation.status === "DISMISSED");

  function handleCreateTask() {
    startTransition(async () => {
      const result = await createTaskFromRecommendationAction(startupId, recommendation.id);
      if (result.ok) setTaskCreated(true);
    });
  }

  function handleAddToRoadmap() {
    startTransition(async () => {
      const result = await addRecommendationToRoadmapAction(startupId, recommendation.id);
      if (result.ok) setAddedToRoadmap(true);
    });
  }

  function handleDismiss() {
    startTransition(async () => {
      const result = await updateRecommendationStatusAction(startupId, recommendation.id, "DISMISSED");
      if (result.ok) setDismissed(true);
    });
  }

  return (
    <li className={`rounded-lg border border-aff-line p-3 text-[13.5px] ${dismissed ? "opacity-50" : ""}`}>
      <div className="font-semibold text-aff-text">
        {index}. {recommendation.title}
      </div>
      <p className="mt-1 text-aff-muted">{recommendation.description}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          className="px-3 py-1.5 text-[12px]"
          disabled={pending || taskCreated || dismissed}
          onClick={handleCreateTask}
        >
          {taskCreated ? t("taskCreated") : t("createTask")}
        </Button>
        <Button
          variant="secondary"
          className="px-3 py-1.5 text-[12px]"
          disabled={pending || addedToRoadmap || dismissed}
          onClick={handleAddToRoadmap}
        >
          {addedToRoadmap ? t("addedToRoadmap") : t("addToRoadmap")}
        </Button>
        <Button variant="ghost" className="px-3 py-1.5 text-[12px]" disabled={pending || dismissed} onClick={handleDismiss}>
          {t("dismiss")}
        </Button>
      </div>
    </li>
  );
}
