import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import type { CoachEvent, CreateEventInput } from "@/features/event/event.types";
import * as service from "@/features/event/event.service";

type SessionUser = { id?: string; role?: string };
type PaginationMeta = { page: number; limit: number; total: number; totalPages: number };
type ApiResponse<T> = { data: T | null; error: string | null; meta: PaginationMeta | null };

const DEFAULT_LIMIT = 20;

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<CoachEvent[]>>> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id || !user.role) {
    return NextResponse.json({ data: null, error: "Unauthorized", meta: null }, { status: 401 });
  }

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, parseInt(req.nextUrl.searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT);

  try {
    const { items, total } = await service.listEvents(user.id, user.role, page, limit);
    const totalPages = Math.ceil(total / limit);
    return NextResponse.json({ data: items, error: null, meta: { page, limit, total, totalPages } });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", meta: null }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<CoachEvent>>> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id || !user.role) {
    return NextResponse.json({ data: null, error: "Unauthorized", meta: null }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON body", meta: null }, { status: 400 });
  }

  // Athletes always create events for themselves
  if (user.role === "ATHLETE") {
    (body as Record<string, unknown>).athleteId = user.id;
  }

  try {
    const result = await service.createEvent(user.id, body as CreateEventInput);
    if (!result.ok) {
      return NextResponse.json({ data: null, error: result.error, meta: null }, { status: result.status });
    }
    return NextResponse.json({ data: result.event, error: null, meta: null }, { status: 201 });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", meta: null }, { status: 500 });
  }
}
