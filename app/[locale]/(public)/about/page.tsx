import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ContactForm } from "@/components/forms/ContactForm";

const CONTACT_EMAIL = "contact@africafoundersfactory.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.about" });
  return { title: t("title"), description: t("description") };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("about");
  const tc = await getTranslations("about.contact");

  return (
    <>
      <Container narrow className="py-16 text-center sm:py-24 lg:py-28">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="mb-6 font-heading text-[28px] font-semibold leading-[1.3] text-aff-text sm:text-[44px]">
          {t("headline")}
        </h1>
        <p className="mb-5 text-base leading-relaxed text-aff-muted sm:text-lg sm:leading-[1.7]">
          {t("body1")}
        </p>
        <p className="text-base leading-relaxed text-aff-muted sm:text-lg sm:leading-[1.7]">
          {t("body2")}
        </p>
      </Container>

      <Container narrow className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-3 font-heading text-2xl font-semibold text-aff-text sm:text-[32px]">
            {tc("heading")}
          </h2>
          <p className="mb-3 text-[15px] leading-relaxed text-aff-muted sm:text-base">
            {tc("body")}
          </p>
          <p className="mb-10 text-sm text-aff-muted">
            {tc("emailLabel")}{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-aff-muted underline underline-offset-2 hover:text-aff-text"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>
        <div className="mx-auto max-w-2xl text-left">
          <ContactForm />
        </div>
      </Container>
    </>
  );
}
