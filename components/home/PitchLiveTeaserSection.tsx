import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ButtonLink } from "@/components/ui/Button";
import { VideoPlaceholder } from "@/components/pitch/VideoPlaceholder";
import { PitchFormatStats } from "@/components/pitch/PitchFormatStats";

export async function PitchLiveTeaserSection() {
  const t = await getTranslations("home.pitchLive");
  const format = t.raw("format") as { value: string; label: string }[];

  return (
    <section className="relative z-[2] flex justify-center px-6 pb-16 sm:px-10 sm:pb-24 lg:px-[120px] lg:pb-[150px]">
      <Container className="!px-0">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-10 sm:flex-row sm:gap-16">
          <div className="w-full sm:flex-1">
            <VideoPlaceholder label={t("headline1")} />
          </div>
          <div className="w-full sm:flex-1">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h2 className="mb-5 font-heading text-2xl font-semibold leading-[1.3] text-aff-text sm:text-[34px]">
              {t("headline1")}
              <br />
              {t("headline2")}
            </h2>
            <p className="mb-7 text-[15px] leading-relaxed text-aff-muted sm:mb-8 sm:text-[16.5px]">
              {t("body")}
            </p>
            <div className="mb-7 sm:mb-8">
              <PitchFormatStats format={format} />
            </div>
            <div className="flex flex-col gap-3.5 sm:flex-row">
              <ButtonLink href="/apply-to-pitch" className="px-[22px] py-3.5 text-sm">
                {t("applyCta")}
              </ButtonLink>
              <ButtonLink
                href="/pitch-live"
                variant="secondary"
                className="px-[22px] py-3.5 text-sm"
              >
                {t("discoverCta")}
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
