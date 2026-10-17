export type VisitorBreakdownItem = {
  key: string;
  label: string;
  count: number;
  pct: number;
};

type LanguageRow = {
  event_type: string;
  payload: Record<string, unknown> | null;
  session_id: string | null;
};

/** Each session counts once per language, even after repeated switches. */
export function summarizeLanguageAnalytics(rows: LanguageRow[]) {
  const keys = ["sv", "en", "unknown"] as const;
  const labels = { sv: "Svenska", en: "Engelska", unknown: "Okänt / före mätning" };
  const views = { sv: 0, en: 0, unknown: 0 };
  const sessions = { sv: new Set<string>(), en: new Set<string>(), unknown: new Set<string>() };
  const allSessions = new Set<string>();
  for (const row of rows) {
    if (row.event_type !== "page_view") continue;
    const lang = row.payload?.lang;
    const key = lang === "sv" || lang === "en" ? lang : "unknown";
    views[key]++;
    if (row.session_id) {
      sessions[key].add(row.session_id);
      allSessions.add(row.session_id);
    }
  }
  const totalViews = views.sv + views.en + views.unknown;
  return {
    pageViews: keys.map((key) => ({ key, label: labels[key], count: views[key], pct: totalViews ? views[key] / totalViews : 0 })),
    sessions: keys.map((key) => ({ key, label: labels[key], count: sessions[key].size, pct: allSessions.size ? sessions[key].size / allSessions.size : 0 })),
  };
}

export function detectBrowser(userAgent: string): string {
  if (/Edg\//i.test(userAgent)) return "Edge";
  if (/OPR\//i.test(userAgent)) return "Opera";
  if (/SamsungBrowser\//i.test(userAgent)) return "Samsung Internet";
  if (/CriOS\//i.test(userAgent)) return "Chrome";
  if (/FxiOS\//i.test(userAgent)) return "Firefox";
  if (/Chrome\//i.test(userAgent)) return "Chrome";
  if (/Firefox\//i.test(userAgent)) return "Firefox";
  if (/Safari\//i.test(userAgent) && /Version\//i.test(userAgent)) return "Safari";
  return "Okänd";
}

export function summarizePageViewField(
  rows: Array<{ event_type: string; payload: Record<string, unknown> | null }>,
  field: "browser",
): VisitorBreakdownItem[] {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    if (row.event_type !== "page_view") continue;
    const raw = row.payload?.[field];
    const key = String(raw ?? "Okänd").trim() || "Okänd";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  return Object.entries(counts)
    .map(([key, count]) => ({
      key,
      label: key,
      count,
      pct: total ? count / total : 0,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "sv"));
}