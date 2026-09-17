# Varför statistiken står stilla på spacefinder.lib.kth.se

## Vad som händer

Statistiksidan hämtar alla händelser för vald period i ett enda anrop och ber om upp till 50 000 rader. Servern som kör på spacefinder.lib.kth.se är inställd på att aldrig lämna ut mer än 1 000 rader per anrop (`PGRST_DB_MAX_ROWS` i `docker-compose.yml`, standardvärde 1000). Överskjutande rader kastas tyst — inget felmeddelande syns.

Följden:

- Korta perioder (idag, 7 dagar) med färre än 1 000 händelser visas korrekt.
- "Sedan lansering" har passerat 1 000 händelser, så statistiken fryser: den visar alltid de 1 000 senaste händelserna. Nya besök kommer med, men lika många gamla faller bort, därför ser siffrorna nästan oförändrade ut från dag till dag.
- Samma tak påverkar allt som räknas i webbläsaren: unika sessioner, filterstatistik, tomma sökningar, trender, heatmap och Excel-exporten.

Din observation stämmer alltså: de 92 sidvisningarna finns i databasen, de kommer bara aldrig fram till statistikvyn för långa perioder.

Den här begränsningen finns inte i förhandsversionen i Lovable (där ligger bara 110 händelser totalt), vilket är varför det ser rätt ut här men inte i drift.

## Åtgärd

Hämta händelserna sidvis i stället för i ett enda anrop, så att taket inte spelar någon roll.

- Hämta i block om 1 000 rader med ett stigande intervall tills ett block returnerar färre rader än blockstorleken.
- Gör detta för både nuvarande och föregående period (jämförelsesiffrorna har samma problem).
- Behåll ett tak på totalt 50 000 rader per period som skydd, och visa en diskret notis i vyn om taket nås.
- Inga databas- eller serverändringar behövs, så uppdateringen från GitHub till spacefinder.lib.kth.se påverkas inte.

## Tekniskt

Fil: `src/components/AnalyticsTab.tsx` (`useQuery` runt rad 178).

- Ny hjälpfunktion `fetchAllEvents(fromIso, toIso)` som loopar med `.range(offset, offset + 999)` och `.order("created_at", { ascending: false })` tills färre än 1 000 rader kommer tillbaka eller 50 000 nås.
- Ersätt de två direkta `supabase.from("analytics_events")...limit(50000)`-anropen med anrop till hjälpfunktionen; övrig beräkningslogik och export är oförändrad.
- `refetchInterval: 30_000` behålls.

## Verifiering

Efter driftsättning: välj "Sedan lansering" och kontrollera att sidvisningarna ökar dag för dag och stämmer med antalet rader i databasen.
