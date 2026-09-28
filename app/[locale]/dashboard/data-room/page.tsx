import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getWorkspaceContext } from "@/lib/services/workspace";
import { getChecklist, getCompletion, getDataRoom } from "@/lib/services/data-room";
import { DataRoomView, type DataRoomPageEntry } from "@/components/dashboard/data-room/DataRoomView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.dataRoom" });
  return { title: t("pageTitle") };
}

export default async function DashboardDataRoomPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const { startups } = await getWorkspaceContext();

  const dataByStartupId: Record<string, DataRoomPageEntry> = Object.fromEntries(
    startups.map((startup) => {
      const room = getDataRoom(startup.id);
      const checklist = getChecklist(startup.id);
      const completion = getCompletion(startup.id);
      return [startup.id, { room, checklist, completion }];
    }),
  );

  return <DataRoomView dataByStartupId={dataByStartupId} />;
}
