import type { Opgave, TalOpgave, CifferOpgave, FlereOpgave, BroekOpgave, UdtrykOpgave } from '../types'
import { afrund, ensUdtryk, laesBroek, regnUd } from './matematik'

/** "7,5" -> 7.5, "1 000" -> 1000. null hvis det ikke er et tal. */
export function parseNumber(s: string): number | null {
  const t = s.trim().replace(/\s+/g, '').replace(',', '.')
  if (t === '' || !/^-?\d*(\.\d+)?$/.test(t)) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

export function formatNumber(n: number): string {
  return String(n).replace('.', ',')
}

/** Er tallet rigtigt? Med decimaler godkendes svar, der afrundes til det samme. */
export function talMatcher(n: number, facit: number, decimaler?: number): boolean {
  if (decimaler === undefined) return Math.abs(n - facit) < 1e-9
  return Math.abs(afrund(n, decimaler) - afrund(facit, decimaler)) < 1e-9
}

/** Tal fra input: "7,5", "-3", og også en brøk som "3/4". */
export function laesTal(s: string): number | null {
  const n = parseNumber(s)
  if (n !== null) return n
  const b = laesBroek(s)
  return b ? b[0] / b[1] : null
}

export function talCorrect(o: TalOpgave, input: string): boolean {
  const s = input.trim()
  if (o.accept?.includes(s)) return true
  const n = laesTal(s)
  return n !== null && talMatcher(n, o.answer, o.decimaler)
}

/** Alle løsninger skal med, i vilkårlig rækkefølge. ingenLoesning = barnet har valgt "ingen løsning". */
export function flereCorrect(o: FlereOpgave, input: string[], ingenLoesning: boolean): boolean {
  if (o.answers.length === 0) return ingenLoesning
  if (ingenLoesning) return false
  const tal = input.map((x) => x.trim()).filter(Boolean).map(laesTal)
  if (tal.some((x) => x === null)) return false
  const unikke = (tal as number[]).filter((v, i, a) => a.findIndex((w) => talMatcher(w, v, o.decimaler)) === i)
  const facit = o.answers.filter((v, i, a) => a.findIndex((w) => talMatcher(w, v, o.decimaler)) === i)
  return unikke.length === facit.length && facit.every((f) => unikke.some((v) => talMatcher(v, f, o.decimaler)))
}

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b))

export function broekCorrect(o: BroekOpgave, taeller: string, naevner: string): boolean {
  const t = Number(taeller.trim())
  const n = naevner.trim() === '' ? 1 : Number(naevner.trim())
  if (!Number.isInteger(t) || !Number.isInteger(n) || n === 0) return false
  const [ft, fn] = o.answer
  if (t * fn !== ft * n) return false
  return !o.forkortet || gcd(t, n) === 1
}

export function udtrykCorrect(o: UdtrykOpgave, input: string): boolean {
  return ensUdtryk(input, o.answer) === true
}

export { regnUd }

export function sameSet(a: Iterable<string>, b: Iterable<string>): boolean {
  const A = new Set(a)
  const B = new Set(b)
  if (A.size !== B.size) return false
  for (const x of A) if (!B.has(x)) return false
  return true
}

const PLACE_INDEX: Record<CifferOpgave['place'], number> = {
  enere: 0,
  tiere: 1,
  hundreder: 2,
  tusinder: 3,
}

/** Nøgler "<talIndex>-<cifferIndex>" for de cifre, der skal vælges. */
export function cifferTargets(numbers: string[], place: CifferOpgave['place']): Set<string> {
  const out = new Set<string>()
  numbers.forEach((num, ni) => {
    const di = num.length - 1 - PLACE_INDEX[place]
    if (di >= 0) out.add(`${ni}-${di}`)
  })
  return out
}

/** Læsbart facit til feedback-boksen. */
export function answerText(o: Opgave): string {
  switch (o.type) {
    case 'tal':
      return formatNumber(o.answer) + (o.unit ? ` ${o.unit}` : '')
    case 'talraekke':
      return o.answers.map(formatNumber).join(', ')
    case 'vaelg':
      return o.correct.join(', ')
    case 'sammenlign':
      return `${o.left} ${o.answer} ${o.right}`
    case 'sorter':
      return o.sorted.join('  ·  ')
    case 'valg':
      return o.answer
    case 'felter':
      return `${o.answer} felter`
    case 'ciffer': {
      const targets = cifferTargets(o.numbers, o.place)
      return o.numbers
        .map((num, ni) => {
          const hit = [...targets].find((k) => k.startsWith(`${ni}-`))
          return hit ? `${num} → ${num[Number(hit.split('-')[1])]}` : `${num} → ingen`
        })
        .join(', ')
    }
    case 'koordinat':
      return `(${o.answer[0]} ; ${o.answer[1]})`
    case 'flere': {
      const v = o.variabel ?? 'x'
      return o.answers.length === 0 ? 'ingen løsning' : o.answers.map((a) => `${v} = ${formatNumber(a)}`).join(' eller ')
    }
    case 'broek':
      return o.answer[1] === 1 ? String(o.answer[0]) : `${o.answer[0]}/${o.answer[1]}`
    case 'udtryk':
      return o.answer
  }
}
