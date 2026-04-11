import Link from "next/link";
import { db } from "@/lib/db";

// ── Types ─────────────────────────────────────────────────────────────────────

type SessionWithLaps = {
  sets: { laps: { distance: string }[] }[];
};

type SessionWithFull = SessionWithLaps & {
  id: string;
  date: Date;
  title: string;
  feedback: {
    incidents: { type: string; bodyPart: string | null }[];
  } | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function parseDistance(raw: string): number {
  const s = raw.trim().toLowerCase();
  const km = s.match(/^([\d.]+)\s*km$/);
  if (km) return Math.round(parseFloat(km[1]) * 1000);
  const m = s.match(/^([\d.,]+)\s*m?$/);
  if (m) return Math.round(parseFloat(m[1].replace(",", "")));
  return 0;
}

function sessionVolume(s: SessionWithLaps): number {
  return s.sets.flatMap((set) => set.laps).reduce((sum, l) => sum + parseDistance(l.distance), 0);
}

function currentWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const end = new Date(monday);
  end.setDate(monday.getDate() + 7);
  return { start: monday, end };
}

function isoWeekKey(d: Date): string {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    );
  return `${date.getFullYear()}-${weekNum}`;
}

function computeStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;
  const weeks = new Set(dates.map(isoWeekKey));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  // Move to Monday of current week
  cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7));
  while (weeks.has(isoWeekKey(cursor)) && streak < 104) {
    streak++;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysUntil(d: Date | string): number {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

// ── Card shell ────────────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white" style={{ border: "0.5px solid #e5e5e5" }}>
      {children}
    </div>
  );
}

