export type Surface = "OUTDOOR" | "INDOOR";

export type PersonalRecord = {
  id: string;
  athleteId: string;
  discipline: string;
  performance: number;
  unit: string;
  wind: number | null;
  date: Date | string;
  competition: string | null;
  location: string | null;
  surface: Surface;
  loggedById: string;
  createdAt: Date | string;
};

export type CreateRecordInput = {
  athleteId: string;
  discipline: string;
  performance: number;
  unit: string;
  wind?: number | null;
  date: string;
  competition?: string;
  location?: string;
  surface?: Surface;
};
