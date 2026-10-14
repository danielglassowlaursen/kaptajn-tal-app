// ---------------------------------------------------------------------------
// Familiekode-synk mod Worker-API'et (/api/progress/:kode).
// Appen er lokal først: localStorage er altid opdateret, skyen er backup + synk.
// ---------------------------------------------------------------------------
import type { Progress } from '../types'

const KODE_KEY = 'kaptajn-tal-kode'
export const KODE_RE = /^[a-z0-9æøå-]{6,32}$/

export function getKode(): string | null {
  try {
    return localStorage.getItem(KODE_KEY)
  } catch {
    return null
  }
}

export function setKode(kode: string | null) {
  try {
    if (kode) localStorage.setItem(KODE_KEY, kode)
    else localStorage.removeItem(KODE_KEY)
  } catch {
    /* ignorer */
  }
}

export function normaliserKode(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, '-')
}

const ORD = ['sortskæg', 'polly', 'kraken', 'guldø', 'sabel', 'kanon', 'anker', 'papegøje', 'galeon', 'skattekort', 'dublon', 'kompas']

/** Forslag til en ny kode, fx "kraken-482". */
export function lavKode(): string {
  const ord = ORD[Math.floor(Math.random() * ORD.length)]
  return `${ord}-${100 + Math.floor(Math.random() * 900)}`
}

const url = (kode: string) => `/api/progress/${encodeURIComponent(kode)}`

export type HentResultat = { status: 'fundet'; progress: Progress } | { status: 'tom' } | { status: 'fejl'; besked: string }

export async function hentCloud(kode: string): Promise<HentResultat> {
  try {
    const r = await fetch(url(kode), { cache: 'no-store' })
    if (r.status === 404) return { status: 'tom' }
    if (!r.ok) return { status: 'fejl', besked: `Serveren svarede ${r.status}` }
    const j = (await r.json()) as { progress: Progress }
    return { status: 'fundet', progress: j.progress }
  } catch {
    return { status: 'fejl', besked: 'Ingen forbindelse' }
  }
}

export type GemResultat = { status: 'ok' } | { status: 'nyere'; progress: Progress } | { status: 'fejl'; besked: string }

export async function gemCloud(kode: string, p: Progress, keepalive = false): Promise<GemResultat> {
  try {
    const r = await fetch(url(kode), {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ progress: p }),
      keepalive,
    })
    if (r.status === 409) {
      const j = (await r.json()) as { progress: Progress }
      return { status: 'nyere', progress: j.progress }
    }
    if (!r.ok) return { status: 'fejl', besked: `Serveren svarede ${r.status}` }
    return { status: 'ok' }
  } catch {
    return { status: 'fejl', besked: 'Ingen forbindelse' }
  }
}

export type SyncState = { status: 'off' } | { status: 'syncing' } | { status: 'ok'; sidst: number } | { status: 'fejl'; besked: string }

// ------------------------------------------------------------ historik
export interface HistorikPunkt {
  id: number
  savedAt: number
  updatedAt: number
  pung: number
  skat: number
  stjaalet: number
  crew: number
  loest: number
  navn: string
}

export async function hentHistorik(kode: string): Promise<{ status: 'ok'; historik: HistorikPunkt[] } | { status: 'fejl'; besked: string }> {
  try {
    const r = await fetch(`${url(kode)}/historik`, { cache: 'no-store' })
    if (!r.ok) return { status: 'fejl', besked: `Serveren svarede ${r.status}` }
    const j = (await r.json()) as { historik: HistorikPunkt[] }
    return { status: 'ok', historik: j.historik }
  } catch {
    return { status: 'fejl', besked: 'Ingen forbindelse' }
  }
}

export async function gendanFraHistorik(kode: string, id: number): Promise<{ status: 'ok'; progress: Progress } | { status: 'fejl'; besked: string }> {
  try {
    const r = await fetch(`${url(kode)}/gendan`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) })
    if (!r.ok) return { status: 'fejl', besked: `Serveren svarede ${r.status}` }
    const j = (await r.json()) as { progress: Progress }
    return { status: 'ok', progress: j.progress }
  } catch {
    return { status: 'fejl', besked: 'Ingen forbindelse' }
  }
}
