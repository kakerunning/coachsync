import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as service from "@/features/invite/invite.service";
import type { ApiResponse } from "@/features/invite/invite.types";

type SessionUser = { id?: string; role?: string };

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
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

  const { token } = await params;
  const result = await service.acceptInvite(token, user.id);

  if (!result.ok) {
    return NextResponse.json(
      { data: null, error: result.error, meta: null },
      { status: result.status }
    );
  }

  return NextResponse.json({ data: null, error: null, meta: null });
}
