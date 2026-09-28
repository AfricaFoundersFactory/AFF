import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ButtonLink } from "@/components/ui/Button";
import { ReadinessStages } from "@/components/scoring/ReadinessStages";

type Stage = { label: string; items: string[] };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.founders" });
  return { title: t("title"), description: t("description") };
}

export default async function FoundersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("founders");
  const tc = await getTranslations("common");
  const tRoot = await getTranslations();
  const stages = tRoot.raw("readinessStages") as Stage[];

  return (
    <>
      <Container narrow className="pb-8 pt-16 text-center sm:pb-10 sm:pt-24 lg:pt-20">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="mb-5 font-heading text-[32px] font-semibold leading-[1.25] text-aff-text sm:mb-6 sm:text-[44px]">
          {t("headline1")}
          <br />
          {t("headline2")}
        </h1>
        <p className="text-base leading-relaxed text-aff-muted sm:text-lg sm:leading-[1.65]">
          {t("body")}
        </p>
      </Container>

      <Container className="flex justify-center py-5 sm:py-6 lg:py-6">
        <div className="w-full max-w-[1200px]">
          <ReadinessStages stages={stages} />
        </div>
      </Container>

      <Container narrow className="flex flex-col items-center pb-20 pt-6 text-center sm:pb-28 sm:pt-8">
        <p className="mb-9 max-w-[600px] text-sm font-medium text-aff-text sm:mb-11">
          {t("disclaimer")}
        </p>
        <ButtonLink href="/join">{tc("joinCta")}</ButtonLink>
      </Container>
    </>
  );
}
