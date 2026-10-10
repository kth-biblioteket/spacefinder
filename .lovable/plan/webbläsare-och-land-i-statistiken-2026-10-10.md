# Webbläsare och land i statistiken

## Genomförande
- Lägg till webbläsarnamn och landskod i befintliga sidvisningshändelser. Ingen IP-adress, exakt position eller ny databasstruktur sparas.
- Identifiera webbläsaren lokalt och hämta endast besökarens landskod från webbplatsens servermiljö.
- Visa två nya utfällbara statistikdelar för **Webbläsare** och **Länder**, med antal sidvisningar och procentandel för vald period.
- Lägg till samma sammanställningar i Excel-exporten.
- Lägg till tester för webbläsaridentifiering och landskodshantering samt kontrollera desktop- och mobilläget.

## Begränsning
Statistiken kan bara samlas in från och med att ändringen aktiveras. Äldre sidvisningar kommer att visas som okänd webbläsare och okänt land.

## Tekniskt
- Återanvänd `analytics_events.payload` för fälten `browser` och `country`.
- En publik läsendpoint returnerar enbart en validerad ISO-landskod från värdplattformens landshuvud; inga personuppgifter eller adresser returneras eller lagras.
