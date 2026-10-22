import { describe, expect, it } from 'vitest'
import { demoTogter } from '../src/data/togter'
import { TEMA_LISTE } from '../src/tema'
import { PIRAT } from '../src/tema/pirat'
import { kontrol } from '../src/lib/kontrol'
import { lavRnd, lavVariant } from '../src/lib/variant'
import { lavTraening, traeningsStatus, TRAENING_ANTAL } from '../src/lib/traening'
import { bogfoer, bogfoerTraening } from '../src/lib/spil'
import { TOM_PROGRESS } from '../src/lib/progress'
import { CONFIG } from '../src/config'
import type { Opgave, Progress } from '../src/types'

const alleOpgaver = TEMA_LISTE.flatMap((t) => demoTogter(t.id).flatMap((tg) => tg.opgaver))

describe('varianter har altid et facit, appen selv har bekræftet', () => {
  it('300 varianter af hver prøveopgave i alle temaer', () => {
    let lavet = 0
    for (const o of alleOpgaver) {
      const rnd = lavRnd(o.id.length * 7919)
      for (let i = 0; i < 300; i++) {
        const v = lavVariant(o, rnd, `v${i}`)
        if (!v) continue
        lavet++
        const k = kontrol(v)
        expect(k.status, `${o.id} → ${JSON.stringify(v)}`).not.toBe('uenig')
        if (v.type !== 'koordinat') expect(k.status, `${o.id} → ${JSON.stringify(v)}`).toBe('bekraeftet')
        expect(v.id).toBe(`v${i}`)
        expect(v.hints?.length).toBe(2)
      }
    }
    expect(lavet).toBeGreaterThan(alleOpgaver.length * 250)
  }, 60000)

  it('varianten har nye tal, men samme opgavetype', () => {
    const o = alleOpgaver.find((x) => x.id === 'demo-01')!
    const v = lavVariant(o, lavRnd(7), 'v')!
    expect(v.type).toBe(o.type)
    expect(v.regnestykke).not.toBe(o.regnestykke)
    expect(v.story).not.toBe(o.story)
  })

  it('positive heltalsfacit forbliver positive heltal', () => {
    const tal = alleOpgaver.filter((o): o is Extract<Opgave, { type: 'tal' }> => o.type === 'tal' && Number.isInteger(o.answer) && o.answer >= 0 && o.decimaler === undefined)
    for (const o of tal) {
      const rnd = lavRnd(99)
      for (let i = 0; i < 100; i++) {
        const v = lavVariant(o, rnd, 'v')
        if (v?.type === 'tal') {
          expect(Number.isInteger(v.answer), `${o.id}: ${v.regnestykke} = ${v.answer}`).toBe(true)
          expect(v.answer).toBeGreaterThanOrEqual(0)
        }
      }
    }
  })

  it('tal skjult i ord (fx "halvdelen") bliver stående', () => {
    const o: Opgave = { id: 'h', type: 'tal', story: 'En kanon koster 530 guldmønter, men kun HALVDELEN skal betales nu.', question: 'Hvor meget skal betales?', regnestykke: '530 : 2', answer: 265 }
    const rnd = lavRnd(5)
    for (let i = 0; i < 100; i++) {
      const v = lavVariant(o, rnd, 'v')
      expect(v?.regnestykke?.endsWith(': 2')).toBe(true)
      if (v?.type === 'tal') expect(v.answer * 2).toBe(Number(v.regnestykke!.split(':')[0]))
    }
  })

  it('tal skrevet som ord, klokkeslæt og brøker uden for regnestykket bliver stående', () => {
    const rnd = lavRnd(11)
    const master: Opgave = { id: 'm', type: 'tal', story: 'Et sejl med 12 felter deles i 3 lige store dele – én til hver af de tre master.', question: 'Hvor mange felter får hver mast?', regnestykke: '12 : 3', answer: 4 }
    const klokke: Opgave = { id: 'k', type: 'tal', story: 'Klokken er 11.00, og skibet forsvinder 8 timer senere.', question: 'Hvad er klokken så?', regnestykke: '11 + 8', answer: 19, accept: ['19.00'] }
    const dolk: Opgave = { id: 'd', type: 'tal', story: 'Dolken er 1/3 så lang som sablen (sablen er 9 cm).', question: 'Hvor lang er dolken?', regnestykke: '9 : 3', answer: 3, unit: 'cm' }
    for (let i = 0; i < 100; i++) {
      const m = lavVariant(master, rnd, 'v')
      if (m) expect(m.regnestykke).toMatch(/: 3$/)
      const k = lavVariant(klokke, rnd, 'v')
      if (k?.type === 'tal') {
        expect(k.story).toContain('11.00')
        expect(k.accept?.[0]).toBe(`${k.answer}.00`)
      }
      const d = lavVariant(dolk, rnd, 'v')
      if (d) {
        expect(d.story).toContain('1/3')
        expect(d.regnestykke).toMatch(/: 3$/)
      }
    }
  })

  it('brøkdele: antallet af felter i historien passer med tegningen', () => {
    const o: Opgave = { id: 'f', type: 'felter', story: 'Skibets sejl har 12 felter. Mal 1/4 af felterne sorte.', question: 'Tryk på de felter, der skal males.', total: 12, cols: 6, answer: 3 }
    const rnd = lavRnd(8)
    for (let i = 0; i < 100; i++) {
      const v = lavVariant(o, rnd, 'v')
      if (v?.type === 'felter') {
        expect(v.story).toContain(`${v.total} felter`)
        expect(v.answer * 4).toBe(v.total)
      }
    }
  })

  it('ægte brøker forbliver ægte', () => {
    const o = alleOpgaver.find((x) => x.type === 'broek')!
    const rnd = lavRnd(3)
    for (let i = 0; i < 200; i++) {
      const v = lavVariant(o, rnd, 'v')
      if (v?.type === 'broek') expect(v.answer[0]).toBeLessThan(v.answer[1])
    }
  })
})

