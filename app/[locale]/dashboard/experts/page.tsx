import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getWorkspaceContext } from "@/lib/services/workspace";
import { listExperts, listStartupNeeds } from "@/lib/services/experts";
import { matchExperts, buildStartupMatchContext } from "@/lib/experts/matching";
import { ExpertDirectoryView, type ExpertDirectoryEntry } from "@/components/dashboard/experts/ExpertDirectoryView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.experts" });
  return { title: t("pageTitle") };
}

export default async function DashboardExpertsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const { startups } = await getWorkspaceContext();
  const nowIso = new Date().toISOString();
  const experts = listExperts();

  const dataByStartupId: Record<string, ExpertDirectoryEntry> = Object.fromEntries(
    startups.map((startup) => {
      const needs = listStartupNeeds(startup.id, nowIso);
      const ctx = buildStartupMatchContext(startup.twin, needs);
      const matches = matchExperts(experts, ctx);
      return [startup.id, { needs, matches }];
    }),
  );

  return <ExpertDirectoryView experts={experts} dataByStartupId={dataByStartupId} />;
}
