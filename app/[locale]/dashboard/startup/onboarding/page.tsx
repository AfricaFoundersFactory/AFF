import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getWorkspaceContext } from "@/lib/services/workspace";
import { OnboardingFlow } from "@/components/dashboard/onboarding/OnboardingFlow";
import type { StartupDigitalTwin } from "@/types/digital-twin";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.onboarding" });
  return { title: t("metaTitle") };
}

export default async function DashboardOnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const { startups } = await getWorkspaceContext();
  const dataByStartupId: Record<string, StartupDigitalTwin> = Object.fromEntries(
    startups.map((startup) => [startup.id, startup.twin]),
  );

  return <OnboardingFlow dataByStartupId={dataByStartupId} />;
}
