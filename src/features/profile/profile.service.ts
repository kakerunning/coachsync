// Profile service — thin validation layer over profile.repository.
// Rejects blank names here rather than at the DB level so the error message
// is user-friendly rather than a constraint violation.
import * as repo from "./profile.repository";
import type { UserProfile, UpdateProfileInput } from "./profile.types";

export type GetProfileResult =
  | { ok: true; profile: UserProfile }
  | { ok: false; status: 404; error: string };

export async function getProfile(userId: string): Promise<GetProfileResult> {
  const profile = await repo.findProfileById(userId);
  if (!profile) {
    return { ok: false, status: 404, error: "User not found" };
  }
  return { ok: true, profile };
}

export type UpdateProfileResult =
  | { ok: true; profile: UserProfile }
  | { ok: false; status: 400; error: string };

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<UpdateProfileResult> {
  if (input.name !== undefined && !input.name.trim()) {
    return { ok: false, status: 400, error: "Name cannot be empty" };
  }

  const profile = await repo.updateProfile(userId, {
    ...input,
    name: input.name?.trim(),
  });

  return { ok: true, profile };
}
