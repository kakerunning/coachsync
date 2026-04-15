/**
 * TEMPORARY DEBUG ROUTE — remove before final production launch
 *
 * GET /api/auth/debug?email=coach@coachsync.demo
 * Header: X-Debug-Key: <DEBUG_KEY env var>
 *
 * Returns user existence and hash metadata without exposing the hash itself.
 * Set DEBUG_KEY in Vercel environment variables before use.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const key = req.headers.get("x-debug-key");
  const debugKey = process.env.DEBUG_KEY;

  if (!debugKey || key !== debugKey) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "Missing email query param" }, { status: 400 });
  }

  const emailNorm = email.toLowerCase().trim();

  let user;
  try {
    user = await db.user.findUnique({ where: { email: emailNorm } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[auth/debug] DB error:", msg);
    return NextResponse.json({ error: "DB error", detail: msg }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({
      found: false,
      emailQueried: emailNorm,
      note: "No user row found. Run npx prisma db seed against this database.",
    });
  }

  // Check bcrypt hash is valid without revealing the hash itself
  const hashValid = user.passwordHash?.startsWith("$2") ?? false;
  const hashRounds = hashValid
    ? parseInt(user.passwordHash.split("$")[2] ?? "0", 10)
    : null;

  // Test the known demo password directly
  const demoPasswordMatch = await bcrypt.compare("demo1234", user.passwordHash).catch(() => false);

  return NextResponse.json({
    found: true,
    emailQueried: emailNorm,
    emailStored: user.email,
    emailsMatch: user.email === emailNorm,
    id: user.id,
    role: user.role,
    hashPresent: !!user.passwordHash,
    hashValid,
    hashRounds,
    demoPasswordMatch,
  });
}
