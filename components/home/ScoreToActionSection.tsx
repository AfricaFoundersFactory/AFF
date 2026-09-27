import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { ActionPlan } from "@/components/scoring/ActionPlan";
import type { ActionCard } from "@/types/scoring";

export async function ScoreToActionSection() {
  const t = await getTranslations("home.scoreToAction");
  const cards = t.raw("cards") as ActionCard[];

  return (
    <section className="relative z-[2] flex flex-col items-center px-6 pb-16 sm:px-10 sm:pb-24 lg:px-[120px] lg:pb-[150px]">
      <Container className="!px-0" narrow>
        <div className="mx-auto mb-10 max-w-xl text-center sm:mb-16">
          <h2 className="font-heading text-2xl font-semibold leading-[1.25] text-aff-text sm:text-[38px]">
            {t("headline1")}
            <br />
            {t("headline2")}
          </h2>
        </div>
      </Container>
      <Container className="!px-0">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 sm:flex-row sm:gap-7">
          {cards.map((card) => (
            <ActionPlan
              key={card.title}
              card={card}
              gapLabel={t("gapLabel")}
              actionLabel={t("actionLabel")}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
