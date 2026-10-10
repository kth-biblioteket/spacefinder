import { describe, expect, test } from "vitest";
import { imagePosition, summarizeImageAnalytics } from "./imageAnalytics";

describe("image analytics", () => {
  test("converts a changed image index to its visible one-based position", () => {
    expect(imagePosition(0)).toBe(1);
    expect(imagePosition(2)).toBe(3);
  });

  test("does not count a viewer opening as an image change", () => {
    const summary = summarizeImageAnalytics([
      { event_type: "image_viewer_open", payload: { space_id: "a", name: "A" }, session_id: "s1" },
    ]);
    expect(summary.total).toEqual({ changes: 0, opens: 1, sessions: 1 });
  });

  test("keeps kiosk and regular image changes separate", () => {
    const summary = summarizeImageAnalytics([
      { event_type: "image_change", payload: { space_id: "a", image_position: 2, kiosk: false }, session_id: "web" },
      { event_type: "image_change", payload: { space_id: "a", image_position: 3, kiosk: true }, session_id: "kiosk" },
    ]);
    expect(summary.audiences.web.changes).toBe(1);
    expect(summary.audiences.kiosk.changes).toBe(1);
    expect(summary.spaces[0]?.positions).toEqual([{ position: 2, count: 1 }, { position: 3, count: 1 }]);
  });
});