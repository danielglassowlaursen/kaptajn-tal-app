# Filformat for togter

Et togt er en JSON-fil. Den kan tilføjes i appen under **Dine togter → Tilføj togt fra fil**
og eksporteres igen fra samme sted. AI-scanningen (fase 2) leverer det samme format.

Se et komplet eksempel i [examples/eksempel-togt.json](../examples/eksempel-togt.json).

```json
{
  "app": "kaptajn-tal",
  "type": "togt",
  "version": 1,
  "togt": {
    "title": "Hajbugten",
    "subtitle": "Eget togt",
    "emoji": "🦈",
    "intro": "En kort tekst, der vises før første opgave.",
    "ark": { "navn": "Uge 42", "kunPapir": ["Nr. 9: Tegn et kvadrat"] },
    "opgaver": [ ... ]
  }
}
```

En fil kan også indeholde flere togter: `{ "togter": [ {...}, {...} ] }`.

## Felter på hver opgave

| Felt | Krævet | Beskrivelse |
| --- | --- | --- |
| `id` | ja | Unikt inden for togtet, fx `"o1"`. Bruges til at gemme fremgang. |
| `type` | ja | En af typerne herunder. |
| `story` | ja | Historien, opgaven fortælles som. |
| `question` | ja | Selve spørgsmålet. |
| `hints` | anbefalet | To tekster: et lille hint og et større, der **ikke** afslører facit. |
| `regnestykke` | nej | Det nøgne regnestykke, vises som lille etiket. |
| `nr` | nej | Opgavens nummer på papirarket (tal eller liste af tal). |
| `papir` | nej | Note, hvis svaret skal skrives anderledes på papiret. |
| `visual` | nej | Tegning: `gitter`, `rektangel`, `trekant`, `lineal`, `soejler`, `koordinat`, `moenter`. |

## Opgavetyper

| `type` | Ekstra felter | Eksempel |
| --- | --- | --- |
| `tal` | `answer` (tal), `unit`, `accept` | `"answer": 21, "unit": "cm"` |
| `talraekke` | `sequence` (tal eller `null` for tomme), `answers` | `"sequence": [3, null, 9], "answers": [6]` |
| `vaelg` | `items`, `correct` (flere rigtige) | lige tal blandt en liste |
| `sammenlign` | `left`, `right`, `answer` (`>`, `<` eller `=`) | `"left": "3 · 5", "answer": "<"` |
| `sorter` | `items`, `sorted` (mindste først) | |
| `valg` | `options`, `answer` (ét rigtigt) | |
| `felter` | `total`, `cols`, `answer` (antal felter) | brøkdel af en figur |
| `ciffer` | `numbers`, `place` (`enere`/`tiere`/`hundreder`/`tusinder`) | find tierne |
| `koordinat` | `answer` som `[x, y]`, gerne `visual` af typen `koordinat` | |

De præcise typer står i [src/types.ts](../src/types.ts), og appens tjek ligger i
[src/lib/togtFil.ts](../src/lib/togtFil.ts).

**Ophavsret**: Del kun togter, du selv har skrevet. Kopiér ikke tekst fra trykte opgavehæfter.
