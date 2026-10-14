// ---------------------------------------------------------------------------
// Spillogik: guld, tyveri, begravelse, dagligt mål, besætning, streak, flåde.
// Alle funktioner er rene: de tager en Progress og giver en ny tilbage.
// ---------------------------------------------------------------------------
import type { Progress, Gravested, Resultat, Svar } from '../types'
import { CONFIG } from '../config'
import { SKIBE, CREW_NAVNE, SVEN, type Skib } from '../data/flaade'
import { dagKey, plusDage, pænDag } from './dato'

export type { Resultat }

export interface Tyveri {
  taget: number
  fra: 'skat' | 'pung' | null
  besked: string
}

/** Markér en opgave som løst og bogfør guld/tyveri. Kun første gang tæller. */
export function bogfoer(p: Progress, togtId: string, opgaveId: string, resultat: Resultat): { p: Progress; guld: number; tyveri: Tyveri | null } {
  const togt = p.togter[togtId] ?? { done: {} }
  if (opgaveId in togt.done) return { p, guld: 0, tyveri: null } // øvelse – intet på spil

  let guld = 0
  if (resultat === 'foerste') guld = CONFIG.guldFoersteForsoeg
  if (resultat === 'andet') guld = CONFIG.guldAndetForsoeg

  const svar: Svar = { r: resultat, guld, dato: dagKey() }
  let next: Progress = {
    ...p,
    pung: p.pung + guld,
    togter: {
      ...p.togter,
      [togtId]: { done: { ...togt.done, [opgaveId]: guld }, svar: { ...(togt.svar ?? {}), [opgaveId]: svar } },
    },
  }
  let tyveri: Tyveri | null = null
  if (resultat === 'forkert') {
    const r = stjael(next, CONFIG.tyveri)
    next = r.p
    tyveri = r.tyveri
  }
  return { p: next, guld, tyveri }
}

/** Sorte Sven snupper guld – først fra den begravede skat, ellers fra pungen. */
export function stjael(p: Progress, amount: number): { p: Progress; tyveri: Tyveri } {
  if (p.skat > 0) {
    const taget = Math.min(amount, p.skat)
    return {
      p: { ...p, skat: p.skat - taget, stjaalet: p.stjaalet + taget },
      tyveri: { taget, fra: 'skat', besked: SVEN.stjalFraSkat(taget) },
    }
  }
  if (p.pung > 0) {
    const taget = Math.min(amount, p.pung)
    return {
      p: { ...p, pung: p.pung - taget, stjaalet: p.stjaalet + taget },
      tyveri: { taget, fra: 'pung', besked: SVEN.stjalFraPung(taget) },
    }
  }
  return { p, tyveri: { taget: 0, fra: null, besked: SVEN.fandtIntet } }
}

/** Flyt alt guld fra pungen ned i jorden. */
export function begrav(p: Progress, sted: Gravested): Progress {
  return { ...p, skat: p.skat + p.pung, pung: 0, gravested: sted }
}

// ------------------------------------------------------------ dagligt mål

export function sekunderIDag(p: Progress, dag: string): number {
  return p.dage[dag] ?? 0
}

/** Læg matematik-tid til dagens konto. Giver besked, hvis det daglige mål nås. */
export function tilfoejTid(p: Progress, sek: number, dag: string): { p: Progress; events: string[] } {
  const foer = p.dage[dag] ?? 0
  const efter = foer + sek
  let next: Progress = { ...p, dage: { ...p.dage, [dag]: efter } }
  const events: string[] = []
  if (efter >= CONFIG.dagligtMaalSek && !next.beloennet[dag]) {
    const navn = naesteCrewNavn(next)
    next = { ...next, crew: [...next.crew, navn], beloennet: { ...next.beloennet, [dag]: true } }
    events.push(`🎉 ${CONFIG.dagligtMaalSek / 60} minutter i dag! ${navn} er gået ombord på dit skib.`)
    const nyt = SKIBE.find((s) => s.crew === next.crew.length)
    if (nyt) events.push(`${nyt.emoji} Din besætning er stor nok til et nyt skib: ${nyt.navn}!`)
  }
  return { p: next, events }
}

/** Tjek alle dage siden sidst: glemte dage koster et besætningsmedlem. */
export function evaluerDage(p: Progress, iDag: string): { p: Progress; events: string[] } {
  const aktiveDage = Object.keys(p.dage).sort()
  if (aktiveDage.length === 0) return { p, events: [] } // ikke startet endnu
  const start = p.sidsteTjek ? plusDage(p.sidsteTjek, 1) : aktiveDage[0]
  const iGaar = plusDage(iDag, -1)
  let next = p
  const events: string[] = []
  for (let d = start; d <= iGaar; d = plusDage(d, 1)) {
    if ((next.dage[d] ?? 0) >= CONFIG.dagligtMaalSek) continue
    if (next.crew.length === 0) continue
    const vaek = next.crew[next.crew.length - 1]
    next = { ...next, crew: next.crew.slice(0, -1) }
    events.push(`😢 Du glemte at regne ${pænDag(d)}. ${vaek} sprang fra skibet.`)
  }
  if (next !== p || p.sidsteTjek !== iGaar) next = { ...next, sidsteTjek: iGaar }
  return { p: next, events }
}

/** Dage i træk med nået mål, talt bagud fra i dag (eller i går, hvis i dag ikke er nået endnu). */
export function streak(p: Progress, iDag: string): number {
  let d = (p.dage[iDag] ?? 0) >= CONFIG.dagligtMaalSek ? iDag : plusDage(iDag, -1)
  let n = 0
  while ((p.dage[d] ?? 0) >= CONFIG.dagligtMaalSek) {
    n++
    d = plusDage(d, -1)
  }
  return n
}

// ------------------------------------------------------------ besætning + flåde

export function naesteCrewNavn(p: Progress): string {
  const ledige = CREW_NAVNE.filter((n) => !p.crew.includes(n))
  if (ledige.length > 0) return ledige[0]
  return `${CREW_NAVNE[p.crew.length % CREW_NAVNE.length]} d. ${Math.floor(p.crew.length / CREW_NAVNE.length) + 1}.`
}

export function flaade(crew: number): Skib[] {
  return SKIBE.filter((s) => s.crew <= crew)
}

export function naesteSkib(crew: number): Skib | undefined {
  return SKIBE.find((s) => s.crew > crew)
}
