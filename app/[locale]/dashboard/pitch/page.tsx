import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getWorkspaceContext } from "@/lib/services/workspace";
import { getWorkspace, getActiveVersion } from "@/lib/services/pitch";
import { countUnresolvedComments } from "@/lib/services/pitch-review";
import { PitchLabView, type PitchLabEntry } from "@/components/dashboard/pitch/PitchLabView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.pitch" });
  return { title: t("pageTitle") };
}

export default async function DashboardPitchLabPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const { startups } = await getWorkspaceContext();

  const dataByStartupId: Record<string, PitchLabEntry> = Object.fromEntries(
    startups.map((startup) => {
      const workspace = getWorkspace(startup.id);
      const activeVersion = getActiveVersion(startup.id);
      const requiredSections = activeVersion?.sections.filter((s) => s.required) ?? [];
      const requiredComplete = requiredSections.filter((s) => s.status === "complete" || s.content.trim().length > 0).length;

      return [
        startup.id,
        {
          workspace,
          activeVersion,
          requiredTotal: requiredSections.length,
          requiredComplete,
          unresolvedFeedback: countUnresolvedComments(startup.id, activeVersion?.id),
        },
      ];
    }),
  );

  return <PitchLabView dataByStartupId={dataByStartupId} />;
}
