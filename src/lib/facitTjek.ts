// ---------------------------------------------------------------------------
// Tjek af AI'ens udkast, før en voksen gemmer det: facit regnes efter med
// matematik-motoren, hvor det kan lade sig gøre, og hint 2 må ikke afsløre facit.
// ---------------------------------------------------------------------------
import type { Opgave } from '../types'
import { tjekOpgave } from './togtFil'
import { afrund, ensUdtryk, loeserLigning, regnUd as motorRegnUd } from './matematik'
import { formatNumber } from './check'

export interface Fund {
  niveau: 'fejl' | 'advarsel'
  tekst: string
}

/** Regn et udtryk uden variabler ud. null hvis det ikke kan. */
export const regnUd = motorRegnUd

/** Variablen i en ligning – x, eller det eneste bogstav der optræder. */
function variabelI(r: string): string {
  if (/x/i.test(r)) return 'x'
  const b = r.toLowerCase().match(/[a-zæøå]/g)?.filter((c) => c !== 'π') ?? []
  return b[0] ?? 'x'
}

/** Passer facit med regnestykket? "362 + 17", "17 + x = 25", "2 timer = ? min" (sidste kan ikke tjekkes → null). */
export function facitFraRegnestykke(r: string, svar: number, decimaler?: number): boolean | null {
  const ren = r.replace(/\s*=\s*\?\s*.*$/, '').replace(/,\s*hvor\s+.*$/i, '').trim()
  if (ren.includes('=')) return loeserLigning(ren, svar, variabelI(ren))
  const v = regnUd(ren)
  if (v === null) return null
  return decimaler === undefined ? Math.abs(v - svar) < 1e-9 : afrund(v, decimaler) === afrund(svar, decimaler)
}

function facitTekster(o: Opgave): string[] {
  const tal = (n: number) => [String(n), formatNumber(n)]
  switch (o.type) {
    case 'tal':
      return Number.isFinite(o.answer) ? tal(o.answer) : []
    case 'talraekke':
      return o.answers.map(String)
    case 'koordinat':
      return [`${o.answer[0]};${o.answer[1]}`, `(${o.answer[0]}`]
    case 'flere':
      return o.answers.flatMap(tal)
    case 'broek':
      return [`${o.answer[0]}/${o.answer[1]}`]
    case 'udtryk':
      return [o.answer.replace(/\s+/g, '')]
    default:
      return []
  }
}

export function tjekUdkast(o: Opgave, nr: number, usikker?: string): Fund[] {
  const fund: Fund[] = tjekOpgave(o as unknown as Record<string, unknown>, nr).map((tekst) => ({ niveau: 'fejl' as const, tekst }))
  if (usikker) fund.push({ niveau: 'advarsel', tekst: `AI'en var usikker: ${usikker}` })
  const r = o.regnestykke

  if (o.type === 'tal' && r && Number.isFinite(o.answer)) {
    if (facitFraRegnestykke(r, o.answer, o.decimaler) === false) fund.push({ niveau: 'advarsel', tekst: `Facit ${formatNumber(o.answer)} passer ikke med regnestykket "${r}". Tjek det.` })
  }
  if (o.type === 'flere' && r && r.includes('=')) {
    const v = variabelI(r)
    const forkerte = o.answers.filter((a) => loeserLigning(r, a, v) === false)
    if (forkerte.length) fund.push({ niveau: 'advarsel', tekst: `${forkerte.map(formatNumber).join(' og ')} passer ikke i ligningen "${r}". Tjek facit.` })
    if (o.answers.length === 0) fund.push({ niveau: 'advarsel', tekst: 'Facit er "ingen løsning". Tjek, at det er rigtigt.' })
  }
  if (o.type === 'broek' && r && !r.includes('=')) {
    const v = regnUd(r)
    if (v !== null && Math.abs(v - o.answer[0] / o.answer[1]) > 1e-9) fund.push({ niveau: 'advarsel', tekst: `Brøken ${o.answer[0]}/${o.answer[1]} passer ikke med "${r}".` })
  }
  if (o.type === 'udtryk' && r && !r.includes('=')) {
    if (ensUdtryk(r, o.answer) === false) fund.push({ niveau: 'advarsel', tekst: `Udtrykket "${o.answer}" er ikke lig med "${r}". Tjek facit.` })
  }
  if (o.type === 'sammenlign') {
    const a = regnUd(o.left)
    const b = regnUd(o.right)
    if (a !== null && b !== null) {
      const rigtigt = a > b ? '>' : a < b ? '<' : '='
      if (rigtigt !== o.answer) fund.push({ niveau: 'advarsel', tekst: `${o.left} = ${formatNumber(a)} og ${o.right} = ${formatNumber(b)}, så tegnet burde være "${rigtigt}".` })
    }
  }
  if (o.type === 'sorter') {
    const vaerdi = (x: string) => regnUd(x)
    if (o.items.every((x) => vaerdi(x) !== null)) {
      const forventet = [...o.items].sort((x, y) => vaerdi(x)! - vaerdi(y)!)
      if (forventet.join('|') !== o.sorted.join('|')) fund.push({ niveau: 'advarsel', tekst: `Sorteringen ser forkert ud. Forventet: ${forventet.join(', ')}.` })
    }
  }
  if (o.type === 'felter' && o.answer > o.total) fund.push({ niveau: 'fejl', tekst: 'Flere felter i facit end i figuren.' })

  const h2 = (o.hints?.[1] ?? '').replace(/\s+/g, '')
  for (const f of facitTekster(o)) {
    const fr = f.replace(/\s+/g, '')
    if (fr && new RegExp(`(^|[^0-9,.])${fr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![0-9])`).test(h2)) {
      fund.push({ niveau: 'advarsel', tekst: `Hint 2 nævner facit (${f}). Omskriv det, så barnet selv tager sidste skridt.` })
      break
    }
  }
  if ((o.hints?.length ?? 0) < 2) fund.push({ niveau: 'advarsel', tekst: 'Opgaven har færre end to hints.' })
  return fund
}
