/**
 * prisma/seed.ts — CoachSync demo seed
 * Fictional data only. Idempotent (upsert / stable IDs).
 *
 * Run:
 *   npx prisma db seed
 *   -- or --
 *   npx tsx prisma/seed.ts
 */

import { config } from "dotenv";
// Next.js uses .env.local; fall back to .env
config({ path: ".env.local" });
config();

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any) as any;

// ── Stable seed IDs ──────────────────────────────────────────────────────────

const ID = {
  // users
  coach:  "seed-user-coach",
  marcus: "seed-user-marcus",
  leon:   "seed-user-leon",
  hina:   "seed-user-hina",
  daiki:  "seed-user-daiki",

  // relations
  rel_marcus: "seed-rel-marcus",
  rel_leon:   "seed-rel-leon",
  rel_hina:   "seed-rel-hina",
  rel_daiki:  "seed-rel-daiki",

  // training program
  prog: "seed-prog-spring2026",

  // training sessions (scheduled, under program)
  ts: (n: number) => `seed-ts-${n}`,

  // athlete sessions (logged)
  s: (athlete: string, n: number) => `seed-sess-${athlete}-${n}`,

  // personal records
  pr: (athlete: string, disc: string) => `seed-pr-${athlete}-${disc}`,
};

// ── Date helpers ─────────────────────────────────────────────────────────────

