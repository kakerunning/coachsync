// DELETE /api/athletes/[athleteId] — remove an athlete from the coach's roster (coach-only).
// Deletes the CoachAthleteRelation only; the athlete's account and session data are preserved.
// Returns 204 No Content on success.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import type { ApiResponse } from "@/features/athlete/athlete.types";
import * as service from "@/features/athlete/athlete.service";

type SessionUser = { id?: string; role?: string };
type RouteContext = { params: Promise<{ athleteId: string }> };

export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<ApiResponse<null>>> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id || !user.role) {
    return NextResponse.json({ data: null, error: "Unauthorized", meta: null }, { status: 401 });
  }

  if (user.role !== "COACH") {
    return NextResponse.json(
      { data: null, error: "Forbidden: coaches only", meta: null },
      { status: 403 }
    );
  }

  const { athleteId } = await params;

  try {
    const result = await service.removeAthlete(user.id, athleteId);
    if (!result.ok) {
      return NextResponse.json(
        { data: null, error: result.error, meta: null },
        { status: result.status }
      );
    }
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { data: null, error: "Internal server error", meta: null },
      { status: 500 }
    );
  }
}
