// ---------------------------------------------------------------------------
// Tjek af AI'ens udkast, før en voksen gemmer det: facit regnes efter, hvor det
// kan lade sig gøre, og hint 2 må ikke afsløre facit.
// ---------------------------------------------------------------------------
import type { Opgave } from '../types'
import { tjekOpgave } from './togtFil'

export interface Fund {
  niveau: 'fejl' | 'advarsel'
  tekst: string
}

/** Regn et simpelt udtryk ud (kun tal, + − · : × ÷ og parenteser). null hvis det ikke kan. */
export function regnUd(udtryk: string): number | null {
  const t = udtryk
    .replace(/−|–/g, '-')
    .replace(/·|×|\*/g, '*')
    .replace(/:|÷/g, '/')
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/\s+/g, '')
  if (!/^[\d.+\-*/()]+$/.test(t) || !/\d/.test(t)) return null
  try {
    // Sikkert: strengen indeholder kun cifre, punktum, parenteser og de fire regningsarter.
    const v = Function(`"use strict"; return (${t})`)() as unknown
    return typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 1e9) / 1e9 : null
  } catch {
    return null
  }
}

/** Facit fra et regnestykke som "362 + 17", "17 + x = 25" eller "30 : x, hvor x = 3". */
export function facitFraRegnestykke(r: string, svar: number): boolean | null {
  const ren = r.replace(/\s*=\s*\?\s*$/, '').trim()
  if (/x/i.test(ren) && ren.includes('=')) {
    // Ligning: sæt svaret ind for x og tjek, at begge sider er lige store.
    const [v, h] = ren.split('=')
    const sub = (s: string) => regnUd(s.replace(/(\d)\s*x/gi, '$1*x').replace(/x/gi, `(${svar})`))
    const a = sub(v)
    const b = sub(h)
    return a === null || b === null ? null : Math.abs(a - b) < 1e-9
  }
  const v = regnUd(ren)
  return v === null ? null : Math.abs(v - svar) < 1e-9
}

function facitTal(o: Opgave): string[] {
  switch (o.type) {
    case 'tal':
      return Number.isFinite(o.answer) ? [String(o.answer), String(o.answer).replace('.', ',')] : []
    case 'talraekke':
      return o.answers.map(String)
    case 'koordinat':
      return [`${o.answer[0]};${o.answer[1]}`, `(${o.answer[0]}`]
    default:
      return []
  }
}

export function tjekUdkast(o: Opgave, nr: number, usikker?: string): Fund[] {
  const fund: Fund[] = tjekOpgave(o as unknown as Record<string, unknown>, nr).map((tekst) => ({ niveau: 'fejl' as const, tekst }))
  if (usikker) fund.push({ niveau: 'advarsel', tekst: `AI'en var usikker: ${usikker}` })

  if (o.type === 'tal' && o.regnestykke && Number.isFinite(o.answer)) {
    const ok = facitFraRegnestykke(o.regnestykke, o.answer)
    if (ok === false) fund.push({ niveau: 'advarsel', tekst: `Facit ${o.answer} passer ikke med regnestykket "${o.regnestykke}". Tjek det.` })
  }
  if (o.type === 'sammenlign') {
    const a = regnUd(o.left)
    const b = regnUd(o.right)
    if (a !== null && b !== null) {
      const rigtigt = a > b ? '>' : a < b ? '<' : '='
      if (rigtigt !== o.answer) fund.push({ niveau: 'advarsel', tekst: `${o.left} = ${a} og ${o.right} = ${b}, så tegnet burde være "${rigtigt}".` })
    }
  }
  if (o.type === 'sorter') {
    const tal = o.items.map((x) => Number(x.replace(',', '.')))
    if (tal.every(Number.isFinite)) {
      const forventet = [...o.items].sort((x, y) => Number(x.replace(',', '.')) - Number(y.replace(',', '.')))
      if (forventet.join('|') !== o.sorted.join('|')) fund.push({ niveau: 'advarsel', tekst: `Sorteringen ser forkert ud. Forventet: ${forventet.join(', ')}.` })
    }
  }
  if (o.type === 'felter' && o.answer > o.total) fund.push({ niveau: 'fejl', tekst: 'Flere felter i facit end i figuren.' })

  const h2 = o.hints?.[1] ?? ''
  for (const f of facitTal(o)) {
    if (f && new RegExp(`(^|[^0-9,.])${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![0-9])`).test(h2)) {
      fund.push({ niveau: 'advarsel', tekst: `Hint 2 nævner facit (${f}). Omskriv det, så barnet selv tager sidste skridt.` })
      break
    }
  }
  if ((o.hints?.length ?? 0) < 2) fund.push({ niveau: 'advarsel', tekst: 'Opgaven har færre end to hints.' })
  return fund
}
