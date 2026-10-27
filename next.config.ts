import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // Cloud agent preview hosts (port-forwarded *.agent.cvm.dev).
  allowedDevOrigins: [
    "p-3333-pod-76mmtecog5grnfq5gfbzcqcgpi-993871809423eb35ee7f-us3.agent.cvm.dev",
    "*.agent.cvm.dev",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "10gb",
    },
    // Large TV movie uploads — avoid silent truncation of request bodies.
    proxyClientMaxBodySize: "10gb",
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
    ];
  },
};

export default nextConfig;
