import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/register"],
      disallow: [
        "/admin",
        "/api/",
        "/billing",
        "/clients",
        "/dashboard",
        "/documents",
        "/invoice-builder",
        "/invoices",
        "/settings",
        "/verify-email",
      ],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
