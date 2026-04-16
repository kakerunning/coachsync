// PATCH /api/sessions/[id]/feedback — update the athlete's free-text note on their session.
// Athlete-only: the service returns 403 if the requester is not the session owner.
// As a side effect, the service auto-translates the note into the coach's language via DeepL.
// An empty string is a valid note value (clears the note).
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as service from "@/features/session/session.service";
import type { ApiResponse } from "@/features/session/session.types";

type SessionUser = { id?: string; role?: string };

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
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

  const { note } = (body ?? {}) as Record<string, unknown>;
  if (typeof note !== "string") {
    return NextResponse.json(
      { data: null, error: "note must be a string", meta: null },
      { status: 400 }
    );
  }

  const { id } = await params;
  const result = await service.updateFeedbackNote(id, user.id, note);

  if (!result.ok) {
    return NextResponse.json(
      { data: null, error: result.error, meta: null },
      { status: result.status }
    );
  }

  return NextResponse.json({ data: null, error: null, meta: null });
}
