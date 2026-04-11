"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { BarChart2, TrendingUp, Activity, Grid3x3, FileDown, Loader2, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

// Lazy-load Plotly to avoid SSR issues with the canvas/WebGL renderer
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// ── Types ─────────────────────────────────────────────────────────────────────

type ChartType = "volume-trend" | "performance-trend" | "fatigue-timeline" | "volume-heatmap";

interface AnalyticsViewProps {
  role: string;
  userId: string;
  athleteId?: string;
  athleteName?: string;
}

interface Tab {
  id: ChartType;
  label: string;
  icon: React.ElementType;
}

const TABS: Tab[] = [
  { id: "volume-trend", label: "Volume Trend", icon: BarChart2 },
  { id: "performance-trend", label: "Performance", icon: TrendingUp },
  { id: "fatigue-timeline", label: "Fatigue", icon: Activity },
  { id: "volume-heatmap", label: "Heatmap", icon: Grid3x3 },
];

// ── Mock data ─────────────────────────────────────────────────────────────────

const TEAL = "#1D9E75";
const ORANGE = "#F97316";

function getMockFigure(
  type: ChartType,
  opts: { distance: string; weeks: number; year: number }
): object {
  switch (type) {
    case "volume-trend": {
      const labels = Array.from({ length: opts.weeks }, (_, i) => `W${i + 1}`);
      const values = [
        4200, 3800, 5100, 4600, 3200, 5400, 4900, 5200, 4100, 3700, 5800, 4400,
        4800, 3600, 5000, 4300, 3900, 5600, 4700, 5100, 3800, 4200, 5300, 4900,
        4100, 3600, 5500, 4800, 5000, 4200, 3900, 5700, 4600, 5200, 4400, 3800,
        5100, 4700, 4300, 5400, 4900, 5100, 4200, 3800, 5800, 4600, 4900, 4200,
        5100, 4600, 3800, 5400,
      ].slice(0, opts.weeks);
      return {
        data: [{ type: "bar", x: labels, y: values, marker: { color: TEAL }, name: "Volume (m)" }],
        layout: {
          title: `Weekly Training Volume — Sample Data`,
          xaxis: { title: "Week", tickfont: { size: 11 } },
          yaxis: { title: "Volume (m)", tickfont: { size: 11 } },
          plot_bgcolor: "#fff",
          paper_bgcolor: "#fff",
        },
      };
    }

    case "performance-trend": {
      const dates = [
        "2026-01-10","2026-01-17","2026-01-24","2026-01-31",
        "2026-02-07","2026-02-14","2026-02-21","2026-02-28",
        "2026-03-07","2026-03-14","2026-03-21","2026-03-28",
      ];
      const times = [62.1, 61.8, 61.5, 61.9, 61.2, 61.0, 60.8, 60.5, 60.9, 60.3, 60.1, 59.8];
      return {
        data: [{
          type: "scatter",
          mode: "lines+markers",
          x: dates,
          y: times,
          name: opts.distance,
          line: { color: TEAL, width: 2 },
          marker: { color: TEAL, size: 7 },
        }],
        layout: {
          title: `Performance Trend (${opts.distance}) — Sample Data`,
          xaxis: { title: "Date", tickfont: { size: 11 } },
          yaxis: { title: "Time (s)", autorange: "reversed", tickfont: { size: 11 } },
          plot_bgcolor: "#fff",
          paper_bgcolor: "#fff",
        },
      };
    }

    case "fatigue-timeline": {
      const dates = [
        "2026-01-10","2026-01-17","2026-01-24","2026-01-31",
        "2026-02-07","2026-02-14","2026-02-21","2026-02-28",
        "2026-03-07","2026-03-14","2026-03-21","2026-03-28",
      ];
      const rpe     = [6, 7, 8, 6, 5, 7, 8, 7, 6, 8, 7, 6];
      const fatigue = [5, 6, 7, 5, 4, 6, 7, 6, 5, 7, 6, 5];
      return {
        data: [
          {
            type: "scatter", mode: "lines+markers",
            x: dates, y: rpe, name: "RPE",
            line: { color: TEAL, width: 2 }, marker: { color: TEAL, size: 7 },
          },
          {
            type: "scatter", mode: "lines+markers",
            x: dates, y: fatigue, name: "Fatigue",
            line: { color: ORANGE, width: 2, dash: "dot" }, marker: { color: ORANGE, size: 7 },
          },
        ],
        layout: {
          title: "Fatigue & RPE Timeline — Sample Data",
          xaxis: { title: "Date", tickfont: { size: 11 } },
          yaxis: { title: "Score (1–10)", range: [0, 10], tickfont: { size: 11 } },
          plot_bgcolor: "#fff",
          paper_bgcolor: "#fff",
          legend: { orientation: "h", y: -0.2 },
        },
      };
    }

    case "volume-heatmap": {
      // Simplified: weekly volume bars grouped by month for the selected year
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const values = [18200, 21400, 24600, 22100, 26800, 28400, 25600, 27900, 23400, 20100, 17800, 15200];
      return {
        data: [{
          type: "bar",
          x: months,
          y: values,
          marker: {
            color: values.map((v) => {
              const norm = (v - 15000) / 15000;
              const g = Math.round(158 * norm + 100);
              return `rgb(29,${g},117)`;
            }),
          },
          name: `Monthly Volume ${opts.year}`,
        }],
        layout: {
          title: `Training Volume by Month (${opts.year}) — Sample Data`,
          xaxis: { title: "Month", tickfont: { size: 11 } },
          yaxis: { title: "Volume (m)", tickfont: { size: 11 } },
          plot_bgcolor: "#fff",
          paper_bgcolor: "#fff",
        },
      };
    }
  }
}

