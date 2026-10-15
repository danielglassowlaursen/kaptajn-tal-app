import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import type { Opgave } from '../src/types'
import { kontrol, loesLigning, omregnEnhed, tidsforskel } from '../src/lib/kontrol'
import { demoTogter } from '../src/data/togter'
import { TEMA_LISTE } from '../src/tema'

const b = { id: 'o', story: '', question: '' }
const tal = (regnestykke: string, answer: number, ekstra: Partial<Opgave> = {}): Opgave => ({ ...b, type: 'tal', regnestykke, answer, ...ekstra }) as Opgave

describe('tal: appen regner selv efter', () => {
  it.each([
    ['362 + 17', 379],
    ['210 − 60', 150],
    ['5 · 12', 60],
    ['40 : 5', 8],
    ['5,5 + 1,5', 7],
    ['120 + 44 − 17', 147],
    ['17 + x = 25', 8],
    ['30 − x = 17', 13],
    ['2 · x = 14', 7],
    ['x − 12 = 10', 22],
    ['30 : x, hvor x = 3', 10],
    ['15 : x + 10, hvor x = 3', 15],
    ['3x + 7 = 22', 5],
  ])('%s = %s bekræftes', (r, facit) => {
    expect(kontrol(tal(r, facit)).status).toBe('bekraeftet')
  })
  it.each([
    ['9 · 6', 56, 54],
    ['362 + 17', 389, 379],
    ['17 + x = 25', 7, 8],
    ['530 : 2', 256, 265],
  ])('%s med forkert facit %s fanges, og appen foreslår %s', (r, forkert, rigtigt) => {
    const k = kontrol(tal(r, forkert))
    expect(k.status).toBe('uenig')
    expect(k.forslag && k.forslag.type === 'tal' && k.forslag.answer).toBe(rigtigt)
  })
  it('afrunding', () => {
    expect(kontrol(tal('sqrt(4^2 + 7^2)', 8.06, { decimaler: 1 })).status).toBe('bekraeftet')
    expect(kontrol(tal('sqrt(4^2 + 7^2)', 8.2, { decimaler: 1 })).status).toBe('uenig')
  })
  it('udregning har forrang for regnestykket', () => {
    expect(kontrol(tal('2 timer = ? min', 120, { udregning: '2 · 60' })).status).toBe('bekraeftet')
    expect(kontrol(tal('2 timer = ? min', 100, { udregning: '2 · 60' })).status).toBe('uenig')
  })
  it('enhedsomregning uden udregning', () => {
    expect(kontrol(tal('2 timer = ? min', 120)).status).toBe('bekraeftet')
    expect(kontrol(tal('150 cm = ? m', 1.5)).status).toBe('bekraeftet')
    expect(kontrol(tal('0,5 m = ? cm', 50)).status).toBe('bekraeftet')
    expect(kontrol(tal('12 cm = ? mm', 120)).status).toBe('bekraeftet')
    expect(kontrol(tal('1 km = ? m', 100)).status).toBe('uenig')
  })
  it('tidsforskel', () => {
    expect(kontrol({ ...b, type: 'tal', regnestykke: '9:15 → 16:15', answer: 7, unit: 'timer' } as Opgave).status).toBe('bekraeftet')
    expect(kontrol({ ...b, type: 'tal', regnestykke: '9:15 → 16:15', answer: 6, unit: 'timer' } as Opgave).status).toBe('uenig')
  })
  it('pladsværdi beskrevet i tekst', () => {
    expect(kontrol({ ...b, type: 'tal', story: 'Koden består af 3 hundreder, 5 enere og 6 tiere.', answer: 365 } as Opgave).status).toBe('bekraeftet')
    expect(kontrol({ ...b, type: 'tal', story: 'Koden består af 4 hundreder, 2 tusinder, 7 enere og 3 tiere.', answer: 2437 } as Opgave).status).toBe('bekraeftet')
    expect(kontrol({ ...b, type: 'tal', story: 'Koden består af 3 hundreder, 5 enere og 6 tiere.', answer: 356 } as Opgave).status).toBe('uenig')
  })
  it('tidsforskel når tiderne står både i regnestykket og i historien', () => {
    expect(kontrol({ ...b, type: 'tal', story: 'Stormen begyndte kl. 9:15 og sluttede kl. 16:15.', regnestykke: '9:15 → 16:15', answer: 7, unit: 'timer' } as Opgave).status).toBe('bekraeftet')
  })
  it('uden noget at regne på er status ukendt – appen gætter aldrig', () => {
    expect(kontrol({ ...b, type: 'tal', answer: 7, question: 'Hvor lang er rebet?' } as Opgave).status).toBe('ukendt')
  })
  it('tilfældige regnestykker: rigtigt facit bekræftes, forkert fanges', () => {
    const n = fc.integer({ min: -500, max: 500 })
    fc.assert(
      fc.property(n, n, n, fc.integer({ min: 1, max: 50 }), (x, y, z, d) => {
        const r = `${x} + ${y} · ${z}`
        expect(kontrol(tal(r, x + y * z)).status).toBe('bekraeftet')
        const k = kontrol(tal(r, x + y * z + d))
        expect(k.status).toBe('uenig')
        expect(k.forslag?.type === 'tal' && k.forslag.answer).toBe(x + y * z)
      }),
      { numRuns: 1000 },
    )
  })
})

