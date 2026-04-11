import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import type { CalendarItem } from "@/features/calendar/calendar.types";
import { getCalendarItems } from "@/features/calendar/calendar.service";

type SessionUser = { id?: string; role?: string };
type ApiResponse<T> = { data: T | null; error: string | null; meta: null };

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<CalendarItem[]>>> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id || !user.role) {
    return NextResponse.json({ data: null, error: "Unauthorized", meta: null }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");

  if (!fromStr || !toStr) {
    return NextResponse.json(
      { data: null, error: "from and to query params are required", meta: null },
      { status: 400 }
    );
  }

  const from = new Date(fromStr);
  const to = new Date(toStr);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json(
      { data: null, error: "Invalid date format", meta: null },
      { status: 400 }
    );
  }

  try {
    const items = await getCalendarItems(user.id, user.role, from, to);
    return NextResponse.json({ data: items, error: null, meta: null });
  } catch {
    return NextResponse.json(
      { data: null, error: "Internal server error", meta: null },
      { status: 500 }
    );
  }
}
