import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  poweredByHeader: false,
  // Keep the dev-mode badge out of screen recordings.
  devIndicators: false,
};

export default nextConfig;
