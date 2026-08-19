import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let the dev server be reached as 127.0.0.1 as well as localhost.
  allowedDevOrigins: ["127.0.0.1"],
  // The announce cron reads content/ files from disk at request time.
  // Vercel only bundles files it can statically trace, so include the
  // whole content folder for that function explicitly.
  outputFileTracingIncludes: {
    "/api/announce": ["./content/**/*"],
    "/api/subscribe": ["./content/**/*"],
    // These render per-request (they read searchParams), so they need the
    // content files at runtime rather than only at build time.
    "/devotions": ["./content/**/*"],
    "/devotions/[slug]": ["./content/**/*"],
  },
};

export default nextConfig;
