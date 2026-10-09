# Kioskläge för touchskärm i biblioteket

Kioskläget slås på med en särskild adress (t.ex. `spacefinder.lib.kth.se/?kiosk=1`) som kioskdatorn öppnar. Vanliga besökare på desktop och mobil använder samma adress utan tillägget och ser allt som idag. Det är så vi kan dölja saker bara på kiosken.

Kioskdatorn sköter själv återställningen när ingen använder den, så det bygger vi inte.

## 1. Kioskläge som inte påverkar statistiken
- Statistiken märks med enheten "kiosk", så kiosktrafiken syns för sig i statistikfliken och inte blandas ihop med mobil/desktop.
- Kioskläget följer med när man byter språk, så det inte stängs av av misstag.

## 2. Anpassningar för touch
- Ingen bildförstoring (lightbox) när man trycker på bilderna, som på mobil idag.
- Ingen delningsknapp på lokalkorten.
- Rullning och filterpanelen ska fungera bara med pekning. Testa det på den riktiga skärmen.

## 3. Förenklad sidhuvud utan väg ut
- Det blå bandet med KTH-loggan tas bort.
- Menyknappen uppe till höger tas bort, så att man inte kan surfa vidare.
- Språkvalet svenska/engelska finns kvar på vit bakgrund, med ikon och språktext i marinblått.

## 4. Länkar i ingresstexten
Länkar i ingressen under rubriken (och i brödtexten under) kan leda bort från tjänsten. I admin finns ett nytt val bland texterna: **"Visa länkar i ingressen i kioskläge"** (av som standard).
- Av: på kiosken visas länktexten som vanlig text, så den inte går att klicka. Meningen blir alltså kvar i sin helhet.
- På: länkarna fungerar som vanligt även på kiosken.
- Desktop och mobil påverkas inte. Där fungerar länkarna alltid som idag.

## 5. Inställningar i kioskdatorn (IT)
- Webbläsaren i fullskärm utan adressfält (t.ex. Chrome `--kiosk`) och med startadressen ovan.
- Bara spacefinder-domänen ska vara tillåten. Det skyddar också mot länkar i lokalkortens beskrivningar och knappar som "Boka".
- Pinch-zoom avstängd, inget strömsparläge, inaktivitetsåterställning i kioskprogramvaran.

## Teknisk not
- Kioskflaggan läses från URL:en (`kiosk=1`) i en delad hook. Den används i `SiteHeader`, `LandingText`, `SpaceCard` och `analytics.ts`. Ingen ny route och ingen ändring i databasstrukturen.
- Inställningen för länkar sparas som en ny rad i `app_settings` (`kiosk_show_intro_links`) och styrs från `TextsTab`.
- I `LandingText` görs `<a>` om till `<span>` efter sanering när kiosken är på och inställningen är av.

## Öppen fråga
- Ska länkar och boknings-/schemaknappar i själva lokalkorten också vara klickbara på kiosken, eller ska bara kioskdatorns domänspärr hantera dem?
