import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getWorkspaceContext } from "@/lib/services/workspace";
import { getWorkspace, getActiveVersion, getSectionsWithSourceUpdates } from "@/lib/services/pitch";
import { PitchEditorView, type PitchEditorEntry } from "@/components/dashboard/pitch/PitchEditorView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.pitch.editor" });
  return { title: t("pageTitle") };
}

export default async function DashboardPitchEditorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const { startups } = await getWorkspaceContext();

  const dataByStartupId: Record<string, PitchEditorEntry> = Object.fromEntries(
    startups.map((startup) => {
      const workspace = getWorkspace(startup.id);
      const activeVersion = getActiveVersion(startup.id);
      const sourceUpdates = activeVersion ? getSectionsWithSourceUpdates(startup.id, activeVersion.id) : {};
      return [startup.id, { workspace, activeVersion, sourceUpdates }];
    }),
  );

  return <PitchEditorView dataByStartupId={dataByStartupId} />;
}
