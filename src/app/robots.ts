import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/home", "/admin", "/api", "/billing", "/unlock", "/auth"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
