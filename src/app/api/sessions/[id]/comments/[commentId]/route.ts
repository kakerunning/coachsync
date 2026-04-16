// DELETE /api/sessions/[id]/comments/[commentId] — remove a coach comment.
// Only the coach who authored the comment can delete it; the service enforces this.
// The parent sessionId in the route is not used here — commentId is globally unique.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as service from "@/features/coach-comment/coach-comment.service";

type SessionUser = { id?: string; role?: string };
type ApiResponse<T> = { data: T | null; error: string | null; meta: null };

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id || !user.role) {
    return NextResponse.json({ data: null, error: "Unauthorized", meta: null }, { status: 401 });
  }

  const { commentId } = await params;

  try {
    const result = await service.deleteComment(commentId, user.id);
    if (!result.ok) {
      return NextResponse.json({ data: null, error: result.error, meta: null }, { status: result.status });
    }
    return NextResponse.json({ data: null, error: null, meta: null });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", meta: null }, { status: 500 });
  }
}