function d(iso: string) {
  return new Date(iso);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const hash = await bcrypt.hash("demo1234", 10);

  // ── 1. Users ───────────────────────────────────────────────────────────────

  console.log("Seeding users…");

  const [coach, marcus, leon, hina, daiki] = await Promise.all([
    prisma.user.upsert({
      where: { id: ID.coach },
      update: { passwordHash: hash },
      create: {
        id: ID.coach,
        email: "coach@coachsync.demo",
        passwordHash: hash,
        name: "James Carter",
        role: "COACH",
        language: "en",
      },
    }),
    prisma.user.upsert({
      where: { id: ID.marcus },
      update: { passwordHash: hash },
      create: {
        id: ID.marcus,
        email: "marcus@coachsync.demo",
        passwordHash: hash,
        name: "Marcus Thompson",
        role: "ATHLETE",
        language: "en",
      },
    }),
    prisma.user.upsert({
      where: { id: ID.leon },
      update: { passwordHash: hash },
      create: {
        id: ID.leon,
        email: "leon@coachsync.demo",
        passwordHash: hash,
        name: "Leon Brandt",
        role: "ATHLETE",
        language: "de",
      },
    }),
    prisma.user.upsert({
      where: { id: ID.hina },
      update: { passwordHash: hash },
      create: {
        id: ID.hina,
        email: "hina@coachsync.demo",
        passwordHash: hash,
        name: "佐藤 陽奈",
        role: "ATHLETE",
        language: "ja",
      },
    }),
    prisma.user.upsert({
      where: { id: ID.daiki },
      update: { passwordHash: hash },
      create: {
        id: ID.daiki,
        email: "daiki@coachsync.demo",
        passwordHash: hash,
        name: "鈴木 大輝",
        role: "ATHLETE",
        language: "ja",
      },
    }),
  ]);

  console.log(`  coach: ${coach.name}  athletes: ${[marcus, leon, hina, daiki].map((u) => u.name).join(", ")}`);

  // ── 2. Coach–Athlete Relations ─────────────────────────────────────────────

  console.log("Seeding relations…");

  await Promise.all([
    prisma.coachAthleteRelation.upsert({
      where: { id: ID.rel_marcus },
      update: {},
      create: { id: ID.rel_marcus, coachId: coach.id, athleteId: marcus.id },
    }),
    prisma.coachAthleteRelation.upsert({
      where: { id: ID.rel_leon },
      update: {},
      create: { id: ID.rel_leon, coachId: coach.id, athleteId: leon.id },
    }),
    prisma.coachAthleteRelation.upsert({
      where: { id: ID.rel_hina },
      update: {},
      create: { id: ID.rel_hina, coachId: coach.id, athleteId: hina.id },
    }),
    prisma.coachAthleteRelation.upsert({
      where: { id: ID.rel_daiki },
      update: {},
      create: { id: ID.rel_daiki, coachId: coach.id, athleteId: daiki.id },
    }),
  ]);

  // ── 3. Training Program ────────────────────────────────────────────────────

  console.log("Seeding training program…");

  await prisma.trainingProgram.upsert({
    where: { id: ID.prog },
    update: {},
    create: {
      id: ID.prog,
      title: "Spring Season 2026",
      description:
        "Sprint and hurdles development block. Peaking for the Regional Championship in April and National Qualifiers in May.",
      coachId: coach.id,
      startDate: d("2026-01-15"),
      endDate: d("2026-05-31"),
    },
  });

  // ── 4. Training Sessions (scheduled under program) ────────────────────────
  //    ~12 weeks × 3–4 sessions/week, Feb–May 2026

  console.log("Seeding training sessions (program schedule)…");

  const trainingSessionDefs: {
    n: number;
    title: string;
    scheduledAt: string;
    durationMin: number;
    notes?: string;
  }[] = [
    // Week of Feb 2
    { n:  1, title: "Sprint Drills + 100m ×6",          scheduledAt: "2026-02-02T09:00:00", durationMin: 90,  notes: "Focus on the acceleration phase throughout." },
    { n:  2, title: "200m Interval ×5",                  scheduledAt: "2026-02-04T09:00:00", durationMin: 100, notes: "90 sec rest. Maintain rhythm in the back straight." },
    { n:  3, title: "Gym Session",                        scheduledAt: "2026-02-06T10:00:00", durationMin: 75  },
    // Week of Feb 9
    { n:  4, title: "Hurdle Drills + 400mH ×3",          scheduledAt: "2026-02-09T09:00:00", durationMin: 100, notes: "Concentrate on inter-hurdle rhythm." },
    { n:  5, title: "100m Time Trial",                    scheduledAt: "2026-02-11T10:00:00", durationMin: 60  },
    { n:  6, title: "Recovery Run",                       scheduledAt: "2026-02-13T09:00:00", durationMin: 45  },
    // Week of Feb 16
    { n:  7, title: "Hill Sprints ×8",                   scheduledAt: "2026-02-16T09:00:00", durationMin: 80  },
    { n:  8, title: "400m Interval ×4",                  scheduledAt: "2026-02-18T09:00:00", durationMin: 110, notes: "3 min rest. Last 2 reps at full effort." },
    { n:  9, title: "Technique + Hurdle Walk",            scheduledAt: "2026-02-20T09:00:00", durationMin: 70  },
    // Week of Feb 23
    { n: 10, title: "200m ×6 (90% intensity)",           scheduledAt: "2026-02-23T09:00:00", durationMin: 100 },
    { n: 11, title: "Gym + Core",                         scheduledAt: "2026-02-25T10:00:00", durationMin: 75  },
    { n: 12, title: "100m Start Drills ×10",             scheduledAt: "2026-02-27T09:00:00", durationMin: 80  },
    // Spring Camp: Mar 7–9
    { n: 13, title: "Camp Day 1 — AM: Technique Drills", scheduledAt: "2026-03-07T07:30:00", durationMin: 90,  notes: "Izumi training camp. Emphasis on technique and load management." },
    { n: 14, title: "Camp Day 1 — PM: 400m ×5",          scheduledAt: "2026-03-07T15:00:00", durationMin: 100 },
    { n: 15, title: "Camp Day 2 — AM: 100m Runs",        scheduledAt: "2026-03-08T07:30:00", durationMin: 80  },
    { n: 16, title: "Camp Day 2 — PM: Hurdles",          scheduledAt: "2026-03-08T15:00:00", durationMin: 100 },
    { n: 17, title: "Camp Day 3 — Final Run-Through",    scheduledAt: "2026-03-09T09:00:00", durationMin: 90  },
    // Week of Mar 11
    { n: 18, title: "Post-Camp Recovery",                scheduledAt: "2026-03-11T09:00:00", durationMin: 50  },
    { n: 19, title: "100m Time Trial (Official Timing)", scheduledAt: "2026-03-14T10:00:00", durationMin: 60,  notes: "Cross-check times against PB records." },
    { n: 20, title: "Hurdle Session",                    scheduledAt: "2026-03-16T09:00:00", durationMin: 90  },
    // Week of Mar 23
    { n: 21, title: "Speed Endurance: 200m ×4 + 400m ×2", scheduledAt: "2026-03-23T09:00:00", durationMin: 110 },
    { n: 22, title: "Gym + Recovery",                    scheduledAt: "2026-03-25T10:00:00", durationMin: 75  },
    { n: 23, title: "Sprint Drills",                     scheduledAt: "2026-03-27T09:00:00", durationMin: 80  },
    // Upcoming weeks
    { n: 24, title: "400m Interval ×5",                  scheduledAt: "2026-04-01T09:00:00", durationMin: 110 },
    { n: 25, title: "Hurdle Rhythm Runs",                scheduledAt: "2026-04-03T09:00:00", durationMin: 90  },
    { n: 26, title: "100m Speed Session",                scheduledAt: "2026-04-06T09:00:00", durationMin: 70  },
    { n: 27, title: "Taper Day 1",                       scheduledAt: "2026-04-13T09:00:00", durationMin: 60,  notes: "Pre-Regional Championship taper. Drop the intensity." },
    { n: 28, title: "Taper Day 2",                       scheduledAt: "2026-04-15T09:00:00", durationMin: 50  },
  ];

  for (const s of trainingSessionDefs) {
    await prisma.trainingSession.upsert({
      where: { id: ID.ts(s.n) },
      update: {},
      create: {
        id: ID.ts(s.n),
        programId: ID.prog,
        title: s.title,
        scheduledAt: d(s.scheduledAt),
        durationMin: s.durationMin,
        notes: s.notes ?? null,
      },
    });
  }

  // ── 5. Athlete Sessions (logged, with detail) ─────────────────────────────

  console.log("Seeding athlete sessions…");

  type SeedSession = {
    id: string;
    date: string;
    title: string;
    durationMin: number;
    athleteId: string;
    coachId: string;
    types: string[];
    warmup: { order: number; name: string; detail?: string }[];
    sets: {
      order: number;
      laps: { order: number; distance: string; timeSeconds?: number }[];
      note?: string;
    }[];
    drills: { order: number; name: string }[];
    feedback?: { fatigue: number; rpe: number; note?: string };
  };

  const athleteSessions: SeedSession[] = [
    // ── Marcus Thompson ────────────────────────────────────────────────────
    {
      id: ID.s("marcus", 1),
      date: "2026-03-03T09:00:00",
      title: "100m Speed Session",
      durationMin: 90,
      athleteId: marcus.id,
      coachId: coach.id,
      types: ["SPEED"],
      warmup: [
        { order: 1, name: "Easy jog", detail: "10 min" },
        { order: 2, name: "A-skip / B-skip", detail: "2×30m each" },
        { order: 3, name: "Acceleration runs", detail: "3×60m" },
      ],
      sets: [
        { order: 1, laps: [{ order: 1, distance: "100m", timeSeconds: 10.72 }] },
        { order: 2, laps: [{ order: 1, distance: "100m", timeSeconds: 10.68 }] },
        { order: 3, laps: [{ order: 1, distance: "100m", timeSeconds: 10.65 }] },
        { order: 4, laps: [{ order: 1, distance: "100m", timeSeconds: 10.61 }] },
        { order: 5, laps: [{ order: 1, distance: "100m", timeSeconds: 10.58 }] },
        { order: 6, laps: [{ order: 1, distance: "100m", timeSeconds: 10.55 }] },
      ],
      drills: [],
      feedback: { fatigue: 3, rpe: 8, note: "Good progressive session. Last rep felt strong." },
    },
    {
      id: ID.s("marcus", 2),
      date: "2026-03-10T09:00:00",
      title: "200m Interval ×5",
      durationMin: 100,
      athleteId: marcus.id,
      coachId: coach.id,
      types: ["SPEED", "ENDURANCE"],
      warmup: [
        { order: 1, name: "Easy jog", detail: "8 min" },
        { order: 2, name: "Dynamic stretching" },
        { order: 3, name: "Strides", detail: "4×100m" },
      ],
      sets: [
        { order: 1, laps: [{ order: 1, distance: "200m", timeSeconds: 21.30 }] },
        { order: 2, laps: [{ order: 1, distance: "200m", timeSeconds: 21.22 }] },
        { order: 3, laps: [{ order: 1, distance: "200m", timeSeconds: 21.18 }] },
        { order: 4, laps: [{ order: 1, distance: "200m", timeSeconds: 21.10 }] },
        { order: 5, laps: [{ order: 1, distance: "200m", timeSeconds: 21.05 }] },
      ],
      drills: [],
      feedback: { fatigue: 3, rpe: 9, note: "Felt the fatigue in rep 4 but held form." },
    },
    {
      id: ID.s("marcus", 3),
      date: "2026-04-05T09:00:00",
      title: "Pre-Meet Speed Sharpener",
      durationMin: 60,
      athleteId: marcus.id,
      coachId: coach.id,
      types: ["SPEED"],
      warmup: [{ order: 1, name: "Easy jog", detail: "10 min" }],
      sets: [],
      drills: [],
    },
    // ── Leon Brandt ────────────────────────────────────────────────────────
    {
      id: ID.s("leon", 1),
      date: "2026-03-05T09:00:00",
      title: "400mH Techniklauf",
      durationMin: 110,
      athleteId: leon.id,
      coachId: coach.id,
      types: ["HURDLES", "TECHNIQUE"],
      warmup: [
        { order: 1, name: "Einlaufen", detail: "10 min locker" },
        { order: 2, name: "Hürdenübungen A–C" },
      ],
      sets: [
        { order: 1, laps: [{ order: 1, distance: "400mH", timeSeconds: 52.80 }] },
        { order: 2, laps: [{ order: 1, distance: "400mH", timeSeconds: 52.45 }] },
        { order: 3, laps: [{ order: 1, distance: "400mH", timeSeconds: 52.20 }] },
      ],
      drills: [
        { order: 1, name: "Hürdenrhythmus 3er Schritt" },
        { order: 2, name: "Schwungbeinarbeit" },
      ],
      feedback: { fatigue: 4, rpe: 9, note: "Hürde 6–8 Rhythmus noch nicht sauber. Morgen extra Technikeinheit." },
    },
    {
      id: ID.s("leon", 2),
      date: "2026-04-02T09:00:00",
      title: "400mH Race Preparation",
      durationMin: 90,
      athleteId: leon.id,
      coachId: coach.id,
      types: ["HURDLES"],
      warmup: [{ order: 1, name: "Einlaufen", detail: "10 min" }],
      sets: [],
      drills: [],
    },
    // ── 佐藤 陽奈 ──────────────────────────────────────────────────────────
    {
      id: ID.s("hina", 1),
      date: "2026-03-04T09:30:00",
      title: "100m スプリント練習",
      durationMin: 85,
      athleteId: hina.id,
      coachId: coach.id,
      types: ["SPEED", "TECHNIQUE"],
      warmup: [
        { order: 1, name: "ジョグ", detail: "10分" },
        { order: 2, name: "Aスキップ・Bスキップ" },
        { order: 3, name: "流し", detail: "3×60m" },
      ],
      sets: [
        { order: 1, laps: [{ order: 1, distance: "100m", timeSeconds: 12.05 }] },
        { order: 2, laps: [{ order: 1, distance: "100m", timeSeconds: 11.98 }] },
        { order: 3, laps: [{ order: 1, distance: "100m", timeSeconds: 11.92 }] },
        { order: 4, laps: [{ order: 1, distance: "100m", timeSeconds: 11.89 }] },
      ],
      drills: [
        { order: 1, name: "腕振りドリル" },
        { order: 2, name: "ハイニー" },
      ],
      feedback: { fatigue: 2, rpe: 7, note: "後半の伸びが良くなってきた。明日は疲労管理を優先。" },
    },
    {
      id: ID.s("hina", 2),
      date: "2026-03-17T09:30:00",
      title: "200m インターバル×4",
      durationMin: 90,
      athleteId: hina.id,
      coachId: coach.id,
      types: ["SPEED", "ENDURANCE"],
      warmup: [{ order: 1, name: "ジョグ", detail: "8分" }],
      sets: [
        { order: 1, laps: [{ order: 1, distance: "200m", timeSeconds: 24.20 }] },
        { order: 2, laps: [{ order: 1, distance: "200m", timeSeconds: 24.05 }] },
        { order: 3, laps: [{ order: 1, distance: "200m", timeSeconds: 23.90 }] },
        { order: 4, laps: [{ order: 1, distance: "200m", timeSeconds: 23.80 }] },
      ],
      drills: [],
      feedback: { fatigue: 3, rpe: 8 },
    },
    {
      id: ID.s("hina", 3),
      date: "2026-04-04T09:30:00",
      title: "大会前最終調整",
      durationMin: 55,
      athleteId: hina.id,
      coachId: coach.id,
      types: ["SPEED"],
      warmup: [{ order: 1, name: "ジョグ", detail: "10分" }],
      sets: [],
      drills: [],
    },
    // ── 鈴木 大輝 ──────────────────────────────────────────────────────────
    {
      id: ID.s("daiki", 1),
      date: "2026-03-06T09:00:00",
      title: "400m インターバル×4",
      durationMin: 110,
      athleteId: daiki.id,
      coachId: coach.id,
      types: ["ENDURANCE", "SPEED"],
      warmup: [
        { order: 1, name: "ジョグ", detail: "12分" },
        { order: 2, name: "動的ストレッチ" },
      ],
      sets: [
        { order: 1, laps: [{ order: 1, distance: "400m", timeSeconds: 49.50 }] },
        { order: 2, laps: [{ order: 1, distance: "400m", timeSeconds: 49.20 }] },
        { order: 3, laps: [{ order: 1, distance: "400m", timeSeconds: 48.90 }] },
        { order: 4, laps: [{ order: 1, distance: "400m", timeSeconds: 48.70 }] },
      ],
      drills: [],
      feedback: { fatigue: 4, rpe: 9, note: "4本目は粘れた。疲労感はあるが良い刺激。" },
    },
    {
      id: ID.s("daiki", 2),
      date: "2026-03-20T09:00:00",
      title: "400mH ハードル練習",
      durationMin: 100,
      athleteId: daiki.id,
      coachId: coach.id,
      types: ["HURDLES"],
      warmup: [
        { order: 1, name: "ジョグ", detail: "10分" },
        { order: 2, name: "ハードルドリル" },
      ],
      sets: [
        { order: 1, laps: [{ order: 1, distance: "400mH", timeSeconds: 54.30 }] },
        { order: 2, laps: [{ order: 1, distance: "400mH", timeSeconds: 53.80 }] },
        { order: 3, laps: [{ order: 1, distance: "400mH", timeSeconds: 53.50 }] },
      ],
      drills: [
        { order: 1, name: "3歩リズム確認" },
        { order: 2, name: "抜き足ドリル" },
      ],
      feedback: { fatigue: 3, rpe: 8 },
    },
  ];

  for (const s of athleteSessions) {
    // Delete first so nested relations can be cleanly re-created
    await prisma.session.deleteMany({ where: { id: s.id } });

    await prisma.session.create({
      data: {
        id: s.id,
        date: d(s.date),
        title: s.title,
        durationMin: s.durationMin,
        athleteId: s.athleteId,
        coachId: s.coachId,
        types: {
          create: s.types.map((t) => ({ type: t })),
        },
        warmupItems: {
          create: s.warmup,
        },
        sets: {
          create: s.sets.map((set) => ({
            order: set.order,
            note: set.note ?? null,
            laps: { create: set.laps },
          })),
        },
        drills: {
          create: s.drills,
        },
        ...(s.feedback
          ? {
              feedback: {
                create: {
                  fatigue: s.feedback.fatigue,
                  rpe: s.feedback.rpe,
                  note: s.feedback.note ?? null,
                },
              },
            }
          : {}),
      },
    });
  }

  // ── 6. Coach Comments ──────────────────────────────────────────────────────

  console.log("Seeding coach comments…");

  const commentDefs = [
    {
      id: "seed-cc-1",
      sessionId: ID.s("marcus", 1),
      text: "Great acceleration phase today, Marcus. Your drive phase is really coming together — last 3 reps showed clear improvement. Keep focusing on arm mechanics at the start.",
    },
    {
      id: "seed-cc-2",
      sessionId: ID.s("marcus", 2),
      text: "Rep 4 looked a bit tense through the shoulders. Remember to stay relaxed at 95% — tension kills speed. Otherwise a solid session.",
    },
    {
      id: "seed-cc-3",
      sessionId: ID.s("leon", 1),
      text: "Hurdles 6–8 rhythm still needs work. We'll do an extra technique block tomorrow focused specifically on that section. Good intensity overall though.",
    },
    {
      id: "seed-cc-4",
      sessionId: ID.s("hina", 1),
      text: "The extension in the second half has improved noticeably. This shows your stride is stabilising. Next session, stay more conscious of the 60–80m zone.",
    },
    {
      id: "seed-cc-5",
      sessionId: ID.s("daiki", 1),
      text: "All four laps were consistent — great discipline. The fight in reps 3 and 4 was especially impressive. Next step is holding back a touch in the first half so you have more left at the end.",
    },
  ];

  for (const c of commentDefs) {
    await prisma.coachComment.upsert({
      where: { id: c.id },
      update: { text: c.text },
      create: {
        id: c.id,
        sessionId: c.sessionId,
        coachId: coach.id,
        text: c.text,
      },
    });
  }

  // ── 7. Personal Records ────────────────────────────────────────────────────

  console.log("Seeding personal records…");

  const prDefs = [
    // Marcus Thompson
    { id: ID.pr("marcus", "100m"),  athleteId: marcus.id, discipline: "100m",  performance: 10.45, unit: "s", wind: +1.2, date: "2025-09-14", competition: "Kanto Regional Championship", location: "Yokohama", surface: "OUTDOOR" as const },
    { id: ID.pr("marcus", "200m"),  athleteId: marcus.id, discipline: "200m",  performance: 20.91, unit: "s", wind:  0.0, date: "2025-08-22", competition: "Invitational Meet",           location: "Tokyo",    surface: "OUTDOOR" as const },
    { id: ID.pr("marcus", "60m"),   athleteId: marcus.id, discipline: "60m",   performance:  6.72, unit: "s",             date: "2026-01-18", competition: "Indoor Championships",        location: "Osaka",    surface: "INDOOR"  as const },
    // Leon Brandt
    { id: ID.pr("leon", "100m"),    athleteId: leon.id,   discipline: "100m",  performance: 10.62, unit: "s", wind: +0.8, date: "2025-07-05", competition: "Süddeutsche Meisterschaften", location: "München",  surface: "OUTDOOR" as const },
    { id: ID.pr("leon", "400mH"),   athleteId: leon.id,   discipline: "400mH", performance: 50.34, unit: "s",             date: "2025-08-30", competition: "National Championships",      location: "Berlin",   surface: "OUTDOOR" as const },
    { id: ID.pr("leon", "200m"),    athleteId: leon.id,   discipline: "200m",  performance: 21.15, unit: "s", wind: +1.0, date: "2025-06-20", competition: "Regional Open",               location: "Frankfurt",surface: "OUTDOOR" as const },
    // 佐藤 陽奈
    { id: ID.pr("hina", "100m"),    athleteId: hina.id,   discipline: "100m",  performance: 11.78, unit: "s", wind: +0.5, date: "2025-09-06", competition: "関東学生選手権",              location: "横浜",     surface: "OUTDOOR" as const },
    { id: ID.pr("hina", "200m"),    athleteId: hina.id,   discipline: "200m",  performance: 23.45, unit: "s", wind:  0.0, date: "2025-10-11", competition: "全国学生陸上",                location: "大阪",     surface: "OUTDOOR" as const },
    { id: ID.pr("hina", "60m"),     athleteId: hina.id,   discipline: "60m",   performance:  7.38, unit: "s",             date: "2026-02-01", competition: "室内選手権",                  location: "東京",     surface: "INDOOR"  as const },
    // 鈴木 大輝
    { id: ID.pr("daiki", "400m"),   athleteId: daiki.id,  discipline: "400m",  performance: 47.23, unit: "s",             date: "2025-09-20", competition: "関東選手権",                  location: "横浜",     surface: "OUTDOOR" as const },
    { id: ID.pr("daiki", "400mH"),  athleteId: daiki.id,  discipline: "400mH", performance: 52.10, unit: "s",             date: "2025-08-16", competition: "インターカレッジ",            location: "大阪",     surface: "OUTDOOR" as const },
    { id: ID.pr("daiki", "200m"),   athleteId: daiki.id,  discipline: "200m",  performance: 21.80, unit: "s", wind: +0.3, date: "2025-07-12", competition: "地区大会",                    location: "さいたま", surface: "OUTDOOR" as const },
  ];

  for (const pr of prDefs) {
    await prisma.personalRecord.upsert({
      where: { id: pr.id },
      update: {},
      create: {
        id: pr.id,
        athleteId: pr.athleteId,
        discipline: pr.discipline,
        performance: pr.performance,
        unit: pr.unit,
        wind: pr.wind ?? null,
        date: d(pr.date),
        competition: pr.competition ?? null,
        location: pr.location ?? null,
        surface: pr.surface,
        loggedById: coach.id,
      },
    });
  }

  // ── 8. Events ──────────────────────────────────────────────────────────────

  console.log("Seeding events…");

  // Events are per athlete in the schema (coachId + athleteId). Create for each athlete.
  const eventTemplates = [
    {
      n: 1,
      title: "Spring Training Camp — Izumi",
      type: "CAMP" as const,
      date: "2026-03-07",
      location: "Izumi Sports Centre, Osaka",
      notes: "3-day intensive training camp. Attendance mandatory for all athletes.",
    },
    {
      n: 2,
      title: "Kanto Regional Athletics Championship",
      type: "MATCH" as const,
      date: "2026-04-19",
      location: "Yokohama Athletics Stadium",
      notes: "All events entered: 100m, 200m, 400m, 400mH.",
    },
    {
      n: 3,
      title: "National Athletics Qualifiers",
      type: "MATCH" as const,
      date: "2026-05-10",
      location: "Yanmar Stadium Nagai, Osaka",
      notes: "Entry restricted to athletes who have cleared the qualifying standard.",
    },
    {
      n: 4,
      title: "Mid-Season Time Trial",
      type: "TEST" as const,
      testType: "TIME_TRIAL" as const,
      date: "2026-02-15",
      location: "Training Track",
      notes: "Mid-season baseline measurement. Compare against current PBs.",
    },
  ];

  const athletes = [marcus, leon, hina, daiki];

  for (const ev of eventTemplates) {
    for (const athlete of athletes) {
      const evId = `seed-ev-${ev.n}-${athlete.id.slice(-6)}`;
      await prisma.event.upsert({
        where: { id: evId },
        update: {},
        create: {
          id: evId,
          title: ev.title,
          type: ev.type,
          testType: ev.testType ?? null,
          date: d(ev.date),
          location: ev.location ?? null,
          notes: ev.notes ?? null,
          coachId: coach.id,
          athleteId: athlete.id,
        },
      });
    }
  }

  console.log("✅ Seed complete.");
  console.log("");
  console.log("Demo accounts (password: demo1234)");
  console.log("  coach@coachsync.demo  — COACH  (James Carter, en)");
  console.log("  marcus@coachsync.demo — ATHLETE (Marcus Thompson, en)");
  console.log("  leon@coachsync.demo   — ATHLETE (Leon Brandt, de)");
  console.log("  hina@coachsync.demo   — ATHLETE (佐藤 陽奈, ja)");
  console.log("  daiki@coachsync.demo  — ATHLETE (鈴木 大輝, ja)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/*
 * ── How to run ────────────────────────────────────────────────────────────────
 *
 *  Recommended (via package.json prisma.seed):
 *
 *    npx prisma db seed
 *
 *  Or directly:
 *
 *    npx tsx prisma/seed.ts
 *
 *  Make sure DATABASE_URL is set in .env.local (or .env).
 *  The script loads .env.local first, then .env as a fallback.
 */
