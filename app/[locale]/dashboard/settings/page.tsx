import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getWorkspaceContext } from "@/lib/services/workspace";
import { getSession } from "@/lib/auth/session";
import { getOrCreateFounderSettings, getOrCreateStartupCommunitySettings, SETTINGS_CAPABILITY_FLAGS } from "@/lib/services/settings";
import { SettingsView, type SettingsViewData } from "@/components/dashboard/settings/SettingsView";
import type { FounderSettings, StartupCommunitySettings } from "@/types/settings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.module" });
  return { title: t("settings.title") };
}

export default async function DashboardSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const { startups } = await getWorkspaceContext();
  const session = await getSession();
  const founderId = session?.user.id ?? "unknown-founder";
  const nowIso = new Date().toISOString();

  const founderSettings: FounderSettings = getOrCreateFounderSettings(founderId, locale === "en" ? "en" : "fr", nowIso);
  const startupSettingsById: Record<string, StartupCommunitySettings> = Object.fromEntries(
    startups.map((s) => [s.id, getOrCreateStartupCommunitySettings(s.id, nowIso)]),
  );

  const data: SettingsViewData = {
    user: session?.user ?? { id: founderId, name: "Founder", email: "unknown@example.org", roles: [] },
    founderSettings,
    startupSettingsById,
    capabilityFlags: SETTINGS_CAPABILITY_FLAGS,
  };

  return <SettingsView data={data} />;
}
