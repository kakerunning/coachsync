/**
 * Thin client for the Python viz microservice.
 * Called only from Next.js API routes (server-side).
 */

/** True only when the Python viz service URL is explicitly configured. */
export const VIZ_AVAILABLE = !!process.env.VIZ_SERVICE_URL;

const VIZ_URL = process.env.VIZ_SERVICE_URL ?? "http://localhost:8000";
const VIZ_KEY = process.env.VIZ_INTERNAL_KEY ?? "changeme";

async function vizPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${VIZ_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Key": VIZ_KEY,
    },
    body: JSON.stringify(body),
    // No caching — charts are always fresh
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Viz service error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

async function vizPostBinary(path: string, body: unknown): Promise<ArrayBuffer> {
  const res = await fetch(`${VIZ_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Key": VIZ_KEY,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Viz service error ${res.status}: ${text}`);
  }

  return res.arrayBuffer();
}

// ── Chart helpers ─────────────────────────────────────────────────────────────

export function getVolumeTrendChart(body: unknown) {
  return vizPost<object>("/charts/volume-trend", body);
}

export function getPerformanceTrendChart(body: unknown) {
  return vizPost<object>("/charts/performance-trend", body);
}

export function getFatigueTimelineChart(body: unknown) {
  return vizPost<object>("/charts/fatigue-timeline", body);
}

export function getVolumeHeatmapChart(body: unknown) {
  return vizPost<object>("/charts/volume-heatmap", body);
}

// ── Report helper ─────────────────────────────────────────────────────────────

export function getWeeklyReport(body: unknown) {
  return vizPostBinary("/reports/weekly", body);
}
