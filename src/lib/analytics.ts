import { isKioskMode } from "@/lib/useKiosk";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { detectBrowser } from "@/lib/visitorAnalytics";
import i18n from "@/i18n";
import { useTranslation } from "react-i18next";

const SESSION_KEY = "hsp_session_id";

function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ??
        Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export type AnalyticsEvent =
  | "page_view"
  | "filter_change"
  | "card_click"
  | "card_expand"
  | "booking_link_click"
  | "map_link_click"
  | "empty_results"
  | "space_link_click"
  | "share_click"
  | "share_open"
  | "image_change"
  | "image_viewer_open";

function detectDevice(): "mobile" | "tablet" | "desktop" | "kiosk" {
  if (typeof window === "undefined") return "desktop";
  if (isKioskMode()) return "kiosk";
  const ua = navigator.userAgent || "";
  const w = window.innerWidth;
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (w >= 768 && w < 1024 && /Mobi|Android/i.test(ua))) return "tablet";
  if (/Mobi|Android|iPhone|iPod/i.test(ua) || w < 768) return "mobile";
  return "desktop";
}

function getContextPayload(event: AnalyticsEvent): Record<string, unknown> {
  if (event !== "page_view" || typeof window === "undefined") return {};
  const out: Record<string, unknown> = {
    device: detectDevice(),
    browser: detectBrowser(navigator.userAgent || ""),
    lang: i18n.resolvedLanguage === "en" ? "en" : "sv",
  };
  try {
    const ref = document.referrer;
    if (ref) {
      const refUrl = new URL(ref);
      if (refUrl.host && refUrl.host !== window.location.host) {
        out.referrer = refUrl.host;
      }
    }
    const params = new URLSearchParams(window.location.search);
    for (const k of ["utm_source", "utm_medium", "utm_campaign"]) {
      const v = params.get(k);
      if (v) out[k] = v;
    }
  } catch {
    // ignore
  }
  return out;
}

export function track(
  event: AnalyticsEvent,
  payload: Record<string, unknown> = {},
): void {
  if (typeof window === "undefined") return;
  const session_id = getSessionId();
  const path = window.location.pathname;
  const send = async () => {
    const context = getContextPayload(event);
    const merged = { ...context, ...payload };
    const { error } = await supabase
      .from("analytics_events")
      .insert({ event_type: event, payload: merged as never, session_id, path });
    if (error) console.debug("[analytics] insert failed", error.message);
  };
  // Fire and forget - never block UI or surface errors
  void send();
}

/** Track the displayed language on mount and after a language switch. */
export function usePageView(name: string): void {
  const { i18n: currentI18n } = useTranslation();
  const lang = currentI18n.resolvedLanguage === "en" ? "en" : "sv";
  const lastRef = useRef<string | null>(null);
  useEffect(() => {
    const key = `${name}:${lang}`;
    if (lastRef.current === key) return;
    lastRef.current = key;
    track("page_view", { name, lang });
  }, [name, lang]);
}

/** Debounced tracker — useful for filter changes that fire on every keystroke. */
export function useDebouncedTrack<T>(
  event: AnalyticsEvent,
  value: T,
  toPayload: (v: T) => Record<string, unknown>,
  delayMs = 800,
): void {
  const firstRef = useRef(true);
  useEffect(() => {
    if (firstRef.current) {
      firstRef.current = false;
      return;
    }
    const id = window.setTimeout(() => {
      track(event, toPayload(value));
    }, delayMs);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value)]);
}
