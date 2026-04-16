// GET  /api/sessions/[id]/comments — list all coach comments on a session.
//   Readable by the owning athlete and by any coach who has the athlete on their roster.
// POST /api/sessions/[id]/comments — add a coach comment. Coach-only; also triggers
//   a push notification to the athlete.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import type { CoachComment } from "@/features/coach-comment/coach-comment.types";
import * as service from "@/features/coach-comment/coach-comment.service";

type SessionUser = { id?: string; role?: string };
type ApiResponse<T> = { data: T | null; error: string | null; meta: null };

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<CoachComment[]>>> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id || !user.role) {
    return NextResponse.json({ data: null, error: "Unauthorized", meta: null }, { status: 401 });
  }

  const { id: sessionId } = await params;

  try {
    const result = await service.listComments(sessionId, user.id, user.role);
    if (!result.ok) {
      return NextResponse.json({ data: null, error: result.error, meta: null }, { status: result.status });
    }
    return NextResponse.json({ data: result.comments, error: null, meta: null });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", meta: null }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<CoachComment>>> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id || !user.role) {
    return NextResponse.json({ data: null, error: "Unauthorized", meta: null }, { status: 401 });
  }

  const { id: sessionId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON body", meta: null }, { status: 400 });
  }

  const { text } = (body ?? {}) as Record<string, unknown>;

  try {
    // Coerce missing/non-string text to "" so the service can return a proper validation error
    // rather than this route throwing a type error.
    const result = await service.createComment(sessionId, user.id, user.role, typeof text === "string" ? text : "");
    if (!result.ok) {
      return NextResponse.json({ data: null, error: result.error, meta: null }, { status: result.status });
    }
    return NextResponse.json({ data: result.comment, error: null, meta: null }, { status: 201 });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", meta: null }, { status: 500 });
  }
}
