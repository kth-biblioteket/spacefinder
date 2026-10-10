import type { Lang } from "@/i18n";

export function safeLandingLinkUrl(value: string): string | null {
  const trimmed = value.trim();
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

export function resolveLandingLink(settings: Record<string, string>, lang: Lang, kiosk: boolean) {
  if (kiosk) return null;
  const read = (prefix: string) => {
    const label = (settings[`${prefix}landing_link_label`] ?? "").trim();
    const href = safeLandingLinkUrl(settings[`${prefix}landing_link_url`] ?? "");
    return label && href ? { label, href } : null;
  };
  return (lang === "en" ? read("ui_text:en:") : null) ?? read("ui_text:");
}