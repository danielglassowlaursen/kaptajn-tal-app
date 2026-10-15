// ---------------------------------------------------------------------------
// Datamodel for Kaptajn Tal.
// Hver opgave har en pirat-historie (story), et spørgsmål og et "nøgent"
// regnestykke (regnestykke) som vises diskret, så koblingen mellem historie
// og matematik bliver tydelig. Hints er trin-for-trin i historiens sprog.
// ---------------------------------------------------------------------------

/** Små tegninger der kan vises over spørgsmålet. */
export type Visual =
  | { kind: 'gitter'; rows: number; cols: number; label?: string }
  | { kind: 'rektangel'; w: number; h: number; unit?: string }
  | { kind: 'trekant'; sides: [number, number, number]; unit?: string }
  | { kind: 'lineal'; length: number; label?: string } // måle med lineal (cm)
  | { kind: 'soejler'; bars: { label: string; value: number }[]; unit?: string }
  | { kind: 'koordinat'; size: number; points?: [number, number][]; marker?: [number, number]; closed?: boolean }
  | { kind: 'moenter'; groups: number; perGroup: number } // bunker af mønter
  /** Graf af en eller flere funktioner i x, fx ["2x + 1", "x^2 - 4"]. */
  | { kind: 'graf'; funktioner: string[]; xMin?: number; xMax?: number; yMin?: number; yMax?: number; punkter?: [number, number][] }

interface Base {
  id: string
  story: string
  question: string
  regnestykke?: string
  /** Pollys hints, fra lille nudge til grundig forklaring. Hun afslører svaret efter det sidste. */
  hints?: string[]
  visual?: Visual
  /** Opgavens nummer på papir-arket (kan være to numre, hvis app-opgaven dækker begge). */
  nr?: number | number[]
  /** Note om hvordan svaret overføres til papiret, hvis det er anderledes end på skærmen. */
  papir?: string
  /** Regnestykke eller ligning, appen selv kan regne facit ud fra (fx "2 · 60" for "2 timer = ? min"). Vises ikke for barnet. */
  udregning?: string
  /** Hvem har bekræftet facit: appen regnede efter, eller en voksen tjekkede mod arket. */
  kontrol?: 'app' | 'voksen'
}

/** Skriv et tal. accept = alternative stavemåder der også er rigtige. */
export interface TalOpgave extends Base {
  type: 'tal'
  answer: number
  unit?: string
  accept?: string[]
  /** Afrund til så mange decimaler; svar, der afrundes til samme tal, godkendes. */
  decimaler?: number
}

/** Flere tal som svar i vilkårlig rækkefølge, fx løsningerne til en andengradsligning. Tom liste = ingen løsning. */
export interface FlereOpgave extends Base {
  type: 'flere'
  answers: number[]
  decimaler?: number
  /** Fx "x" – vises foran felterne. */
  variabel?: string
}

/** Svar som brøk. Forkortede og uforkortede brøker med samme værdi godkendes. */
export interface BroekOpgave extends Base {
  type: 'broek'
  answer: [number, number]
  /** Kræv at brøken er forkortet mest muligt. */
  forkortet?: boolean
}

/** Svar som et algebraisk udtryk, fx "5x + 3". Godkendes, hvis det er lig facit for alle x. */
export interface UdtrykOpgave extends Base {
  type: 'udtryk'
  answer: string
}

/** Udfyld de tomme felter i en talrække. null = tomt felt. */
export interface TalraekkeOpgave extends Base {
  type: 'talraekke'
  sequence: (number | null)[]
  answers: number[]
}

/** Tryk på alle de rigtige blandt flere (fx lige tal). */
export interface VaelgOpgave extends Base {
  type: 'vaelg'
  items: string[]
  correct: string[]
}

/** Sæt >, < eller = mellem to udtryk. */
export interface SammenlignOpgave extends Base {
  type: 'sammenlign'
  left: string
  right: string
  answer: '>' | '<' | '='
}

