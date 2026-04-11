"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { fetchCalendarItems } from "@/lib/api";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CalendarItem } from "@/features/calendar/calendar.types";

type View = "month" | "week" | "day";

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

// ── Range helpers ─────────────────────────────────────────────────────────────

function monthRange(year: number, month: number): { from: string; to: string } {
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0, 23, 59, 59);
  return { from: toDateStr(from), to: toDateStr(to) };
}

function weekRange(anchor: Date): { from: string; to: string } {
  const from = startOfWeek(anchor);
  const to = addDays(from, 6);
  return { from: toDateStr(from), to: toDateStr(to) };
}

function dayRange(anchor: Date): { from: string; to: string } {
  const d = toDateStr(anchor);
  return { from: d, to: d };
}

// ── Item pill ─────────────────────────────────────────────────────────────────

function ItemPill({ item, onClick }: { item: CalendarItem; onClick: (url: string) => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="truncate rounded px-1 py-0.5 text-xs font-medium text-white cursor-pointer hover:opacity-80"
      style={{ backgroundColor: item.color }}
      title={item.subLabel ? `${item.title} — ${item.subLabel}` : item.title}
      onClick={(e) => { e.stopPropagation(); onClick(item.url); }}
      onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onClick(item.url); } }}
    >
      {item.title}
    </div>
  );
}

// ── Month view ────────────────────────────────────────────────────────────────

