import { createContext, useContext, type ReactNode } from 'react'
import type { Tema, TemaId } from './typer'
import { PIRAT } from './pirat'
import { PRINSESSE } from './prinsesse'
import { RUM } from './rum'

export type { Tema, TemaId, Samling } from './typer'

export const TEMAER: Record<TemaId, Tema> = { pirat: PIRAT, prinsesse: PRINSESSE, rum: RUM }
export const TEMA_LISTE: Tema[] = [PIRAT, PRINSESSE, RUM]

export function hentTema(id: string | undefined): Tema {
  return TEMAER[id as TemaId] ?? PIRAT
}

const Ctx = createContext<Tema>(PIRAT)

export function TemaProvider({ tema, children }: { tema: Tema; children: ReactNode }) {
  return <Ctx.Provider value={tema}>{children}</Ctx.Provider>
}

export function useTema(): Tema {
  return useContext(Ctx)
}

/** "Kaptajn Tal" eller "Kaptajn Tal – Prinsesse Plus". */
export function appNavn(t: Tema): string {
  return t.undertitel ? `Kaptajn Tal – ${t.undertitel}` : 'Kaptajn Tal'
}

/** Navn på besætningsmedlem nr. i i dette tema (vises efter plads, så et temaskift giver temaets navne). */
export function crewNavn(t: Tema, i: number): string {
  const n = t.crewNavne[i % t.crewNavne.length]
  const runde = Math.floor(i / t.crewNavne.length)
  return runde > 0 ? `${n} ${runde + 1}.` : n
}
