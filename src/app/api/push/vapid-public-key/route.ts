import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    return NextResponse.json({ data: null, error: "Push not configured", meta: null }, { status: 503 });
  }
  return NextResponse.json({ data: { key }, error: null, meta: null });
}
