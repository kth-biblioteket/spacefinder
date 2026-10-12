import { describe, expect, test } from "vitest";
import { detectBrowser, summarizePageViewField } from "./visitorAnalytics";

describe("visitor analytics", () => {
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