// ---------------------------------------------------------------------------
// Et tema er ren konfiguration: ord, figurer, farver og pynt. Matematikken og
// spillets regler er de samme i alle temaer. Nyt tema = ny fil i src/tema/.
// ---------------------------------------------------------------------------

export type TemaId = 'pirat' | 'prinsesse' | 'rum' | 'detektiv' | 'sport' | 'flyt'

export interface Samling {
  navn: string
  emoji: string
  /** Så mange i besætningen/hoffet kræves. Første element har man altid (0). */
  crew: number
}

export interface Tema {
  id: TemaId
  /** Navn i temavælgeren. */
  navn: string
  /** Anbefalet til disse klassetrin (vises i temavælgeren). */
  klasser?: string
  /** Undertitel efter "Kaptajn Tal" – null for hovedtemaet. */
  undertitel: string | null
  flag: string
  slogan: string
  hilsen: string
  /** Hvad barnet kaldes: "kaptajn", "prinsesse". */
  titel: string

  // Rejsen (et ark)
  rejse: string // "togt"
  rejser: string // "togter"
  rejsen: string // "togtet"
  startRejse: string // "Sejl ud! ⛵"
  fortsaetRejse: string
  videre: string
  kortNavn: string // "Søkort"
  kort: { start: string; maal: string; fartoej: string }

  // Belønning
  valuta: string // "guldmønter"
  valutaKort: string // "guld"
  pung: string // "pungen"
  gemt: string // "Begravet"
  gemVerbum: string // "begrave"
  gemTitel: string // "Begrav guldet"
  gemKnap: string // "Begrav guldet ⛏️"
  gemFaerdig: string // "Skatten er begravet!"
  gemSted: string // "Skatteøen"
  gaaTilGemmested: string // "ro i land"
  moent: { form: 'moent' | 'aedelsten' | 'stjerne' | 'lup' | 'medalje'; ydre: string; indre: string; tegn: string; /** Tegn på mønten, standard "$". */ symbol?: string }
  gemmested: { vand: [string, string]; kant: string; land: string; midte: string; pynt: string[] }

  // Figurer
  hjaelper: { navn: string; emoji: string; art: string }
  tyv: { navn: string; emoji: string; tagerFraSkat: (n: number) => string; tagerFraPung: (n: number) => string; fandtIntet: string }
  ros: string[]
  afsloering: string[]

  // Hof / besætning
  crewTitel: string // "Din besætning"
  crewOrd: string // "besætning"
  crewMedlem: string // "besætningsmedlem"
  crewMedlemmer: string // "besætningsmedlemmer"
  ombord: string // "Ombord"
  kommerMed: (navn: string) => string
  forlader: (navn: string) => string
  crewNavne: string[]
  crewEmoji: string[]
  samlingTitel: string // "Din flåde"
  samlingFlertal: string // "skibe"
  nytISamling: (s: Samling) => string
  samling: Samling[]

  // Menu
  menu: { rejser: [string, string]; skat: [string, string]; crew: [string, string] }

  // Konfetti: 'moent' tegnes som temaets mønt/ædelsten
  konfetti: { lille: string[]; stor: string[] }
}
