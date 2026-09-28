import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getWorkspaceContext } from "@/lib/services/workspace";
import { listResources, listBookmarks, getTaskIdForResource } from "@/lib/services/resources";
import { recommendResources } from "@/lib/resources/recommendation";
import { getLatestAssessment } from "@/lib/services/readiness";
import { ResourceLibraryView, type ResourceLibraryEntry } from "@/components/dashboard/resources/ResourceLibraryView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.resources" });
  return { title: t("pageTitle") };
}

export default async function DashboardResourcesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const { startups } = await getWorkspaceContext();
  const resources = listResources();

  const dataByStartupId: Record<string, ResourceLibraryEntry> = Object.fromEntries(
    startups.map((startup) => {
      const assessment = getLatestAssessment(startup.id);
      const weakDimensions = (assessment?.dimensions ?? [])
        .filter((d) => d.status === "weak" || d.status === "developing")
        .map((d) => d.dimension);
      const recommendations = recommendResources(resources, { stage: startup.twin.identity.stage, weakDimensions });
      const bookmarks = listBookmarks(startup.id);
      const bookmarkedIds = new Set(bookmarks.map((b) => b.resourceId));
      const taskedIds = new Set(resources.filter((r) => getTaskIdForResource(startup.id, r.id)).map((r) => r.id));
      return [startup.id, { recommendations, bookmarkedIds: Array.from(bookmarkedIds), taskedIds: Array.from(taskedIds) }];
    }),
  );

  return <ResourceLibraryView resources={resources} dataByStartupId={dataByStartupId} />;
}
