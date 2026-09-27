import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/Button";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-6 font-heading text-[15px] font-bold tracking-[0.1em] text-aff-accent">
        404
      </div>
      <h1 className="mb-4 font-heading text-[28px] font-semibold text-aff-text sm:text-[36px]">
        {t("title")}
      </h1>
      <p className="mb-9 text-base text-aff-muted">{t("subtitle")}</p>
      <ButtonLink href="/">{t("cta")}</ButtonLink>
    </div>
  );
}
