import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getWorkspaceContext } from "@/lib/services/workspace";
import { computeProfileCompletion } from "@/lib/services/profile-completion";
import { MyStartupView, type MyStartupEntry } from "@/components/dashboard/twin/MyStartupView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.nav" });
  return { title: t("myStartup") };
}

export default async function DashboardStartupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const { startups } = await getWorkspaceContext();

  const dataByStartupId: Record<string, MyStartupEntry> = Object.fromEntries(
    startups.map((startup) => [startup.id, { twin: startup.twin, completion: computeProfileCompletion(startup.twin) }]),
  );

  return <MyStartupView dataByStartupId={dataByStartupId} />;
}
