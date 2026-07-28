import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let the dev server be reached as 127.0.0.1 as well as localhost.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
