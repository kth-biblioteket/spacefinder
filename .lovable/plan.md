# Kioskläge för touchskärm i biblioteket

Tjänsten fungerar i stort redan på en touchskärm, men några saker behöver anpassas för att den ska kännas bra och inte samla in missvisande statistik.

## Vad som redan fungerar

- Touchytor, responsiv layout och live-status (beläggning, grupprum) som uppdateras varje minut.
- Öppettiderna styr live-visningen på timer, så en kiosk som står på dygnet runt följer schemat.

## Anpassningar som behövs

### 1. Automatisk återställning vid inaktivitet
En besökare lämnar ofta kiosken med filter och utfällda kort kvar. Nästa besökare ska möta en ren startsida.
- Efter t.ex. 60–90 sekunder utan beröring: nollställ filter, stäng utfällda kort och dialoger, scrolla till toppen.
- Tiden bör vara inställningsbar i admin (eller åtminstone enkel att ändra).

### 2. Kioskläge som inte smutsar ner statistiken
Idag räknas varje kiosk som en desktop-session som lever hela dagen, och kioskbesök blandas med vanliga besök.
- En URL-parameter (t.ex. `?kiosk=1`) som:
  - aktiverar återställningen ovan,
  - taggar statistikhändelser med "kiosk" som enhet, så ni kan se kiosktrafik separat i statistikfliken (och den inte förvrider mobil/desktop-fördelningen).

### 3. Touchanpassning i detaljerna
- Stäng av lightbox/bildförstoring (redan avstängd på mobil – samma bör gälla kiosk).
- Dölj delningsknappen i kioskläge (meningslös på en fast skärm, och "kopiera länk" fungerar dåligt utan tangentbord).
- Säkerställ att rullning och filterpanelen fungerar med pekning utan hover – det mesta gör det redan, men det bör testas på riktig hårdvara.

### 4. Driftsfrågor utanför appen (er IT/hårdvara)
Dessa kan vi inte lösa i koden men bör tänkas igenom:
- Webbläsaren bör köras i kiosk-/fullskärmsläge utan adressfält och navigeringsknappar (t.ex. Chrome `--kiosk`).
- Blockera navigering bort från tjänsten (vitlista domänen), så besökare inte kan surfa vidare.
- Skärmsläckare/strömsparläge och nattlig omstart av webbläsaren.
- Pinch-zoom bör stängas av i webbläsaren så layouten inte kan "fastna" inzoomad.

## Teknisk not

Berör främst `src/routes/index.tsx` (kioskparameter, inaktivitetstimer, återställning) och `src/lib/analytics.ts` (enhetstag "kiosk"). Inga databasändringar, inga nya routes. Delningsknappens döljande sker i `SpaceCard.tsx` via samma kioskflagga.

## Öppna frågor

- Ska kiosken visa tjänsten på svenska, engelska eller med språkvalet kvar?
- Hur lång inaktivitetstid känns rimlig – 60, 90 eller 120 sekunder?
