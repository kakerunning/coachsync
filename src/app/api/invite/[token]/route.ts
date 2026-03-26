import { NextRequest, NextResponse } from "next/server";
import * as service from "@/features/invite/invite.service";
import type { ApiResponse, InviteInfo } from "@/features/invite/invite.types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse<ApiResponse<InviteInfo>>> {
  const { token } = await params;

  const result = await service.getInviteInfo(token);
  if (!result.ok) {
    return NextResponse.json(
      { data: null, error: result.error, meta: null },
      { status: result.status }
    );
  }

  return NextResponse.json({ data: result.invite, error: null, meta: null });
}
