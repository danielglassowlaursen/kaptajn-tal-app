# STATUS — Kaptajn Tal (offentlig udgave)

_Updated: 2026-10-14 · laptop_

## Now
Fase 0 er lavet lokalt: ren kopi uden ophavsretligt indhold, licens, README, prøvetogt. Venter på Daniels gennemsyn, før repoet `kaptajn-tal-app` oprettes offentligt.

## State
- ✅ Kode kopieret fra den private udgave uden arkfotos, Isaks opgaver, lyde og backups. Ny git-historik.
- ✅ LICENSE.md (PolyForm Noncommercial 1.0.0), CONTRIBUTING.md med bidragsaftale, ROADMAP.md, README (da + kort en).
- ✅ Prøvetogt "Skildpaddeøen" (5 opgaver, selvskrevet) i `src/data/togter.ts`.
- ✅ Personlige data fjernet: Cloudflare-konto-id, database-id, worker-navn (`kaptajn-tal-app`).
- 🚧 Ikke på GitHub endnu. Ikke deployet.

## Next
1. Daniel gennemser mappen → opret offentligt repo `danielglassowlaursen/kaptajn-tal-app` og push.
2. Fase 1: togter som data pr. familie (D1 + R2), familie som egen enhed, forbrugstabel.
3. Prøvetogtet skal have historier i alle tre temaer, når tema-systemet kommer (fase 3).

## Watch out
- Den fulde plan med private detaljer ligger kun i det private repo (`Kaptajn Tal/docs/PLAN-open-source.md`). Læg den aldrig her.
- Lydene fra Elevenlabs er udeladt, indtil licensen er tjekket.
- Læg aldrig fotos af trykte regneark i repoet.

## Run & test
```bash
pnpm install
pnpm dev        # http://localhost:5180
pnpm build
```
