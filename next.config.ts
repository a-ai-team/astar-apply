import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist (legacy build) and pdf-lib are loaded at runtime in route handlers / server
  // actions; keep them out of the server bundle so their workers resolve from node_modules.
  serverExternalPackages: ["pdfjs-dist", "pdf-lib"],
};

export default nextConfig;
