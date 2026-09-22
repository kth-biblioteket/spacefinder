# Varför "Arbetssätt: grupprum" visas som 0 träffar

## Vad statistiken faktiskt säger

När en sökning ger noll träffar loggas händelsen med bara en del av filtren: sökord, kategori (studieplats/service/skapande), arbetssätt och de vanliga filterkategorierna. **Gruppstorlek** och **"endast lediga just nu"** skickas inte med i loggen, trots att båda påverkar resultatlistan.

Resultatet: en sökning som egentligen var "Grupprum + endast lediga just nu" (eller "Grupprum + 5+ personer") syns i statistiken som enbart "Arbetssätt: grupprum". Därför ser det ut som att grupprumsfiltret ensamt ger noll träffar, vilket det inte gör.

## Två orsaker till raderna

1. **Dolda filter.** Är alla grupprum upptagna just då ger "endast lediga" noll träffar — helt korrekt för studenten, men missvisande i statistiken eftersom det filtret inte syns på raden.
2. **Tidsfönster vid laddning.** Bokningsläget för grupprummen hämtas separat från lokalerna. Väljer man "endast lediga" innan det svaret kommit räknas alla rum som upptagna en kort stund, listan blir tom och en tom sökning loggas — trots att rum blir synliga en sekund senare. Det gör siffran för hög.

## Åtgärder (endast frontend, inga databasändringar)

### 1. Logga hela filterkombinationen
I `src/routes/index.tsx` utökas `empty_results`-händelsen med `groupSize` och `freeOnly`, precis som `filter_change` redan gör.

### 2. Visa dem i statistiken
I `src/components/AnalyticsTab.tsx` läses de nya fälten in i raderna för tomma sökningar, så texten kan bli t.ex. "Arbetssätt: grupprum, Endast lediga nu" istället för enbart "Arbetssätt: grupprum". Etiketterna följer samma mönster som idag (`Gruppstorlek`, `Endast lediga nu`).

### 3. Sluta logga falska nollträffar
Tom sökning loggas inte medan bokningsläget fortfarande hämtas: när "endast lediga" är valt och tillgänglighetsdatan ännu inte finns hoppas loggningen över. När svaret kommit loggas händelsen om listan fortfarande är tom.

## Effekt

Nya nollträffsrader blir sanningsenliga: de visar hela filterkombinationen och räknar inte med de korta laddningsögonblicken. Gamla rader i statistiken (t.ex. de 14 på den publicerade sidan) kan inte efterhandsrättas — de saknar informationen — så räkna med att siffran sjunker efter ändringen.

## Filer som ändras
- `src/routes/index.tsx`
- `src/components/AnalyticsTab.tsx` (och motsvarande text i Excel-exporten, `src/lib/analyticsExport.ts`)
