# Byt "Solo" till "Individual" – och få ändringen att slå igenom överallt

## Vad som händer i dag

Jag kontrollerade den engelska vyn i förhandsvisningen:

- I filterpanelen står det **Solo** – den texten kommer från databasen och går att ändra i admin.
- På lokalkorten står det i stället **Alone** på samma filter – den texten är hårdkodad i språkfilerna och bryr sig inte om vad du skriver i admin.

Samma sak gäller texten som föreslår vilket filter du kan ta bort när ett sök ger noll träffar: även den använder den hårdkodade engelska texten.

Det är därför din ändring "inte slår igenom": den syns i filterpanelen men inte på korten, så det ser ut som om ingenting hände.

## Vad jag gör

1. Lokalkortens filtertexter (Ensam/Tillsammans/I grupprum) hämtas från samma admininställning som filterpanelen, i stället för de hårdkodade texterna.
2. Samma sak för förslagstexten vid tomt sökresultat.
3. De hårdkodade texterna blir kvar enbart som reserv, om admininställningen skulle saknas.
4. Därefter ändrar du själv "Solo" till "Individual" i admin (Filter → Hur vill du jobba? → engelsk etikett), så slår det igenom på hela sidan.

## Påverkas databasen?

Nej. Ingen tabell, kolumn eller regel ändras – inga databasmigreringar skapas. Att byta "Solo" mot "Individual" är bara ett ändrat textvärde på en befintlig rad, precis som när du redigerar en lokalbeskrivning. Uppdateringen från GitHub till spacefinder.lib.kth.se påverkas alltså inte.

En sak att veta: eftersom texten ligger i databasen och inte i koden, måste namnbytet göras i admin i den miljö som spacefinder.lib.kth.se använder – det följer inte automatiskt med en kodutrullning.

## Tekniska detaljer

- `src/components/SpaceCard.tsx` (ca rad 292–299): `intentChips` använder `t("filters.intent_*")`. Byt till uppslag i `filter_options` för kategorin med `special_kind === "arbetssatt"` via `value_key` och `pickLocalized(opt, "label", lang)`, med i18n som fallback.
- `src/lib/useNarrowestFilter.ts` (ca rad 73–86): samma uppslag för `workMode`-etiketten.
- Mönstret finns redan i `src/components/ActiveFilterChips.tsx` (rad 60–81) och återanvänds.
- Inga ändringar i `schema.sql`, inga migreringar, inga nya kolumner.
