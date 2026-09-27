import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";

export async function ExpertFeedbackSection() {
  const t = await getTranslations("home.feedback");
  const actions = t.raw("actions") as string[];

  return (
    <section className="relative z-[2] flex flex-col items-center px-6 pb-16 sm:px-10 sm:pb-24 lg:px-[120px] lg:pb-[150px]">
      <Container className="!px-0" narrow>
        <div className="mx-auto mb-9 max-w-xl text-center sm:mb-12">
          <h2 className="font-heading text-2xl font-semibold leading-[1.25] text-aff-text sm:text-[38px]">
            {t("headline1")}
            <br />
            {t("headline2")}
          </h2>
        </div>
      </Container>

      <div className="mb-10 flex flex-wrap items-center justify-center gap-4 sm:mb-14">
        <div className="rounded-full border border-aff-line px-4 py-2.5 text-[12.5px] font-semibold tracking-[0.06em] text-aff-text">
          {t("formulaA")}
        </div>
        <div className="text-aff-muted">+</div>
        <div className="rounded-full border border-aff-line px-4 py-2.5 text-[12.5px] font-semibold tracking-[0.06em] text-aff-text">
          {t("formulaB")}
        </div>
        <div className="text-aff-muted">+</div>
        <div className="rounded-full border border-aff-accent px-4 py-2.5 text-[12.5px] font-semibold tracking-[0.06em] text-aff-accent">
          {t("formulaC")}
        </div>
      </div>

      <Container className="!px-0" narrow>
        <div className="mx-auto w-full max-w-[760px] rounded-2xl border border-aff-line bg-aff-bg2 p-8 sm:p-10">
          <div className="mb-4 text-[11.5px] font-semibold tracking-[0.1em] text-aff-muted">
            {t("mentorLabel")}
          </div>
          <p className="mb-6 text-lg leading-relaxed text-aff-text">{t("mentorQuote")}</p>
          <div className="flex flex-wrap gap-2.5">
            {actions.map((action, i) => (
              <div
                key={action}
                className={
                  i === 2
                    ? "rounded-lg border border-aff-accent/40 px-3.5 py-2 text-[13px] text-aff-accent"
                    : "rounded-lg border border-aff-line px-3.5 py-2 text-[13px] text-aff-muted"
                }
              >
                {action}
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
