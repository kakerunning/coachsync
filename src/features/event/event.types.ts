export type EventType = "MATCH" | "CAMP" | "TEST" | "OTHER";
export type TestType = "VO2MAX" | "LACTIC_TOLERANCE" | "TIME_TRIAL" | "FIELD_TEST";

export type CoachEvent = {
  id: string;
  title: string;
  type: EventType;
  testType: TestType | null;
  date: Date | string;
  location: string | null;
  notes: string | null;
  coachId: string;
  athleteId: string;
  athlete: { id: string; name: string };
  createdAt: Date | string;
};

export type CreateEventInput = {
  title: string;
  type: EventType;
  testType?: TestType;
  date: string;
  location?: string;
  notes?: string;
  athleteId?: string;
};
