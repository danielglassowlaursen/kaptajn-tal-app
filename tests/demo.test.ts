import { describe, expect, it } from 'vitest'
import { demoTogter } from '../src/data/togter'
import { tjekUdkast } from '../src/lib/facitTjek'
import { tjekOpgave } from '../src/lib/togtFil'
import { answerText } from '../src/lib/check'
import { TEMA_LISTE } from '../src/tema'

describe('prøvetogterne har korrekte facit i alle temaer', () => {
  for (const tema of TEMA_LISTE) {
    for (const togt of demoTogter(tema.id)) {
      it(`${tema.navn}: ${togt.title}`, () => {
        togt.opgaver.forEach((o, i) => {
          expect(tjekOpgave(o as unknown as Record<string, unknown>, i + 1)).toEqual([])
          expect(tjekUdkast(o, i + 1)).toEqual([])
          expect(answerText(o)).not.toBe('')
        })
      })
    }
  }
})
