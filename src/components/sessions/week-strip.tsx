"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchLoggedSessions } from "@/lib/api";
import type { SessionListItem } from "@/features/session/session.types";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TEAL = "#1D9E75";

function toISOWeek(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getWeekDays(isoWeek: string): Date[] {
  const [yearStr, weekStr] = isoWeek.split("-W");
  const year = parseInt(yearStr, 10);
  const weekNum = parseInt(weekStr, 10);
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (weekNum - 1) * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function WeekStrip({ activeSessionId, activeDate }: { activeSessionId: string; activeDate: string }) {
  const router = useRouter();
  const [week, setWeek] = useState(() => toISOWeek(new Date(activeDate)));
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const activeDateStr = activeDate.slice(0, 10);

  useEffect(() => {
    fetchLoggedSessions(week).then((data) => setSessions(Array.isArray(data) ? data : data.items)).catch(() => {});
  }, [week]);

  const days = getWeekDays(week);

  // Build a map: dateStr → session id
  const sessionMap = new Map<string, string>();
  sessions.forEach((s) => {
    sessionMap.set(new Date(s.date).toISOString().slice(0, 10), s.id);
  });

  function handleDayClick(day: Date) {
    const dayStr = day.toISOString().slice(0, 10);
    const sid = sessionMap.get(dayStr);
    if (sid) {
      router.push(`/dashboard/sessions/${sid}`);
    } else {
      router.push(`/dashboard/sessions/new?date=${dayStr}`);
    }
  }

  return (
    <div style={{ border: "0.5px solid #e5e5e5", borderRadius: 12, backgroundColor: "white", padding: "12px 16px", marginBottom: 16 }}>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => {
            const [y, w] = week.split("-W");
            const prev = parseInt(w, 10) - 1;
            setWeek(prev < 1 ? `${parseInt(y) - 1}-W52` : `${y}-W${String(prev).padStart(2, "0")}`);
          }}
          className="text-gray-400 hover:text-gray-700 text-sm px-2"
        >
          ‹
        </button>
        <span className="text-xs text-gray-500 font-medium">{week.replace("W", "Week ")}</span>
        <button
          onClick={() => {
            const [y, w] = week.split("-W");
            const next = parseInt(w, 10) + 1;
            setWeek(next > 52 ? `${parseInt(y) + 1}-W01` : `${y}-W${String(next).padStart(2, "0")}`);
          }}
          className="text-gray-400 hover:text-gray-700 text-sm px-2"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const dayStr = day.toISOString().slice(0, 10);
          const isActive = dayStr === activeDateStr;
          const hasSession = sessionMap.has(dayStr);
          return (
            <button
              key={i}
              onClick={() => handleDayClick(day)}
              className="flex flex-col items-center py-2 rounded-lg text-xs transition-colors"
              style={{
                backgroundColor: isActive ? TEAL : hasSession ? "#E8F7F2" : "transparent",
                color: isActive ? "white" : hasSession ? TEAL : "#9ca3af",
                cursor: "pointer",
                border: "none",
              }}
            >
              <span style={{ fontWeight: 500 }}>{DAY_LABELS[i]}</span>
              <span style={{ fontSize: 11, marginTop: 2 }}>{day.getDate()}</span>
              {hasSession && !isActive && (
                <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: TEAL, marginTop: 2 }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
