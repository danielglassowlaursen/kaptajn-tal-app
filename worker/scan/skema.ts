// ---------------------------------------------------------------------------
// JSON-skema for AI'ens svar. Fladt og uden rekursion, så det virker med
// struktureret output hos både Anthropic og OpenAI/OpenRouter. Alle felter er
// krævede. Felter, der ikke bruges af en opgavetype, er "" / 0 / tomme lister.
//
// Bevidst kun ÉN union-type (hullerne i en talrække): Anthropic tillader højst
// 16 parametre med anyOf pr. kald, og hver union gør skemaet dyrere at kompilere.
// ---------------------------------------------------------------------------

const str = { type: 'string' }
const num = { type: 'number' }
const int = { type: 'integer' }
const nul = { type: 'null' }
const nullable = (s: object) => ({ anyOf: [s, nul] })
const strs = { type: 'array', items: str }

export const OPGAVETYPER = ['tal', 'talraekke', 'vaelg', 'sammenlign', 'sorter', 'valg', 'felter', 'ciffer', 'koordinat'] as const

const opgave = {
  type: 'object',
  additionalProperties: false,
  properties: {
    nr: int,
    type: { type: 'string', enum: [...OPGAVETYPER] },
    historie: str,
    spoergsmaal: str,
    regnestykke: str,
    hint_1: str,
    hint_2: str,
    papir: str,
    enhed: str,
    svar_tal: num,
    svar_tekst: str,
    raekke: { type: 'array', items: nullable(num) },
    raekke_svar: { type: 'array', items: num },
    valgmuligheder: strs,
    rigtige: strs,
    sorteret: strs,
    tal_liste: strs,
    venstre: str,
    hoejre: str,
    felter_total: int,
    felter_kolonner: int,
    plads: { type: 'string', enum: ['', 'enere', 'tiere', 'hundreder', 'tusinder'] },
    x: int,
    y: int,
    usikker: { type: 'boolean' },
    usikker_grund: str,
  },
  required: [
    'nr', 'type', 'historie', 'spoergsmaal', 'regnestykke', 'hint_1', 'hint_2', 'papir', 'enhed', 'svar_tal', 'svar_tekst',
    'raekke', 'raekke_svar', 'valgmuligheder', 'rigtige', 'sorteret', 'tal_liste', 'venstre', 'hoejre', 'felter_total',
    'felter_kolonner', 'plads', 'x', 'y', 'usikker', 'usikker_grund',
  ],
}

export const TOGT_SKEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    titel: str,
    emoji: str,
    intro: str,
    ark_navn: str,
    kun_papir: strs,
    opgaver: { type: 'array', items: opgave },
  },
  required: ['titel', 'emoji', 'intro', 'ark_navn', 'kun_papir', 'opgaver'],
}

export interface RaaOpgave {
  nr: number // 0 = intet nummer
  type: (typeof OPGAVETYPER)[number]
  historie: string
  spoergsmaal: string
  regnestykke: string
  hint_1: string
  hint_2: string
  papir: string
  enhed: string
  svar_tal: number
  svar_tekst: string
  raekke: (number | null)[]
  raekke_svar: number[]
  valgmuligheder: string[]
  rigtige: string[]
  sorteret: string[]
  tal_liste: string[]
  venstre: string
  hoejre: string
  felter_total: number
  felter_kolonner: number
  plads: '' | 'enere' | 'tiere' | 'hundreder' | 'tusinder'
  x: number
  y: number
  usikker: boolean
  usikker_grund: string
}

export interface RaaTogt {
  titel: string
  emoji: string
  intro: string
  ark_navn: string
  kun_papir: string[]
  opgaver: RaaOpgave[]
}
