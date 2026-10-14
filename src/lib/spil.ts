// ---------------------------------------------------------------------------
// Spillogik: guld, tyveri, begravelse, dagligt mål, besætning, streak, flåde.
// Alle funktioner er rene: de tager en Progress og giver en ny tilbage.
// ---------------------------------------------------------------------------
import type { Progress, Gravested, Resultat, Svar } from '../types'
import { CONFIG } from '../config'
import { crewNavn, type Samling, type Tema } from '../tema'
import { dagKey, plusDage, pænDag } from './dato'

export type { Resultat }

export interface Tyveri {
  taget: number
  fra: 'skat' | 'pung' | null
  besked: string
}

/** Markér en opgave som løst og bogfør guld/tyveri. Kun første gang tæller. */
export function bogfoer(p: Progress, togtId: string, opgaveId: string, resultat: Resultat, tema: Tema): { p: Progress; guld: number; tyveri: Tyveri | null } {
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
    const r = stjael(next, CONFIG.tyveri, tema)
    next = r.p
    tyveri = r.tyveri
  }
  return { p: next, guld, tyveri }
}

/** Sorte Sven snupper guld – først fra den begravede skat, ellers fra pungen. */
export function stjael(p: Progress, amount: number, tema: Tema): { p: Progress; tyveri: Tyveri } {
  if (p.skat > 0) {
    const taget = Math.min(amount, p.skat)
    return {
      p: { ...p, skat: p.skat - taget, stjaalet: p.stjaalet + taget },
      tyveri: { taget, fra: 'skat', besked: tema.tyv.tagerFraSkat(taget) },
    }
  }
  if (p.pung > 0) {
    const taget = Math.min(amount, p.pung)
    return {
      p: { ...p, pung: p.pung - taget, stjaalet: p.stjaalet + taget },
      tyveri: { taget, fra: 'pung', besked: tema.tyv.tagerFraPung(taget) },
    }
  }
  return { p, tyveri: { taget: 0, fra: null, besked: tema.tyv.fandtIntet } }
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
export function tilfoejTid(p: Progress, sek: number, dag: string, tema: Tema): { p: Progress; events: string[] } {
  const foer = p.dage[dag] ?? 0
  const efter = foer + sek
  let next: Progress = { ...p, dage: { ...p.dage, [dag]: efter } }
  const events: string[] = []
  if (efter >= CONFIG.dagligtMaalSek && !next.beloennet[dag]) {
    const navn = crewNavn(tema, next.crew.length)
    next = { ...next, crew: [...next.crew, navn], beloennet: { ...next.beloennet, [dag]: true } }
    events.push(`🎉 ${CONFIG.dagligtMaalSek / 60} minutter i dag! ${tema.kommerMed(navn)}`)
    const nyt = tema.samling.find((s) => s.crew === next.crew.length)
    if (nyt) events.push(tema.nytISamling(nyt))
  }
  return { p: next, events }
}

/** Tjek alle dage siden sidst: glemte dage koster et besætningsmedlem. */
export function evaluerDage(p: Progress, iDag: string, tema: Tema): { p: Progress; events: string[] } {
  const aktiveDage = Object.keys(p.dage).sort()
  if (aktiveDage.length === 0) return { p, events: [] } // ikke startet endnu
  const start = p.sidsteTjek ? plusDage(p.sidsteTjek, 1) : aktiveDage[0]
  const iGaar = plusDage(iDag, -1)
  let next = p
  const events: string[] = []
  for (let d = start; d <= iGaar; d = plusDage(d, 1)) {
    if ((next.dage[d] ?? 0) >= CONFIG.dagligtMaalSek) continue
    if (next.crew.length === 0) continue
    const vaek = crewNavn(tema, next.crew.length - 1)
    next = { ...next, crew: next.crew.slice(0, -1) }
    events.push(`😢 Du glemte at regne ${pænDag(d)}. ${tema.forlader(vaek)}`)
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

export function flaade(crew: number, tema: Tema): Samling[] {
  return tema.samling.filter((s) => s.crew <= crew)
}

export function naesteSkib(crew: number, tema: Tema): Samling | undefined {
  return tema.samling.find((s) => s.crew > crew)
}