function alleLoest(): Progress {
  let p: Progress = { ...TOM_PROGRESS, togter: {} }
  for (const t of demoTogter('pirat')) for (const o of t.opgaver) p = bogfoer(p, t.id, o.id, 'foerste', PIRAT).p
  return p
}

describe('træningsomgang', () => {
  it('er låst, indtil alle togter er løst', () => {
    const togter = demoTogter('pirat')
    expect(traeningsStatus(togter, { ...TOM_PROGRESS, togter: {} }).laast).toBe(true)
    expect(traeningsStatus(togter, alleLoest()).laast).toBe(false)
  })

  it(`giver ${TRAENING_ANTAL} kontrollerede opgaver`, () => {
    const togter = [...demoTogter('pirat'), ...demoTogter('detektiv')]
    let p = alleLoest()
    for (const t of demoTogter('detektiv')) for (const o of t.opgaver) p = bogfoer(p, t.id, o.id, 'andet', PIRAT).p
    for (const seed of [1, 2, 3, 42, 1234]) {
      const t = lavTraening(togter, p, PIRAT, seed)
      expect(t.opgaver.length).toBe(TRAENING_ANTAL)
      expect(new Set(t.opgaver.map((o) => o.id)).size).toBe(TRAENING_ANTAL)
      for (const o of t.opgaver) expect(kontrol(o).status).not.toBe('uenig')
    }
  })

  it('en lille pulje giver stadig en fuld omgang', () => {
    const t = lavTraening(demoTogter('pirat'), alleLoest(), PIRAT, 77)
    expect(t.opgaver.length).toBe(TRAENING_ANTAL)
  })

  it('giver samme guld og tyveri som et togt, men gemmer kun tællere', () => {
    let p = alleLoest()
    const foer = JSON.stringify(p.togter)
    const r = bogfoerTraening(p, 'foerste', PIRAT)
    expect(r.guld).toBe(CONFIG.guldFoersteForsoeg)
    p = r.p
    expect(bogfoerTraening(p, 'andet', PIRAT).guld).toBe(CONFIG.guldAndetForsoeg)
    const f = bogfoerTraening(p, 'forkert', PIRAT)
    expect(f.tyveri?.taget).toBe(CONFIG.tyveri)
    expect(JSON.stringify(f.p.togter)).toBe(foer)
    expect(f.p.traening).toMatchObject({ opgaver: 2, rigtige: 1 })
  })
})
