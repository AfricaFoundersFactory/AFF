"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "text-[14.5px] font-medium no-underline transition-colors",
        isActive ? "text-aff-text" : "text-aff-muted hover:text-aff-text",
      )}
    >
      {children}
    </Link>
  );
}