function CardHeader({
  dot,
  title,
  linkHref,
  linkLabel,
}: {
  dot: string;
  title: string;
  linkHref?: string;
  linkLabel?: string;
}) {
  return (
    <div
      className="flex items-center justify-between rounded-t-xl bg-gray-50 px-3.5 py-2.5"
      style={{ borderBottom: "0.5px solid #e5e5e5" }}
    >
      <div className="flex items-center gap-2">
        <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ backgroundColor: dot }} />
        <span className="text-[12px] font-medium text-gray-700">{title}</span>
      </div>
      {linkHref && linkLabel && (
        <Link href={linkHref} className="text-[11px] font-medium" style={{ color: "#1D9E75" }}>
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export async function AthleteOverview({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const firstName = userName.split(" ")[0];
  const { start: weekStart, end: weekEnd } = currentWeekRange();

  const [recentSessions, weekSessions, allDates, upcomingEvents, records, latestComment] =
    await Promise.all([
      db.session.findMany({
        where: { athleteId: userId },
        orderBy: { date: "desc" },
        take: 4,
        include: {
          sets: { include: { laps: true } },
          feedback: { include: { incidents: true } },
        },
      }),
      db.session.findMany({
        where: { athleteId: userId, date: { gte: weekStart, lt: weekEnd } },
        include: { sets: { include: { laps: true } } },
      }),
      db.session.findMany({
        where: { athleteId: userId },
        select: { date: true },
        orderBy: { date: "desc" },
      }),
      db.event.findMany({
        where: { athleteId: userId, date: { gte: new Date() } },
        orderBy: { date: "asc" },
        take: 3,
      }),
      db.personalRecord.findMany({
        where: { athleteId: userId },
        orderBy: [{ discipline: "asc" }, { date: "desc" }],
        take: 4,
      }),
      db.coachComment.findFirst({
        where: { session: { athleteId: userId } },
        orderBy: { createdAt: "desc" },
        include: { coach: { select: { name: true } } },
      }),
    ]);

  // ── Derived values ───────────────────────────────────────────────────────────

  const lastSession = recentSessions[0];
  const nextEvent = upcomingEvents[0];
  const nextEventDays = nextEvent ? daysUntil(nextEvent.date) : null;

  const weeklyVolume = weekSessions.reduce(
    (sum, s) => sum + sessionVolume(s as unknown as SessionWithLaps),
    0
  );
  const streak = computeStreak(allDates.map((s) => new Date(s.date)));

  // Weekly load bars — Mon=0 … Sun=6
  const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const dailyVolume = Array<number>(7).fill(0);
  for (const s of weekSessions) {
    const idx = (new Date(s.date).getDay() + 6) % 7;
    dailyVolume[idx] += sessionVolume(s as unknown as SessionWithLaps);
  }
  const maxVol = Math.max(...dailyVolume, 1);
  const todayIdx = (new Date().getDay() + 6) % 7;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* 1. Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {greeting()}, {firstName}.
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          {lastSession
            ? <>Last session: {formatDate(lastSession.date)}</>
            : "No sessions logged yet"}
          {nextEventDays !== null && nextEventDays > 0 && (
            <> &middot; Next competition in{" "}
              <span className="font-medium text-gray-600">{nextEventDays} days</span>
            </>
          )}
        </p>
      </div>

      {/* 2. Stat row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Volume this week",
            value: weeklyVolume > 0 ? `${weeklyVolume.toLocaleString()} m` : "—",
          },
          { label: "Sessions this week", value: String(weekSessions.length) },
          {
            label: "Streak",
            value: streak > 0 ? `${streak} week${streak !== 1 ? "s" : ""}` : "—",
          },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg bg-gray-50 px-3 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
            <p className="mt-1 text-xl font-semibold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* 3. Personal bests */}
      <Card>
        <CardHeader
          dot="#E24B4A"
          title="Personal bests"
          linkHref="/dashboard/records"
          linkLabel="View all"
        />
        <div className="divide-y px-3.5" style={{ borderColor: "#e5e5e5" }}>
          {records.length === 0 ? (
            <p className="py-5 text-center text-sm text-gray-400">No personal bests recorded yet</p>
          ) : (
            records.map((r) => {
              const isSeasonBest =
                new Date(r.date).getFullYear() === new Date().getFullYear();
              return (
                <div key={r.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.discipline}</p>
                    <p className="text-xs text-gray-400">{formatDate(r.date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSeasonBest && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ backgroundColor: "#E1F5EE", color: "#0F6E56" }}
                      >
                        Season best
                      </span>
                    )}
                    <span className="text-sm font-semibold text-gray-900">
                      {r.performance} {r.unit}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* 4. Upcoming competitions */}
      <Card>
        <CardHeader
          dot="#BA7517"
          title="Upcoming competitions"
          linkHref="/dashboard/calendar"
          linkLabel="View calendar"
        />
        <div className="divide-y px-3.5" style={{ borderColor: "#e5e5e5" }}>
          {upcomingEvents.length === 0 ? (
            <p className="py-5 text-center text-sm text-gray-400">No competitions scheduled</p>
          ) : (
            upcomingEvents.map((ev) => {
              const days = daysUntil(ev.date);
              const countdownColor =
                days < 14 ? "#E24B4A" : days <= 30 ? "#BA7517" : "#888780";
              const isSelection = ev.type === "TEST";
              const badgeStyle = isSelection
                ? { backgroundColor: "#FCEBEB", color: "#A32D2D" }
                : { backgroundColor: "#FAEEDA", color: "#854F0B" };
              return (
                <div key={ev.id} className="flex items-center gap-4 py-2.5">
                  <div className="w-10 shrink-0 text-center">
                    <p className="text-xl font-bold leading-none" style={{ color: countdownColor }}>
                      {days}
                    </p>
                    <p className="mt-0.5 text-[10px] text-gray-400">days</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{ev.title}</p>
                    <p className="text-xs text-gray-400">{formatDate(ev.date)}</p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={badgeStyle}
                  >
                    {isSelection ? "Selection" : "Competition"}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* 5. Two-column grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left — Recent sessions */}
        <Card>
          <CardHeader
            dot="#1D9E75"
            title="Recent sessions"
            linkHref="/dashboard/sessions"
            linkLabel="All sessions"
          />
          <div className="divide-y" style={{ borderColor: "#e5e5e5" }}>
            {recentSessions.length === 0 ? (
              <p className="px-3.5 py-5 text-center text-sm text-gray-400">
                No sessions logged yet
              </p>
            ) : (
              (recentSessions as unknown as SessionWithFull[]).map((s) => {
                const d = new Date(s.date);
                const vol = sessionVolume(s);
                const incidents = s.feedback?.incidents ?? [];
                const firstBad = incidents.find((i) => i.type !== "NONE");
                const incidentStr = firstBad
                  ? ` · ${firstBad.type.toLowerCase().replace(/_/g, " ")}`
                  : "";
                const meta =
                  vol > 0
                    ? `${vol.toLocaleString()} m${incidentStr}`
                    : incidentStr
                    ? incidentStr.slice(3)
                    : null;
                return (
                  <Link
                    key={s.id}
                    href={`/dashboard/sessions/${s.id}`}
                    className="flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-gray-50"
                  >
                    <div className="w-8 shrink-0 text-center">
                      <p className="text-lg font-bold leading-none text-gray-900">
                        {d.getDate()}
                      </p>
                      <p className="mt-0.5 text-[10px] text-gray-400">
                        {d.toLocaleString("en-US", { month: "short" })}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{s.title}</p>
                      {meta && (
                        <p className="truncate text-xs text-gray-400">{meta}</p>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </Card>

        {/* Right — stacked */}
        <div className="flex flex-col gap-4">
          {/* Weekly load */}
          <Card>
            <CardHeader dot="#888780" title="Weekly load" />
            <div className="px-3.5 py-3">
              <div className="flex h-16 items-end gap-1">
                {dailyVolume.map((vol, i) => {
                  const barH =
                    vol > 0 ? Math.max(8, Math.round((vol / maxVol) * 56)) : 3;
                  const isActive = vol > 0;
                  const isToday = i === todayIdx;
                  const color = isActive
                    ? vol >= maxVol * 0.5
                      ? "#1D9E75"
                      : "#5DCAA5"
                    : "#D3D1C7";
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-sm transition-all"
                        style={{ height: `${barH}px`, backgroundColor: color }}
                      />
                      <span
                        className="text-[9px] font-medium"
                        style={{ color: isToday ? "#1D9E75" : "#9CA3AF" }}
                      >
                        {DAY_LABELS[i]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Coach note */}
          <Card>
            <CardHeader dot="#888780" title="Coach note" />
            <div className="px-3.5 py-3">
              {latestComment ? (
                <>
                  <p className="text-sm leading-relaxed text-gray-700">
                    {latestComment.text.length > 120
                      ? `${latestComment.text.slice(0, 120)}…`
                      : latestComment.text}
                  </p>
                  <p className="mt-2 text-[11px] text-gray-400">
                    {latestComment.coach.name} &middot; {formatDate(latestComment.createdAt)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-400">No notes from your coach yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* 6. CTA bar */}
      <div
        className="flex items-center justify-between rounded-xl bg-white px-4 py-3"
        style={{ border: "0.5px solid #e5e5e5" }}
      >
        <p className="text-sm text-gray-600">Ready to log today's session?</p>
        <Link
          href="/dashboard/sessions/new"
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: "#1D9E75", color: "#E1F5EE" }}
        >
          + New session
        </Link>
      </div>
    </div>
  );
}
