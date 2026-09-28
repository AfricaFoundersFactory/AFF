import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { getWorkspaceContext } from "@/lib/services/workspace";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

// Authenticated boundary for the whole Founder Workspace. See
// lib/auth/session.ts for why this checks a demo session rather than a real
// one — the redirect below is real and will fire once getSession() can
// actually return null.
export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const session = await getSession();
  if (!session) {
    redirect({ href: "/sign-in", locale: locale as Locale });
    return null;
  }

  const { startups } = await getWorkspaceContext();

  return (
    <DashboardShell startups={startups} initialStartupId={startups[0].id} user={session.user}>
      {children}
    </DashboardShell>
  );
}