function MonthView({
  year,
  month,
  items,
  todayStr,
  onDayClick,
  onItemClick,
}: {
  year: number;
  month: number;
  items: CalendarItem[];
  todayStr: string;
  onDayClick: (date: Date) => void;
  onItemClick: (url: string) => void;
}) {
  const today = todayStr;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const byDate = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {};
    for (const item of items) {
      (map[item.date] ??= []).push(item);
    }
    return map;
  }, [items]);

  // Build 6 weeks × 7 days grid
  const cells: { date: string; day: number; current: boolean }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ date: toDateStr(new Date(year, month - 1, daysInPrevMonth - i)), day: daysInPrevMonth - i, current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: toDateStr(new Date(year, month, d)), day: d, current: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: toDateStr(new Date(year, month + 1, d)), day: d, current: false });
  }

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b" style={{ borderColor: "#e5e5e5" }}>
        {DAY_HEADERS.map((h) => (
          <div key={h} className="py-2 text-center text-xs font-medium text-gray-400">
            {h}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const cellItems = byDate[cell.date] ?? [];
          const isToday = cell.date === today;
          return (
            <button
              key={i}
              onClick={() => onDayClick(new Date(cell.date + "T00:00:00"))}
              className={cn(
                "min-h-[80px] border-b border-r p-1 text-left transition-colors hover:bg-gray-50",
                !cell.current && "bg-gray-50/50"
              )}
              style={{ borderColor: "#e5e5e5" }}
            >
              <span
                className={cn(
                  "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  isToday ? "text-white" : cell.current ? "text-gray-700" : "text-gray-300"
                )}
                style={isToday ? { backgroundColor: "#1D9E75" } : undefined}
              >
                {cell.day}
              </span>
              <div className="space-y-0.5">
                {cellItems.slice(0, 3).map((item) => (
                  <ItemPill key={item.id} item={item} onClick={onItemClick} />
                ))}
                {cellItems.length > 3 && (
                  <p className="text-xs text-gray-400">+{cellItems.length - 3} more</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Week view ─────────────────────────────────────────────────────────────────

function WeekView({ anchor, items, todayStr, onItemClick }: { anchor: Date; items: CalendarItem[]; todayStr: string; onItemClick: (url: string) => void }) {
  const today = todayStr;
  const monday = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const byDate = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {};
    for (const item of items) (map[item.date] ??= []).push(item);
    return map;
  }, [items]);

  return (
    <div className="grid grid-cols-7 divide-x" style={{ borderColor: "#e5e5e5" }}>
      {days.map((day) => {
        const dateStr = toDateStr(day);
        const dayItems = byDate[dateStr] ?? [];
        const isToday = dateStr === today;
        return (
          <div key={dateStr} className="min-h-[200px] p-2">
            <div className="mb-2 text-center">
              <p className="text-xs text-gray-400">{DAY_HEADERS[day.getDay()]}</p>
              <span
                className={cn(
                  "mx-auto flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                  isToday ? "text-white" : "text-gray-700"
                )}
                style={isToday ? { backgroundColor: "#1D9E75" } : undefined}
              >
                {day.getDate()}
              </span>
            </div>
            <div className="space-y-1">
              {dayItems.map((item) => (
                <ItemPill key={item.id} item={item} onClick={onItemClick} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Day view ──────────────────────────────────────────────────────────────────

function DayView({ anchor, items, onItemClick }: { anchor: Date; items: CalendarItem[]; onItemClick: (url: string) => void }) {
  const dateStr = toDateStr(anchor);
  const dayItems = items.filter((i) => i.date === dateStr);

  const formatted = anchor.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="p-4">
      <p className="mb-4 text-sm font-medium text-gray-500">{formatted}</p>
      {dayItems.length === 0 ? (
        <p className="text-sm text-gray-400">Nothing scheduled.</p>
      ) : (
        <div className="space-y-2">
          {dayItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onItemClick(item.url)}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-gray-50"
              style={{ border: "0.5px solid #e5e5e5" }}
            >
              <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <div>
                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                {item.subLabel && <p className="text-xs text-gray-400">{item.subLabel}</p>}
              </div>
              <span
                className="ml-auto rounded-full px-2 py-0.5 text-xs"
                style={{ backgroundColor: `${item.color}18`, color: item.color }}
              >
                {item.kind === "SESSION" ? "Training" : "Event"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main CalendarView ─────────────────────────────────────────────────────────

export function CalendarView() {
  const router = useRouter();
  const [view, setView] = useState<View>("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const [todayStr, setTodayStr] = useState("");

  // Set after mount so server and client both start with "" — no hydration mismatch
  useEffect(() => { setTodayStr(toDateStr(new Date())); }, []);

  const year = anchor.getFullYear();
  const month = anchor.getMonth();

  const range = useMemo(() => {
    if (view === "month") return monthRange(year, month);
    if (view === "week") return weekRange(anchor);
    return dayRange(anchor);
  }, [view, year, month, anchor]);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["calendar", range.from, range.to],
    queryFn: () => fetchCalendarItems(range.from, range.to),
  });

  function navigate(direction: -1 | 1) {
    if (view === "month") {
      setAnchor(new Date(year, month + direction, 1));
    } else if (view === "week") {
      setAnchor(addDays(anchor, direction * 7));
    } else {
      setAnchor(addDays(anchor, direction));
    }
  }

  function title(): string {
    if (view === "month") return `${MONTH_NAMES[month]} ${year}`;
    if (view === "week") {
      const from = startOfWeek(anchor);
      const to = addDays(from, 6);
      return `${from.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${to.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return anchor.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>

        {/* View tabs */}
        <div className="flex rounded-lg border p-0.5 text-sm" style={{ borderColor: "#e5e5e5" }}>
          {(["month", "week", "day"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "rounded-md px-3 py-1 capitalize transition-colors",
                view === v ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900"
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => navigate(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-gray-700">{title()}</span>
        <Button
          variant="outline"
          className="ml-auto text-sm"
          onClick={() => setAnchor(new Date())}
        >
          Today
        </Button>
      </div>

      {/* Calendar body */}
      <div className="rounded-xl bg-white" style={{ border: "0.5px solid #e5e5e5" }}>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-sm text-gray-400">
            Loading…
          </div>
        ) : (
          <>
            {view === "month" && (
              <MonthView
                year={year}
                month={month}
                items={items}
                todayStr={todayStr}
                onDayClick={(d) => { setAnchor(d); setView("day"); }}
                onItemClick={(url) => router.push(url)}
              />
            )}
            {view === "week" && <WeekView anchor={anchor} items={items} todayStr={todayStr} onItemClick={(url) => router.push(url)} />}
            {view === "day" && <DayView anchor={anchor} items={items} onItemClick={(url) => router.push(url)} />}
          </>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        {[
          { color: "#7C3AED", label: "Training Session" },
          { color: "#E24B4A", label: "Match" },
          { color: "#378ADD", label: "Camp" },
          { color: "#1D9E75", label: "Test" },
          { color: "#888780", label: "Other" },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
