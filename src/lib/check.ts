import type { Opgave, TalOpgave, CifferOpgave } from '../types'

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

export function talCorrect(o: TalOpgave, input: string): boolean {
  const s = input.trim()
  if (o.accept?.includes(s)) return true
  const n = parseNumber(s)
  return n !== null && Math.abs(n - o.answer) < 1e-9
}

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
  }
}
