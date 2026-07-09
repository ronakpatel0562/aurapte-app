import type { MetadataRoute } from "next";

const BASE_URL = "https://aurapte.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/mock-tests", "/practice-tests", "/questions", "/billing", "/prediction-files", "/specialised-tips", "/admin", "/api", "/auth/callback", "/forgot-password"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
