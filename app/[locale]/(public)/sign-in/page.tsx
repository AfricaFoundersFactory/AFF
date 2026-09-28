import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.signIn" });
  return { title: t("title"), description: t("description") };
}

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("signIn");
  const tc = await getTranslations("common");

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16 sm:py-24">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center font-heading text-[26px] font-semibold text-aff-text sm:text-[30px]">
          {t("title")}
        </h1>
        <p className="mb-9 text-center text-[14.5px] text-aff-muted">{t("subtitle")}</p>

        <form className="flex flex-col gap-4" aria-label={t("title")}>
          <div>
            <label
              htmlFor="signin-email"
              className="mb-2 block text-[13px] font-semibold text-aff-muted"
            >
              {t("email")}
            </label>
            <input
              id="signin-email"
              type="email"
              autoComplete="email"
              placeholder="you@email.com"
              className="w-full rounded-lg border border-aff-line bg-aff-bg2 px-4 py-3.5 text-[15px] text-aff-text placeholder:text-aff-muted focus:border-aff-accent"
            />
          </div>
          <div>
            <label
              htmlFor="signin-password"
              className="mb-2 block text-[13px] font-semibold text-aff-muted"
            >
              {t("password")}
            </label>
            <input
              id="signin-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-aff-line bg-aff-bg2 px-4 py-3.5 text-[15px] text-aff-text placeholder:text-aff-muted focus:border-aff-accent"
            />
          </div>
          <a href="#" className="text-[13px] no-underline">
            {t("forgot")}
          </a>
          <Button type="button" block className="mt-1">
            {t("submit")}
          </Button>
        </form>

        <p className="mt-7 text-center text-sm text-aff-muted">
          {t("noAccount")}{" "}
          <Link href="/join" className="no-underline">
            {tc("joinCta")}
          </Link>
        </p>
      </div>
    </div>
  );
}
