# Kaptajn Tal 🏴‍☠️

**Matematik fortalt som eventyr.** Børn, der har svært ved den tørre vej gennem regnestykkerne,
får dem fortalt som historier: guldmønter, kanonkugler, skattekort – og papegøjen Polly, der
hjælper lidt ad gangen.

> 🇬🇧 *English summary below.*

Appen blev bygget til en 10-årig, der lærer bedst gennem historier. Den bruger barnets egne
regneark fra skolen, så svarene nemt kan skrives over på papiret bagefter.

## Hvad appen kan

- **Togter** – ét regneark bliver til et togt med en historie til hver opgave.
- **9 opgavetyper** – tal, talrækker, sammenlign (> < =), sortér, brøkdele, pladsværdi,
  koordinater, valg og multiple choice, med tegninger som lineal, gitter og søjlediagram.
- **Polly hjælper i tre trin** – et lille hint, et større hint uden facit, og til sidst svaret
  med en frisk kommentar.
- **Guld, begravelse og Sorte Sven** – rigtige svar giver guld, som skal begraves efter
  tabel-træning. Forkerte svar lader Sorte Sven snuppe noget af skatten.
- **Dagligt mål** – 10 minutter om dagen giver et nyt besætningsmedlem. Streak og flåde vokser.
- **Oversigt** – facit og hvor meget hjælp der blev brugt, pr. ark og opgavenummer.
- **Familiekode** – fremgangen synker mellem iPad, telefon og computer, med historik og
  sikkerhedskopi som fil.
- **Lyd og konfetti** – kan slås fra.

Appen leveres **uden opgaver**, bortset fra et lille prøvetogt. Familier tilføjer deres egne
togter, og hvert togt kan få et foto af det rigtige ark, så svarene let kan skrives over.

- **I dag**: Tilføj et togt fra en JSON-fil. Formatet står i [docs/TOGT-FORMAT.md](docs/TOGT-FORMAT.md),
  og der er et eksempel i [examples/](examples/eksempel-togt.json).
- **På vej**: Scan arket med din egen AI-nøgle (Anthropic, OpenAI eller OpenRouter), gennemse
  og ret, og gem som togt. Se [ROADMAP.md](ROADMAP.md).

## Kør lokalt

Kræver Node 20+ og pnpm.

```bash
pnpm install
pnpm dev
```

Åbn http://localhost:5180. Familiekode-synk kræver også API'et lokalt:

```bash
pnpm db:init:local
pnpm dev:api
```

## Kør din egen kopi på Cloudflare

Gratis-planen hos Cloudflare rækker til en familie eller en skoleklasse.

1. Log ind: `npx wrangler login`
2. Opret databasen: `npx wrangler d1 create kaptajn-tal-app`
3. Indsæt det udskrevne `database_id` i `wrangler.jsonc`.
4. Opret lageret til arkfotos: `npx wrangler r2 bucket create kaptajn-tal-app-ark`
5. Opret tabellerne: `pnpm db:init`
6. Udgiv: `pnpm deploy`

Har du flere Cloudflare-konti, så sæt `CLOUDFLARE_ACCOUNT_ID` før kommandoerne.

## Lyde

Lydfilerne er ikke med i repoet. Læg dine egne MP3-filer i `public/lyd/` som `polly.mp3`,
`guld.mp3` og `sejr.mp3`. Uden dem kører appen bare lydløst.

## Teknik

React + TypeScript + Vite. Cloudflare Worker med D1 til familier, fremgang, togter og historik,
og R2 til arkfotos, som kun kan hentes med familiekoden. Ingen konti og
ingen tracking – kun barnets fornavn gemmes.

## Licens

[PolyForm Noncommercial 1.0.0](LICENSE.md). Fri til privat brug, undervisning og
forskning. **Kommerciel brug er ikke tilladt.** Det betyder, at projektet er
*source-available* og ikke "open source" efter OSI's definition.

Bidrag er velkomne – læs [CONTRIBUTING.md](CONTRIBUTING.md) først.

---

## 🇬🇧 English summary

Kaptajn Tal ("Captain Numbers") turns a child's own school math worksheets into story-driven
voyages with pirates (more themes coming), step-by-step hints from Polly the parrot, gold to
bury, and a daily 10-minute goal. The UI is currently in Danish.

Run locally with `pnpm install && pnpm dev`. Licensed under PolyForm Noncommercial 1.0.0:
free for personal, educational and research use, **no commercial use**.
