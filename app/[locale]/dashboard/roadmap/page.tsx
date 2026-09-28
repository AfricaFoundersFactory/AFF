import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getWorkspaceContext } from "@/lib/services/workspace";
import { getLatestAssessment } from "@/lib/services/readiness";
import { getCurrentRoadmap } from "@/lib/services/roadmap";
import { getTasksForStartup } from "@/lib/services/tasks";
import { getQuickWins } from "@/lib/roadmap/prioritization";
import { shouldSuggestReassessment } from "@/lib/roadmap/reassessment";
import { RoadmapView, type RoadmapPageEntry } from "@/components/dashboard/roadmap/RoadmapView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.roadmap" });
  return { title: t("pageTitle") };
}

export default async function DashboardRoadmapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const { startups } = await getWorkspaceContext();

  const dataByStartupId: Record<string, RoadmapPageEntry> = Object.fromEntries(
    startups.map((startup) => {
      const roadmap = getCurrentRoadmap(startup.id);
      const tasks = getTasksForStartup(startup.id);
      const latestAssessment = getLatestAssessment(startup.id);
      const quickWins = roadmap ? getQuickWins(roadmap) : [];
      const topPriorities = roadmap
        ? [...roadmap.items]
            .filter((i) => i.status !== "done" && i.status !== "cancelled")
            .sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority))
            .slice(0, 3)
        : [];
      const reassessment = shouldSuggestReassessment(latestAssessment, roadmap?.items ?? []);

      return [
        startup.id,
        {
          roadmap,
          tasks,
          quickWins,
          topPriorities,
          hasCompletedAssessment: Boolean(latestAssessment),
          reassessment,
        },
      ];
    }),
  );

  return <RoadmapView dataByStartupId={dataByStartupId} />;
}

function priorityRank(p: string | undefined): number {
  switch (p) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}
