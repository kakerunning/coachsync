import { db } from "@/lib/db";

export async function createInvite(coachId: string, expiresAt: Date) {
  return db.inviteLink.create({
    data: { coachId, expiresAt },
    select: { id: true, token: true, coachId: true, expiresAt: true, usedById: true, createdAt: true },
  });
}

export async function findInviteByToken(token: string) {
  return db.inviteLink.findUnique({
    where: { token },
    select: {
      id: true,
      token: true,
      coachId: true,
      expiresAt: true,
      usedById: true,
      createdAt: true,
      coach: { select: { id: true, name: true } },
    },
  });
}

export async function markInviteUsed(token: string, athleteId: string) {
  return db.inviteLink.update({
    where: { token },
    data: { usedById: athleteId },
  });
}
