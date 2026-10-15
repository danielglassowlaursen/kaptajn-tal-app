// ---------------------------------------------------------------------------
// Filformat for togter (.json). Bruges til "Tilføj togt fra fil", til eksport,
// og er samme form som AI-scanningen skal levere i fase 2.
//
//   { "app": "kaptajn-tal", "type": "togt", "version": 1, "togt": { ...Togt } }
//
// Et rent Togt-objekt accepteres også. Se docs/TOGT-FORMAT.md.
// ---------------------------------------------------------------------------
import type { Opgave, Togt } from '../types'
import { laesUdtryk } from './matematik'

const TYPER = new Set(['tal', 'talraekke', 'vaelg', 'sammenlign', 'sorter', 'valg', 'felter', 'ciffer', 'koordinat', 'flere', 'broek', 'udtryk'])

export type ParseResultat = { ok: true; togter: Togt[]; advarsler: string[] } | { ok: false; fejl: string[] }

const erTal = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
const erTekst = (x: unknown): x is string => typeof x === 'string' && x.trim() !== ''
const erTekster = (x: unknown): x is string[] => Array.isArray(x) && x.every((v) => typeof v === 'string')

/** Tjek én opgave. Returnerer fejlbeskeder (tom liste = ok). */
export function tjekOpgave(o: Record<string, unknown>, nr: number): string[] {
  const f: string[] = []
  const hvor = `Opgave ${nr}`
  if (!erTekst(o.id)) f.push(`${hvor}: mangler id`)
  if (!erTekst(o.type) || !TYPER.has(o.type)) f.push(`${hvor}: ukendt type "${String(o.type)}"`)
  if (!erTekst(o.story)) f.push(`${hvor}: mangler historie (story)`)
  if (!erTekst(o.question)) f.push(`${hvor}: mangler spørgsmål (question)`)
  if (o.hints !== undefined && !erTekster(o.hints)) f.push(`${hvor}: hints skal være en liste af tekster`)
  switch (o.type) {
    case 'tal':
      if (!erTal(o.answer)) f.push(`${hvor}: answer skal være et tal`)
      break
    case 'talraekke':
      if (!Array.isArray(o.sequence) || !Array.isArray(o.answers)) f.push(`${hvor}: mangler sequence/answers`)
      else if (o.sequence.filter((v) => v === null).length !== o.answers.length) f.push(`${hvor}: antal tomme felter passer ikke med answers`)
      break
    case 'vaelg':
      if (!erTekster(o.items) || !erTekster(o.correct)) f.push(`${hvor}: mangler items/correct`)
      break
    case 'sammenlign':
      if (!erTekst(o.left) || !erTekst(o.right) || !['>', '<', '='].includes(String(o.answer))) f.push(`${hvor}: mangler left/right/answer`)
      break
    case 'sorter':
      if (!erTekster(o.items) || !erTekster(o.sorted)) f.push(`${hvor}: mangler items/sorted`)
      break
    case 'valg':
      if (!erTekster(o.options) || !erTekst(o.answer)) f.push(`${hvor}: mangler options/answer`)
      break
    case 'felter':
      if (!erTal(o.total) || !erTal(o.cols) || !erTal(o.answer)) f.push(`${hvor}: mangler total/cols/answer`)
      break
    case 'ciffer':
      if (!erTekster(o.numbers) || !['enere', 'tiere', 'hundreder', 'tusinder'].includes(String(o.place))) f.push(`${hvor}: mangler numbers/place`)
      break
    case 'koordinat':
      if (!Array.isArray(o.answer) || o.answer.length !== 2 || !o.answer.every(erTal)) f.push(`${hvor}: answer skal være [x, y]`)
      break
    case 'flere':
      if (!Array.isArray(o.answers) || !o.answers.every(erTal)) f.push(`${hvor}: answers skal være en liste af tal (tom = ingen løsning)`)
      break
    case 'broek':
      if (!Array.isArray(o.answer) || o.answer.length !== 2 || !o.answer.every(Number.isInteger) || o.answer[1] === 0)
        f.push(`${hvor}: answer skal være [tæller, nævner] med hele tal`)
      break
    case 'udtryk':
      if (!erTekst(o.answer) || !laesUdtryk(String(o.answer))) f.push(`${hvor}: answer skal være et udtryk, der kan læses, fx "5x + 3"`)
      break
  }
  return f
}

