import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UI_SETTINGS_QUERY_KEY, uiSettingsQueryOptions } from "@/lib/useUiText";

export const KIOSK_INTRO_LINKS_SETTING_KEY = "kiosk_show_intro_links";
/** How links in the intro/body text behave on kiosk computers. */
export type KioskIntroLinksMode = "show" | "plaintext" | "hidden";

/** Map a stored setting value to a mode; "false" and anything unknown mean plain text. */
export function introLinksModeFromValue(value: string | undefined): KioskIntroLinksMode {
  if (value === "true") return "show";
  if (value === "hidden") return "hidden";
  return "plaintext";
}
const SESSION_KEY = "spacefinder_kiosk";

/** Explicit URL settings override a remembered browser session. */
export function kioskModeFromParam(param: string | null): boolean | undefined {
  if (param === "1") return true;
  if (param === "0") return false;
  return undefined;
}

/** True when the page was opened with ?kiosk=1 (remembered for the browser session). */
export function isKioskMode(): boolean {
  if (typeof window === "undefined") return false;
  const explicit = kioskModeFromParam(new URL(window.location.href).searchParams.get("kiosk"));
  if (explicit === true) {
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* ignore */ }
    return true;
  }
  if (explicit === false) {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    return false;
  }
  try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch { return false; }
}

/** Hydration-safe kiosk flag (false during SSR and first render). */
export function useKiosk(): boolean {
  const [kiosk, setKiosk] = useState(false);
  useEffect(() => setKiosk(isKioskMode()), []);
  return kiosk;
}

export function useKioskIntroLinks() {
  return useQuery({
    ...uiSettingsQueryOptions,
    select: (s) => introLinksModeFromValue(s[KIOSK_INTRO_LINKS_SETTING_KEY]),
  });
}

export function useSaveKioskIntroLinks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mode: KioskIntroLinksMode) => {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: KIOSK_INTRO_LINKS_SETTING_KEY, value: mode });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: UI_SETTINGS_QUERY_KEY }),
  });
}

/** Turn <a> tags into plain <span> so links can't be followed. */
export function stripLinks(html: string): string {
  return html.replace(/<a\b[^>]*>/gi, "<span>").replace(/<\/a>/gi, "</span>");
}

/** Remove <a> elements entirely, including their text. */
export function removeLinks(html: string): string {
  return html
    .replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, "")
    .replace(/<a\b[^>]*\/>/gi, "")
    .trim();
}
