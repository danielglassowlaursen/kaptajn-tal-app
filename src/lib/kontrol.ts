// ---------------------------------------------------------------------------
// Uafhængig kontrol af facit. Appen regner selv facit ud fra opgavens
// "udregning" eller "regnestykke" (eller fra opgavens data) og sammenligner med
// AI'ens facit. Kan appen ikke afgøre det, siger den "ukendt" – den gætter aldrig.
//
//   bekraeftet  appen får samme facit
//   uenig       appen får et andet facit (forslag indeholder appens udgave)
//   ukendt      appen kan ikke regne opgaven efter – en voksen må tjekke arket
// ---------------------------------------------------------------------------
import type { Opgave } from '../types'
import { afrund, ensUdtryk, laesUdtryk, normaliser, regnUd } from './matematik'
import { answerText, formatNumber, talMatcher } from './check'

export type KontrolStatus = 'bekraeftet' | 'uenig' | 'ukendt'

export interface Kontrol {
  status: KontrolStatus
  /** Hvordan appen kom frem til sit facit. */
  hvordan?: string
  /** Appens facit som tekst (ved uenighed). */
  appFacit?: string
  /** Opgaven med appens facit (ved uenighed). */
  forslag?: Opgave
}

const ukendt = (hvordan?: string): Kontrol => ({ status: 'ukendt', hvordan })

// ------------------------------------------------------------ enheder og tid

const ENHEDER: Record<string, [string, number]> = {
  mm: ['længde', 1], cm: ['længde', 10], dm: ['længde', 100], m: ['længde', 1000], meter: ['længde', 1000], km: ['længde', 1_000_000],
  sek: ['tid', 1], sekund: ['tid', 1], sekunder: ['tid', 1], s: ['tid', 1], min: ['tid', 60], minut: ['tid', 60], minutter: ['tid', 60],
  time: ['tid', 3600], timer: ['tid', 3600], t: ['tid', 3600], døgn: ['tid', 86400], dage: ['tid', 86400], dag: ['tid', 86400],
  g: ['vægt', 1], gram: ['vægt', 1], kg: ['vægt', 1000], ton: ['vægt', 1_000_000],
  ml: ['rumfang', 1], cl: ['rumfang', 10], dl: ['rumfang', 100], l: ['rumfang', 1000], liter: ['rumfang', 1000],
}

/** "2 timer = ? min", "150 cm = ? m", "0,5 m = ? cm" → det omregnede tal. */
export function omregnEnhed(s: string): number | null {
  const m = s
    .toLowerCase()
    .replace(/\./g, '')
    .match(/^\s*(-?\d+(?:,\d+)?)\s*([a-zæøå]+)\s*=\s*(?:\?|_+|x)?\s*([a-zæøå]+)\s*$/)
  if (!m) return null
  const fra = ENHEDER[m[2]]
  const til = ENHEDER[m[3]]
  if (!fra || !til || fra[0] !== til[0]) return null
  return afrund((Number(m[1].replace(',', '.')) * fra[1]) / til[1], 9)
}

/** "9:15 → 16:15", "fra kl. 9.15 til kl. 16.15" → antal minutter. */
export function tidsforskel(s: string): number | null {
  const tider = [...s.matchAll(/(\d{1,2})[:.](\d{2})/g)].map((m) => Number(m[1]) * 60 + Number(m[2]))
  if (tider.length !== 2) return null
  const d = tider[1] - tider[0]
  return d >= 0 ? d : d + 24 * 60
}

/** "3 hundreder, 5 enere og 6 tiere" → 365. null hvis teksten ikke beskriver pladser. */
export function pladsvaerdi(s: string): number | null {
  const vaegt: Record<string, number> = {
    enere: 1, ener: 1, tiere: 10, tier: 10, hundreder: 100, hundrede: 100, tusinder: 1000, tusinde: 1000, tusind: 1000, titusinder: 10000,
  }
  const fund = [...s.toLowerCase().matchAll(/(\d+)\s+(titusinder|tusinder|tusinde|tusind|hundreder|hundrede|tiere|tier|enere|ener)\b/g)]
  if (fund.length < 2) return null
  return fund.reduce((sum, m) => sum + Number(m[1]) * vaegt[m[2]], 0)
}

