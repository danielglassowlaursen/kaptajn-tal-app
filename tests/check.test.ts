import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import type { BroekOpgave, FlereOpgave, TalOpgave, UdtrykOpgave } from '../src/types'
import { answerText, broekCorrect, flereCorrect, talCorrect, udtrykCorrect } from '../src/lib/check'

const base = { id: 'o1', story: 's', question: 'q' }

describe('svar på tal', () => {
  const o: TalOpgave = { ...base, type: 'tal', answer: 379 }
  it('godkender rigtige svar og afviser forkerte', () => {
    expect(talCorrect(o, '379')).toBe(true)
    expect(talCorrect(o, ' 379 ')).toBe(true)
    expect(talCorrect(o, '380')).toBe(false)
    expect(talCorrect(o, '')).toBe(false)
    expect(talCorrect(o, 'abc')).toBe(false)
  })
  it('decimalkomma, punktum og brøk', () => {
    const d: TalOpgave = { ...base, type: 'tal', answer: 1.5 }
    expect(talCorrect(d, '1,5')).toBe(true)
    expect(talCorrect(d, '1.5')).toBe(true)
    expect(talCorrect(d, '3/2')).toBe(true)
    expect(talCorrect(d, '1,4')).toBe(false)
  })
  it('afrunding', () => {
    const p: TalOpgave = { ...base, type: 'tal', answer: Math.sqrt(65), decimaler: 1 }
    expect(talCorrect(p, '8,1')).toBe(true)
    expect(talCorrect(p, '8,06')).toBe(true)
    expect(talCorrect(p, '8')).toBe(false)
    expect(talCorrect(p, '8,2')).toBe(false)
  })
  it('ethvert heltal godkendes kun som sig selv', () => {
    fc.assert(
      fc.property(fc.integer({ min: -100000, max: 100000 }), fc.integer({ min: 1, max: 1000 }), (n, d) => {
        const t: TalOpgave = { ...base, type: 'tal', answer: n }
        expect(talCorrect(t, String(n))).toBe(true)
        expect(talCorrect(t, String(n + d))).toBe(false)
      }),
      { numRuns: 2000 },
    )
  })
})

describe('flere løsninger', () => {
  const o: FlereOpgave = { ...base, type: 'flere', answers: [2, 3] }
  it('kræver alle løsninger i vilkårlig rækkefølge', () => {
    expect(flereCorrect(o, ['2', '3'], false)).toBe(true)
    expect(flereCorrect(o, ['3', '2'], false)).toBe(true)
    expect(flereCorrect(o, ['3', '', '2'], false)).toBe(true)
    expect(flereCorrect(o, ['2', ''], false)).toBe(false)
    expect(flereCorrect(o, ['2', '3', '4'], false)).toBe(false)
    expect(flereCorrect(o, [], true)).toBe(false)
  })
  it('dobbeltrod og ingen løsning', () => {
    const dobbelt: FlereOpgave = { ...base, type: 'flere', answers: [4, 4] }
    expect(flereCorrect(dobbelt, ['4', ''], false)).toBe(true)
    const ingen: FlereOpgave = { ...base, type: 'flere', answers: [] }
    expect(flereCorrect(ingen, [], true)).toBe(true)
    expect(flereCorrect(ingen, ['0'], false)).toBe(false)
  })
})

describe('brøk', () => {
  const o: BroekOpgave = { ...base, type: 'broek', answer: [5, 6] }
  it('godkender ligeværdige brøker', () => {
    expect(broekCorrect(o, '5', '6')).toBe(true)
    expect(broekCorrect(o, '10', '12')).toBe(true)
    expect(broekCorrect(o, '5', '7')).toBe(false)
    expect(broekCorrect(o, '5', '0')).toBe(false)
  })
  it('kræver forkortet, når opgaven siger det', () => {
    const f: BroekOpgave = { ...o, forkortet: true }
    expect(broekCorrect(f, '5', '6')).toBe(true)
    expect(broekCorrect(f, '10', '12')).toBe(false)
  })
})

describe('udtryk', () => {
  const o: UdtrykOpgave = { ...base, type: 'udtryk', answer: '2x + 6' }
  it('godkender ligeværdige skrivemåder', () => {
    expect(udtrykCorrect(o, '2x+6')).toBe(true)
    expect(udtrykCorrect(o, '6 + 2x')).toBe(true)
    expect(udtrykCorrect(o, '2(x+3)')).toBe(true)
    expect(udtrykCorrect(o, '3x + 6')).toBe(false)
    expect(udtrykCorrect(o, 'x +')).toBe(false)
  })
})

describe('facit-tekst', () => {
  it('viser facit læsbart', () => {
    expect(answerText({ ...base, type: 'flere', answers: [2, 3] })).toBe('x = 2 eller x = 3')
    expect(answerText({ ...base, type: 'flere', answers: [] })).toBe('ingen løsning')
    expect(answerText({ ...base, type: 'broek', answer: [5, 6] })).toBe('5/6')
    expect(answerText({ ...base, type: 'tal', answer: 1.5, unit: 'cm' })).toBe('1,5 cm')
  })
})
