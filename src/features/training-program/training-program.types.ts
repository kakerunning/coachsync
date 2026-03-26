export type TrainingProgram = {
  id: string;
  title: string;
  description: string | null;
  coachId: string;
  athleteId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateTrainingProgramInput = {
  title: string;
  description?: string;
  athleteId?: string;
  startDate?: string;
  endDate?: string;
};

export type UpdateTrainingProgramInput = {
  title?: string;
  description?: string | null;
  athleteId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  meta: Record<string, unknown> | null;
};
