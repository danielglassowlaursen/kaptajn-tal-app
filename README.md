# Kaptajn Tal 🏴‍☠️

**Matematik fortalt som eventyr.** Børn, der har svært ved den tørre vej gennem regnestykkerne,
får dem fortalt som historier i deres yndlingsunivers – med en hjælper, der giver hints lidt ad
gangen.

| Tema | Hjælper | Belønning |
| --- | --- | --- |
| 🏴‍☠️ **Kaptajn Tal** – pirater | Papegøjen Polly | Guldmønter, besætning og skibe |
| 🦄 **Kaptajn Tal – Prinsesse Plus** – enhjørninger og prinsesser | Enhjørningen Luna | Ædelsten, hof og slotte |
| 🚀 **Kaptajn Tal – Kommandør Komma** – rummet | Robotten Bip | Stjernestøv, besætning og rumskibe |
| 🕵️ **Kaptajn Tal – Detektiv Decimal** – udskoling | Sporhunden Rex | Beviser, team og bureau |
| 🏆 **Kaptajn Tal – Mester Minus** – udskoling | Coach Kim | Point, hold og trofæer |
| 🔑 **Kaptajn Tal – Egen Økonomi** – flyt hjemmefra, 9.–10. klasse | Sparegrisen Penny | Kroner, opsparing og din første lejlighed |

Se [docs/TEMAER.md](docs/TEMAER.md), hvis du vil lave dit eget tema.

> 🇬🇧 *English summary below.*

Appen blev bygget til en 10-årig, der lærer bedst gennem historier. Den bruger barnets egne
regneark fra skolen, så svarene nemt kan skrives over på papiret bagefter.

## Hvad appen kan

- **Togter** – ét regneark bliver til et togt med en historie til hver opgave.
- **12 opgavetyper fra 1. til 10. klasse** – tal, talrækker, sammenlign (> < =), sortér, brøkdele,
  pladsværdi, koordinater og multiple choice, og til udskolingen: ligninger med flere løsninger
  (andengradsligninger), brøker, algebraiske udtryk og afrundede svar. Tegninger som lineal,
  gitter, søjlediagram og grafer af funktioner.
- **Klassetrin** – styrer tonen, så historierne passer til en 7-årig eller en 15-årig.
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

- **Scan et ark**: Tag et foto af arket. En AI-model laver opgaverne om til et togt med
  historier, to hint-trin og facit. Du gennemser og retter alt, før det gemmes.
- **Fra fil**: Tilføj et togt fra en JSON-fil. Formatet står i [docs/TOGT-FORMAT.md](docs/TOGT-FORMAT.md),
  og der er et eksempel i [examples/](examples/eksempel-togt.json).

### Scanning med din egen AI-nøgle

Appen har ingen indbygget AI-adgang. Du bruger din egen nøgle hos én af tre udbydere:

| Udbyder | Model | Bemærkning |
| --- | --- | --- |
| Anthropic | `claude-sonnet-5-5` (standard) eller `claude-opus-5-5` | Anbefalet. Ca. 1 kr. pr. ark med Sonnet 5.5. |
| OpenAI | en model, der kan læse billeder og levere JSON efter skema | |
| OpenRouter | modelnavn som på openrouter.ai/models | Én nøgle til mange modeller |

- **Nøglen gemmes kun på din enhed.** Den sendes gennem appens server ved hver scanning og
  gemmes eller logges ikke dér.
- **Fotoet sendes til den valgte udbyder.** Tag kun billeder af selve arket, ikke af barnet.
- **En voksen godkender altid.** Appen regner facit efter, hvor det kan lade sig gøre, og
  advarer, hvis facit ikke passer, hvis hint 2 afslører svaret, eller hvis AI'en var usikker.
- Scanning kræver en familiekode, så togtet og fotoet kan gemmes.

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

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/danielglassowlaursen/kaptajn-tal-app)

Knappen kopierer projektet til din egen GitHub og udgiver det på din Cloudflare-konto.
Database (D1), billedlager (R2) og grænser for antal kald oprettes automatisk, og tabellerne
oprettes ved første besøg. Gratis-planen rækker til en familie eller en skoleklasse.

**R2 skal være slået til** på din Cloudflare-konto (Dashboard → R2), før arkfotos virker.
Uden R2 kan du fjerne `r2_buckets` fra `wrangler.jsonc` – så virker alt undtagen arkfotos.

Eller fra kommandolinjen:

```bash
npx wrangler login
pnpm install
pnpm deploy
```

Har du flere Cloudflare-konti, så sæt `CLOUDFLARE_ACCOUNT_ID` først.

### Beskyttelse

- Højst 300 kald i minuttet pr. IP, 20 opslag af ukendte familiekoder i minuttet pr. IP (mod
  gætteri) og 5 scanninger i minuttet pr. familie og pr. IP. Justér i `wrangler.jsonc`.
- Højst 40 scanninger pr. familie pr. døgn (`worker/plan.ts`).

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
