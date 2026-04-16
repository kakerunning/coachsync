// GET /api/sessions/chart?distance=100m — return the athlete's best lap time per session
// for the requested distance, used to render the performance trend chart on session detail.
// Returns the athlete's own data only (userId is used as athleteId).
// Dates are serialised to ISO strings because the service returns Date objects.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as service from "@/features/session/session.service";
import type { ApiResponse } from "@/features/session/session.types";

type SessionUser = { id?: string };

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<{ date: string; minTime: number }[]>>> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id) {
    return NextResponse.json({ data: null, error: "Unauthorized", meta: null }, { status: 401 });
  }

  const distance = req.nextUrl.searchParams.get("distance");
  if (!distance) {
    return NextResponse.json(
      { data: null, error: "distance query param required", meta: null },
      { status: 400 }
    );
  }

  const data = await service.getChartData(user.id, distance);
  const serialized = data.map((d) => ({ date: d.date.toISOString(), minTime: d.minTime }));

  return NextResponse.json({ data: serialized, error: null, meta: null });
}
