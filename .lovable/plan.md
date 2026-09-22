# Justering av filteretiketter i admin-statistik

## Bakgrund
I Analytics-tabben visas tomma sökningar med etiketter som **"läge: grupprum"**. Detta kommer från en hårdkodad mappning i `AnalyticsTab.tsx` där `workMode` alltid skrivs ut som "Läge". I själva studentvyn hämtas dock kategorititeln från `filter_categories`-tabellen (t.ex. "Arbetssätt"), vilket skapar en mismatch och gör statistiken svår att tolka för administratörer.

## Mål
Låt statistikfliken använda samma kategorietiketter som filterpanelen, med tillförlitliga fallback-texter om databasraden saknas.

## Förändringar

### 1. Använd databasens kategorititlar i AnalyticsTab
I `src/components/AnalyticsTab.tsx` uppdateras funktionen `categoryLabelFor`:
- För `workMode`: leta upp kategorin med `special_kind === "arbetssatt"` och använd dess `title`. Fallback: "Arbetssätt".
- För `spaceKind`: leta upp kategorin med `special_kind === "space_kind"` och använd dess `title`. Fallback: "Kategori".
- Behåll nuvarande fallbacks för `groupSize` och `freeOnly`.
- Övriga kategorier hämtas som tidigare från `categories`-arrayen.

### 2. Ingen databasförändring
Endast frontend-koden ändras. Inga migrationer eller nya tabeller krävs.

## Fil att ändra
- `src/components/AnalyticsTab.tsx`

## Förväntat resultat
Tidigare rad "läge: grupprum" kommer istället visas som "Arbetssätt: grupprum" (eller den titel ni har angett i admin), vilket gör statistiken begriplig direkt.