// ------------------------------------------------------------ ligninger

/** Alle reelle løsninger til "venstre = højre" i [-200; 200] (dobbeltrødder kommer med én gang). */
export function loesLigning(ligning: string, variabel = 'x'): number[] | null {
  const dele = ligning.split('=')
  if (dele.length !== 2) return null
  const v = laesUdtryk(dele[0])
  const h = laesUdtryk(dele[1])
  if (!v || !h) return null
  const vars = new Set([...v.variabler, ...h.variabler])
  if (vars.size !== 1 || !vars.has(variabel)) return null
  const f = (x: number) => {
    try {
      return v.regn({ [variabel]: x }) - h.regn({ [variabel]: x })
    } catch {
      return Number.NaN
    }
  }
  const roedder: number[] = []
  const tilfoej = (r: number) => {
    // Snap til et "pænt" tal (heltal, halve, tiendedele …), hvis det passer mindst lige så godt.
    let rr = afrund(r, 9)
    for (const d of [0, 1, 2, 3, 4]) {
      const c = afrund(r, d)
      if (Math.abs(c - r) < 1e-4 && Math.abs(f(c)) <= Math.abs(f(r)) + 1e-12) {
        rr = c
        break
      }
    }
    if (rr === 0) rr = 0 // undgå -0
    if (!roedder.some((x) => Math.abs(x - rr) < 1e-6)) roedder.push(rr)
  }
  // Grovt net, derefter forfining: halvering ved fortegnsskift, og ternær søgning
  // på |f| ved lokale minima (dobbeltrødder, hvor grafen kun rører x-aksen).
  const MIN = -200
  const MAX = 200
  const N = 8000
  const xs: number[] = []
  const ys: number[] = []
  for (let i = 0; i <= N; i++) {
    const x = MIN + ((MAX - MIN) * i) / N
    xs.push(x)
    ys.push(f(x))
  }
  const skala = Math.max(1, ...ys.filter(Number.isFinite).map(Math.abs).slice(0, 50))
  for (let i = 1; i <= N; i++) {
    const a0 = xs[i - 1]
    const b0 = xs[i]
    const ya = ys[i - 1]
    const yb = ys[i]
    if (!Number.isFinite(ya) || !Number.isFinite(yb)) continue
    if (ya === 0) tilfoej(a0)
    if (Math.sign(ya) !== Math.sign(yb) && ya !== 0 && yb !== 0) {
      let a = a0
      let b = b0
      for (let k = 0; k < 60; k++) {
        const m = (a + b) / 2
        if (Math.sign(f(m)) === Math.sign(f(a))) a = m
        else b = m
      }
      const r = (a + b) / 2
      if (Math.abs(f(r)) < 1e-6 * skala) tilfoej(r)
    }
    // Lokalt minimum af |f| uden fortegnsskift → mulig dobbeltrod
    if (i < N && Number.isFinite(ys[i + 1]) && Math.abs(yb) <= Math.abs(ya) && Math.abs(yb) <= Math.abs(ys[i + 1]) && Math.sign(ya) === Math.sign(ys[i + 1])) {
      let a = a0
      let b = xs[i + 1]
      for (let k = 0; k < 80; k++) {
        const m1 = a + (b - a) / 3
        const m2 = b - (b - a) / 3
        if (Math.abs(f(m1)) < Math.abs(f(m2))) b = m2
        else a = m1
      }
      const r = (a + b) / 2
      if (Math.abs(f(r)) < 1e-9 * skala) tilfoej(r)
    }
  }
  return roedder.sort((a, b) => a - b)
}

function variabelI(s: string): string {
  if (/x/i.test(s)) return 'x'
  return s.toLowerCase().match(/[a-zæøå]/)?.[0] ?? 'x'
}

