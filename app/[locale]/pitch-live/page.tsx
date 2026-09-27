import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ButtonLink } from "@/components/ui/Button";
import { VideoPlaceholder } from "@/components/pitch/VideoPlaceholder";
import { PitchFormatStats } from "@/components/pitch/PitchFormatStats";
import { AfterLiveLoop } from "@/components/pitch/AfterLiveLoop";

type FormatStat = { value: string; label: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.pitchLive" });
  return { title: t("title"), description: t("description") };
}

export default async function PitchLivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("pitchLive");
  const format = t.raw("format") as FormatStat[];
  const afterLoop = t.raw("afterLoop") as string[];

  return (
    <>
      <Container className="flex justify-center pb-14 pt-14 sm:pb-16 sm:pt-20 lg:pt-20">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-10 sm:flex-row sm:gap-16">
          <div className="w-full sm:flex-1">
            <VideoPlaceholder label={t("headline1")} />
          </div>
          <div className="w-full sm:flex-1">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h1 className="mb-5 font-heading text-2xl font-semibold leading-[1.3] text-aff-text sm:text-[38px]">
              {t("headline1")}
              <br />
              {t("headline2")}
            </h1>
            <p className="mb-7 text-[15px] leading-relaxed text-aff-muted sm:mb-8 sm:text-[16.5px]">
              {t("body")}
            </p>
            <div className="mb-7 sm:mb-8">
              <PitchFormatStats format={format} />
            </div>
            <ButtonLink href="/apply-to-pitch" className="px-[22px] py-3.5 text-sm">
              {t("applyCta")}
            </ButtonLink>
          </div>
        </div>
      </Container>

      <Container className="pb-20 sm:pb-32">
        <div className="mx-auto max-w-[1200px] text-center">
          <h2 className="font-heading text-2xl font-semibold text-aff-text sm:text-[30px]">
            {t("afterHeadline1")}
            <br />
            <span className="text-aff-accent">{t("afterHeadline2")}</span>
          </h2>
          <AfterLiveLoop steps={afterLoop} />
        </div>
      </Container>
    </>
  );
}
