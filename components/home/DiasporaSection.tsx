import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";

export async function DiasporaSection() {
  const t = await getTranslations("home.diaspora");
  const tRoot = await getTranslations();
  const cities = tRoot.raw("diasporaCities") as string[];

  return (
    <section className="relative z-[2] flex flex-col items-center px-6 pb-16 sm:px-10 sm:pb-24 lg:px-[120px] lg:pb-[150px]">
      <Container className="!px-0" narrow>
        <div className="mx-auto mb-8 max-w-xl text-center sm:mb-11">
          <h2 className="mb-4 font-heading text-2xl font-semibold leading-[1.25] text-aff-text sm:mb-5 sm:text-[38px]">
            {t("headline1")}
            <br />
            <span className="text-aff-accent">{t("headline2")}</span>
          </h2>
          <p className="text-[15px] leading-relaxed text-aff-muted sm:text-[17px] sm:leading-[1.65]">
            {t("body")}
          </p>
        </div>
      </Container>
      <Container className="!px-0" narrow>
        <div className="mx-auto flex max-w-[820px] flex-wrap justify-center gap-3">
          {cities.map((city) => (
            <div
              key={city}
              className="rounded-full border border-aff-line px-4 py-2.5 text-[13px] text-aff-text"
            >
              {city}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
