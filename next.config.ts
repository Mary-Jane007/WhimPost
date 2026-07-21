import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    serverActions: {
      bodySizeLimit: "80mb",
    },
    proxyClientMaxBodySize: "80mb",
  },
};

export default nextConfig;
