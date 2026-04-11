"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { logSession } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SessionPayload } from "@/features/session/session.types";

// ── Design tokens ─────────────────────────────────────────────────────────────
const TEAL = "#1D9E75";
const DOT_TEAL = "#5DCAA5";
const DOT_RED = "#E24B4A";
const DOT_BLUE = "#378ADD";
const DOT_AMBER = "#BA7517";
const DOT_GRAY = "#888780";
const BORDER = "0.5px solid #e5e5e5";

// ── Constants ─────────────────────────────────────────────────────────────────
const SESSION_TYPES = ["Speed", "Endurance", "Volume", "Technique", "Hills", "Hurdles", "Gym", "Recovery"] as const;
const FATIGUE_LABELS = ["", "Easy", "Moderate", "Noticeable", "Hard", "Max"];

// ── Types ─────────────────────────────────────────────────────────────────────
type LapRow = { id: string; distance: string; timeSeconds: string; note: string };
type SetBlock = { id: string; abandoned: boolean; note: string; laps: LapRow[] };
type WarmupRow = { id: string; name: string; detail: string };
type DrillRow = { id: string; name: string };

let _uid = 0;
function uid() { return String(++_uid); }

function makeWarmup(): WarmupRow { return { id: uid(), name: "", detail: "" }; }
function makeLap(): LapRow { return { id: uid(), distance: "", timeSeconds: "", note: "" }; }
function makeSet(): SetBlock { return { id: uid(), abandoned: false, note: "", laps: [makeLap()] }; }
function makeDrill(): DrillRow { return { id: uid(), name: "" }; }

type FormState = {
  date: string;
  startTime: string;
  durationMin: string;
  title: string;
  types: string[];
  warmupItems: WarmupRow[];
  sets: SetBlock[];
  drills: DrillRow[];
  fatigue: number;
  rpe: number;
  feedbackNote: string;
  cramp: boolean;
  crampDetail: string;
  pain: boolean;
  painBodyPart: string;
  painSeverity: number;
  earlyFatigue: boolean;
};

const DRAFT_KEY = "coachsync_session_draft";

// Empty initial state — date/time and localStorage draft are filled in useEffect
// after mount so the server render and client hydration produce identical HTML.
function emptyForm(): FormState {
  return {
    date: "", startTime: "", durationMin: "", title: "",
    types: [], warmupItems: [], sets: [], drills: [],
    fatigue: 3, rpe: 5, feedbackNote: "",
    cramp: false, crampDetail: "", pain: false,
    painBodyPart: "", painSeverity: 1, earlyFatigue: false,
  };
}

// ── Card wrapper ──────────────────────────────────────────────────────────────
function SectionCard({ dot, title, children }: { dot: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: BORDER, borderRadius: 12, overflow: "hidden", backgroundColor: "white" }}>
      <div style={{ backgroundColor: "#f7f7f7", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: dot, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>{title}</span>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

// ── Slider ────────────────────────────────────────────────────────────────────
function SliderField({
  label, value, min, max, onChange, colorFn,
}: {
  label: string; value: number; min: number; max: number;
  onChange: (v: number) => void;
  colorFn: (v: number) => string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span style={{ color: colorFn(value), fontWeight: 600 }}>{value}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: colorFn(value) }}
      />
    </div>
  );
}

function fatigueColor(v: number) {
  if (v <= 2) return "#1D9E75";
  if (v === 3) return "#BA7517";
  return "#E24B4A";
}

function rpeColor(v: number) {
  if (v <= 4) return "#1D9E75";
  if (v <= 6) return "#BA7517";
  if (v <= 8) return "#E24B4A";
  return "#7F0000";
}

