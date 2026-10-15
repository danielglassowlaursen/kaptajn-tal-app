import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { afrund, ensUdtryk, laesBroek, loeserLigning, regnUd } from '../src/lib/matematik'

describe('regnUd – faste eksempler', () => {
  const tilfaelde: [string, number | null][] = [
    ['362 + 17', 379],
    ['210 − 60', 150],
    ['5 · 12', 60],
    ['40 : 5', 8],
    ['5,5 + 1,5', 7],
    ['120 + 44 − 17', 147],
    ['3 · 12 + 5', 41],
    ['2^3', 8],
    ['3² + 4²', 25],
    ['√(9+16)', 5],
    ['sqrt(4^2 + 7^2)', Math.round(Math.sqrt(65) * 1e9) / 1e9],
    ['-2^2', -4],
    ['(-2)^2', 4],
    ['2^-1', 0.5],
    ['2(3+4)', 14],
    ['3/4', 0.75],
    ['2/3 + 1/6', Math.round((5 / 6) * 1e9) / 1e9],
    ['10 − 2 − 3', 5],
    ['100 : 10 : 2', 5],
    ['2 · 3^2', 18],
    ['2 m', null],
    ['', null],
    ['3 +', null],
    ['(2 + 3', null],
  ]
  it.each(tilfaelde)('%s = %s', (udtryk, facit) => {
    expect(regnUd(udtryk)).toBe(facit)
  })
})

describe('regnUd – tilfældige regnestykker', () => {
  const heltal = fc.integer({ min: -999, max: 999 })
  it('følger regnereglernes rækkefølge (gange før plus)', () => {
    fc.assert(
      fc.property(heltal, heltal, heltal, (a, b, c) => {
        expect(regnUd(`${a} + ${b} · ${c}`)).toBe(a + b * c)
        expect(regnUd(`(${a} + ${b}) · ${c}`)).toBe((a + b) * c)
        expect(regnUd(`${a} − ${b} − ${c}`)).toBe(a - b - c)
      }),
      { numRuns: 2000 },
    )
  })
  it('division og decimalkomma', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 999 }), fc.integer({ min: 1, max: 99 }), (a, b) => {
        expect(regnUd(`${a * b} : ${b}`)).toBe(a)
        expect(regnUd(`${a},5 + ${b},5`)).toBe(a + b + 1)
      }),
      { numRuns: 1000 },
    )
  })
})

/** Skriv et polynomium pænt med fortegn, som et regneark ville. */
function andengrad(r1: number, r2: number): string {
  const b = -(r1 + r2)
  const c = r1 * r2
  const led = (k: number, x: string) => (k === 0 ? '' : `${k < 0 ? ' - ' : ' + '}${Math.abs(k) === 1 && x ? '' : Math.abs(k)}${x}`)
  return `x^2${led(b, 'x')}${led(c, '')} = 0`
}

describe('ligninger', () => {
  it('faste eksempler', () => {
    expect(loeserLigning('17 + x = 25', 8)).toBe(true)
    expect(loeserLigning('30 − x = 17', 13)).toBe(true)
    expect(loeserLigning('30 − x = 17', 12)).toBe(false)
    expect(loeserLigning('2 · x = 14', 7)).toBe(true)
    expect(loeserLigning('3x + 7 = 22', 5)).toBe(true)
    expect(loeserLigning('2x² = 18', -3)).toBe(true)
    expect(loeserLigning('ingen lighedstegn', 3)).toBe(null)
  })
  it('andengradsligninger bygget af kendte rødder: begge rødder passer, andre tal gør ikke', () => {
    const rod = fc.integer({ min: -20, max: 20 })
    fc.assert(
      fc.property(rod, rod, rod, (r1, r2, andet) => {
        const l = andengrad(r1, r2)
        expect(loeserLigning(l, r1)).toBe(true)
        expect(loeserLigning(l, r2)).toBe(true)
        if (andet !== r1 && andet !== r2) expect(loeserLigning(l, andet)).toBe(false)
      }),
      { numRuns: 2000 },
    )
  })
  it('førstegradsligninger ax + b = c bygget af kendt x', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 30 }), fc.integer({ min: -50, max: 50 }), fc.integer({ min: -50, max: 50 }), (a, b, x) => {
        const l = `${a}x ${b < 0 ? '-' : '+'} ${Math.abs(b)} = ${a * x + b}`
        expect(loeserLigning(l, x)).toBe(true)
        expect(loeserLigning(l, x + 1)).toBe(false)
      }),
      { numRuns: 2000 },
    )
  })
})

describe('ens udtryk', () => {
  it('faste eksempler', () => {
    expect(ensUdtryk('2x + 3x', '5x')).toBe(true)
    expect(ensUdtryk('(x+1)^2', 'x² + 2x + 1')).toBe(true)
    expect(ensUdtryk('x(x-1)', 'x^2 - x')).toBe(true)
    expect(ensUdtryk('3(x + 2) - x', '2x + 6')).toBe(true)
    expect(ensUdtryk('2x + 3', '2x + 4')).toBe(false)
    expect(ensUdtryk('3a + 2a', '5a')).toBe(true)
    expect(ensUdtryk('kan ikke læses +', 'x')).toBe(null)
  })
  it('a(x + b) er lig ax + ab, og ikke lig ax + ab + 1', () => {
    const k = fc.integer({ min: -12, max: 12 })
    fc.assert(
      fc.property(k, k, (a, b) => {
        const udvidet = `${a}x ${a * b < 0 ? '-' : '+'} ${Math.abs(a * b)}`
        expect(ensUdtryk(`${a}(x + ${b})`.replace('+ -', '- '), udvidet)).toBe(true)
        expect(ensUdtryk(`${a}(x + ${b})`.replace('+ -', '- '), `${udvidet} + 1`)).toBe(false)
      }),
      { numRuns: 1000 },
    )
  })
})

describe('brøker og afrunding', () => {
  it('læser brøker og hele tal', () => {
    expect(laesBroek('3/4')).toEqual([3, 4])
    expect(laesBroek('6')).toEqual([6, 1])
    expect(laesBroek('-2/5')).toEqual([-2, 5])
    expect(laesBroek('1/0')).toBe(null)
    expect(laesBroek('abc')).toBe(null)
  })
  it('afrunder', () => {
    expect(afrund(Math.sqrt(50), 2)).toBe(7.07)
    expect(afrund(Math.sqrt(65), 1)).toBe(8.1)
    expect(afrund(2.5, 0)).toBe(3)
  })
})
