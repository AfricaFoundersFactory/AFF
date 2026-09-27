import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { cn } from "@/lib/utils";

type ProblemItem = { title: string; body: string };

export async function ProblemSection() {
  const t = await getTranslations("home.problem");
  const items = t.raw("items") as ProblemItem[];

  return (
    <section className="relative z-[2] px-6 pb-16 sm:px-10 sm:pb-24 lg:px-[120px] lg:pb-[150px]">
      <Container className="!px-0" narrow>
        <div className="mx-auto mb-11 max-w-2xl text-center sm:mb-20">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2 className="mb-4 font-heading text-[27px] font-semibold leading-[1.25] text-aff-text sm:mb-5 sm:text-[42px]">
            {t("headline1")}
            <br />
            {t("headline2")}
          </h2>
          <p className="text-[15px] leading-relaxed text-aff-muted sm:text-lg sm:leading-[1.65]">
            {t("body")}
          </p>
        </div>
      </Container>

      <Container className="!px-0">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 sm:grid-cols-2 sm:divide-x sm:divide-aff-line">
          {items.map((item, i) => (
            <div
              key={item.title}
              className={cn(
                "border-b border-aff-line py-6 last:border-b-0 sm:py-11 sm:pr-14 sm:first:pl-0",
                i >= items.length - 2 && "sm:border-b-0",
                i % 2 === 1 && "sm:pl-14",
              )}
            >
              <h3 className="mb-2.5 font-heading text-lg font-semibold text-aff-text sm:text-[22px]">
                {item.title}
              </h3>
              <p className="max-w-[420px] text-[14.5px] leading-relaxed text-aff-muted sm:text-[16.5px]">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