describe('flere løsninger: appen finder selv alle rødder', () => {
  const flere = (regnestykke: string, answers: number[]): Opgave => ({ ...b, type: 'flere', regnestykke, answers }) as Opgave
  it('faste eksempler', () => {
    expect(loesLigning('x^2 - 5x + 6 = 0')).toEqual([2, 3])
    expect(loesLigning('x^2 + 1 = 0')).toEqual([])
    expect(loesLigning('x^2 - 4x + 4 = 0')).toEqual([2])
    expect(loesLigning('2x^2 = 18')).toEqual([-3, 3])
    expect(kontrol(flere('x^2 - 5x + 6 = 0', [3, 2])).status).toBe('bekraeftet')
    expect(kontrol(flere('x^2 - 5x + 6 = 0', [2])).status).toBe('uenig')
    expect(kontrol(flere('x^2 + 1 = 0', [])).status).toBe('bekraeftet')
    expect(kontrol(flere('x^2 - 4x + 4 = 0', [2])).status).toBe('bekraeftet')
  })
  it('tilfældige andengradsligninger bygget af kendte rødder', () => {
    const r = fc.integer({ min: -30, max: 30 })
    fc.assert(
      fc.property(r, r, (r1, r2) => {
        const s = -(r1 + r2)
        const p = r1 * r2
        const l = `x^2 ${s < 0 ? '-' : '+'} ${Math.abs(s)}x ${p < 0 ? '-' : '+'} ${Math.abs(p)} = 0`
        const forventet = [...new Set([r1, r2])].sort((a, c) => a - c)
        expect(loesLigning(l)).toEqual(forventet)
        expect(kontrol(flere(l, [r2, r1])).status).toBe('bekraeftet')
        // Mangler en rod eller har en forkert rod → fanges
        if (r1 !== r2) expect(kontrol(flere(l, [r1])).status).toBe('uenig')
        expect(kontrol(flere(l, [r1, r2 + 1])).status).toBe('uenig')
      }),
      { numRuns: 300 },
    )
  }, 30000)
  it('løsninger med halve', () => {
    expect(loesLigning('2x^2 - 3x + 1 = 0')).toEqual([0.5, 1])
  })
})

