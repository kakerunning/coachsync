export type InviteLink = {
  id: string;
  token: string;
  coachId: string;
  expiresAt: Date;
  usedById: string | null;
  createdAt: Date;
};

export type InviteInfo = {
  token: string;
  coach: { id: string; name: string };
  expiresAt: Date;
  isUsed: boolean;
};

export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  meta: Record<string, unknown> | null;
};
