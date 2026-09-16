# Byt lösenord för admin-kontot

## Mål
Sätt ett nytt, enklare lösenord för admin-kontot (tjugotresaker@gmail.com) så du kan logga in på admin.

## Åtgärd
- Uppdatera lösenordet för admin-användaren direkt i databasen (krypterat, på samma sätt som systemet lagrar lösenord normalt).
- Inga kodändringar behövs.

## Efteråt
- Du loggar in med e-postadressen tjugotresaker@gmail.com och det nya lösenordet du angett.
- Lösenordet upprepas inte i chatten.

## Teknisk detalj
- Uppdatering sker i `auth.users` (kolumn `encrypted_password`, hashad med bcrypt) för användaren med e-post tjugotresaker@gmail.com, via databas-verktyget.
