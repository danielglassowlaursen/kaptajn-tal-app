// ---------------------------------------------------------------------------
// Træning: en omgang med varianter af opgaver, barnet allerede har løst.
// Låses op, når alle togter er løst. Opgaver, barnet havde svært ved, kommer oftere.
// ---------------------------------------------------------------------------
import type { Opgave, Progress, Togt } from '../types'
import type { Tema } from '../tema'
import { lavRnd, lavVariant, type Rnd } from './variant'

export const TRAENING_ID = 'traening'
export const TRAENING_ANTAL = 20

export interface TraeningsStatus {
  laast: boolean
  /** Opgaver i togterne, der endnu ikke er løst. */
  mangler: number
  /** Opgaver, der kan laves varianter af. */
  pulje: number
}

export function traeningsStatus(togter: Togt[], p: Progress): TraeningsStatus {
  let mangler = 0
  let pulje = 0
  for (const t of togter) {
    const done = p.togter[t.id]?.done ?? {}
    for (const o of t.opgaver) {
      if (o.id in done) pulje++
      else mangler++
    }
  }
  return { laast: mangler > 0 || pulje === 0, mangler, pulje }
}

/** Vægt: svære opgaver (hint, Polly, forkert) kommer oftere. */
function vaegt(p: Progress, togtId: string, o: Opgave): number {
  const r = p.togter[togtId]?.svar?.[o.id]?.r
  return r === 'forkert' ? 4 : r === 'polly' ? 3 : r === 'andet' ? 2 : 1
}

function traek<T>(rnd: Rnd, items: { x: T; w: number }[]): T | null {
  const sum = items.reduce((s, i) => s + i.w, 0)
  if (sum <= 0) return null
  let r = rnd() * sum
  for (const i of items) {
    r -= i.w
    if (r <= 0) return i.x
  }
  return items[items.length - 1].x
}

/** Byg en træningsomgang. Hver opgave er en ny variant med appens eget, kontrollerede facit. */
export function lavTraening(togter: Togt[], p: Progress, tema: Tema, seed: number, antal = TRAENING_ANTAL): Togt {
  const rnd = lavRnd(seed)
  const pulje: { x: { t: Togt; o: Opgave }; w: number }[] = []
  for (const t of togter) for (const o of t.opgaver) if (o.id in (p.togter[t.id]?.done ?? {})) pulje.push({ x: { t, o }, w: vaegt(p, t.id, o) })

  const opgaver: Opgave[] = []
  const brugt = new Map<string, number>()
  // Samme opgave højst to gange pr. omgang – medmindre puljen er lille, så omgangen stadig får fuld længde
  for (let forsoeg = 0; opgaver.length < antal && forsoeg < antal * 12 && pulje.length; forsoeg++) {
    // Loftet beregnes løbende, fordi opgaver, der ikke kan varieres, fjernes fra puljen undervejs
    const maks = Math.max(2, Math.ceil(antal / pulje.length))
    const valg = traek(
      rnd,
      pulje.map((i) => ({ ...i, w: (brugt.get(`${i.x.t.id}/${i.x.o.id}`) ?? 0) >= maks ? 0 : i.w })),
    )
    if (!valg) break
    const noegle = `${valg.t.id}/${valg.o.id}`
    const v = lavVariant(valg.o, rnd, `${seed}-${opgaver.length + 1}`)
    if (!v) {
      // Opgaven kan ikke varieres sikkert – tag den ud af puljen
      const i = pulje.findIndex((x) => x.x === valg)
      if (i >= 0) pulje.splice(i, 1)
      continue
    }
    brugt.set(noegle, (brugt.get(noegle) ?? 0) + 1)
    opgaver.push(v)
  }
  const tr = tema.traening
  return {
    id: TRAENING_ID,
    title: tr.navn,
    subtitle: 'Træning',
    emoji: tr.emoji,
    intro: tr.intro,
    opgaver,
  }
}
