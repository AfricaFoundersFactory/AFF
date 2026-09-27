import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";

type ProfileGroup = { title: string; items: string[] };

export async function FounderProfileSection() {
  const t = await getTranslations("home.profile");
  const groups = t.raw("groups") as ProfileGroup[];

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
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 rounded-2xl border border-aff-line bg-aff-bg2 p-8 sm:flex-row sm:gap-14 sm:p-11">
          {groups.map((group) => (
            <div key={group.title} className="flex-1">
              <div className="mb-5 text-xs font-semibold tracking-[0.1em] text-aff-accent">
                {group.title}
              </div>
              {group.items.map((item) => (
                <div
                  key={item}
                  className="border-b border-aff-line py-2.5 text-[15px] text-aff-text last:border-b-0"
                >
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
