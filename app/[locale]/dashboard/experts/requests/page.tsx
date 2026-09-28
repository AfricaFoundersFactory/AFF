import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getWorkspaceContext } from "@/lib/services/workspace";
import { listSupportRequests } from "@/lib/services/support-requests";
import { listSessions, listRecommendations, getFollowUp } from "@/lib/services/mentoring";
import { getExpert } from "@/lib/services/experts";
import { ExpertRequestsView, type ExpertRequestsEntry } from "@/components/dashboard/experts/ExpertRequestsView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.experts.requestsPage" });
  return { title: t("pageTitle") };
}

export default async function DashboardExpertRequestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const { startups } = await getWorkspaceContext();

  const dataByStartupId: Record<string, ExpertRequestsEntry> = Object.fromEntries(
    startups.map((startup) => {
      const requests = listSupportRequests(startup.id);
      const sessions = listSessions(startup.id).map((session) => ({
        session,
        recommendations: listRecommendations(startup.id, session.id),
        followUp: getFollowUp(startup.id, session.id),
      }));

      const expertIds = new Set([...requests.map((r) => r.expertId), ...sessions.map((s) => s.session.expertId)]);
      const expertsById = Object.fromEntries(
        Array.from(expertIds)
          .map((id) => [id, getExpert(id)])
          .filter((entry): entry is [string, NonNullable<ReturnType<typeof getExpert>>] => Boolean(entry[1])),
      );

      return [startup.id, { requests, sessions, expertsById }];
    }),
  );

  return <ExpertRequestsView dataByStartupId={dataByStartupId} />;
}
