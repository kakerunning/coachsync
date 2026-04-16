// GET /api/athletes/[athleteId]/sessions — paginated session log for a specific athlete (coach-only).
// The service verifies the coach has an active roster relationship with the athlete before
// returning data; coaches cannot browse sessions of athletes they don't manage.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as service from "@/features/session/session.service";
import type { ApiResponse } from "@/features/session/session.types";
import type { AthleteSessionListItem } from "@/features/session/session.types";

type SessionUser = { id?: string; role?: string };
type RouteContext = { params: Promise<{ athleteId: string }> };

export async function GET(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<ApiResponse<AthleteSessionListItem[]>>> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id) {
    return NextResponse.json({ data: null, error: "Unauthorized", meta: null }, { status: 401 });
  }

  if (user.role !== "COACH") {
    return NextResponse.json(
      { data: null, error: "Forbidden: coaches only", meta: null },
      { status: 403 }
    );
  }

  const { athleteId } = await params;
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10) || 20);

  const result = await service.listAthleteSessionsForCoach(user.id, athleteId, page, limit);

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
    meta: { page, limit, total: result.total, totalPages },
  });
}
