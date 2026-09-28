import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.privacy" });
  return { title: t("title"), description: t("description") };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("privacy");

  return (
    <Container narrow className="py-16 sm:py-24 lg:py-20">
      <h1 className="mb-5 font-heading text-[28px] font-semibold text-aff-text sm:text-[36px]">
        {t("title")}
      </h1>
      <p className="max-w-2xl text-base leading-relaxed text-aff-muted">{t("body")}</p>
    </Container>
  );
}
