import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/Button";

export async function FinalCtaSection() {
  const t = await getTranslations("home.finalCta");
  const tc = await getTranslations("common");

  return (
    <section className="relative z-[2] flex min-h-[360px] flex-col items-center justify-center overflow-hidden px-6 py-20 text-center sm:min-h-[480px] sm:px-10 lg:min-h-[560px] lg:px-[120px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-md sm:h-[600px] sm:w-[1000px]"
        style={{
          background:
            "radial-gradient(circle, rgba(23,201,154,0.18) 0%, rgba(34,184,214,0.06) 45%, rgba(0,26,45,0) 72%)",
        }}
      />
      <h2 className="relative mb-6 max-w-[760px] font-heading text-2xl font-semibold leading-[1.3] text-aff-text sm:text-[32px] lg:text-[44px]">
        {t("headline1")}
        <br />
        {t("headline2")} <span className="text-aff-accent">{t("headlineAccent")}</span>
        {t("headlineEnd")}
      </h2>
      <div className="relative flex w-full max-w-sm flex-col gap-3.5 sm:w-auto sm:max-w-none sm:flex-row sm:gap-4">
        <ButtonLink href="/join" block className="sm:w-auto">
          {tc("joinCta")}
        </ButtonLink>
        <ButtonLink href="/pitch-live" variant="secondary" block className="sm:w-auto">
          {tc("pitchCta")}
        </ButtonLink>
      </div>
    </section>
  );
}