// ── Main form ─────────────────────────────────────────────────────────────────
export function NewSessionForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore localStorage draft or set today's date — runs only on the client
  // after hydration so server and client initial renders are identical.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) { setForm(JSON.parse(raw) as FormState); return; }
    } catch { /* ignore */ }
    const now = new Date();
    setForm((f) => ({
      ...f,
      date: now.toISOString().slice(0, 10),
      startTime: now.toTimeString().slice(0, 5),
    }));
  }, []);

  // Persist draft to localStorage whenever the form changes
  useEffect(() => {
    if (!form.date) return; // skip the empty initial state
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch { /* ignore */ }
  }, [form]);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  // ── Warmup ────────────────────────────────────────────────────────────────
  function updateWarmup(id: string, field: keyof WarmupRow, value: string) {
    setForm((f) => ({ ...f, warmupItems: f.warmupItems.map((w) => w.id === id ? { ...w, [field]: value } : w) }));
  }
  function removeWarmup(id: string) {
    setForm((f) => ({ ...f, warmupItems: f.warmupItems.filter((w) => w.id !== id) }));
  }

  // ── Sets / Laps ────────────────────────────────────────────────────────────
  function updateSet(sid: string, field: keyof Omit<SetBlock, "laps" | "id">, value: string | boolean) {
    setForm((f) => ({ ...f, sets: f.sets.map((s) => s.id === sid ? { ...s, [field]: value } : s) }));
  }
  function removeSet(sid: string) {
    setForm((f) => ({ ...f, sets: f.sets.filter((s) => s.id !== sid) }));
  }
  function addLap(sid: string) {
    setForm((f) => ({ ...f, sets: f.sets.map((s) => s.id === sid ? { ...s, laps: [...s.laps, makeLap()] } : s) }));
  }
  function updateLap(sid: string, lid: string, field: keyof LapRow, value: string) {
    setForm((f) => ({
      ...f,
      sets: f.sets.map((s) => s.id === sid
        ? { ...s, laps: s.laps.map((l) => l.id === lid ? { ...l, [field]: value } : l) }
        : s),
    }));
  }
  function removeLap(sid: string, lid: string) {
    setForm((f) => ({
      ...f,
      sets: f.sets.map((s) => s.id === sid ? { ...s, laps: s.laps.filter((l) => l.id !== lid) } : s),
    }));
  }

  // ── Drills ─────────────────────────────────────────────────────────────────
  function updateDrill(id: string, value: string) {
    setForm((f) => ({ ...f, drills: f.drills.map((d) => d.id === id ? { ...d, name: value } : d) }));
  }
  function removeDrill(id: string) {
    setForm((f) => ({ ...f, drills: f.drills.filter((d) => d.id !== id) }));
  }

  // ── Pill toggle ────────────────────────────────────────────────────────────
  function toggleType(t: string) {
    setForm((f) => ({
      ...f,
      types: f.types.includes(t) ? f.types.filter((x) => x !== t) : [...f.types, t],
    }));
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const dateTime = form.startTime ? `${form.date}T${form.startTime}:00` : `${form.date}T00:00:00`;
      const incidents: SessionPayload["feedback"]["incidents"] = [];
      if (form.cramp) incidents.push({ type: "CRAMP", detail: form.crampDetail || undefined });
      if (form.pain) incidents.push({ type: "PAIN", bodyPart: form.painBodyPart || undefined, severity: form.painSeverity });
      if (form.earlyFatigue) incidents.push({ type: "EARLY_FATIGUE" });
      if (!form.cramp && !form.pain && !form.earlyFatigue) incidents.push({ type: "NONE" });

      const payload: SessionPayload = {
        date: dateTime,
        title: form.title || "Untitled session",
        durationMin: form.durationMin ? Number(form.durationMin) : undefined,
        types: form.types.map((t) => t.toUpperCase() as SessionPayload["types"][number]),
        warmupItems: form.warmupItems.filter((w) => w.name).map((w, i) => ({ order: i, name: w.name, detail: w.detail || undefined })),
        sets: form.sets.map((s, i) => ({
          order: i,
          abandoned: s.abandoned,
          note: s.note || undefined,
          laps: s.laps.filter((l) => l.distance).map((l, j) => ({
            order: j,
            distance: l.distance,
            timeSeconds: l.timeSeconds ? Number(l.timeSeconds) : undefined,
            note: l.note || undefined,
          })),
        })),
        drills: form.drills.filter((d) => d.name).map((d, i) => ({ order: i, name: d.name })),
        feedback: { fatigue: form.fatigue, rpe: form.rpe, note: form.feedbackNote || undefined, incidents },
      };

      const result = await logSession(payload);
      localStorage.removeItem(DRAFT_KEY);
      router.push(`/dashboard/sessions/${result.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSaveDraft() {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch { /* ignore */ }
    alert("Draft saved.");
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-24">

      {/* 1. Session info */}
      <SectionCard dot={DOT_TEAL} title="Session info">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date</label>
            <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Start time</label>
            <Input type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} />
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">Title</label>
          <Input placeholder='e.g. 2 × (200m – 200m – 400m)' value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">Duration (min)</label>
          <Input type="number" min="1" placeholder="e.g. 90" value={form.durationMin} onChange={(e) => set("durationMin", e.target.value)} className="w-32" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-2">Session type</label>
          <div className="flex flex-wrap gap-2">
            {SESSION_TYPES.map((t) => {
              const active = form.types.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  style={active
                    ? { backgroundColor: TEAL, border: `1px solid #0F6E56`, color: "#E1F5EE", borderRadius: 20, padding: "4px 12px", fontSize: 13, cursor: "pointer" }
                    : { backgroundColor: "transparent", border: "0.5px solid #d1d5db", color: "#6b7280", borderRadius: 20, padding: "4px 12px", fontSize: 13, cursor: "pointer" }
                  }
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </SectionCard>

      {/* 2. Warm-up */}
      <SectionCard dot={DOT_TEAL} title="Warm-up">
        <div className="space-y-2">
          {form.warmupItems.map((w) => (
            <div key={w.id} className="flex gap-2 items-center">
              <Input placeholder="Exercise" value={w.name} onChange={(e) => updateWarmup(w.id, "name", e.target.value)} className="flex-1" />
              <Input placeholder="Sets / reps / dist" value={w.detail} onChange={(e) => updateWarmup(w.id, "detail", e.target.value)} className="w-36" />
              <button type="button" onClick={() => removeWarmup(w.id)} className="text-gray-400 hover:text-red-500 text-sm px-1">✕</button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, warmupItems: [...f.warmupItems, makeWarmup()] }))}
          className="mt-3 text-sm text-gray-500 hover:text-gray-800"
          style={{ color: TEAL }}
        >
          + Add warm-up exercise
        </button>
      </SectionCard>

      {/* 3. Main set */}
      <SectionCard dot={DOT_RED} title="Main set">
        <div className="space-y-4">
          {form.sets.map((s, si) => (
            <div key={s.id} style={{ border: BORDER, borderRadius: 8, padding: 12 }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Set {si + 1}</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                    <input type="checkbox" checked={s.abandoned} onChange={(e) => updateSet(s.id, "abandoned", e.target.checked)} />
                    Abandoned
                  </label>
                  <button type="button" onClick={() => removeSet(s.id)} className="text-gray-400 hover:text-red-500 text-xs">Remove</button>
                </div>
              </div>
              <div className="space-y-2">
                {s.laps.map((l, li) => (
                  <div key={l.id} className="flex gap-2 items-center">
                    <span className="text-xs text-gray-400 w-5">{li + 1}</span>
                    <Input placeholder="200m" value={l.distance} onChange={(e) => updateLap(s.id, l.id, "distance", e.target.value)} className="w-20" />
                    <Input type="number" placeholder="s" min="0" step="0.1" value={l.timeSeconds} onChange={(e) => updateLap(s.id, l.id, "timeSeconds", e.target.value)} className="w-20" />
                    <Input placeholder="note" value={l.note} onChange={(e) => updateLap(s.id, l.id, "note", e.target.value)} className="flex-1" />
                    <button type="button" onClick={() => removeLap(s.id, l.id)} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => addLap(s.id)} className="mt-2 text-xs" style={{ color: TEAL }}>
                + Add rep
              </button>
              <div className="mt-2">
                <Input placeholder="Set note" value={s.note} onChange={(e) => updateSet(s.id, "note", e.target.value)} className="text-sm" />
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, sets: [...f.sets, makeSet()] }))}
          className="mt-3 text-sm"
          style={{ color: TEAL }}
        >
          + Add set
        </button>
      </SectionCard>

      {/* 4. Supplementary work */}
      <SectionCard dot={DOT_BLUE} title="Supplementary work">
        <div className="space-y-2">
          {form.drills.map((d) => (
            <div key={d.id} className="flex gap-2 items-center">
              <Input placeholder="Exercise / drill name" value={d.name} onChange={(e) => updateDrill(d.id, e.target.value)} className="flex-1" />
              <button type="button" onClick={() => removeDrill(d.id)} className="text-gray-400 hover:text-red-500 text-sm">✕</button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, drills: [...f.drills, makeDrill()] }))}
          className="mt-3 text-sm"
          style={{ color: TEAL }}
        >
          + Add drill / exercise
        </button>
      </SectionCard>

      {/* 5. How did it feel? */}
      <SectionCard dot={DOT_AMBER} title="How did it feel?">
        <div className="space-y-5">
          <div>
            <SliderField label={`Fatigue — ${FATIGUE_LABELS[form.fatigue]}`} value={form.fatigue} min={1} max={5} onChange={(v) => set("fatigue", v)} colorFn={fatigueColor} />
          </div>
          <div>
            <SliderField label="Effort (RPE)" value={form.rpe} min={1} max={10} onChange={(v) => set("rpe", v)} colorFn={rpeColor} />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">Any issues?</p>
            <div className="flex flex-wrap gap-2">
              {(["cramp", "pain", "earlyFatigue"] as const).map((key) => {
                const labels = { cramp: "Cramp", pain: "Pain / Injury", earlyFatigue: "Early fatigue" } as const;
                const active = form[key] as boolean;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => set(key, !active)}
                    style={active
                      ? { backgroundColor: "#FCEBEB", border: "1px solid #A32D2D", color: "#A32D2D", borderRadius: 20, padding: "4px 12px", fontSize: 13, cursor: "pointer" }
                      : { backgroundColor: "transparent", border: "0.5px solid #d1d5db", color: "#6b7280", borderRadius: 20, padding: "4px 12px", fontSize: 13, cursor: "pointer" }
                    }
                  >
                    {labels[key]}
                  </button>
                );
              })}
            </div>
            {form.cramp && (
              <div className="mt-3">
                <Input placeholder="Location / timing (e.g. left calf, final 100m)" value={form.crampDetail} onChange={(e) => set("crampDetail", e.target.value)} />
              </div>
            )}
            {form.pain && (
              <div className="mt-3 space-y-2">
                <Input placeholder="Body part (e.g. right hamstring)" value={form.painBodyPart} onChange={(e) => set("painBodyPart", e.target.value)} />
                <SliderField label="Severity" value={form.painSeverity} min={1} max={5} onChange={(v) => set("painSeverity", v)} colorFn={fatigueColor} />
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* 6. Notes to coach */}
      <SectionCard dot={DOT_GRAY} title="Notes to coach">
        <Textarea
          placeholder="Anything else your coach should know..."
          value={form.feedbackNote}
          onChange={(e) => set("feedbackNote", e.target.value)}
          rows={3}
        />
      </SectionCard>

      {/* Footer */}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={handleSaveDraft} type="button">
          Save draft
        </Button>
        <Button onClick={handleSubmit} disabled={submitting} type="button" style={{ backgroundColor: TEAL, color: "white" }}>
          {submitting ? "Submitting…" : "Submit session"}
        </Button>
      </div>
    </div>
  );
}
