// Profile repository — read and update a user's own profile fields.
// Email is intentionally excluded from UpdateProfileInput; email changes
// are not supported and would require re-verification.
import { db } from "@/lib/db";
import type { UserProfile, UpdateProfileInput } from "./profile.types";

export async function findProfileById(userId: string): Promise<UserProfile | null> {
  return db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, language: true, imageUrl: true, role: true },
  });
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<UserProfile> {
  return db.user.update({
    where: { id: userId },
    data: input,
    select: { id: true, name: true, email: true, language: true, imageUrl: true, role: true },
  });
}