function tjekTogt(t: unknown): { togt?: Togt; fejl: string[]; advarsler: string[] } {
  if (!t || typeof t !== 'object') return { fejl: ['Filen indeholder ikke et togt'], advarsler: [] }
  const r = t as Record<string, unknown>
  const fejl: string[] = []
  const advarsler: string[] = []
  if (!erTekst(r.title)) fejl.push('Togtet mangler en titel')
  if (!Array.isArray(r.opgaver) || r.opgaver.length === 0) fejl.push('Togtet har ingen opgaver')
  else {
    const ids = new Set<string>()
    r.opgaver.forEach((o, i) => {
      if (!o || typeof o !== 'object') return fejl.push(`Opgave ${i + 1}: ugyldig`)
      fejl.push(...tjekOpgave(o as Record<string, unknown>, i + 1))
      const id = (o as { id?: unknown }).id
      if (typeof id === 'string') {
        if (ids.has(id)) fejl.push(`Opgave ${i + 1}: id "${id}" bruges to gange`)
        ids.add(id)
      }
      if (!Array.isArray((o as Opgave).hints) || ((o as Opgave).hints?.length ?? 0) < 2) advarsler.push(`Opgave ${i + 1} har færre end to hints`)
    })
  }
  if (fejl.length) return { fejl, advarsler }
  const togt: Togt = {
    id: erTekst(r.id) ? r.id : '',
    title: String(r.title),
    subtitle: erTekst(r.subtitle) ? r.subtitle : 'Eget togt',
    emoji: erTekst(r.emoji) ? r.emoji : '🗺️',
    intro: erTekst(r.intro) ? r.intro : '',
    ark: r.ark && typeof r.ark === 'object' && erTekst((r.ark as { navn?: unknown }).navn) ? { navn: String((r.ark as { navn: string }).navn) } : undefined,
    opgaver: r.opgaver as Opgave[],
  }
  return { togt, fejl, advarsler }
}

/** Læs en fil med ét eller flere togter. */
export function parseTogtFil(text: string): ParseResultat {
  let j: unknown
  try {
    j = JSON.parse(text)
  } catch {
    return { ok: false, fejl: ['Filen er ikke gyldig JSON'] }
  }
  const o = j as Record<string, unknown>
  const kandidater: unknown[] = Array.isArray(o?.togter) ? o.togter : o && 'togt' in o ? [o.togt] : [j]
  const togter: Togt[] = []
  const fejl: string[] = []
  const advarsler: string[] = []
  kandidater.forEach((k, i) => {
    const r = tjekTogt(k)
    const pre = kandidater.length > 1 ? `Togt ${i + 1}: ` : ''
    fejl.push(...r.fejl.map((x) => pre + x))
    advarsler.push(...r.advarsler.map((x) => pre + x))
    if (r.togt) togter.push(r.togt)
  })
  return fejl.length ? { ok: false, fejl } : { ok: true, togter, advarsler }
}

/** Lav indholdet til en .json-fil med ét togt (uden lokale felter som foto-adressen). */
export function togtTilFil(t: Togt): string {
  const { oprettet: _o, ...rest } = t
  const ark = rest.ark ? { navn: rest.ark.navn, kunPapir: rest.ark.kunPapir } : undefined
  return JSON.stringify({ app: 'kaptajn-tal', type: 'togt', version: 1, togt: { ...rest, ark } }, null, 2)
}

/** Download en tekst som fil i browseren. */
export function downloadFil(navn: string, indhold: string, type = 'application/json') {
  const href = URL.createObjectURL(new Blob([indhold], { type }))
  const a = document.createElement('a')
  a.href = href
  a.download = navn
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(href), 1000)
}

export function filnavn(s: string): string {
  return s.toLowerCase().replace(/[^a-zæøå0-9]+/g, '-').replace(/^-|-$/g, '') || 'togt'
}
