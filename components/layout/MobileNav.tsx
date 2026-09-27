"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ButtonLink } from "@/components/ui/Button";

type NavItem = { href: string; label: string };

export function MobileNav({
  items,
  signInLabel,
  joinLabel,
}: {
  items: NavItem[];
  signInLabel: string;
  joinLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-4 lg:hidden">
      <LanguageSwitcher className="text-[12px]" />
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 flex-col items-center justify-center gap-[5px]"
      >
        <span
          className="h-[2px] w-5 rounded-full bg-aff-text transition-transform"
          style={open ? { transform: "translateY(7px) rotate(45deg)" } : undefined}
        />
        <span
          className="h-[2px] w-5 rounded-full bg-aff-text transition-opacity"
          style={open ? { opacity: 0 } : undefined}
        />
        <span
          className="h-[2px] w-5 rounded-full bg-aff-text transition-transform"
          style={open ? { transform: "translateY(-7px) rotate(-45deg)" } : undefined}
        />
      </button>

      {open ? (
        <div
          id="mobile-nav-panel"
          className="fixed inset-x-0 top-[64px] bottom-0 z-40 flex flex-col gap-1 overflow-y-auto bg-aff-bg px-6 py-8"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-4 text-[17px] font-medium text-aff-text border-b border-aff-line"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-4 text-[17px] font-medium text-aff-muted"
            >
              {signInLabel}
            </Link>
          </nav>
          <ButtonLink href="/join" block className="mt-6">
            {joinLabel}
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}
