import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let the dev server be reached as 127.0.0.1 as well as localhost.
  allowedDevOrigins: ["127.0.0.1"],
  // The announce cron reads content/ files from disk at request time.
  // Vercel only bundles files it can statically trace, so include the
  // whole content folder for that function explicitly.
  outputFileTracingIncludes: {
    "/api/announce": ["./content/**/*"],
  },
};

export default nextConfig;
