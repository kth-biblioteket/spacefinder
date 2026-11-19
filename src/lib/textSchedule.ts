import { TZDate } from "@date-fns/tz";

export type TextSchedule = {
  notice_from?: string;
  notice_to?: string;
  info_from?: string;
  info_to?: string;
};
export type SpaceTags = Record<string, string[] | TextSchedule>;

/** Wall-clock input is always interpreted in Stockholm, not the device timezone. */
export function stockholmTimestamp(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const date = new TZDate(year, month - 1, day, hour, minute, 0, 0, "Europe/Stockholm");
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day ||
      date.getHours() !== hour || date.getMinutes() !== minute) return null;
  return date.getTime();
}

export function readTextSchedule(tags: SpaceTags | null | undefined): TextSchedule {
  const schedule = tags?.schedule;
  if (!schedule || Array.isArray(schedule) || typeof schedule !== "object") return {};
  return Object.fromEntries(
    ["notice_from", "notice_to", "info_from", "info_to"].flatMap((key) => {
      const value = schedule[key as keyof TextSchedule];
      return typeof value === "string" && value ? [[key, value]] : [];
    }),
  );
}

export function textIsVisible(schedule: TextSchedule, kind: "notice" | "info", now: number): boolean {
  const from = schedule[`${kind}_from`];
  const to = schedule[`${kind}_to`];
  const start = from ? stockholmTimestamp(from) : null;
  const end = to ? stockholmTimestamp(to) : null;
  if ((from && start === null) || (to && end === null)) return false;
  return (start === null || now >= start) && (end === null || now < end);
}

export function validateTextSchedule(schedule: TextSchedule): string[] {
  const errors: string[] = [];
  for (const kind of ["notice", "info"] as const) {
    const label = kind === "notice" ? "Gul notis" : "Information (ofärgad)";
    const from = schedule[`${kind}_from`];
    const to = schedule[`${kind}_to`];
    const start = from ? stockholmTimestamp(from) : null;
    const end = to ? stockholmTimestamp(to) : null;
    if ((from && start === null) || (to && end === null)) errors.push(`${label}: ange ett giltigt datum och klockslag i svensk tid.`);
    else if (start !== null && end !== null && end <= start) errors.push(`${label}: sluttiden måste vara senare än starttiden.`);
  }
  return errors;
}