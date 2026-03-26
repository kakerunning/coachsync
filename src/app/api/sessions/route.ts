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
  const result = await service.listSessions(user.id, week);

  if (!result.ok) {
    return NextResponse.json(
      { data: null, error: result.error, meta: null },
      { status: result.status }
    );
  }

  return NextResponse.json({ data: result.sessions, error: null, meta: null });
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
