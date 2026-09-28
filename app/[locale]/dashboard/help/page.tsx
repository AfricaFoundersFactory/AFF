import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { listHelpArticles } from "@/lib/help/articles";
import { contextualHelpMap } from "@/lib/help/contextual";
import { HelpCenterView } from "@/components/dashboard/help/HelpCenterView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.help" });
  return { title: t("pageTitle") };
}

export default async function DashboardHelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return <HelpCenterView articles={listHelpArticles()} contextualHelpMap={contextualHelpMap} />;
}
