export type CoachComment = {
  id: string;
  sessionId: string;
  coachId: string;
  text: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  coach: { id: string; name: string };
};
