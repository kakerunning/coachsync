export type CalendarItemKind = "EVENT" | "SESSION";

export type CalendarItem = {
  id: string;
  kind: CalendarItemKind; // "EVENT" or "SESSION"
  title: string;
  date: string; // YYYY-MM-DD
  color: string; // hex
  subLabel?: string;
  url: string;
};
