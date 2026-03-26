export type AthleteUser = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};

export type AthleteRelation = {
  id: string;
  coachId: string;
  athleteId: string;
  createdAt: Date;
  athlete: AthleteUser;
};

export type AddAthleteInput = {
  email: string;
};

export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  meta: Record<string, unknown> | null;
};
