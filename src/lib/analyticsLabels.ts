import type { FilterCategoryRow, FilterOption } from "./spaces";

const CATEGORY_FALLBACKS: Record<string, string> = {
  spaceKind: "Kategori",
  workMode: "Arbetssätt",
  groupSize: "Grupprumsstorlek",
  freeOnly: "Endast lediga",
  intent: "Arbetssätt",
  noise: "Ljudnivå",
  equipment: "Utrustning",
  facility: "Faciliteter",
  lokaltyp: "Lokaltyp",
  miljo_och_intryck: "Miljö och intryck",
};

const SPACE_KIND_FALLBACKS: Record<string, string> = {
  study: "Studieplats",
  creative: "Skapande och paus",
  service: "Service och faciliteter",
};

function humanize(value: string): string {
  const text = value.replace(/_/g, " ").trim();
  return text ? text.charAt(0).toLocaleUpperCase("sv-SE") + text.slice(1) : value;
}

function categoryForSpecialKind(
  specialKind: "space_kind" | "arbetssatt",
  categories: FilterCategoryRow[],
): FilterCategoryRow | undefined {
  return categories.find((category) => category.special_kind === specialKind);
}

export function analyticsCategoryLabel(
  key: string,
  categories: FilterCategoryRow[],
): string {
  if (key === "spaceKind") {
    return categoryForSpecialKind("space_kind", categories)?.title ?? CATEGORY_FALLBACKS.spaceKind;
  }
  if (key === "workMode") {
    return categoryForSpecialKind("arbetssatt", categories)?.title ?? CATEGORY_FALLBACKS.workMode;
  }
  return categories.find((category) => category.key === key)?.title
    ?? CATEGORY_FALLBACKS[key]
    ?? humanize(key);
}

export function analyticsValueLabel(
  categoryKey: string,
  value: string,
  categories: FilterCategoryRow[],
  filterOptions: FilterOption[],
): string {
  if (categoryKey === "freeOnly") return "Endast lediga grupprum";
  const optionCategory = categoryKey === "spaceKind"
    ? categoryForSpecialKind("space_kind", categories)?.key
    : categoryKey === "workMode"
      ? categoryForSpecialKind("arbetssatt", categories)?.key
      : categoryKey;
  const option = filterOptions.find((item) =>
    item.category === optionCategory
    && (item.value_key === value || item.label === value || item.label_en === value)
  );
  if (option?.label) return option.label;
  if (categoryKey === "spaceKind") return SPACE_KIND_FALLBACKS[value] ?? humanize(value);
  return humanize(value);
}