import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { ModulePlaceholder } from "./ModulePlaceholder";

/**
 * Shared renderer for every dashboard route that is only a routing/nav
 * placeholder in this batch (see lib/dashboard/navigation.ts). Each
 * app/[locale]/dashboard/<route>/page.tsx is a thin wrapper calling this
 * with its own translation key under the `dashboard.module` namespace.
 */
export async function renderModulePage(moduleKey: string, locale: string) {
  setRequestLocale(locale as Locale);
  const t = await getTranslations("dashboard");

  return (
    <ModulePlaceholder
      title={t(`module.${moduleKey}.title`)}
      description={t(`module.${moduleKey}.description`)}
      badge={t("placeholder.badge")}
    />
  );
}

export async function moduleMetadata(moduleKey: string, locale: string) {
  const t = await getTranslations({ locale, namespace: "dashboard.module" });
  return { title: t(`${moduleKey}.title`) };
}
