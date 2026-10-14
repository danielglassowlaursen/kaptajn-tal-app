# STATUS — Kaptajn Tal (offentlig udgave)

_Updated: 2026-10-14 · laptop_

## Now
Fase 1 er færdig og testet lokalt: familier, togter som data, arkfotos i R2. Næste er fase 2: scanning med egen AI-nøgle.

## State
- ✅ Fase 0: licens, README, CONTRIBUTING med bidragsaftale, ROADMAP, prøvetogt.
- ✅ Fase 1: D1-skema med `familier`, `koder`, `progress`, `progress_history`, `togter` (gravsten ved sletning), `forbrug`. Alt hænger på familie_id.
- ✅ API under `/api/f/:kode/…` (progress, historik, gendan, togter, ark). Skrivning opretter familien, læsning gør ikke.
- ✅ Arkfotos i R2 under `familie/togt`, komprimeret til 1600 px JPEG i browseren, versioneret adresse mod cache.
- ✅ Klient: togter lokalt først (`src/lib/togtStore.ts`), synk pr. togt, nyeste vinder. "Dine togter"-kort: tilføj fra fil, arkfoto, eksportér, slet.
- ✅ Filformat + validering (`src/lib/togtFil.ts`, `docs/TOGT-FORMAT.md`) – samme format skal AI'en levere i fase 2.
- ✅ Krog til betalt plan: `worker/plan.ts` (`maaScanne`, `logForbrug`). Stærkere koder: tre ord + tal.
- ✅ Sikkerhedskopi-fil indeholder nu også egne togter (version 2).
- 🚧 Ikke deployet nogen steder. Kun testet lokalt med `wrangler dev`.

## Next
1. Fase 2: `/api/scan` med adaptere til Anthropic (standard), OpenAI og OpenRouter. Egen nøgle gemmes kun på enheden.
2. Gennemse-skærm: hver opgave ved siden af fotoet, ret facit/tekst/type, slet. Intet gemmes uden godkendelse.
3. Facit-tjek i koden (parse regnestykker) og hint-2-lækagetjek.
4. Evt. deploy af den offentlige udgave til egen Cloudflare-konto (worker `kaptajn-tal-app`, kræver D1 + R2).

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
```
