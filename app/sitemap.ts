import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const routes = [
  "",
  "/mission",
  "/about",
  "/founders",
  "/pitch-live",
  "/community",
  "/resources",
  "/join",
  "/apply-to-pitch",
  "/sign-in",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://africafoundersfactory.com";

  return routing.locales.flatMap((locale) =>
    routes.map((route) => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: new Date(),
    })),
  );
}
