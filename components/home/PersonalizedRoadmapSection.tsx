import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";

type RoadmapItem = { n: string; text: string };

export async function PersonalizedRoadmapSection() {
  const t = await getTranslations("home.roadmap");
  const items = t.raw("items") as RoadmapItem[];

  return (
    <section className="relative z-[2] flex flex-col items-center px-6 pb-16 sm:px-10 sm:pb-24 lg:px-[120px] lg:pb-[150px]">
      <Container className="!px-0" narrow>
        <div className="mx-auto mb-9 max-w-xl text-center sm:mb-14">
          <h2 className="font-heading text-2xl font-semibold leading-[1.25] text-aff-text sm:text-[38px]">
            {t("headline")}
          </h2>
        </div>
      </Container>
      <Container className="!px-0" narrow>
        <div className="mx-auto w-full max-w-[820px] rounded-2xl border border-aff-line bg-aff-bg2 px-6 sm:px-10">
          <div className="py-4 text-[11.5px] font-semibold tracking-[0.1em] text-aff-accent sm:py-[18px]">
            {t("label")}
          </div>
          {items.map((item) => (
            <div
              key={item.n}
              className="flex items-center gap-4 border-t border-aff-line py-4 sm:gap-5"
            >
              <div className="font-heading text-[13px] font-bold text-aff-muted">{item.n}</div>
              <div className="text-[15px] text-aff-text sm:text-[15.5px]">{item.text}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
