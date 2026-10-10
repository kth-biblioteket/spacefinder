export type VisitorBreakdownItem = {
  key: string;
  label: string;
  count: number;
  pct: number;
};

const COUNTRY_NAMES = new Intl.DisplayNames(["sv"], { type: "region" });

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

export function normalizeCountryCode(value: unknown): string | null {
  const code = String(value ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) && code !== "XX" ? code : null;
}

export function countryLabel(code: string): string {
  const normalized = normalizeCountryCode(code);
  if (!normalized) return "Okänt land";
  try {
    return COUNTRY_NAMES.of(normalized) ?? normalized;
  } catch {
    return normalized;
  }
}

export function summarizePageViewField(
  rows: Array<{ event_type: string; payload: Record<string, unknown> | null }>,
  field: "browser" | "country",
): VisitorBreakdownItem[] {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    if (row.event_type !== "page_view") continue;
    const raw = row.payload?.[field];
    const key = field === "country"
      ? normalizeCountryCode(raw) ?? "unknown"
      : String(raw ?? "Okänd").trim() || "Okänd";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  return Object.entries(counts)
    .map(([key, count]) => ({
      key,
      label: field === "country" ? countryLabel(key) : key,
      count,
      pct: total ? count / total : 0,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "sv"));
}