import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { ResourceSearchInput } from "@/components/resources/ResourceSearchInput";
import { ResourceCategoryList, ResourceTypeList } from "@/components/resources/ResourceCategoryList";
import { ComingSoonBadge } from "@/components/resources/ComingSoonBadge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.resources" });
  return { title: t("title"), description: t("description") };
}

export default async function ResourcesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("resources");
  const tRoot = await getTranslations();
  const categories = tRoot.raw("resourceCategories") as string[];
  const types = tRoot.raw("resourceTypes") as string[];

  return (
    <Container narrow className="py-16 text-center sm:py-24 lg:py-20">
      <h1 className="mb-7 font-heading text-[32px] font-semibold leading-[1.25] text-aff-text sm:mb-8 sm:text-[44px]">
        {t("headline")}
      </h1>

      <div className="mb-6">
        <ResourceSearchInput placeholder={t("searchPlaceholder")} />
      </div>

      <div className="mb-5">
        <ResourceCategoryList categories={categories} />
      </div>

      <div className="mb-6">
        <ResourceTypeList types={types} />
      </div>

      <div className="mb-5">
        <ComingSoonBadge label={t("comingSoon")} />
      </div>
      <p className="mx-auto max-w-[480px] text-[14.5px] text-aff-muted">{t("emptyState")}</p>
    </Container>
  );
}
