# Space Finder

Detta är ett verktyg för att söka platser på biblioteket.

## Install på server

- Skapa lokal folder (`sudo mkdir spacefinder`)
- Skapa `docker-compose.yml` och uppdatera från repot
- Skapa `.env` med allt som behövs
- Skapa och kör `prepare.sh` (`sudo chmod +x prepare.sh`)
- Kopiera innehållet i repots `kong.yml` till `./volumes/api/kong.yml`
- Kopiera `schema.sql` från repot till servern (samma mapp som `docker-compose.yml`)
- Skapa eventuellt en post i DNS för domänen 
  - För KTH (`spacefinder.lib.kth.se`)
    - Via https://sysadm.lan.kth.se

## Skapa databas/tabeller

```bash
docker compose up -d
docker exec -i supabase-db psql -U postgres -d postgres < schema.sql
```

### Server-komponenter

`server-adapter.js` används för att köra appens server-komponenter i en node-container. Den fångar upp inloggning, validerar mot KTH LDAP, och skapar/uppdaterar Supabase-användaren automatiskt via admin-API:t — ingen manuell användarskapning behövs.

Build args för Vite/Supabase-URL:er sätts i `.github/workflows/deploy_ref.yml`/`deploy_main.yml` (behövs eftersom Vite bakar in dem i bygget).

## För KTH
### Appen utvecklas på två parallella sätt mot samma repo:
- **Lovable** — UI/funktionsutveckling i Lovable-editorn, synkas automatiskt till branchen `feature/lovable`.
- **Lokalt/Docker** — självhostad Supabase-stack i Docker (se nedan).

Se [Branch-roller](#branch-roller) för hur de två flödena möts.

### Branch-roller för KTH

- **`main`** — produktion (spacefinder.lib.kth.se). Tar bara emot merges från `ref`, aldrig direkta pushar eller direkta merges från `feature/lovable`/en feature-branch.
- **`ref`** — staging (spacefinder-ref.lib.kth.se). Gemensam landningsplats för både Lovable-synken och egna feature-branches (som PR:as hit).
- **`feature/lovable`** — Lovable pushar hit automatiskt vid varje ändring i Lovable-editorn.
- **`feature/*`** (egna) — eget arbete (grenas från `main`). Mergas till `main` **via `ref`** — testas på spacefinder-ref innan det går vidare, aldrig direkt till `main`.

En regel att komma ihåg: **inget når `main` utan att först ha legat på `ref` och synats på spacefinder-ref.**

Push till `ref`/`main` kör numera lint + typecheck + unit-tester (se `.github/workflows/deploy_ref.yml`/`deploy_main.yml`) innan Docker-imagen byggs och deployas — ett fail i något av de stegen blockerar deployen.

### Hämta nya ändringar från Lovable

Lovable pushar direkt till `feature/lovable` i det här repot (ingen separat remote).

- `git fetch origin`
- `git checkout ref`
- `git diff --stat ref origin/feature/lovable`
- `git merge origin/feature/lovable`
- Hantera eventuella konflikter
  - `git add` och `commit`
- Hantera eventuell ändring i `package.json`/lockfile
  - `nvm use 22`
  - `npm install` (ev. `npm install --legacy-peer-deps`)
  - `git add` och `commit`
- Hantera anpassningar för eventuella förändringar
  - t.ex. ny folder vid bygge
- Hantera eventuella databasuppdateringar
  - Ligger i filer i `supabase/migrations/`
  - Kör `./scripts/sync-migrations.sh` på ref-servern (via SSH) — applicerar nya migrationsfiler och regenererar `schema.sql` från den körande databasen automatiskt. Ersätter det gamla sättet (köra SQL manuellt och sedan handredigera `schema.sql`), som orsakat schema-drift tidigare.
- `git push origin ref`
- Kontrollera i ref att allt ser ok ut
- `git checkout main`
- `git merge ref`
- `git push origin main`
- Kör `./scripts/sync-migrations.sh` på main-servern också (idempotent tack vare `.migrations-applied` — kostar inget att köra om)

### Egna funktioner

Grenas från `main` som `feature/<namn>`. När klart: PR/merge in i `ref`, testa på spacefinder-ref, promota sedan till `main` på exakt samma sätt som Lovable-synken ovan (`git checkout main && git merge ref && git push origin main`) — aldrig direkt till `main`.

## Licens / License

Copyright (C) 2026 KTH Biblioteket

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or (at
your option) any later version.

This program is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
