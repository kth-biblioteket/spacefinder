import type { FilterCategoryRow, FilterOption } from "@/lib/spaces";
import { pickLocalized, type Lang } from "@/i18n";

/**
 * Work-mode chip labels (enskilt / tillsammans / grupprum) come from the
 * DB-backed "arbetssatt" category so admin renames show up everywhere —
 * cards, chips and empty-state suggestions. i18n strings are only a fallback
 * while the options are loading or if the row is missing.
 */
export function makeWorkModeLabel(
  options: FilterOption[],
  categories: FilterCategoryRow[],
  lang: Lang,
  fallback: Record<string, string>,
) {
  const cat = categories.find((c) => c.special_kind === "arbetssatt");
  const byKey = new Map(
    options
      .filter((o) => (cat ? o.category === cat.key : o.category === "arbetssatt"))
      .filter((o) => o.value_key)
      .map((o) => [o.value_key as string, o]),
  );
  return (key: string): string => {
    const opt = byKey.get(key);
    if (opt) return pickLocalized(opt, "label", lang);
    return fallback[key] ?? key;
  };
}
