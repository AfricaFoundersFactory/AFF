import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { CommunityChips } from "@/components/community/CommunityChips";

type ChipItem = { label: string; future?: boolean };
type Pathway = { title: string; desc: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.community" });
  return { title: t("title"), description: t("description") };
}

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("community");
  const tRoot = await getTranslations();
  const chips = tRoot.raw("communityChips") as ChipItem[];
  const pathways = t.raw("pathways") as Pathway[];

  return (
    <>
      <Container narrow className="pb-8 pt-16 text-center sm:pb-10 sm:pt-24 lg:pt-20">
        <h1 className="font-heading text-[32px] font-semibold leading-[1.25] text-aff-text sm:text-[44px]">
          {t("headline1")}
          <br />
          {t("headline2")}
        </h1>
      </Container>

      <Container narrow className="pb-10 sm:pb-14">
        <CommunityChips chips={chips} />
      </Container>

      <Container narrow className="pb-14 text-center sm:pb-24">
        <p className="text-[15px] text-aff-muted">{t("line")}</p>
      </Container>

      <Container className="pb-20 sm:pb-32">
        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-px overflow-hidden rounded-2xl border border-aff-line bg-aff-line sm:grid-cols-2">
          {pathways.map((pathway) => (
            <div key={pathway.title} className="bg-aff-bg p-8 sm:p-10">
              <h3 className="mb-3 font-heading text-xl font-semibold text-aff-text sm:text-2xl">
                {pathway.title}
              </h3>
              <p className="mb-4 text-[14.5px] text-aff-muted">{pathway.desc}</p>
              <Link
                href="/join"
                className="text-[13px] font-semibold text-aff-accent no-underline"
              >
                {t("startCta")} →
              </Link>
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}
