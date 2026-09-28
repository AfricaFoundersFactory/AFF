import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getWorkspaceContext } from "@/lib/services/workspace";
import { getTasksForStartup } from "@/lib/services/tasks";
import { getCurrentRoadmap } from "@/lib/services/roadmap";
import { TasksView, type TasksPageEntry } from "@/components/dashboard/tasks/TasksView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.tasks" });
  return { title: t("pageTitle") };
}

export default async function DashboardTasksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const { startups } = await getWorkspaceContext();

  const dataByStartupId: Record<string, TasksPageEntry> = Object.fromEntries(
    startups.map((startup) => {
      const tasks = getTasksForStartup(startup.id);
      const roadmap = getCurrentRoadmap(startup.id);
      const roadmapItemTitleById = Object.fromEntries(
        (roadmap?.items ?? []).map((item) => [item.id, item.titleKey ?? item.title]),
      );
      return [startup.id, { tasks, roadmapItemTitleById }];
    }),
  );

  return <TasksView dataByStartupId={dataByStartupId} />;
}