/** Udtrykket, appen skal regne på: udregning først, ellers regnestykket. Fjerner "= ?" og ", hvor x = 3". */
function kilder(o: Opgave): string[] {
  const k: string[] = []
  for (const s of [o.udregning, o.regnestykke]) {
    if (!s || !s.trim()) continue
    let t = s.trim()
    const hvor = t.match(/,?\s*hvor\s+([a-zæøå])\s*=\s*(-?[\d.,]+)\s*$/i)
    if (hvor) t = t.slice(0, hvor.index).replace(new RegExp(`\\b${hvor[1]}\\b`, 'gi'), `(${hvor[2]})`)
    t = t.replace(/\s*=\s*(\?|_+)\s*$/, '')
    k.push(t)
  }
  return k
}

/** Et enkelt talfacit fra et udtryk eller en ligning med præcis én løsning. */
function talFra(s: string): { v: number; hvordan: string } | null {
  if (s.includes('=')) {
    const r = loesLigning(s, variabelI(s))
    if (r && r.length === 1) return { v: r[0], hvordan: `løste ligningen ${s}` }
    return null
  }
  const v = regnUd(s)
  return v === null ? null : { v, hvordan: `regnede ${s} ud` }
}

// ------------------------------------------------------------ talrækker

function udfyldRaekke(seq: (number | null)[]): number[] | null {
  const kendte = seq.map((v, i) => [i, v] as const).filter((x): x is readonly [number, number] => x[1] !== null)
  if (kendte.length < 2) return null
  const [i0, v0] = kendte[0]
  const [i1, v1] = kendte[1]
  // Aritmetisk: fast spring
  const d = (v1 - v0) / (i1 - i0)
  if (kendte.every(([i, v]) => Math.abs(v0 + d * (i - i0) - v) < 1e-9)) return seq.flatMap((v, i) => (v === null ? [afrund(v0 + d * (i - i0), 9)] : []))
  // Geometrisk: fast faktor
  if (v0 !== 0 && v1 / v0 > 0) {
    const r = (v1 / v0) ** (1 / (i1 - i0))
    if (kendte.every(([i, v]) => Math.abs(v0 * r ** (i - i0) - v) < 1e-6 * Math.max(1, Math.abs(v)))) return seq.flatMap((v, i) => (v === null ? [afrund(v0 * r ** (i - i0), 6)] : []))
  }
  return null
}

// ------------------------------------------------------------ vælg-regler

const BROEKTEGN: Record<string, string> = { '½': '1/2', '¼': '1/4', '¾': '3/4', '⅓': '1/3', '⅔': '2/3' }

function vaerdi(s: string): number | null {
  const t = s.trim().replace(/[½¼¾⅓⅔]/g, (c) => BROEKTEGN[c])
  return regnUd(t)
}

function erPrimtal(n: number) {
  if (!Number.isInteger(n) || n < 2) return false
  for (let k = 2; k * k <= n; k++) if (n % k === 0) return false
  return true
}

function vaelgRegel(tekst: string): ((v: number) => boolean) | null {
  const t = tekst.toLowerCase()
  if (/\bulige\b/.test(t)) return (v) => Number.isInteger(v) && Math.abs(v % 2) === 1
  if (/\blige tal\b/.test(t)) return (v) => Number.isInteger(v) && v % 2 === 0
  if (/\bhele tal\b/.test(t)) return (v) => Number.isInteger(v)
  if (/\bprimtal\b/.test(t)) return erPrimtal
  if (/\bnegative?\b/.test(t)) return (v) => v < 0
  if (/\bpositive?\b/.test(t)) return (v) => v > 0
  return null
}

// ------------------------------------------------------------ kontrol pr. opgavetype

