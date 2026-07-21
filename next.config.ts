import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    serverActions: {
      bodySizeLimit: "5gb",
    },
    // Large TV movie uploads — avoid silent truncation of request bodies.
    proxyClientMaxBodySize: "5gb",
  },
};

export default nextConfig;
