import * as repo from "./training-program.repository";
import type {
  TrainingProgram,
  CreateTrainingProgramInput,
  UpdateTrainingProgramInput,
} from "./training-program.types";

export async function listPrograms(userId: string, role: string): Promise<TrainingProgram[]> {
  if (role === "COACH") {
    return repo.findProgramsByCoachId(userId);
  }
  return repo.findProgramsByAthleteId(userId);
}

export async function getProgram(
  id: string,
  userId: string,
  role: string
): Promise<TrainingProgram | null> {
  const program = await repo.findProgramById(id);
  if (!program) return null;

  if (role === "COACH" && program.coachId !== userId) return null;
  if (role === "ATHLETE" && program.athleteId !== userId) return null;

  return program;
}

export async function createProgram(
  coachId: string,
  input: CreateTrainingProgramInput
): Promise<TrainingProgram> {
  return repo.createProgram({
    title: input.title,
    description: input.description,
    coachId,
    athleteId: input.athleteId,
    startDate: input.startDate ? new Date(input.startDate) : undefined,
    endDate: input.endDate ? new Date(input.endDate) : undefined,
  });
}

export async function updateProgram(
  id: string,
  coachId: string,
  input: UpdateTrainingProgramInput
): Promise<TrainingProgram | null> {
  const program = await repo.findProgramById(id);
  if (!program || program.coachId !== coachId) return null;

  return repo.updateProgram(id, {
    title: input.title,
    description: input.description,
    athleteId: input.athleteId,
    startDate:
      input.startDate !== undefined
        ? input.startDate
          ? new Date(input.startDate)
          : null
        : undefined,
    endDate:
      input.endDate !== undefined
        ? input.endDate
          ? new Date(input.endDate)
          : null
        : undefined,
  });
}

export async function deleteProgram(id: string, coachId: string): Promise<boolean> {
  const program = await repo.findProgramById(id);
  if (!program || program.coachId !== coachId) return false;

  await repo.deleteProgram(id);
  return true;
}
