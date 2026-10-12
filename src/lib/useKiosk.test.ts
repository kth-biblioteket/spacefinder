import { afterEach, expect, test, vi } from "vitest";
import { isKioskMode, kioskModeFromParam } from "./useKiosk";

afterEach(() => vi.unstubAllGlobals());

test("kiosk=1 enables kiosk mode before browser storage is available", () => {
  expect(kioskModeFromParam("1")).toBe(true);
});

test("kiosk=0 explicitly disables kiosk mode", () => {
  expect(kioskModeFromParam("0")).toBe(false);
});

test("a missing URL flag defers to the remembered session", () => {
  expect(kioskModeFromParam(null)).toBeUndefined();
  const storage = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
  vi.stubGlobal("window", { location: { href: "https://example.test/?kiosk=1" } });
  expect(isKioskMode()).toBe(true);
  window.location.href = "https://example.test/?lang=en";
  expect(isKioskMode()).toBe(true);
  window.location.href = "https://example.test/?kiosk=0";
  expect(isKioskMode()).toBe(false);
  window.location.href = "https://example.test/";
  expect(isKioskMode()).toBe(false);
});