import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileNav } from "./MobileNav";
import { NavLink } from "./NavLink";
import { HeaderFrame } from "./HeaderFrame";

export async function Header() {
  const t = await getTranslations("nav");
  const tc = await getTranslations("common");

  const items = [
    { href: "/mission", label: t("mission") },
    { href: "/founders", label: t("founders") },
    { href: "/pitch-live", label: t("pitchLive") },
    { href: "/community", label: t("community") },
    { href: "/resources", label: t("resources") },
    { href: "/about", label: t("about") },
  ];

  return (
    <HeaderFrame>
      <Link
        href="/"
        className="font-heading text-[15px] font-bold tracking-[0.06em] text-aff-text no-underline sm:text-base"
      >
        AFRICA FOUNDERS FACTORY
      </Link>

      <nav className="hidden gap-9 lg:flex" aria-label="Main">
        {items.map((item) => (
          <NavLink key={item.href} href={item.href}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="hidden items-center gap-5 lg:flex">
        <LanguageSwitcher />
        <NavLink href="/sign-in">{t("signIn")}</NavLink>
        <ButtonLink href="/join" className="px-5 py-[11px] text-[14px]">
          {tc("joinCta")}
        </ButtonLink>
      </div>

      <MobileNav items={items} signInLabel={t("signIn")} joinLabel={tc("joinCta")} />
    </HeaderFrame>
  );
}
