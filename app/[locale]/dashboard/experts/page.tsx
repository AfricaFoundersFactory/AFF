import type { Metadata } from "next";
import { renderModulePage, moduleMetadata } from "@/components/dashboard/ModulePage";

const MODULE_KEY = "experts";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return moduleMetadata(MODULE_KEY, locale);
}

export default async function DashboardExpertsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return renderModulePage(MODULE_KEY, locale);
}
