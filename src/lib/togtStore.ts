// ---------------------------------------------------------------------------
// Familiens egne togter. Gemmes lokalt først og synkes pr. togt til skyen.
// Sletning er en "gravsten" (slettet: true), så den også når andre enheder.
// ---------------------------------------------------------------------------
import type { Togt } from '../types'

export interface GemtTogt {
  togt: Togt
  updatedAt: number
  oprettet: number
  slettet?: boolean
}

export type TogtLager = Record<string, GemtTogt>

const KEY = 'kaptajn-tal-togter-v1'

export function loadTogter(): TogtLager {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const l = JSON.parse(raw) as TogtLager
      if (l && typeof l === 'object') return l
    }
  } catch {
    /* ignorer */
  }
  return {}
}

export function saveTogter(l: TogtLager) {
  try {
    localStorage.setItem(KEY, JSON.stringify(l))
  } catch {
    /* fx fuld lagerplads – skyen har stadig en kopi, hvis der er en familiekode */
  }
}

/** De togter, der skal vises, i den rækkefølge de blev tilføjet. */
export function synlige(l: TogtLager): Togt[] {
  return Object.values(l)
    .filter((g) => !g.slettet)
    .sort((a, b) => a.oprettet - b.oprettet)
    .map((g) => g.togt)
}

/** Flet skyens togter ind. Nyeste vinder pr. togt. Returnerer også de lokale, der skal sendes op. */
export function flet(lokal: TogtLager, sky: GemtTogt[]): { lager: TogtLager; skalOp: GemtTogt[] } {
  const lager: TogtLager = { ...lokal }
  const skyIds = new Set<string>()
  for (const g of sky) {
    skyIds.add(g.togt.id)
    const l = lager[g.togt.id]
    if (!l || g.updatedAt > l.updatedAt) lager[g.togt.id] = g
  }
  const skalOp = Object.values(lokal).filter((l) => {
    const s = sky.find((g) => g.togt.id === l.togt.id)
    return !s || l.updatedAt > s.updatedAt
  })
  return { lager, skalOp }
}

/** Nyt id, der ikke kolliderer med noget eksisterende. */
export function nytTogtId(optaget: Set<string>): string {
  for (;;) {
    const id = `t-${Math.random().toString(36).slice(2, 8)}`
    if (!optaget.has(id)) return id
  }
}
