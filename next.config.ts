import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/**": ["./prisma/dev.db", "./prisma/schema.prisma", "./dev.db"],
  },
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
