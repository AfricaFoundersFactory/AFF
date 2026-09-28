import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getWorkspaceContext } from "@/lib/services/workspace";
import { listOpportunities, listSaved, listApplications } from "@/lib/services/opportunities";
import { buildOpportunityMatchContext, matchOpportunities } from "@/lib/opportunities/matching";
import { OpportunityWorkspaceView, type OpportunityWorkspaceEntry } from "@/components/dashboard/opportunities/OpportunityWorkspaceView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.opportunities" });
  return { title: t("pageTitle") };
}

export default async function DashboardOpportunitiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const { startups } = await getWorkspaceContext();
  const opportunities = listOpportunities();

  const dataByStartupId: Record<string, OpportunityWorkspaceEntry> = Object.fromEntries(
    startups.map((startup) => {
      const ctx = buildOpportunityMatchContext(startup.twin);
      const matches = matchOpportunities(opportunities, ctx);
      const saved = listSaved(startup.id);
      const applications = listApplications(startup.id);
      return [startup.id, { matches, saved, applications }];
    }),
  );

  return <OpportunityWorkspaceView dataByStartupId={dataByStartupId} />;
}
