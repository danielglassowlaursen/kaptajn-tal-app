# STATUS — Kaptajn Tal (offentlig udgave)

_Updated: 2026-10-14 · laptop_

## Now
Fase 3 er færdig og deployet: tema-system med Pirater og Prinsesse Plus. Næste er fase 4 (tema 3 Kommandør Komma, onboarding, rate-limit, Deploy-knap). Stadig: Daniel tester en rigtig scanning og slår R2 til.

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
- ✅ Forbrug logges pr. scanning (`forbrug`-tabellen) med anslået pris for Claude-modeller.
- ✅ Deployet: https://kaptajn-tal-app.dl-a66.workers.dev (Daniels konto, `wrangler.local.jsonc` – ignoreret af git). R2 er IKKE slået til endnu → arkfotos svarer 501.
- 🚧 Ingen rigtig scanning kørt endnu (ingen nøgle på maskinen). Fejlveje er testet mod alle tre udbydere med ugyldig nøgle; gennemse/gem er testet med simuleret AI-svar.

## Next
1. Daniel: test en rigtig scanning med egen Claude-nøgle på et ark. Justér prompten efter resultatet.
2. Daniel: slå R2 til i Cloudflare-dashboardet → tilføj `r2_buckets` i `wrangler.local.jsonc` → `npx wrangler r2 bucket create kaptajn-tal-app-ark` → `pnpm deploy:mine`.
3. Fase 3: tema-system (pirat som tema 1, Prinsesse Plus som tema 2). Prompten tager allerede et tema-parameter.
4. Tjek Workers-plan: free-planens 10 ms CPU kan blive stram ved store fotos i scan-kaldet.

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
