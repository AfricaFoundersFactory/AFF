import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getWorkspaceContext } from "@/lib/services/workspace";
import { computeProfileCompletion } from "@/lib/services/profile-completion";
import { getAssessmentHistory, getDraftAssessment } from "@/lib/services/readiness";
import { getCurrentRoadmap } from "@/lib/services/roadmap";
import { ReadinessDashboardView, type ReadinessEntry } from "@/components/dashboard/readiness/ReadinessDashboardView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.readiness" });
  return { title: t("pageTitle") };
}

export default async function DashboardReadinessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const { startups } = await getWorkspaceContext();

  const dataByStartupId: Record<string, ReadinessEntry> = Object.fromEntries(
    startups.map((startup) => {
      const history = getAssessmentHistory(startup.id);
      const roadmap = getCurrentRoadmap(startup.id);
      const roadmapCriterionIds = (roadmap?.items ?? [])
        .filter((item) => item.status !== "done" && item.status !== "cancelled" && item.readinessCriterion)
        .map((item) => item.readinessCriterion!);
      return [
        startup.id,
        {
          assessment: history[history.length - 1],
          history,
          completion: computeProfileCompletion(startup.twin),
          hasDraft: Boolean(getDraftAssessment(startup.id)),
          roadmapCriterionIds,
        },
      ];
    }),
  );

  return <ReadinessDashboardView dataByStartupId={dataByStartupId} />;
}
