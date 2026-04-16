// SessionDetailView — read-only session display used by both athletes and coaches.
// Coaches see a translated version of the athlete's note; athletes see an editable
// textarea so they can add/update their note to the coach.
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchLoggedSession, updateFeedbackNote, fetchChartData } from "@/lib/api";
import { WeekStrip } from "./week-strip";
import { CoachComments } from "./coach-comments";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { SessionDetail } from "@/features/session/session.types";

const TEAL = "#1D9E75";
const RED = "#E24B4A";
const BLUE = "#378ADD";
const DOT_TEAL = "#5DCAA5";
const DOT_AMBER = "#BA7517";
const DOT_GRAY = "#888780";
const BORDER = "0.5px solid #e5e5e5";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(s: number | null | undefined): string {
  if (s === null || s === undefined) return "—";
  return parseFloat(s.toFixed(1)).toString();
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function totalDistance(sets: SessionDetail["sets"]): string {
  const nums = sets.flatMap((s) => s.laps).map((l) => {
    const m = l.distance.match(/(\d+\.?\d*)/);
    return m ? parseFloat(m[1]) : 0;
  });
  const total = nums.reduce((a, b) => a + b, 0);
  if (total === 0) return "—";
  return total >= 1000 ? `${(total / 1000).toFixed(2).replace(/\.?0+$/, "")}km` : `${total}m`;
}

// ── Card ──────────────────────────────────────────────────────────────────────
function SectionCard({ dot, title, children }: { dot: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: BORDER, borderRadius: 12, overflow: "hidden", backgroundColor: "white", marginBottom: 12 }}>
      <div style={{ backgroundColor: "#f7f7f7", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: dot, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>{title}</span>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

// ── Performance chart ─────────────────────────────────────────────────────────
function PerfChart({ distance, athleteId }: { distance: string; athleteId: string }) {
  const { data } = useQuery({
    queryKey: ["session-chart", athleteId, distance],
    queryFn: () => fetchChartData(distance),
    enabled: !!distance && !!athleteId,
  });

  // Require at least 3 data points before rendering the chart — a single-session
  // trend has no meaningful pattern to show the athlete.
  if (!data || data.length < 3) return null;

  const max = Math.max(...data.map((d) => d.minTime));
  const min = Math.min(...data.map((d) => d.minTime));
  const range = max - min || 1;

  return (
    <SectionCard dot={BLUE} title={`${distance} performance`}>
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-3 text-xs">
            <span className="text-gray-400 w-20 shrink-0">{new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            <div className="flex-1 h-5 rounded" style={{ backgroundColor: "#f3f4f6" }}>
              <div
                className="h-5 rounded transition-all"
                style={{
                  width: `${((d.minTime - min) / range) * 80 + 20}%`,
                  backgroundColor: TEAL,
                  opacity: i === data.length - 1 ? 1 : 0.5 + (i / data.length) * 0.4,
                }}
              />
            </div>
            <span className="text-gray-600 w-12 text-right font-medium">{formatTime(d.minTime)}s</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ── Athlete note display for coaches ──────────────────────────────────────────
function AthleteNoteForCoach({
  note,
  noteTranslated,
  noteSourceLang,
  noteTargetLang,
}: {
  note: string | null;
  noteTranslated: string | null;
  noteSourceLang: string | null;
  noteTargetLang: string | null;
}) {
  const [showOriginal, setShowOriginal] = useState(false);

  if (!note) {
    return <p className="text-sm text-gray-400">No notes from athlete.</p>;
  }

  const hasTranslation = !!noteTranslated && noteTranslated !== note;

  return (
    <div className="space-y-2">
      {hasTranslation ? (
        <>
          {/* Language label e.g. "JA → EN" */}
          {noteSourceLang && noteTargetLang && (
            <span
              style={{
                display: "inline-block",
                fontSize: 11,
                fontWeight: 600,
                color: TEAL,
                backgroundColor: "#E8F7F2",
                borderRadius: 10,
                padding: "2px 8px",
                letterSpacing: "0.04em",
              }}
            >
              {noteSourceLang} → {noteTargetLang}
            </span>
          )}
          {/* Translated text — primary */}
          <p className="text-sm text-gray-900 leading-relaxed">{noteTranslated}</p>
          {/* Toggle original */}
          <button
            onClick={() => setShowOriginal((v) => !v)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showOriginal ? "Hide original" : "Show original"}
          </button>
          {showOriginal && (
            <p className="text-xs text-gray-500 italic border-l-2 border-gray-200 pl-3 leading-relaxed">
              {note}
            </p>
          )}
        </>
      ) : (
        <>
          <p className="text-sm text-gray-900 leading-relaxed">{note}</p>
          <p className="text-xs text-gray-400">[Translation unavailable]</p>
        </>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function SessionDetailView({
  sessionId,
  isCoach = false,
  currentUserId = "",
}: {
  sessionId: string;
  isCoach?: boolean;
  currentUserId?: string;
}) {
  const { data: session, isLoading, error } = useQuery<SessionDetail>({
    queryKey: ["session", sessionId],
    queryFn: () => fetchLoggedSession(sessionId),
  });

  const [feedbackNote, setFeedbackNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    if (session?.feedback?.note) setFeedbackNote(session.feedback.note);
  }, [session]);

  const noteMutation = useMutation({
    mutationFn: (note: string) => updateFeedbackNote(sessionId, note),
    onSuccess: () => { setNoteSaved(true); setTimeout(() => setNoteSaved(false), 2000); },
  });

  if (isLoading) {
    return (
      <div className="space-y-3 max-w-2xl mx-auto animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (error || !session) {
    return <p className="text-sm text-red-600 text-center py-12">Session not found.</p>;
  }

  // Drive the performance chart with the most-repeated lap distance in this session
  // (e.g. in "3×200m + 1×400m" the chart shows 200m trend, not 400m).
  const lapDistances = session.sets.flatMap((s) => s.laps.map((l) => l.distance));
  const distanceCount = new Map<string, number>();
  lapDistances.forEach((d) => distanceCount.set(d, (distanceCount.get(d) ?? 0) + 1));
  const topDistance = [...distanceCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  const totalLaps = session.sets.reduce((acc, s) => acc + s.laps.length, 0);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Week strip */}
      <WeekStrip activeSessionId={sessionId} activeDate={session.date.toString()} />

      {/* Session header */}
      <div className="flex items-start justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-900 flex-1 mr-4">{session.title}</h1>
        <span className="text-sm text-gray-400 shrink-0">{formatDate(session.date)}</span>
      </div>

      {/* Type pills */}
      {session.types.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {session.types.map((t) => (
            <span
              key={t.id}
              style={{ backgroundColor: "#E8F7F2", color: TEAL, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 500 }}
            >
              {t.type.charAt(0) + t.type.slice(1).toLowerCase()}
            </span>
          ))}
        </div>
      )}

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Volume", value: totalDistance(session.sets) },
          { label: "Structure", value: `${session.sets.length} set${session.sets.length !== 1 ? "s" : ""}` },
          { label: "Runs", value: `${totalLaps} lap${totalLaps !== 1 ? "s" : ""}` },
        ].map(({ label, value }) => (
          <div key={label} style={{ border: BORDER, borderRadius: 12, padding: "12px 16px", backgroundColor: "white", textAlign: "center" }}>
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className="text-base font-semibold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Warm-up */}
      {session.warmupItems.length > 0 && (
        <SectionCard dot={DOT_TEAL} title="Warm-up">
          <div className="space-y-2">
            {session.warmupItems.map((w) => (
              <div key={w.id} className="flex justify-between text-sm">
                <span className="text-gray-800">{w.name}</span>
                {w.detail && <span className="text-gray-400">{w.detail}</span>}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Main set */}
      {session.sets.length > 0 && (
        <SectionCard dot={RED} title="Main set">
          <div className="space-y-5">
            {session.sets.map((s, i) => (
              <div key={s.id}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-gray-600">Set {i + 1}</span>
                  {s.abandoned && (
                    <span style={{ backgroundColor: "#FCEBEB", color: "#A32D2D", fontSize: 11, padding: "2px 8px", borderRadius: 10, fontWeight: 500 }}>
                      Abandoned{s.note?.toLowerCase().includes("cramp") ? " — cramp" : ""}
                    </span>
                  )}
                  {s.note && !s.abandoned && (
                    <span className="text-xs text-gray-400">{s.note}</span>
                  )}
                </div>
                {/* Laps horizontal */}
                <div className="flex flex-wrap items-center gap-1">
                  {s.laps.map((l, li) => (
                    <div key={l.id} className="flex items-center">
                      <div style={{ textAlign: "center", minWidth: 48 }}>
                        <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>{l.distance}</div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: l.timeSeconds ? "#111" : "#9ca3af", fontStyle: l.timeSeconds ? "normal" : "italic" }}>
                          {formatTime(l.timeSeconds)}
                        </div>
                        {l.note && <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{l.note}</div>}
                      </div>
                      {li < s.laps.length - 1 && (
                        <span style={{ color: "#d1d5db", margin: "0 4px", fontSize: 16, lineHeight: 1 }}>·</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Supplementary work */}
      {session.drills.length > 0 && (
        <SectionCard dot={BLUE} title="Supplementary work">
          <div className="space-y-2">
            {session.drills.map((d) => (
              <div key={d.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-800">{d.name}</span>
                <span style={{ backgroundColor: "#E6F1FB", color: "#185FA5", fontSize: 11, padding: "2px 8px", borderRadius: 10, fontWeight: 500 }}>
                  Supplementary
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Performance chart */}
      {topDistance && (
        <PerfChart distance={topDistance} athleteId={session.athleteId} />
      )}

      {/* Feedback card */}
      <SectionCard dot={DOT_AMBER} title="How it felt">
        {session.feedback ? (
          <div className="space-y-3">
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-gray-400 text-xs">Fatigue</span>
                {/* Fatigue 4–5 = high (red); 3 = moderate (amber); 1–2 = fine (teal) */}
            <p className="font-semibold" style={{ color: session.feedback.fatigue >= 4 ? RED : session.feedback.fatigue === 3 ? DOT_AMBER : TEAL }}>
                  {session.feedback.fatigue} / 5
                </p>
              </div>
              <div>
                <span className="text-gray-400 text-xs">RPE</span>
                {/* RPE 7–10 = hard (red); 5–6 = moderate (amber); 1–4 = easy (teal) */}
            <p className="font-semibold" style={{ color: session.feedback.rpe >= 7 ? RED : session.feedback.rpe >= 5 ? DOT_AMBER : TEAL }}>
                  {session.feedback.rpe} / 10
                </p>
              </div>
            </div>
            {session.feedback.incidents.filter((i) => i.type !== "NONE").map((inc) => (
              <div key={inc.id} style={{ backgroundColor: "#FCEBEB", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
                <span style={{ color: "#A32D2D", fontWeight: 500 }}>{inc.type.replace("_", " ")}</span>
                {inc.bodyPart && <span className="text-gray-600 ml-2">— {inc.bodyPart}</span>}
                {inc.severity && <span className="text-gray-500 ml-2">(severity {inc.severity}/5)</span>}
                {inc.detail && <p className="text-gray-500 mt-1 text-xs">{inc.detail}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No feedback recorded.</p>
        )}
      </SectionCard>

      {/* Coach comments */}
      <CoachComments sessionId={sessionId} isCoach={isCoach} currentUserId={currentUserId} />

      {/* Notes / feedback to coach */}
      <SectionCard dot={DOT_GRAY} title="Notes to coach">
        {isCoach ? (
          <AthleteNoteForCoach
            note={session.feedback?.note ?? null}
            noteTranslated={session.feedback?.noteTranslated ?? null}
            noteSourceLang={session.feedback?.noteSourceLang ?? null}
            noteTargetLang={session.feedback?.noteTargetLang ?? null}
          />
        ) : (
          <>
            <Textarea
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              placeholder="Add notes for your coach..."
              rows={3}
            />
            <div className="flex items-center gap-2 mt-2">
              <Button
                size="sm"
                onClick={() => noteMutation.mutate(feedbackNote)}
                disabled={noteMutation.isPending}
                style={{ backgroundColor: TEAL, color: "white" }}
              >
                {noteMutation.isPending ? "Saving…" : "Save note"}
              </Button>
              {noteSaved && <span className="text-xs text-green-600">Saved</span>}
            </div>
          </>
        )}
      </SectionCard>
    </div>
  );
}
