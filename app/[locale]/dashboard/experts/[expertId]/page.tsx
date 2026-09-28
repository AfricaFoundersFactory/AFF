import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getWorkspaceContext } from "@/lib/services/workspace";
import { getExpert, listStartupNeeds } from "@/lib/services/experts";
import { getSession } from "@/lib/auth/session";
import { explainExpertMatch, buildStartupMatchContext } from "@/lib/experts/matching";
import { ExpertProfileView, type ExpertProfileEntry } from "@/components/dashboard/experts/ExpertProfileView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; expertId: string }>;
}): Promise<Metadata> {
  const { locale, expertId } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.experts" });
  const expert = getExpert(expertId);
  return { title: expert ? expert.displayName : t("profile.notFoundTitle") };
}

export default async function DashboardExpertProfilePage({
  params,
}: {
  params: Promise<{ locale: string; expertId: string }>;
}) {
  const { locale, expertId } = await params;
  setRequestLocale(locale as Locale);

  const { startups } = await getWorkspaceContext();
  const session = await getSession();
  const expert = getExpert(expertId);
  const nowIso = new Date().toISOString();

  const dataByStartupId: Record<string, ExpertProfileEntry> = Object.fromEntries(
    startups.map((startup) => {
      const needs = listStartupNeeds(startup.id, nowIso);
      if (!expert) return [startup.id, { reasons: [], needs }];
      const ctx = buildStartupMatchContext(startup.twin, needs);
      const reasons = explainExpertMatch(expert, ctx);
      return [startup.id, { reasons, needs }];
    }),
  );

  return <ExpertProfileView expert={expert} founderId={session?.user.id ?? "unknown-founder"} dataByStartupId={dataByStartupId} />;
}
