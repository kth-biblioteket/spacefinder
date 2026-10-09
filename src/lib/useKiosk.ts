import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UI_SETTINGS_QUERY_KEY, uiSettingsQueryOptions } from "@/lib/useUiText";

export const KIOSK_INTRO_LINKS_SETTING_KEY = "kiosk_show_intro_links";
const SESSION_KEY = "spacefinder_kiosk";

/** True when the page was opened with ?kiosk=1 (remembered for the browser session). */
export function isKioskMode(): boolean {
  if (typeof window === "undefined") return false;
  const param = new URL(window.location.href).searchParams.get("kiosk");
  if (param === "1") {
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* ignore */ }
    return true;
  }
  if (param === "0") {
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
    select: (s) => (s[KIOSK_INTRO_LINKS_SETTING_KEY] ?? "false") === "true",
  });
}

export function useSaveKioskIntroLinks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: KIOSK_INTRO_LINKS_SETTING_KEY, value: enabled ? "true" : "false" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: UI_SETTINGS_QUERY_KEY }),
  });
}

/** Turn <a> tags into plain <span> so links can't be followed. */
export function stripLinks(html: string): string {
  return html.replace(/<a\b[^>]*>/gi, "<span>").replace(/<\/a>/gi, "</span>");
}
