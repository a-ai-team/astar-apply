// Site-wide SEO constants (Loop 10). NEXT_PUBLIC_SITE_URL is the canonical origin in production.
// TODO(james): set NEXT_PUBLIC_SITE_URL in Vercel to the real domain.
export const SITE = {
  name: "A* Apply",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  description: "Investment banking interview prep with a mentor who got in: interview-framed technicals, a graded question bank, AI mocks and a mentor chatbot that cites real mentor material.",
  publisher: "A* AI",
  twitter: null as string | null,
};

/** Public, indexable routes for the sitemap. */
export const PUBLIC_ROUTES = ["/", "/pricing", "/non-target", "/privacy", "/terms"] as const;

export function absoluteUrl(path: string): string {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}
