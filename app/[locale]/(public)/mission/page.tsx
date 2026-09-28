import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.mission" });
  return { title: t("title"), description: t("description") };
}

export default async function MissionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("mission");

  return (
    <Container narrow className="py-16 text-center sm:py-24 lg:py-28">
      <Eyebrow>{t("eyebrow")}</Eyebrow>
      <h1 className="mb-6 font-heading text-[32px] font-semibold leading-[1.25] text-aff-text sm:text-[48px]">
        {t("headline1")}
        <br />
        {t("headline2")} <span className="text-aff-accent">{t("headlineAccent")}</span>
        {t("headlineEnd")}
      </h1>
      <p className="mb-5 text-base leading-relaxed text-aff-muted sm:text-lg sm:leading-[1.7]">
        {t("body1")}
      </p>
      <p className="text-base leading-relaxed text-aff-muted sm:text-lg sm:leading-[1.7]">
        {t("body2")}
      </p>
    </Container>
  );
}
