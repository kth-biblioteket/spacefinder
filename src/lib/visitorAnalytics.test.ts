import { describe, expect, test } from "vitest";
import { detectBrowser, summarizePageViewField, summarizeLanguageAnalytics } from "./visitorAnalytics";

describe("visitor analytics", () => {
  test("shows Swedish and English page views and unique sessions in parallel", () => {
    const summary = summarizeLanguageAnalytics([
      { event_type: "page_view", payload: { lang: "sv" }, session_id: "one" },
      { event_type: "page_view", payload: { lang: "en" }, session_id: "one" },
      { event_type: "page_view", payload: { lang: "en" }, session_id: "one" },
      { event_type: "page_view", payload: { lang: "en" }, session_id: "two" },
      { event_type: "share_click", payload: { lang: "sv" }, session_id: "three" },
    ]);
    expect(summary.pageViews.map((item) => [item.key, item.count, item.pct])).toEqual([
      ["sv", 1, 0.25], ["en", 3, 0.75], ["unknown", 0, 0],
    ]);
    expect(summary.sessions.map((item) => [item.key, item.count, item.pct])).toEqual([
      ["sv", 1, 0.5], ["en", 2, 1], ["unknown", 0, 0],
    ]);
  });

  test("keeps unmeasured visits unknown instead of assuming Swedish", () => {
    const summary = summarizeLanguageAnalytics([
      { event_type: "page_view", payload: {}, session_id: "old" },
      { event_type: "page_view", payload: null, session_id: null },
      { event_type: "page_view", payload: { lang: "de" }, session_id: "invalid" },
    ]);
    expect(summary.pageViews.map((item) => item.count)).toEqual([0, 0, 3]);
    expect(summary.sessions.map((item) => item.count)).toEqual([0, 0, 2]);
    expect(summarizeLanguageAnalytics([]).pageViews.every((item) => item.pct === 0)).toBe(true);
  });
  test("identifies common browsers without confusing Edge with Chrome", () => {
    expect(detectBrowser("Mozilla/5.0 Chrome/120.0 Safari/537.36 Edg/120.0")).toBe("Edge");
    expect(detectBrowser("Mozilla/5.0 Version/17.0 Mobile Safari/604.1")).toBe("Safari");
  });

  test("counts page views and keeps older events as unknown", () => {
    const summary = summarizePageViewField([
      { event_type: "page_view", payload: { browser: "Chrome" } },
      { event_type: "page_view", payload: {} },
      { event_type: "card_expand", payload: { browser: "Safari" } },
    ], "browser");
    expect(summary.map(({ label, count }) => ({ label, count }))).toEqual([
      { label: "Chrome", count: 1 },
      { label: "Okänd", count: 1 },
    ]);
  });
});