import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ['@prisma/client', '.prisma/client'],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
