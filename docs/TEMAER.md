# Temaer

Et tema er ren konfiguration. Matematikken, reglerne og opgaverne er de samme; temaet
bestemmer ord, figurer, farver, skrift og pynt.

| Tema | Titel | Hjælper | Tyv | Valuta | Daglig belønning | Samling |
| --- | --- | --- | --- | --- | --- | --- |
| Pirater | Kaptajn Tal | Papegøjen Polly | Sorte Sven | Guldmønter | Besætningsmedlem | Flåde af skibe |
| Enhjørninger og prinsesser | Kaptajn Tal – Prinsesse Plus | Enhjørningen Luna | Trolden Grum | Ædelsten | Ven ved hoffet | Rige af slotte |
| Rummet | Kaptajn Tal – Kommandør Komma | Robotten Bip | Rumpiraten Zorg | Stjernestøv | Astronaut | Flåde af rumskibe |
| Detektiv | Kaptajn Tal – Detektiv Decimal | Sporhunden Rex | Mestertyven Maske | Beviser | Agent | Bureauets kontorer |
| Sport | Kaptajn Tal – Mester Minus | Coach Kim | Rivalen Rasmus | Point | Holdkammerat | Trofæer |
| Flyt hjemmefra | Kaptajn Tal – Egen Økonomi | Sparegrisen Penny | Uventede udgifter | Kroner | Ting til lejligheden | Boliger |

Detektiv, Sport og Flyt hjemmefra er lavet til udskolingen. Flyt hjemmefra er til 9. og 10. klasse, og AI'en
bruger realistiske danske priser, så eleven lærer om løn, skat, budget, opsparing og renter.

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
