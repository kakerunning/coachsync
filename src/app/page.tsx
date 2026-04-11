"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Syne, DM_Mono, Outfit } from "next/font/google";

const syne = Syne({ subsets: ["latin"], weight: ["700", "800"] });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"] });
const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500"] });

function useCounter(target: number, duration = 2000, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let startTime: number | null = null;
    const tick = (ts: number) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, target, duration]);
  return count;
}

const LANGUAGES = [
  "日本語", "English", "Español", "한국어", "Français",
  "Deutsch", "Italiano", "中文", "Português", "العربية", "Русский", "Nederlands",
];

const FEATURES = [
  {
    dot: "#5DCAA5",
    label: "Training Logs",
    desc: "Log sessions with full detail — sets, laps, drills, warmups, and athlete feedback with incident tracking.",
    stat: "12 data points per session",
  },
  {
    dot: "#378ADD",
    label: "Schedule & Events",
    desc: "Plan matches, camps, and performance tests. Athletes and coaches see a unified calendar in real time.",
    stat: "Month · Week · Day views",
  },
  {
    dot: "#E24B4A",
    label: "Personal Records",
    desc: "Track PBs across disciplines. Wind readings, surface type, competition context — nothing gets lost.",
    stat: "Outdoor + Indoor tracked",
  },
  {
    dot: "#BA7517",
    label: "Coach Feedback",
    desc: "Coaches leave comments directly on session logs. Athletes get push notifications the moment it lands.",
    stat: "Push-notified in seconds",
  },
  {
    dot: "#1D9E75",
    label: "Analytics & Reports",
    desc: "Performance trend charts, fatigue timelines, volume heatmaps, and weekly PDF reports for coaches.",
    stat: "Powered by Python + Plotly",
  },
  {
    dot: "#888780",
    label: "Invite System",
    desc: "Generate a 24-hour invite link. Athletes join with one click — no email hunting required.",
    stat: "24-hour secure token",
  },
];

