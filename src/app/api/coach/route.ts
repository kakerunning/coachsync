// GET /api/coach — return the coach assigned to the authenticated athlete (athlete-only).
// Used by the athlete dashboard to display coach name and contact info.
// Returns 404 if the athlete has no coach relationship yet.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import type { CoachInfo } from "@/features/coach/coach.types";
import * as service from "@/features/coach/coach.service";

type SessionUser = { id?: string; role?: string };
type ApiResponse<T> = { data: T | null; error: string | null; meta: null };

export async function GET(
  _req: NextRequest
): Promise<NextResponse<ApiResponse<CoachInfo>>> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id || !user.role) {
    return NextResponse.json({ data: null, error: "Unauthorized", meta: null }, { status: 401 });
  }

  if (user.role !== "ATHLETE") {
    return NextResponse.json(
      { data: null, error: "Forbidden: athletes only", meta: null },
      { status: 403 }
    );
  }

  try {
    const result = await service.getCoachForAthlete(user.id);
    if (!result.ok) {
      return NextResponse.json(
        { data: null, error: result.error, meta: null },
        { status: result.status }
      );
    }
    return NextResponse.json({ data: result.coach, error: null, meta: null });
  } catch {
    return NextResponse.json(
      { data: null, error: "Internal server error", meta: null },
      { status: 500 }
    );
  }
}