// ── Chart fetch ───────────────────────────────────────────────────────────────

async function fetchChart(
  type: ChartType,
  extra: Record<string, unknown> = {}
): Promise<{ figure: object | null; unavailable: boolean }> {
  const res = await fetch("/api/viz/charts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, ...extra }),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({})) as { unavailable?: boolean; error?: string };
    if (json.unavailable) return { figure: null, unavailable: true };
    throw new Error(json.error ?? `Chart error ${res.status}`);
  }

  return { figure: await res.json(), unavailable: false };
}

// ── Controls ──────────────────────────────────────────────────────────────────

const DISTANCES = ["100m", "200m", "400m", "800m", "1500m", "3000m", "5000m", "10000m"];

// ── AnalyticsView ─────────────────────────────────────────────────────────────

export function AnalyticsView({ role, athleteId, athleteName }: AnalyticsViewProps) {
  const [activeTab, setActiveTab] = useState<ChartType>("volume-trend");
  const [figure, setFigure] = useState<object | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const [distance, setDistance] = useState("400m");
  const [weeks, setWeeks] = useState(12);
  const [year, setYear] = useState(new Date().getFullYear());

  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const loadChart = useCallback(async () => {
    setLoading(true);
    setError(null);
    setFigure(null);
    try {
      const extra: Record<string, unknown> = {};
      if (athleteId) extra.athleteId = athleteId;
      if (activeTab === "performance-trend") extra.distance = distance;
      if (activeTab === "volume-trend") extra.weeks = weeks;
      if (activeTab === "volume-heatmap") extra.year = year;

      const { figure: fig, unavailable: isUnavailable } = await fetchChart(activeTab, extra);

      if (isUnavailable) {
        setUnavailable(true);
        setFigure(getMockFigure(activeTab, { distance, weeks, year }));
      } else {
        setUnavailable(false);
        setFigure(fig);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chart");
    } finally {
      setLoading(false);
    }
  }, [activeTab, athleteId, distance, weeks, year]);

  useEffect(() => {
    loadChart();
  }, [loadChart]);

  async function downloadReport() {
    setReportLoading(true);
    setReportError(null);
    try {
      const body: Record<string, unknown> = { type: "weekly" };
      if (athleteId) body.athleteId = athleteId;

      const res = await fetch("/api/viz/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(json.error ?? `Report error ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const today = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `weekly-report-${today}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setReportLoading(false);
    }
  }

  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          {athleteName && (
            <p className="text-sm text-gray-500 mt-0.5">{athleteName}</p>
          )}
        </div>
        {role === "COACH" && (
          <button
            onClick={downloadReport}
            disabled={reportLoading || unavailable}
            title={unavailable ? "PDF reports require the analytics service" : undefined}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {reportLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Weekly PDF
          </button>
        )}
      </div>

      {/* Unavailability banner */}
      {unavailable && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <span className="font-medium">Analytics charts available in development mode.</span>
            {" "}The Python viz service is not running in this environment. Sample data is shown below.
            To enable live charts, start the viz service and set{" "}
            <code className="rounded bg-amber-100 px-1 font-mono text-xs">VIZ_SERVICE_URL</code> in your environment.
          </div>
        </div>
      )}

      {reportError && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{reportError}</p>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              activeTab === id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        {activeTab === "performance-trend" && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Distance</label>
            <select
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {DISTANCES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}
        {activeTab === "volume-trend" && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Weeks</label>
            <select
              value={weeks}
              onChange={(e) => setWeeks(Number(e.target.value))}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {[4, 8, 12, 16, 24, 52].map((w) => (
                <option key={w} value={w}>{w} weeks</option>
              ))}
            </select>
          </div>
        )}
        {activeTab === "volume-heatmap" && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {[currentYear - 1, currentYear].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Chart area */}
      <div className="min-h-[420px] rounded-xl border border-gray-200 bg-white p-4">
        {loading && (
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
          </div>
        )}
        {error && !loading && (
          <div className="flex h-96 flex-col items-center justify-center gap-3 text-gray-500">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={loadChart}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Retry
            </button>
          </div>
        )}
        {figure && !loading && !error && (
          <Plot
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data={(figure as any).data}
            layout={{
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(figure as any).layout,
              autosize: true,
              margin: { l: 48, r: 24, t: 40, b: 48 },
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: "100%", height: "400px" }}
          />
        )}
      </div>
    </div>
  );
}
