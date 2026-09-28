import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getWorkspaceContext } from "@/lib/services/workspace";
import { createAssessment, getDraftAssessment } from "@/lib/services/readiness";
import { AssessmentFlow, type AssessmentEntry } from "@/components/dashboard/readiness/AssessmentFlow";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.readiness" });
  return { title: t("assessmentTitle") };
}

export default async function DashboardReadinessAssessmentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const { startups } = await getWorkspaceContext();
  const nowIso = new Date().toISOString();

  const dataByStartupId: Record<string, AssessmentEntry> = Object.fromEntries(
    startups.map((startup) => {
      const draft = getDraftAssessment(startup.id) ?? createAssessment(startup.id, nowIso);
      return [startup.id, { twin: startup.twin, draft }];
    }),
  );

  return <AssessmentFlow dataByStartupId={dataByStartupId} />;
}
