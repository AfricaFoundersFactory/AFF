import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";

export async function ScoreCycleSection() {
  const t = await getTranslations("home.scoreCycle");
  const steps = t.raw("steps") as string[];

  return (
    <section className="relative z-[2] px-6 pb-16 sm:px-10 sm:pb-24 lg:px-[120px] lg:pb-[150px]">
      <Container className="!px-0">
        <div className="mx-auto mb-8 max-w-[1200px] text-center sm:mb-11">
          <h3 className="font-heading text-2xl font-semibold leading-[1.3] text-aff-text sm:text-[30px]">
            {t("headline1")}
            <br />
            <span className="text-aff-accent">{t("headline2")}</span>
          </h3>
        </div>
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-y-3">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center">
              <div className="rounded-full border border-aff-line px-4 py-2.5 font-heading text-xs font-semibold tracking-[0.06em] text-aff-text sm:px-[18px] sm:text-[13px]">
                {step}
              </div>
              {i < steps.length - 1 ? (
                <div className="mx-2 h-px w-6 bg-aff-accent opacity-50 sm:mx-0 sm:w-8" />
              ) : null}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
