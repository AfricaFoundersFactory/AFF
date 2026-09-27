import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ReadinessStages } from "@/components/scoring/ReadinessStages";

type Stage = { label: string; items: string[] };

export async function StartupReadinessSection() {
  const t = await getTranslations("home.readiness");
  const tStages = await getTranslations();
  const stages = tStages.raw("readinessStages") as Stage[];

  return (
    <section className="relative z-[2] flex flex-col items-center px-6 pb-16 sm:px-10 sm:pb-24 lg:px-[120px] lg:pb-[150px]">
      <Container className="!px-0" narrow>
        <div className="mx-auto mb-10 max-w-xl text-center sm:mb-16">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2 className="font-heading text-2xl font-semibold leading-[1.25] text-aff-text sm:text-[38px]">
            {t("headline1")}
            <br />
            {t("headline2")}
          </h2>
        </div>
      </Container>
      <Container className="!px-0">
        <div className="mx-auto w-full max-w-[1200px]">
          <ReadinessStages stages={stages} />
        </div>
      </Container>
      <p className="mx-auto mt-9 max-w-[600px] text-center text-sm font-medium text-aff-text sm:mt-11">
        {t("disclaimer")}
      </p>
    </section>
  );
}