describe('øvrige typer', () => {
  it('sammenlign', () => {
    expect(kontrol({ ...b, type: 'sammenlign', left: '4 · 7', right: '30 − 3', answer: '>' } as Opgave).status).toBe('bekraeftet')
    const k = kontrol({ ...b, type: 'sammenlign', left: '4 · 7', right: '30 − 3', answer: '<' } as Opgave)
    expect(k.status).toBe('uenig')
    expect(k.forslag?.type === 'sammenlign' && k.forslag.answer).toBe('>')
  })
  it('sortér, også med decimalkomma', () => {
    expect(kontrol({ ...b, type: 'sorter', items: ['2,5', '3,1', '0,5', '1,9'], sorted: ['0,5', '1,9', '2,5', '3,1'] } as Opgave).status).toBe('bekraeftet')
    expect(kontrol({ ...b, type: 'sorter', items: ['162', '155', '140'], sorted: ['140', '162', '155'] } as Opgave).status).toBe('uenig')
  })
  it('talrækker: fast spring og fordobling', () => {
    expect(kontrol({ ...b, type: 'talraekke', sequence: [null, 16, null, 24, 28, null], answers: [12, 20, 32] } as Opgave).status).toBe('bekraeftet')
    expect(kontrol({ ...b, type: 'talraekke', sequence: [null, 16, null, 24, 28, null], answers: [12, 20, 30] } as Opgave).status).toBe('uenig')
    expect(kontrol({ ...b, type: 'talraekke', sequence: [1, 2, 4, 8, null], answers: [16] } as Opgave).status).toBe('bekraeftet')
    expect(kontrol({ ...b, type: 'talraekke', sequence: [null, 12, null, 20, null, 28, null], answers: [8, 16, 24, 32] } as Opgave).status).toBe('bekraeftet')
  })
  it('vælg lige tal og hele tal', () => {
    expect(kontrol({ ...b, type: 'vaelg', question: 'Tryk på alle de lige tal.', items: ['46', '43', '5', '32', '7', '50', '1', '8'], correct: ['46', '32', '50', '8'] } as Opgave).status).toBe('bekraeftet')
    expect(kontrol({ ...b, type: 'vaelg', question: 'Tryk på alle de lige tal.', items: ['46', '43', '5'], correct: ['46', '5'] } as Opgave).status).toBe('uenig')
    expect(kontrol({ ...b, type: 'vaelg', question: 'Tryk på alle de hele tal.', items: ['13', '2,5', '½', '1', '0,2', '√5'], correct: ['13', '1'] } as Opgave).status).toBe('bekraeftet')
  })
  it('felter med brøk i teksten', () => {
    expect(kontrol({ ...b, type: 'felter', story: 'Mal 1/4 af felterne.', total: 12, cols: 6, answer: 3 } as Opgave).status).toBe('bekraeftet')
    expect(kontrol({ ...b, type: 'felter', story: 'Mal 1/4 af felterne.', total: 12, cols: 6, answer: 4 } as Opgave).status).toBe('uenig')
  })
  it('brøk og forkortning', () => {
    expect(kontrol({ ...b, type: 'broek', regnestykke: '2/3 + 1/6', answer: [5, 6] } as Opgave).status).toBe('bekraeftet')
    expect(kontrol({ ...b, type: 'broek', regnestykke: '2/3 + 1/6', answer: [4, 6] } as Opgave).status).toBe('uenig')
    const k = kontrol({ ...b, type: 'broek', regnestykke: '2/3 + 1/6', answer: [10, 12], forkortet: true } as Opgave)
    expect(k.status).toBe('uenig')
    expect(k.forslag?.type === 'broek' && k.forslag.answer).toEqual([5, 6])
  })
  it('udtryk', () => {
    expect(kontrol({ ...b, type: 'udtryk', regnestykke: '3(x + 2) - x', answer: '2x + 6' } as Opgave).status).toBe('bekraeftet')
    expect(kontrol({ ...b, type: 'udtryk', regnestykke: '3(x + 2) - x', answer: '2x + 5' } as Opgave).status).toBe('uenig')
  })
  it('koordinater kan ikke regnes efter', () => {
    expect(kontrol({ ...b, type: 'koordinat', answer: [4, 4] } as Opgave).status).toBe('ukendt')
  })
})

describe('hjælpefunktioner', () => {
  it('enheder og tid', () => {
    expect(omregnEnhed('4 cm = ? mm')).toBe(40)
    expect(omregnEnhed('60 mm = ? cm')).toBe(6)
    expect(omregnEnhed('1 min = ? sek')).toBe(60)
    expect(omregnEnhed('2 kg = ? g')).toBe(2000)
    expect(omregnEnhed('3 dl = ? l')).toBe(0.3)
    expect(omregnEnhed('2 kg = ? cm')).toBe(null)
    expect(tidsforskel('fra kl. 9.15 til kl. 16.15')).toBe(420)
    expect(tidsforskel('22:30 til 01:00')).toBe(150)
  })
})

describe('prøvetogterne: ingen uenighed med appen', () => {
  for (const tema of TEMA_LISTE) {
    for (const t of demoTogter(tema.id)) {
      it(`${tema.navn}: ${t.title}`, () => {
        for (const o of t.opgaver) expect(kontrol(o).status, o.id).not.toBe('uenig')
      })
    }
  }
})
