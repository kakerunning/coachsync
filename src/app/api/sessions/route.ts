// GET  /api/sessions — list the authenticated athlete's sessions.
//   ?week=YYYY-Www  returns all sessions in that ISO week (no pagination, max ~7 results).
//   ?page=N         returns a paginated page of the full history (default page 1, limit 20).
// POST /api/sessions — create a new session for the authenticated athlete.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as service from "@/features/session/session.service";
import type { ApiResponse, SessionListItem } from "@/features/session/session.types";

type SessionUser = { id?: string; role?: string };

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<SessionListItem[]>>> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id) {
    return NextResponse.json({ data: null, error: "Unauthorized", meta: null }, { status: 401 });
  }

  const week = req.nextUrl.searchParams.get("week") ?? undefined;
  // Clamp page to ≥1 and limit to ≤100 to guard against malformed query strings.
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10) || 20);

  const result = await service.listSessions(user.id, week, page, limit);

  if (!result.ok) {
    return NextResponse.json(
      { data: null, error: result.error, meta: null },
      { status: result.status }
    );
  }

  const totalPages = Math.ceil(result.total / limit);
  return NextResponse.json({
    data: result.sessions,
    error: null,
    // Week-filtered responses omit pagination meta — the client treats them as a plain array.
    meta: week ? null : { page, limit, total: result.total, totalPages },
  });
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id) {
    return NextResponse.json({ data: null, error: "Unauthorized", meta: null }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { data: null, error: "Invalid JSON body", meta: null },
      { status: 400 }
    );
  }

  const result = await service.createSession(user.id, body);
  if (!result.ok) {
    return NextResponse.json(
      { data: null, error: result.error, meta: null },
      { status: result.status }
    );
  }

  return NextResponse.json({ data: { id: result.id }, error: null, meta: null }, { status: 201 });
}
