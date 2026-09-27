"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchTo = (nextLocale: "fr" | "en") => {
    if (nextLocale === locale) return;
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <div className={cn("flex items-center gap-1.5 text-[13px] font-semibold", className)}>
      <button
        type="button"
        onClick={() => switchTo("fr")}
        aria-current={locale === "fr" ? "true" : undefined}
        className={cn(
          "cursor-pointer transition-colors",
          locale === "fr" ? "text-aff-text" : "text-aff-muted hover:text-aff-text",
        )}
      >
        FR
      </button>
      <span className="text-aff-muted" aria-hidden="true">
        /
      </span>
      <button
        type="button"
        onClick={() => switchTo("en")}
        aria-current={locale === "en" ? "true" : undefined}
        className={cn(
          "cursor-pointer transition-colors",
          locale === "en" ? "text-aff-text" : "text-aff-muted hover:text-aff-text",
        )}
      >
        EN
      </button>
    </div>
  );
}
