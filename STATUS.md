# STATUS — Kaptajn Tal (offentlig udgave)

_Updated: 2026-10-14 · laptop_

## Now
Korrekte facit er bygget: testsuite i CI (vitest + fast-check), uafhængig kontrol af facit (`src/lib/kontrol.ts`) med mærker og blokering i gennemse, melding fra barnet og ret-skærm for gemte togter. Åbent: rigtig scanning med Daniels nøgle, R2, og evt. lag 3 (blind anden AI-vurdering) og lag 5 (mål scanning mod Isaks 80 opgaver).

## State
- ✅ Fase 0: licens, README, CONTRIBUTING med bidragsaftale, ROADMAP, prøvetogt.
- ✅ Fase 1: D1-skema med `familier`, `koder`, `progress`, `progress_history`, `togter` (gravsten ved sletning), `forbrug`. Alt hænger på familie_id.
- ✅ API under `/api/f/:kode/…` (progress, historik, gendan, togter, ark). Skrivning opretter familien, læsning gør ikke.
- ✅ Arkfotos i R2 under `familie/togt`, komprimeret til 1600 px JPEG i browseren, versioneret adresse mod cache.
- ✅ Klient: togter lokalt først (`src/lib/togtStore.ts`), synk pr. togt, nyeste vinder. "Dine togter"-kort: tilføj fra fil, arkfoto, eksportér, slet.
- ✅ Filformat + validering (`src/lib/togtFil.ts`, `docs/TOGT-FORMAT.md`) – samme format skal AI'en levere i fase 2.
- ✅ Krog til betalt plan: `worker/plan.ts` (`maaScanne`, `logForbrug`). Stærkere koder: tre ord + tal.
- ✅ Sikkerhedskopi-fil indeholder nu også egne togter (version 2).
- ✅ Fase 2: `POST /api/f/:kode/scan` (worker/scan/: skema, prompt, adaptere, konverter). Fladt skema med kun én union-type (Anthropic-grænse: 16 unions, 24 valgfrie). Claude via SDK med streaming, effort medium, struktureret output og `fallbacks: "default"`. OpenAI/OpenRouter via chat completions + json_schema.
- ✅ Klient: AI-indstillinger på enheden (`src/lib/ai.ts`), Scan-skærm (fotos komprimeres til 1600 px JPEG), Gennemse-editor med facit-tjek (`src/lib/facitTjek.ts`: regner udtryk, x-ligninger, sammenlign, sortering, hint-2-læk).
- ✅ Fase 3: `src/tema/` (typer, pirat, prinsesse, kontekst `useTema`). Tema gemmes i `Progress.tema` og synker. CSS-palet + skrift via `data-tema` på <html>. Spillogik (`spil.ts`) tager tema som parameter. Besætningens navne vises efter plads, så et temaskift giver temaets navne. Prøvetogt i begge temaer med samme opgave-id'er. AI-prompten kender begge temaer. Guide: `docs/TEMAER.md`.
- ✅ Fase 4: tema `rum` (Bip, Zorg, stjernestøv tegnet som stjerne, Audiowide-skrift). Velkomstguide (`Velkommen.tsx`) første gang på tom enhed uden kode: tema → navn → familiekode → klar. Rate-limit via Cloudflare-binding (API 300/min/IP, ukendte koder 20/min/IP, scan 5/min pr. familie og IP) – valgfri, fejler åbent. Dagligt loft 40 scanninger/familie i `maaScanne`. Skema oprettes af Worker'en ved første kald (`schema.sql` importeret som tekst). Offentlig `wrangler.jsonc` uden database-id → automatisk oprettelse; Deploy-knap i README (ikke testet med en fremmed konto).
- ✅ Udskoling: `src/lib/matematik.ts` (egen parser uden eval: potenser, √, π, brøker, skjult gange; ensUdtryk, loeserLigning, laesBroek) – 28 tests. Typer `flere`, `broek`, `udtryk` + `tal.decimaler` + visual `graf`. `Mat.tsx` viser x², √ og brøkstreg uden bibliotek. Facit-tjek bruger motoren (tjekker begge rødder i andengradsligninger). `Progress.klasse` styrer tonen i prompten. Temaer `detektiv`, `sport`, `flyt` med prøvetogt for udskolingen (6 opgaver med alle nye typer). Skemaet har stadig kun én union-type.
- ✅ Korrekte facit: `kontrol.ts` regner facit uafhængigt (udregning > regnestykke; ligninger med rodsøgning i [-200;200], enheder, tid, pladsværdi, talrækker, sortering, lige/ulige/hele/primtal, brøk i felter-tekst). Status bekraeftet/uenig/ukendt; uenig blokerer gem, til en voksen vælger. AI-skemaet har feltet `udregning`. På Isaks 80 rigtige opgaver: 74 bekræftet, 0 uenige, 6 ukendte (figuraflæsning). Barnet kan melde forkert facit (`rapporterFacit` giver tyvens bytte tilbage); voksen retter via "Ret" (Gennemse genbrugt), ændrede/meldte opgaver åbnes igen (`aabnOpgaver`). Tests: 94 (`pnpm test`), kører i GitHub Actions og i `pnpm build`.
- ✅ Glemt kode: gendannelseskode (16 tegn uden O/0/I/1) pr. familie; kun SHA-256 gemmes i tabellen `gendannelse`. `POST /api/f/:kode/gendannelse` (409 hvis den findes; `{ny:true}` erstatter), `POST /api/gendan` (i GAET_LIMIT). "Gem jeres koder" (`GemKoder.tsx`: download kodekort-PNG, del, kopiér, flueben) vises ved ny kode i velkomstguiden og familiekode-kortet. "Glemt familiekoden?" begge steder.
- ✅ Forbrug logges pr. scanning (`forbrug`-tabellen) med anslået pris for Claude-modeller.
- ✅ Deployet: https://kaptajn-tal-app.dl-a66.workers.dev (Daniels konto, `wrangler.local.jsonc` – ignoreret af git). R2 er IKKE slået til endnu → arkfotos svarer 501.
- 🚧 Ingen rigtig scanning kørt endnu (ingen nøgle på maskinen). Fejlveje er testet mod alle tre udbydere med ugyldig nøgle; gennemse/gem er testet med simuleret AI-svar.

## Next
1. Daniel: test en rigtig scanning med egen Claude-nøgle (gerne i alle tre temaer). Justér prompten efter resultatet.
2. Daniel: slå R2 til → tilføj `r2_buckets` i `wrangler.local.jsonc` → `npx wrangler r2 bucket create kaptajn-tal-app-ark` → `pnpm deploy:mine`.
3. Tjek Deploy to Cloudflare-knappen med en testkonto.
4. Flyt Isaks togter og fremgang fra den private udgave, når han er klar (afsnit 7 i den private plan).
5. Senere: betalt plan (fase 5), lyde pr. tema, engelsk oversættelse.

## Watch out
- Den fulde plan med private detaljer ligger kun i det private repo. Læg den aldrig her.
- Lydene fra Elevenlabs er udeladt, indtil licensen er tjekket.
- Læg aldrig fotos af trykte regneark i repoet.
- Arkfotos ligger bag familiekoden, ikke bag login. Koden er nøglen.

## Run & test
```bash
pnpm install
pnpm db:init:local      # én gang
pnpm dev:api            # API + D1 + R2 lokalt på 8787
pnpm dev                # http://localhost:5180 (sender /api videre til 8787)
pnpm build
pnpm deploy:mine         # Daniels deploy (bruger wrangler.local.jsonc)
```
