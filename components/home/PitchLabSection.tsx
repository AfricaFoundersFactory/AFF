import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";

type PitchLabStep = { label: string; desc: string };

export async function PitchLabSection() {
  const t = await getTranslations("home.pitchLab");
  const steps = t.raw("steps") as PitchLabStep[];

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
        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-2 gap-x-6 gap-y-8 sm:mb-14 sm:flex sm:flex-nowrap sm:justify-between sm:gap-0">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-start sm:flex-1">
              <div className="flex min-w-[90px] flex-col gap-2">
                <div className="font-heading text-[13px] font-semibold tracking-[0.05em] text-aff-accent sm:text-sm">
                  {step.label}
                </div>
                <div className="max-w-[140px] text-[12.5px] leading-relaxed text-aff-muted sm:text-[13px]">
                  {step.desc}
                </div>
              </div>
              {i < steps.length - 1 ? (
                <div className="mx-2 mt-[9px] hidden h-px flex-1 bg-aff-line sm:block" />
              ) : null}
            </div>
          ))}
        </div>
      </Container>

      <Container className="!px-0">
        <div className="mx-auto flex max-w-[1200px] items-center justify-center gap-6 sm:gap-10">
          <div className="max-w-[220px] text-center text-[11px] font-semibold tracking-[0.08em] text-aff-muted sm:max-w-[260px] sm:text-xs">
            {t("gapFounder")}
          </div>
          <div className="text-xl text-aff-accent sm:text-[22px]">→</div>
          <div className="max-w-[220px] text-center text-[11px] font-semibold tracking-[0.08em] text-aff-text sm:max-w-[260px] sm:text-xs">
            {t("gapAudience")}
          </div>
        </div>
      </Container>
    </section>
  );
}
