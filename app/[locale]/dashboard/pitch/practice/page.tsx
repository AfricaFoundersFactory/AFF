import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getWorkspaceContext } from "@/lib/services/workspace";
import { getActiveVersion } from "@/lib/services/pitch";
import { listAttempts } from "@/lib/services/pitch-practice";
import { PitchPracticeView, type PitchPracticeEntry } from "@/components/dashboard/pitch/PitchPracticeView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.pitch.practice" });
  return { title: t("pageTitle") };
}

export default async function DashboardPitchPracticePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const { startups } = await getWorkspaceContext();

  const dataByStartupId: Record<string, PitchPracticeEntry> = Object.fromEntries(
    startups.map((startup) => {
      const activeVersion = getActiveVersion(startup.id);
      return [startup.id, { activeVersion, attempts: listAttempts(startup.id, activeVersion?.id) }];
    }),
  );

  return <PitchPracticeView dataByStartupId={dataByStartupId} />;
}
