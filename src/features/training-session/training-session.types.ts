export type TrainingSession = {
  id: string;
  programId: string;
  title: string;
  description: string | null;
  scheduledAt: Date;
  durationMin: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateTrainingSessionInput = {
  title: string;
  description?: string;
  scheduledAt: string;
  durationMin?: number;
  notes?: string;
};

export type UpdateTrainingSessionInput = {
  title?: string;
  description?: string | null;
  scheduledAt?: string;
  durationMin?: number | null;
  notes?: string | null;
};

export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  meta: Record<string, unknown> | null;
};
