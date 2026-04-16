// GET /api/profile — return the authenticated user's own profile.
// PATCH /api/profile — update name, language, or profile image URL.
// Changing language affects the DeepL target used for future auto-translations
// of athlete feedback; existing translated notes are not retroactively updated.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import type { UserProfile, UpdateProfileInput } from "@/features/profile/profile.types";
import * as service from "@/features/profile/profile.service";

type SessionUser = { id?: string; role?: string };
type ApiResponse<T> = { data: T | null; error: string | null; meta: null };

export async function GET(
  _req: NextRequest
): Promise<NextResponse<ApiResponse<UserProfile>>> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id) {
    return NextResponse.json({ data: null, error: "Unauthorized", meta: null }, { status: 401 });
  }

  try {
    const result = await service.getProfile(user.id);
    if (!result.ok) {
      return NextResponse.json({ data: null, error: result.error, meta: null }, { status: result.status });
    }
    return NextResponse.json({ data: result.profile, error: null, meta: null });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", meta: null }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest
): Promise<NextResponse<ApiResponse<UserProfile>>> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user?.id) {
    return NextResponse.json({ data: null, error: "Unauthorized", meta: null }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON body", meta: null }, { status: 400 });
  }

  const { name, language, imageUrl } = (body ?? {}) as Record<string, unknown>;

  const input: UpdateProfileInput = {};
  if (name !== undefined) input.name = typeof name === "string" ? name : undefined;
  if (language !== undefined) input.language = typeof language === "string" ? language : undefined;
  if (imageUrl !== undefined) input.imageUrl = typeof imageUrl === "string" ? imageUrl : null;

  try {
    const result = await service.updateProfile(user.id, input);
    if (!result.ok) {
      return NextResponse.json({ data: null, error: result.error, meta: null }, { status: result.status });
    }
    return NextResponse.json({ data: result.profile, error: null, meta: null });
  } catch {
    return NextResponse.json({ data: null, error: "Internal server error", meta: null }, { status: 500 });
  }
}
