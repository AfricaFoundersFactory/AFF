import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";

const socialLinks = ["TikTok", "LinkedIn", "YouTube", "Instagram"];

export async function Footer() {
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");
  const tc = await getTranslations("common");

  return (
    <footer className="relative z-10 border-t border-aff-line px-6 py-16 sm:px-10 lg:px-[120px] lg:py-20">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-14 lg:flex-row lg:justify-between lg:gap-16">
        <div className="max-w-xs">
          <div className="mb-4 font-heading text-[15px] font-bold tracking-[0.06em] text-aff-text">
            AFRICA FOUNDERS FACTORY
          </div>
          <p className="text-sm leading-relaxed text-aff-muted">{t("mission")}</p>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:flex sm:gap-20">
          <div>
            <div className="mb-4 text-xs font-semibold tracking-[0.08em] text-aff-muted">
              {t("colExplore")}
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/mission" className="text-sm text-aff-text no-underline hover:text-aff-accent">
                {tn("mission")}
              </Link>
              <Link href="/founders" className="text-sm text-aff-text no-underline hover:text-aff-accent">
                {tn("founders")}
              </Link>
              <Link href="/#founder-scoring" className="text-sm text-aff-text no-underline hover:text-aff-accent">
                {t("scoring")}
              </Link>
              <Link href="/pitch-live" className="text-sm text-aff-text no-underline hover:text-aff-accent">
                {tn("pitchLive")}
              </Link>
            </div>
          </div>

          <div>
            <div className="mb-4 text-xs font-semibold tracking-[0.08em] text-aff-muted">
              {t("colCommunity")}
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/join" className="text-sm text-aff-text no-underline hover:text-aff-accent">
                {t("joinLink")}
              </Link>
              <Link href="/community" className="text-sm text-aff-text no-underline hover:text-aff-accent">
                {t("whoCanJoin")}
              </Link>
            </div>
          </div>

          <div>
            <div className="mb-4 text-xs font-semibold tracking-[0.08em] text-aff-muted">
              {t("colResources")}
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/resources" className="text-sm text-aff-text no-underline hover:text-aff-accent">
                {t("library")}
              </Link>
            </div>
          </div>

          <div>
            <div className="mb-4 text-xs font-semibold tracking-[0.08em] text-aff-muted">
              {t("colCompany")}
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/about" className="text-sm text-aff-text no-underline hover:text-aff-accent">
                {tn("about")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-14 flex max-w-[1440px] flex-col gap-6 border-t border-aff-line pt-7 text-[13px] text-aff-muted sm:flex-row sm:items-center sm:justify-between">
        <div>{tc("siteUrl")}</div>
        <div className="flex flex-wrap gap-6">
          {socialLinks.map((label) => (
            <a
              key={label}
              href="#"
              className="text-aff-muted no-underline hover:text-aff-accent"
            >
              {label}
            </a>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <LanguageSwitcher />
          <Link href="/privacy" className="ml-2 text-aff-muted no-underline hover:text-aff-accent">
            {t("privacy")}
          </Link>
          <Link href="/terms" className="text-aff-muted no-underline hover:text-aff-accent">
            {t("terms")}
          </Link>
          <a href="#" className="text-aff-muted no-underline hover:text-aff-accent">
            {t("cookies")}
          </a>
        </div>
      </div>
    </footer>
  );
}
