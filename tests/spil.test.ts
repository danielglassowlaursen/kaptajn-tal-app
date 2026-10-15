import { describe, expect, it } from 'vitest'
import { aabnOpgaver, begrav, bogfoer, rapporterFacit } from '../src/lib/spil'
import { TOM_PROGRESS } from '../src/lib/progress'
import { PIRAT } from '../src/tema/pirat'
import { CONFIG } from '../src/config'

describe('melding om forkert facit', () => {
  it('giver tyvens bytte tilbage og markerer opgaven', () => {
    let p = { ...TOM_PROGRESS, togter: {} }
    p = bogfoer(p, 't', 'o1', 'foerste', PIRAT).p
    p = begrav(p, { x: 0.5, y: 0.5 })
    const skatFoer = p.skat
    const r = bogfoer(p, 't', 'o2', 'forkert', PIRAT)
    expect(r.tyveri?.taget).toBe(CONFIG.tyveri)
    expect(r.p.skat).toBe(skatFoer - CONFIG.tyveri)
    const m = rapporterFacit(r.p, 't', 'o2')
    expect(m.tilbage).toBe(CONFIG.tyveri)
    expect(m.p.pung).toBe(CONFIG.tyveri)
    expect(m.p.stjaalet).toBe(0)
    expect(m.p.togter.t.svar?.o2.rapport).toBeTruthy()
    // En melding mere giver ikke noget ekstra
    expect(rapporterFacit(m.p, 't', 'o2').tilbage).toBe(0)
  })
  it('åbner opgaven igen, så barnet kan løse den og tjene igen', () => {
    let p = { ...TOM_PROGRESS, togter: {} }
    p = bogfoer(p, 't', 'o1', 'forkert', PIRAT).p
    p = aabnOpgaver(p, 't', ['o1'])
    expect(p.togter.t.done.o1).toBeUndefined()
    const igen = bogfoer(p, 't', 'o1', 'foerste', PIRAT)
    expect(igen.guld).toBe(CONFIG.guldFoersteForsoeg)
  })
})
