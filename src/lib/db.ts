// Prisma client singleton.
// Next.js hot-reload in development re-evaluates modules on every change, which
// would create a new PrismaClient (and a new connection pool) on each reload.
// Storing the instance on globalThis prevents pool exhaustion during development.
// In production the module is only ever evaluated once so the guard is a no-op.
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
