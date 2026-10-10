import { describe, expect, test } from "vitest";
import { resolveLandingLink, safeLandingLinkUrl } from "./landingLink";

const settings = {
  "ui_text:landing_link_label": "Feedback",
  "ui_text:landing_link_url": "https://www.kth.se/form/sv",
  "ui_text:en:landing_link_label": "Leave feedback",
  "ui_text:en:landing_link_url": "https://www.kth.se/form/en",
};

describe("landing link", () => {
  test("hides the entire link on kiosks in both languages", () => {
    expect(resolveLandingLink(settings, "sv", true)).toBeNull();
    expect(resolveLandingLink(settings, "en", true)).toBeNull();
  });
  test("uses each language's label and destination outside kiosk mode", () => {
    expect(resolveLandingLink(settings, "sv", false)).toEqual({ label: "Feedback", href: "https://www.kth.se/form/sv" });
    expect(resolveLandingLink(settings, "en", false)).toEqual({ label: "Leave feedback", href: "https://www.kth.se/form/en" });
  });
  test("uses the complete Swedish pair when English is incomplete", () => {
    expect(resolveLandingLink({ ...settings, "ui_text:en:landing_link_url": "" }, "en", false)).toEqual({ label: "Feedback", href: "https://www.kth.se/form/sv" });
  });
  test("omits empty or unsafe links", () => {
    expect(resolveLandingLink({}, "sv", false)).toBeNull();
    expect(safeLandingLinkUrl("javascript:alert(1)")).toBeNull();
    expect(safeLandingLinkUrl("data:text/html,test")).toBeNull();
  });
});