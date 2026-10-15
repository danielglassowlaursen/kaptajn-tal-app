// ---------------------------------------------------------------------------
// Tjek af AI'ens udkast, før en voksen gemmer det: facit regnes efter med
// matematik-motoren, hvor det kan lade sig gøre, og hint 2 må ikke afsløre facit.
// ---------------------------------------------------------------------------
import type { Opgave } from '../types'
import { tjekOpgave } from './togtFil'
import { afrund, loeserLigning, regnUd as motorRegnUd } from './matematik'
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
  // Selve facit regnes efter i kontrol.ts (uafhængig kontrol). Her: validering, usikkerhed og hint-læk.
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
