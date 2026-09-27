import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { CommunityChips } from "@/components/community/CommunityChips";

type ChipItem = { label: string; future?: boolean };

export async function CommunitySection() {
  const t = await getTranslations("home.community");
  const tc = await getTranslations("common");
  const tRoot = await getTranslations();
  const chips = tRoot.raw("communityChips") as ChipItem[];

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
      <Container className="!px-0" narrow>
        <div className="mx-auto mb-8 max-w-[900px]">
          <CommunityChips chips={chips} />
        </div>
      </Container>
      <p className="mb-7 text-[15px] text-aff-muted">{t("line")}</p>
      <ButtonLink href="/join">{tc("joinCta")}</ButtonLink>
    </section>
  );
}