export default function LandingPage() {
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsActive, setStatsActive] = useState(false);

  const athletes = useCounter(2400, 2200, statsActive);
  const sessions = useCounter(18500, 2200, statsActive);
  const langs = useCounter(12, 1500, statsActive);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsActive(true); },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className={`${outfit.className} bg-[#090E0C] text-[#EDF2EF] min-h-screen overflow-x-hidden`}>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up   { animation: fadeUp 0.75s ease both; }
        .fade-up-1 { animation: fadeUp 0.75s 0.15s ease both; }
        .fade-up-2 { animation: fadeUp 0.75s 0.30s ease both; }
        .fade-up-3 { animation: fadeUp 0.75s 0.45s ease both; }
        .fade-up-4 { animation: fadeUp 0.75s 0.60s ease both; }
        .card-lift  { transition: border-color 0.2s, transform 0.2s; }
        .card-lift:hover { border-color: rgba(29,158,117,0.5) !important; transform: translateY(-3px); }
      `}</style>

      {/* Noise texture */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
          opacity: 0.5,
        }}
      />

      {/* Grid */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(29,158,117,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(29,158,117,0.035) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      {/* Radial glow */}
      <div
        aria-hidden
        className="fixed pointer-events-none z-0"
        style={{
          top: "-15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "900px",
          height: "700px",
          background: "radial-gradient(ellipse, rgba(29,158,117,0.10) 0%, transparent 68%)",
        }}
      />

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5 border-b border-white/[0.06]">
        <div className={`${syne.className} text-lg font-extrabold tracking-tight flex items-center gap-2`}>
          <span className="w-2 h-2 rounded-full bg-[#1D9E75]" />
          CoachSync
        </div>

        <div className={`${dmMono.className} hidden md:flex gap-8 text-xs text-white/35`}>
          {[["#features", "Features"], ["#how", "How it works"], ["#roles", "Coaches & Athletes"]].map(([href, label]) => (
            <a key={href} href={href} className="hover:text-white/65 transition-colors">{label}</a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className={`${dmMono.className} text-xs text-white/45 hover:text-white/70 transition-colors px-4 py-2`}>
            Log in
          </Link>
          <Link
            href="/signup"
            className={`${dmMono.className} text-xs font-medium bg-[#1D9E75] text-[#051009] px-5 py-2.5 rounded-full hover:bg-[#23b887] transition-colors`}
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-10 pt-28 pb-28 max-w-7xl mx-auto">
        <p className={`${dmMono.className} fade-up text-xs text-[#1D9E75] tracking-[0.2em] uppercase mb-6`}>
          Coach–Athlete Platform · Multilingual
        </p>

        <h1
          className={`${syne.className} fade-up-1 font-extrabold leading-[0.9] tracking-tight mb-10`}
          style={{ fontSize: "clamp(3.8rem, 9.5vw, 8.5rem)" }}
        >
          Train together.
          <br />
          <span className="text-[#1D9E75]">Speak any</span>
          <br />
          language.
        </h1>

        <p className="fade-up-2 text-white/45 text-lg max-w-lg leading-relaxed mb-12">
          CoachSync connects coaches and athletes across language barriers —
          session logs, feedback, and schedules, all auto-translated via DeepL.
        </p>

        <div className="fade-up-3 flex flex-wrap gap-4">
          <Link
            href="/signup"
            className={`${syne.className} font-bold text-sm bg-[#1D9E75] text-[#051009] px-8 py-4 rounded-xl hover:bg-[#23b887] transition-all hover:scale-[1.02] active:scale-[0.99]`}
          >
            Start free →
          </Link>
          <Link
            href="/login"
            className={`${dmMono.className} text-sm border border-white/[0.12] text-white/50 px-8 py-4 rounded-xl hover:border-white/30 hover:text-white/80 transition-all`}
          >
            Sign in
          </Link>
        </div>

        {/* Floating session preview card */}
        <div
          className="hidden xl:block absolute right-10 top-1/2 -translate-y-1/2 fade-up-4 pointer-events-none select-none"
        >
          <div
            className="w-[300px] rounded-xl border p-5 space-y-4"
            style={{
              background: "rgba(13,20,16,0.85)",
              borderColor: "rgba(255,255,255,0.09)",
              backdropFilter: "blur(16px)",
            }}
          >
            {/* Card header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#5DCAA5]" />
                <span className={`${dmMono.className} text-[11px] text-white/50`}>Session · Today</span>
              </div>
              <span className={`${dmMono.className} text-[10px] text-[#1D9E75] tracking-widest`}>● LIVE</span>
            </div>

            <p className={`${syne.className} font-bold text-sm`}>Track Intervals · 400m × 8</p>

            {/* Type pills */}
            <div className="flex gap-2">
              {["SPEED", "ENDURANCE"].map((t) => (
                <span
                  key={t}
                  className={`${dmMono.className} text-[10px] px-2.5 py-0.5 rounded-full`}
                  style={{ background: "rgba(29,158,117,0.14)", color: "#5DCAA5" }}
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Lap grid */}
            <div className="grid grid-cols-4 gap-y-1 pt-1">
              {[
                ["L1", "58.2s"], ["L2", "57.8s"], ["L3", "58.5s"], ["L4", "57.1s"],
                ["L5", "59.0s"], ["L6", "57.4s"], ["L7", "58.8s"], ["L8", "56.9s"],
              ].map(([lap, time]) => (
                <div key={lap} className="text-center">
                  <div className={`${dmMono.className} text-[9px] text-white/25`}>{lap}</div>
                  <div className={`${dmMono.className} text-[11px] font-medium`}>{time}</div>
                </div>
              ))}
            </div>

            {/* Translation preview */}
            <div
              className="p-3 rounded-lg text-[11px] leading-snug text-white/45 italic border-l-2"
              style={{ borderColor: "#1D9E75", background: "rgba(29,158,117,0.07)" }}
            >
              "良いペース。最後のセットに集中して。"
              <br />
              <span className="text-[#5DCAA5] not-italic">→ "Good pace. Focus on the final set."</span>
            </div>

            {/* RPE row */}
            <div className="flex items-center justify-between pt-1">
              <span className={`${dmMono.className} text-[10px] text-white/30`}>RPE</span>
              <div className="flex gap-1">
                {Array.from({ length: 10 }, (_, i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-sm"
                    style={{
                      background: i < 7
                        ? i < 4 ? "rgba(29,158,117,0.7)" : i < 6 ? "rgba(186,117,23,0.7)" : "rgba(226,75,74,0.7)"
                        : "rgba(255,255,255,0.08)",
                    }}
                  />
                ))}
              </div>
              <span className={`${dmMono.className} text-[10px] text-white/30`}>7/10</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── LANGUAGE MARQUEE ─────────────────────────────────────────────── */}
      <div className="relative z-10 border-y border-white/[0.05] py-5 overflow-hidden">
        <div className="flex gap-10 whitespace-nowrap" style={{ animation: "marquee 22s linear infinite" }}>
          {[...LANGUAGES, ...LANGUAGES].map((lang, i) => (
            <span key={i} className={`${dmMono.className} text-sm text-white/20`}>
              {lang}
              <span className="text-[#1D9E75] ml-10">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <section ref={statsRef} className="relative z-10 py-24 px-6 md:px-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08]">
          {[
            { val: athletes.toLocaleString(), suffix: "+", label: "Athletes tracked" },
            { val: sessions.toLocaleString(), suffix: "+", label: "Sessions logged" },
            { val: langs, suffix: "", label: "Languages supported" },
          ].map((s, i) => (
            <div key={i} className="py-10 sm:py-0 sm:px-12 first:pl-0 last:pr-0">
              <div className={`${syne.className} font-extrabold text-[#EDF2EF]`} style={{ fontSize: "clamp(2.8rem, 5vw, 4.5rem)" }}>
                {s.val}{s.suffix}
              </div>
              <div className={`${dmMono.className} text-xs text-white/35 uppercase tracking-[0.15em] mt-2`}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-6 md:px-10 max-w-7xl mx-auto" id="features">
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className={`${dmMono.className} text-xs text-[#1D9E75] tracking-[0.2em] uppercase block mb-3`}>
              Everything you need
            </span>
            <h2 className={`${syne.className} font-extrabold leading-[0.95]`} style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.8rem)" }}>
              Built for how
              <br />coaches actually work.
            </h2>
          </div>
          <p className="text-white/40 text-sm max-w-xs leading-relaxed">
            Every feature designed around the real rhythm of coach–athlete communication.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="card-lift rounded-xl border p-6 cursor-default"
              style={{
                background: "rgba(255,255,255,0.018)",
                borderColor: "rgba(255,255,255,0.07)",
              }}
            >
              {/* Card header per UI.md pattern */}
              <div
                className="flex items-center gap-2 mb-5 -mx-6 -mt-6 px-6 py-3 rounded-t-xl border-b"
                style={{ background: "rgba(255,255,255,0.025)", borderColor: "rgba(255,255,255,0.06)" }}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: f.dot }} />
                <span className={`${dmMono.className} text-[11px] text-white/45 font-medium`}>{f.label}</span>
              </div>

              <p className="text-white/60 text-sm leading-relaxed mb-5">{f.desc}</p>

              <span
                className={`${dmMono.className} text-[10px] px-3 py-1 rounded-full inline-block`}
                style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.28)" }}
              >
                {f.stat}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-6 md:px-10 max-w-7xl mx-auto" id="how">
        <div className="mb-16">
          <span className={`${dmMono.className} text-xs text-[#1D9E75] tracking-[0.2em] uppercase block mb-3`}>Simple by design</span>
          <h2 className={`${syne.className} font-extrabold leading-[0.95]`} style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.8rem)" }}>
            Up and running
            <br />in three steps.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.05] rounded-xl overflow-hidden border border-white/[0.07]">
          {[
            {
              step: "01",
              title: "Coach creates an invite",
              desc: "Generate a 24-hour secure link and send it to your athlete. No email setup, no admin friction.",
            },
            {
              step: "02",
              title: "Athlete joins with one click",
              desc: "Accept the invite, set your preferred language, and you're on the roster instantly.",
            },
            {
              step: "03",
              title: "Train. Log. Communicate.",
              desc: "Log sessions, receive coach feedback, view your schedule — all auto-translated in real time.",
            },
          ].map((s, i) => (
            <div key={i} className="p-8 md:p-10" style={{ background: "#0C1310" }}>
              <div className={`${dmMono.className} text-5xl font-medium text-white/[0.08] mb-8 leading-none`}>{s.step}</div>
              <h3 className={`${syne.className} font-bold text-lg mb-3 leading-snug`}>{s.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ROLE SPLIT ────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-6 md:px-10 max-w-7xl mx-auto" id="roles">
        <div className="mb-14">
          <span className={`${dmMono.className} text-xs text-[#1D9E75] tracking-[0.2em] uppercase block mb-3`}>Two roles. One platform.</span>
          <h2 className={`${syne.className} font-extrabold leading-[0.95]`} style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.8rem)" }}>
            Built for both sides
            <br />of the track.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Coach */}
          <div
            className="rounded-xl border p-8 md:p-10"
            style={{ background: "rgba(29,158,117,0.07)", borderColor: "rgba(29,158,117,0.22)" }}
          >
            <div className={`${dmMono.className} text-[11px] text-[#1D9E75] uppercase tracking-[0.2em] mb-6`}>For coaches</div>
            <h3 className={`${syne.className} font-extrabold text-3xl mb-6 leading-tight`}>
              Your full roster,
              <br />one dashboard.
            </h3>
            <ul className="space-y-3 mb-8">
              {[
                "Manage multiple athletes from one view",
                "Leave session feedback with push notifications",
                "Schedule matches, camps, and performance tests",
                "View analytics charts and generate PDF reports",
                "Invite athletes with a shareable 24-hour link",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/55">
                  <span className="text-[#1D9E75] mt-px flex-shrink-0">→</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className={`${syne.className} font-bold text-sm inline-block bg-[#1D9E75] text-[#051009] px-7 py-3.5 rounded-lg hover:bg-[#23b887] transition-colors`}
            >
              I'm a coach →
            </Link>
          </div>

          {/* Athlete */}
          <div
            className="rounded-xl border p-8 md:p-10"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}
          >
            <div className={`${dmMono.className} text-[11px] text-white/35 uppercase tracking-[0.2em] mb-6`}>For athletes</div>
            <h3 className={`${syne.className} font-extrabold text-3xl mb-6 leading-tight`}>
              Your training.
              <br />Your language.
            </h3>
            <ul className="space-y-3 mb-8">
              {[
                "Log training sessions with granular detail",
                "Track personal bests across every discipline",
                "Read coach feedback in your own language",
                "See your full schedule on a live calendar",
                "Monitor fatigue, RPE, and wellness trends",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/55">
                  <span className="text-white/25 mt-px flex-shrink-0">→</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className={`${syne.className} font-bold text-sm inline-block border border-white/20 text-white/80 px-7 py-3.5 rounded-lg hover:border-white/40 hover:text-white transition-colors`}
            >
              I'm an athlete →
            </Link>
          </div>
        </div>
      </section>

      {/* ── TRANSLATION CALLOUT ───────────────────────────────────────────── */}
      <section className="relative z-10 py-12 px-6 md:px-10 max-w-7xl mx-auto">
        <div
          className="rounded-xl border px-8 py-16 md:py-20 text-center"
          style={{
            background: "radial-gradient(ellipse at 50% 100%, rgba(29,158,117,0.12) 0%, transparent 65%)",
            borderColor: "rgba(29,158,117,0.18)",
          }}
        >
          <span className={`${dmMono.className} text-[11px] text-[#1D9E75] tracking-[0.2em] uppercase block mb-5`}>
            Powered by DeepL API
          </span>
          <h2 className={`${syne.className} font-extrabold leading-[0.95] mb-5`} style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>
            Language is no longer a barrier.
          </h2>
          <p className="text-white/45 max-w-lg mx-auto text-base leading-relaxed mb-10">
            Coach in Japanese, athlete reads in Spanish. Leave feedback in Korean, it lands in French.
            CoachSync auto-translates every message per each user's language preference.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "日本語 → Español",
              "한국어 → Français",
              "English → 中文",
              "Deutsch → Italiano",
              "Português → العربية",
            ].map((pair, i) => (
              <span
                key={i}
                className={`${dmMono.className} text-xs px-4 py-2 rounded-full border`}
                style={{
                  borderColor: "rgba(29,158,117,0.28)",
                  color: "rgba(255,255,255,0.38)",
                  background: "rgba(29,158,117,0.07)",
                }}
              >
                {pair}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-32 px-6 md:px-10 text-center">
        <p className={`${dmMono.className} text-xs text-[#1D9E75] tracking-[0.2em] uppercase mb-6`}>
          Free to start · No credit card
        </p>
        <h2 className={`${syne.className} font-extrabold leading-[0.9] mb-12`} style={{ fontSize: "clamp(3rem, 7vw, 6rem)" }}>
          Ready to coach
          <br />without limits?
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/signup"
            className={`${syne.className} font-bold text-sm bg-[#1D9E75] text-[#051009] px-10 py-4 rounded-xl hover:bg-[#23b887] transition-all hover:scale-[1.02] active:scale-[0.99]`}
          >
            Create your account →
          </Link>
          <Link
            href="/login"
            className={`${dmMono.className} text-sm border border-white/[0.12] text-white/45 px-10 py-4 rounded-xl hover:border-white/30 hover:text-white/75 transition-all`}
          >
            Log in
          </Link>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[0.06] px-6 md:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className={`${syne.className} font-extrabold text-sm flex items-center gap-2`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75]" />
          CoachSync
        </div>
        <p className={`${dmMono.className} text-[11px] text-white/20 text-center`}>
          Coach–athlete management · Multilingual · Built with Next.js + Prisma + DeepL
        </p>
        <div className="flex gap-6">
          <Link href="/login" className={`${dmMono.className} text-xs text-white/28 hover:text-white/55 transition-colors`}>Log in</Link>
          <Link href="/signup" className={`${dmMono.className} text-xs text-white/28 hover:text-white/55 transition-colors`}>Sign up</Link>
        </div>
      </footer>
    </div>
  );
}
