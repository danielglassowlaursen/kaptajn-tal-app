# Temaer

Et tema er ren konfiguration. Matematikken, reglerne og opgaverne er de samme; temaet
bestemmer ord, figurer, farver, skrift og pynt.

| Tema | Titel | Hjælper | Tyv | Valuta | Daglig belønning | Samling |
| --- | --- | --- | --- | --- | --- | --- |
| Pirater | Kaptajn Tal | Papegøjen Polly | Sorte Sven | Guldmønter | Besætningsmedlem | Flåde af skibe |
| Enhjørninger og prinsesser | Kaptajn Tal – Prinsesse Plus | Enhjørningen Luna | Trolden Grum | Ædelsten | Ven ved hoffet | Rige af slotte |
| Rummet (på vej) | Kaptajn Tal – Kommandør Komma | Robotten Bip | Rumpiraten Zorg | Stjernestøv | Besætningsmedlem | Flåde af raketter |

Familien vælger tema på forsiden. Valget følger familiekoden, så alle enheder viser samme tema.

## Sådan laver du et nyt tema

1. Kopiér `src/tema/pirat.ts` til en ny fil, fx `src/tema/rum.ts`, og ret alle tekster,
   emojis og farver. Typerne i `src/tema/typer.ts` viser, hvad hvert felt bruges til.
2. Tilføj temaets id til `TemaId` i `src/tema/typer.ts` og til `TEMAER` og `TEMA_LISTE` i
   `src/tema/index.tsx`. Tilføj samme id til `tema` i `Progress` i `src/types.ts`.
3. Giv temaet farver og skrift i `src/styles.css` under `:root[data-tema='rum']`, og tilføj
   skriften til Google Fonts-linket i `index.html`.
4. Tilføj temaet til `TEMAER` i `worker/scan/prompt.ts`, så AI'en skriver historier i det.
5. Giv prøvetogtet historier i temaet i `src/data/togter.ts` (samme opgave-id'er).

## Hvad der skifter, og hvad der ikke gør

- **Skifter med det samme**: menu, overskrifter, hjælper, tyv, valuta, gemmested, samling,
  navne på besætningen, farver, skrift, konfetti og prøvetogtets historier.
- **Skifter ikke**: historierne i togter, der allerede er scannet. De er skrevet i det tema,
  der var valgt ved scanningen.
