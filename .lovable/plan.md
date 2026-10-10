# Bildengagemang i statistikfliken

## Mål
Visa hur besökare använder bildgallerierna på lokalkorten, vilka lokaler som får mest bildengagemang och vilka bildpositioner som visas. Kioskbesök redovisas separat från vanliga besök.

Statistiken börjar samlas in när funktionen tas i bruk. Tidigare bildbläddringar kan inte återskapas.

## Genomförande

1. **Registrera bildinteraktioner**
   - Registrera när någon byter bild i ett lokalkort, oavsett om det sker med svep, pilar eller tangentbord.
   - Registrera när den stora bildvisaren öppnas på desktop och när användaren byter bild där.
   - Spara lokalens id och namn samt bildens position i ordningen, men inte bildfilen eller alttexten.
   - Räkna inte den första automatiskt visade bilden som en bläddring.
   - Märk varje bildhändelse som kiosk eller vanlig webbvisning.

2. **Ny sektion i adminstatistiken**
   - Lägg till sammanfattningar för totalt antal bildbläddringar, unika sessioner som bläddrat och antal öppningar av den stora bildvisaren.
   - Visa en topplista över lokalkort med mest bildengagemang, med både antal händelser och unika sessioner för att en flitig användare inte ska väga oproportionerligt tungt.
   - Visa per lokal vilka bildpositioner som har visats mest, exempelvis ”Bild 2”, ”Bild 3”.
   - Dela upp resultatet i **Vanliga besök** och **Kiosk**, samt visa en totalsumma.
   - Låt sektionen följa samma valda datumintervall som resten av statistikfliken och ge den utfällbara hjälptexter.

3. **Excel-export**
   - Ta med bildengagemang per lokal, bildposition och besökstyp i statistikexporten.

4. **Kontroll**
   - Lägg till små tester som säkerställer att första bilden inte räknas som bläddring, att bildbyten får rätt position och att kiosk skiljs från vanliga besök.
   - Kontrollera bildbyte med svep, pilar och tangentbord samt statistikens desktop- och mobilvisning.

## Tekniskt
- Använd den befintliga tabellen `analytics_events` och dess flexibla `payload`; ingen ändring av databasens struktur behövs.
- Lägg till två händelsetyper: en för öppning av stor bildvisare och en för aktivt bildbyte.
- Händelserna innehåller `space_id`, lokalnamn, bildindex, visningsyta och kioskmarkering. Ingen personinformation eller bild-URL lagras.
