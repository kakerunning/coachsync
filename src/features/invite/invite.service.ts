import * as repo from "./invite.repository";
import * as athleteRepo from "@/features/athlete/athlete.repository";
import type { InviteInfo } from "./invite.types";

const TTL_HOURS = 24;

export type CreateInviteResult =
  | { ok: true; token: string; expiresAt: Date }
  | { ok: false; status: 500; error: string };

export async function createInvite(coachId: string): Promise<CreateInviteResult> {
  const expiresAt = new Date(Date.now() + TTL_HOURS * 60 * 60 * 1000);
  try {
    const invite = await repo.createInvite(coachId, expiresAt);
    return { ok: true, token: invite.token, expiresAt: invite.expiresAt };
  } catch {
    return { ok: false, status: 500, error: "Failed to create invite" };
  }
}

export type GetInviteResult =
  | { ok: true; invite: InviteInfo }
  | { ok: false; status: 404 | 410; error: string };

export async function getInviteInfo(token: string): Promise<GetInviteResult> {
  const invite = await repo.findInviteByToken(token);
  if (!invite) {
    return { ok: false, status: 404, error: "Invite not found" };
  }
  if (new Date() > invite.expiresAt) {
    return { ok: false, status: 410, error: "Invite has expired" };
  }
  if (invite.usedById) {
    return { ok: false, status: 410, error: "Invite has already been used" };
  }
  return {
    ok: true,
    invite: {
      token: invite.token,
      coach: invite.coach,
      expiresAt: invite.expiresAt,
      isUsed: false,
    },
  };
}

export type AcceptInviteResult =
  | { ok: true }
  | { ok: false; status: 400 | 404 | 409 | 410; error: string };

export async function acceptInvite(
  token: string,
  athleteId: string
): Promise<AcceptInviteResult> {
  const invite = await repo.findInviteByToken(token);
  if (!invite) {
    return { ok: false, status: 404, error: "Invite not found" };
  }
  if (new Date() > invite.expiresAt) {
    return { ok: false, status: 410, error: "Invite has expired" };
  }
  if (invite.usedById) {
    return { ok: false, status: 410, error: "Invite has already been used" };
  }
  if (invite.coachId === athleteId) {
    return { ok: false, status: 400, error: "Cannot accept your own invite" };
  }

  const existing = await athleteRepo.findRelation(invite.coachId, athleteId);
  if (existing) {
    return { ok: false, status: 409, error: "You are already linked to this coach" };
  }

  await athleteRepo.createRelation(invite.coachId, athleteId);
  await repo.markInviteUsed(token, athleteId);
  return { ok: true };
}
