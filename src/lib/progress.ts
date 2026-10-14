import type { Progress } from '../types'

const KEY = 'kaptajn-tal-v1'

export const TOM_PROGRESS: Progress = {
  name: '',
  togter: {},
  pung: 0,
  skat: 0,
  stjaalet: 0,
  gravested: null,
  crew: [],
  dage: {},
  beloennet: {},
  sidsteTjek: null,
  updatedAt: 0,
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<Progress>
      if (p && typeof p === 'object') return { ...TOM_PROGRESS, ...p, togter: p.togter ?? {} }
    }
  } catch {
    /* ignorer – fx private browsing */
  }
  return { ...TOM_PROGRESS }
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* ignorer */
  }
}

export function togtCoins(p: Progress, togtId: string): number {
  return Object.values(p.togter[togtId]?.done ?? {}).reduce((a, b) => a + b, 0)
}

export function doneIds(p: Progress, togtId: string): Set<string> {
  return new Set(Object.keys(p.togter[togtId]?.done ?? {}))
}

/** Har denne enhed overhovedet noget at miste? (Bruges når en familiekode forbindes.) */
export function erTom(p: Progress): boolean {
  const loest = Object.values(p.togter).some((t) => Object.keys(t.done).length > 0)
  return !loest && p.pung === 0 && p.skat === 0 && p.crew.length === 0 && Object.keys(p.dage).length === 0
}
