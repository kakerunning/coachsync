// POST /api/push/subscribe — register or update a Web Push subscription for the current user.
// DELETE /api/push/subscribe — remove the subscription for the given endpoint.
// Keyed on endpoint (unique per browser/device), not per user, so the same
// device re-subscribing after a permission reset overwrites the stale record
// rather than creating a duplicate.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

type ApiResponse<T> = { data: T | null; error: string | null; meta: null };

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ data: null, error: "Unauthorized", meta: null }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON body", meta: null }, { status: 400 });
  }

  // p256dh and auth are the ECDH public key and symmetric auth secret
  // used to encrypt push payloads — both are required by the Web Push spec.
  const { endpoint, p256dh, auth: authKey } =
    (body ?? {}) as Record<string, unknown>;

  if (
    typeof endpoint !== "string" ||
    typeof p256dh !== "string" ||
    typeof authKey !== "string"
  ) {
    return NextResponse.json(
      { data: null, error: "endpoint, p256dh, and auth are required", meta: null },
      { status: 400 }
    );
  }

  try {
    const sub = await db.pushSubscription.upsert({
      where: { endpoint },
      update: { userId: session.user.id, p256dh, auth: authKey },
      create: { userId: session.user.id, endpoint, p256dh, auth: authKey },
    });
    return NextResponse.json({ data: { id: sub.id }, error: null, meta: null });
  } catch {
    return NextResponse.json(
      { data: null, error: "Internal server error", meta: null },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest
): Promise<NextResponse<ApiResponse<null>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ data: null, error: "Unauthorized", meta: null }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON body", meta: null }, { status: 400 });
  }

  const { endpoint } = (body ?? {}) as Record<string, unknown>;
  if (typeof endpoint !== "string") {
    return NextResponse.json({ data: null, error: "endpoint is required", meta: null }, { status: 400 });
  }

  try {
    await db.pushSubscription.deleteMany({
      where: { endpoint, userId: session.user.id },
    });
    return NextResponse.json({ data: null, error: null, meta: null });
  } catch {
    return NextResponse.json(
      { data: null, error: "Internal server error", meta: null },
      { status: 500 }
    );
  }
}