/** Sortér tal, mindste først. */
export interface SorterOpgave extends Base {
  type: 'sorter'
  items: string[]
  sorted: string[]
}

/** Multiple choice med ét rigtigt svar. */
export interface ValgOpgave extends Base {
  type: 'valg'
  options: string[]
  answer: string
}

/** Tryk på N felter ud af M (brøkdel af en figur). */
export interface FelterOpgave extends Base {
  type: 'felter'
  total: number
  cols: number
  answer: number
}

/** Tryk på cifferet på en bestemt plads (fx tierne) i hvert tal. */
export interface CifferOpgave extends Base {
  type: 'ciffer'
  numbers: string[]
  place: 'enere' | 'tiere' | 'hundreder' | 'tusinder'
}

/** Aflæs et punkt i et koordinatsystem. */
export interface KoordinatOpgave extends Base {
  type: 'koordinat'
  answer: [number, number]
}

export type Opgave =
  | TalOpgave
  | TalraekkeOpgave
  | VaelgOpgave
  | SammenlignOpgave
  | SorterOpgave
  | ValgOpgave
  | FelterOpgave
  | CifferOpgave
  | KoordinatOpgave
  | FlereOpgave
  | BroekOpgave
  | UdtrykOpgave

export interface Togt {
  id: string
  title: string
  subtitle: string
  emoji: string
  intro: string
  /** Det fysiske regneark, togtet bygger på. */
  ark?: {
    navn: string
    /** Adresse på fotoet af arket. For familiens egne togter sættes den af appen ud fra 'foto'. */
    billede?: string
    /** Der ligger et foto af arket i skyen under familien. */
    foto?: boolean
    /** Version af fotoet (tidspunkt for upload), så et nyt foto ikke vises fra cache. */
    fotoV?: number
    /** Opgaver der kun findes på papiret (fx tegneopgaver). */
    kunPapir?: string[]
  }
  opgaver: Opgave[]
  /** Hvornår familien tilføjede togtet (ms). Sættes af appen. */
  oprettet?: number
}

/** Hvordan en opgave blev løst første gang. */
export type Resultat = 'foerste' | 'andet' | 'forkert' | 'polly'

export interface Svar {
  r: Resultat
  guld: number
  dato: string // 'YYYY-MM-DD'
  /** Så meget tog tyven ved denne opgave (gives tilbage, hvis facit var forkert). */
  stjal?: number
  /** Barnet har meldt, at facit ser forkert ud. */
  rapport?: { dato: string }
}

/** Gemmes i localStorage pr. togt. */
export interface TogtProgress {
  done: Record<string, number> // opgave-id -> guld tjent første gang
  /** Detaljer pr. opgave (mangler for opgaver løst før oversigten fandtes). */
  svar?: Record<string, Svar>
}

export interface Gravested {
  x: number // 0–1 på øen
  y: number
}

export interface Progress {
  name: string
  togter: Record<string, TogtProgress>
  /** Guld i pungen – tjent, men endnu ikke begravet. */
  pung: number
  /** Begravet guld – den egentlige skat. */
  skat: number
  /** Så meget har Sorte Sven snuppet i alt. */
  stjaalet: number
  gravested: Gravested | null
  /** Besætningen, ét navn pr. medlem. */
  crew: string[]
  /** Sekunders matematik pr. dag ('YYYY-MM-DD' -> sek). */
  dage: Record<string, number>
  /** Dage hvor det daglige mål allerede har givet et besætningsmedlem. */
  beloennet: Record<string, boolean>
  /** Sidste dag der er tjekket for glemte dage. */
  sidsteTjek: string | null
  /** Hvornår fremgangen sidst blev ændret (ms). Nyeste vinder ved synk. */
  updatedAt: number
  /** Familiens valgte tema (følger med familiekoden). */
  tema?: 'pirat' | 'prinsesse' | 'rum' | 'detektiv' | 'sport' | 'flyt'
  /** Klassetrin (1–10). Styrer tonen i AI'ens historier. */
  klasse?: number
}
