# STATUS — Kaptajn Tal (offentlig udgave)

_Updated: 2026-10-16 · laptop_

## Now
Alle planlagte faser for den gratis udgave er bygget og deployet. Næste skridt kræver Daniel: en rigtig scanning med egen Claude-nøgle og R2 slået til.

## State
- ✅ Live: https://kaptajn-tal-app.dl-a66.workers.dev (Daniels Cloudflare-konto, `wrangler.local.jsonc` – ignoreret af git). Repo: github.com/danielglassowlaursen/kaptajn-tal-app (public, PolyForm Noncommercial).
- ✅ Familier/koder/progress/historik/togter/forbrug/gendannelse i D1; skema oprettes af Worker'en selv. Arkfotos i R2 (valgfri – svarer 501 uden).
- ✅ Scan med egen nøgle (Anthropic standard Sonnet 5.5, OpenAI, OpenRouter) → gennemse/ret → gem. Fladt skema, kun én union-type.
- ✅ Korrekte facit: `src/lib/kontrol.ts` regner facit uafhængigt (uenig blokerer gem). Isaks 80 opgaver: 74 bekræftet, 0 uenige, 6 figuraflæsning. Barnet kan melde forkert facit; voksen retter via "Ret".
- ✅ 6 temaer (pirat, prinsesse, rum, detektiv, sport, flyt hjemmefra/økonomi), klassetrin 1–10, udskolingstyper (flere løsninger, brøk, udtryk, afrunding, grafer).
- ✅ Velkomstguide, rate-limit, 40 scan/døgn, gendannelseskode + kodekort, Deploy-knap i README.
- ✅ 94 tests (vitest + fast-check) i GitHub Actions og i `pnpm build`.
- 🚧 Ingen rigtig AI-scanning kørt endnu (ingen nøgle på maskinen). Deploy-knappen ikke testet med fremmed konto.

## Next
1. Daniel: test rigtig scanning (gerne flere temaer og et udskolingsark). Justér prompten efter resultatet.
2. Daniel: slå R2 til → tilføj `r2_buckets` i `wrangler.local.jsonc` → `npx wrangler r2 bucket create kaptajn-tal-app-ark` → `pnpm deploy:mine`.
3. Lag 5: læg nøgle i `.env.local` → mål scanning mod Isaks 4 ark (lokalt, privat data) → beslut om lag 3 (blind anden AI-vurdering).
4. Flyt Isaks togter/fremgang fra den private udgave, når han er klar.
5. Senere: betalt plan (fase 5), lyde pr. tema, engelsk.

## Watch out
- Læg aldrig nøgler, arkfotos, Isaks data eller den private plan i dette repo. `.env*`, `*.local`, `wrangler.local.jsonc`, `backups` er ignoreret.
- Lydene fra Elevenlabs er udeladt, indtil licensen er tjekket.
- Familiekoden er eneste adgangskontrol; gendannelseskoden gemmes kun som SHA-256.
- Node-scripts mod `src/` skal køre via Vite (`ssrLoadModule`) inde fra projektmappen.

## Run & test
```bash
pnpm install
pnpm test               # 94 tests
pnpm db:init:local      # én gang
pnpm dev:api            # API + D1 + R2 lokalt på 8787
pnpm dev                # http://localhost:5180
pnpm deploy:mine         # sæt CLOUDFLARE_ACCOUNT_ID først (står i den private STATUS)
```