export function kontrol(o: Opgave): Kontrol {
  const uenig = (forslag: Opgave, hvordan: string): Kontrol => ({ status: 'uenig', hvordan, forslag, appFacit: answerText(forslag) })
  const ok = (hvordan: string): Kontrol => ({ status: 'bekraeftet', hvordan })

  switch (o.type) {
    case 'tal': {
      for (const k of kilder(o)) {
        const r = talFra(k)
        if (r) return talMatcher(r.v, o.answer, o.decimaler) ? ok(`Appen ${r.hvordan}`) : uenig({ ...o, answer: r.v }, `Appen ${r.hvordan}`)
        const om = omregnEnhed(k)
        if (om !== null) return talMatcher(om, o.answer, o.decimaler) ? ok(`Appen omregnede ${k}`) : uenig({ ...o, answer: om }, `Appen omregnede ${k}`)
      }
      for (const tekst of [o.regnestykke, o.question].filter(Boolean) as string[]) {
        const om = omregnEnhed(tekst)
        if (om !== null) return talMatcher(om, o.answer, o.decimaler) ? ok(`Appen omregnede ${tekst}`) : uenig({ ...o, answer: om }, `Appen omregnede ${tekst}`)
      }
      const plads = pladsvaerdi(`${o.story} ${o.question}`)
      if (plads !== null) return plads === o.answer ? ok('Appen lagde pladserne sammen') : uenig({ ...o, answer: plads }, 'Appen lagde pladserne sammen')
      const tid = [o.regnestykke ?? '', o.question, o.story].map(tidsforskel).find((x) => x !== null) ?? null
      if (tid !== null && o.unit && /tim|min/i.test(o.unit)) {
        const v = /tim/i.test(o.unit) ? tid / 60 : tid
        return talMatcher(v, o.answer, o.decimaler) ? ok('Appen regnede tidsforskellen ud') : uenig({ ...o, answer: afrund(v, 2) }, 'Appen regnede tidsforskellen ud')
      }
      return ukendt('Opgaven har ingen udregning, appen kan regne på.')
    }

    case 'flere': {
      for (const k of kilder(o)) {
        if (!k.includes('=')) continue
        const r = loesLigning(k, o.variabel ?? variabelI(k))
        if (!r) continue
        const facit = o.answers.filter((v, i, a) => a.findIndex((w) => talMatcher(w, v, o.decimaler)) === i)
        const samme = r.length === facit.length && r.every((x) => facit.some((f) => talMatcher(x, f, o.decimaler)))
        const appSvar = o.decimaler !== undefined ? r.map((x) => afrund(x, o.decimaler!)) : r
        return samme ? ok(`Appen løste ${k} og fandt ${r.length === 0 ? 'ingen løsning' : r.map(formatNumber).join(' og ')}`) : uenig({ ...o, answers: appSvar }, `Appen løste ${k}`)
      }
      return ukendt('Opgaven har ingen ligning, appen kan løse.')
    }

    case 'broek': {
      const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b))
      const [t, n] = o.answer
      if (o.forkortet && gcd(t, n) !== 1) {
        const g = gcd(t, n)
        return uenig({ ...o, answer: [t / g, n / g] }, 'Brøken er ikke forkortet mest muligt')
      }
      for (const k of kilder(o)) {
        const r = talFra(k)
        if (!r) continue
        if (Math.abs(r.v - t / n) < 1e-9) return ok(`Appen ${r.hvordan}`)
        // Find appens brøk med samme nævner-størrelse
        for (let nn = 1; nn <= 1000; nn++) {
          const tt = r.v * nn
          if (Math.abs(tt - Math.round(tt)) < 1e-9) return uenig({ ...o, answer: [Math.round(tt), nn] }, `Appen ${r.hvordan}`)
        }
        return { status: 'uenig', hvordan: `Appen ${r.hvordan}`, appFacit: formatNumber(afrund(r.v, 6)) }
      }
      return ukendt('Opgaven har ingen udregning, appen kan regne på.')
    }

    case 'udtryk': {
      for (const k of kilder(o)) {
        if (k.includes('=')) continue
        const ens = ensUdtryk(k, o.answer)
        if (ens === true) return ok(`Appen tjekkede, at ${o.answer} er lig ${k}`)
        if (ens === false) return { status: 'uenig', hvordan: `${o.answer} er ikke lig ${k}`, appFacit: `noget, der er lig ${k}` }
      }
      return ukendt('Opgaven har intet udtryk, appen kan sammenligne med.')
    }

    case 'sammenlign': {
      const a = regnUd(o.left)
      const b = regnUd(o.right)
      if (a === null || b === null) return ukendt('Appen kan ikke regne begge sider ud.')
      const rigtigt = a > b ? '>' : a < b ? '<' : '='
      const hvordan = `Appen regnede ${o.left} = ${formatNumber(a)} og ${o.right} = ${formatNumber(b)}`
      return rigtigt === o.answer ? ok(hvordan) : uenig({ ...o, answer: rigtigt }, hvordan)
    }

    case 'sorter': {
      if (!o.items.every((x) => vaerdi(x) !== null)) return ukendt('Appen kan ikke læse alle tallene.')
      const sorteret = [...o.items].sort((x, y) => vaerdi(x)! - vaerdi(y)!)
      return sorteret.join('|') === o.sorted.join('|') ? ok('Appen sorterede tallene') : uenig({ ...o, sorted: sorteret }, 'Appen sorterede tallene')
    }

    case 'talraekke': {
      const r = udfyldRaekke(o.sequence)
      if (!r) return ukendt('Appen kan ikke se mønsteret i rækken.')
      const samme = r.length === o.answers.length && r.every((v, i) => Math.abs(v - o.answers[i]) < 1e-6)
      return samme ? ok('Appen fandt mønsteret i rækken') : uenig({ ...o, answers: r }, 'Appen fandt mønsteret i rækken')
    }

    case 'vaelg': {
      const regel = vaelgRegel(`${o.question} ${o.story}`)
      if (!regel || !o.items.every((x) => vaerdi(x) !== null)) return ukendt('Appen kender ikke reglen for, hvad der skal vælges.')
      const rigtige = o.items.filter((x) => regel(vaerdi(x)!))
      const samme = rigtige.length === o.correct.length && rigtige.every((x) => o.correct.includes(x))
      return samme ? ok('Appen fandt selv de rigtige tal') : uenig({ ...o, correct: rigtige }, 'Appen fandt selv de rigtige tal')
    }

    case 'felter': {
      const m = `${o.question} ${o.story}`.match(/(\d+)\s*\/\s*(\d+)/)
      if (!m || o.total <= 0) return ukendt('Appen kan ikke finde brøken i teksten.')
      const forventet = (o.total * Number(m[1])) / Number(m[2])
      if (!Number.isInteger(forventet)) return ukendt('Brøken går ikke op i antallet af felter.')
      return forventet === o.answer ? ok(`Appen regnede ${m[1]}/${m[2]} af ${o.total} ud`) : uenig({ ...o, answer: forventet }, `Appen regnede ${m[1]}/${m[2]} af ${o.total} ud`)
    }

    case 'ciffer':
      return ok('Appen finder selv cifrene på pladsen')

    case 'valg': {
      for (const k of kilder(o)) {
        const r = talFra(k)
        if (!r) continue
        const match = o.options.find((x) => {
          const v = vaerdi(x)
          return v !== null && Math.abs(v - r.v) < 1e-9
        })
        if (!match) return ukendt('Appens resultat er ikke blandt svarmulighederne.')
        return match === o.answer ? ok(`Appen ${r.hvordan}`) : uenig({ ...o, answer: match }, `Appen ${r.hvordan}`)
      }
      return ukendt('Appen kan ikke regne valget ud.')
    }

    case 'koordinat':
      return ukendt('Koordinater aflæses på tegningen – tjek mod arket.')
  }
}

/** Kan en udregning overhovedet læses af appen? Bruges til at advare om dårlige udregninger. */
export function kanRegnes(s: string): boolean {
  const t = normaliser(s)
  return t.includes('=') ? loesLigning(s, variabelI(s)) !== null : regnUd(s) !== null
}
