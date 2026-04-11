import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,           // automatically optimises re-reder
  serverExternalPackages: [
    '@prisma/client',
    '.prisma/client',
    '@prisma/adapter-pg',
    'pg',
  ],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
