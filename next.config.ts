import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,           // automatically optimises re-reder
  serverExternalPackages: [
    '@prisma/client',
    '.prisma/client',
    '@prisma/adapter-pg',
    'pg',
  ],
};

export default nextConfig;
