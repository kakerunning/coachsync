import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import * as service from "@/features/invite/invite.service";
import type { ApiResponse } from "@/features/invite/invite.types";

type SessionUser = { id?: string; role?: string };

export async function POST(
  _req: NextRequest
): Promise<NextResponse<ApiResponse<{ token: string; expiresAt: Date }>>> {
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

  const result = await service.createInvite(user.id);
  if (!result.ok) {
    return NextResponse.json(
      { data: null, error: result.error, meta: null },
      { status: result.status }
    );
  }

  return NextResponse.json(
    { data: { token: result.token, expiresAt: result.expiresAt }, error: null, meta: null },
    { status: 201 }
  );
}
