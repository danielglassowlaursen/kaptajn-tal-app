// ---------------------------------------------------------------------------
// Familiekode-synk mod Worker-API'et (/api/progress/:kode).
// Appen er lokal først: localStorage er altid opdateret, skyen er backup + synk.
// ---------------------------------------------------------------------------
import type { Progress } from '../types'
import type { GemtTogt } from './togtStore'

const KODE_KEY = 'kaptajn-tal-kode'
export const KODE_RE = /^[a-z0-9æøå-]{6,40}$/

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

// Neutrale ord, så koden passer til alle temaer. Tre ord + tal giver ~10^9 muligheder.
const ORD = [
  'anker', 'bølge', 'kompas', 'stjerne', 'måne', 'sol', 'ø', 'skov', 'slot', 'raket', 'komet', 'planet',
  'perle', 'krone', 'sabel', 'kort', 'tårn', 'drage', 'ugle', 'ræv', 'hval', 'skildpadde', 'papegøje', 'enhjørning',
  'regnbue', 'lanterne', 'tromme', 'fløjte', 'kiste', 'nøgle', 'bro', 'fyrtårn', 'vulkan', 'sky', 'storm', 'stjerneskud',
  'mønt', 'diamant', 'rubin', 'safir', 'smaragd', 'krystal', 'glimmer', 'gnist', 'flamme', 'frost', 'tåge', 'blæst',
]

/** Forslag til en ny kode, fx "anker-komet-ugle-42". */
export function lavKode(): string {
  const tal = new Uint32Array(4)
  crypto.getRandomValues(tal)
  // Tre forskellige ord: træk fra en liste, der bliver kortere for hvert ord.
  const rest = [...ORD]
  const ord = [0, 1, 2].map((i) => rest.splice(tal[i] % rest.length, 1)[0])
  return `${ord.join('-')}-${10 + (tal[3] % 90)}`
}

const base = (kode: string) => `/api/f/${encodeURIComponent(kode)}`
const url = (kode: string) => `${base(kode)}/progress`

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
    const r = await fetch(`${base(kode)}/historik`, { cache: 'no-store' })
    if (!r.ok) return { status: 'fejl', besked: `Serveren svarede ${r.status}` }
    const j = (await r.json()) as { historik: HistorikPunkt[] }
    return { status: 'ok', historik: j.historik }
  } catch {
    return { status: 'fejl', besked: 'Ingen forbindelse' }
  }
}

export async function gendanFraHistorik(kode: string, id: number): Promise<{ status: 'ok'; progress: Progress } | { status: 'fejl'; besked: string }> {
  try {
    const r = await fetch(`${base(kode)}/gendan`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) })
    if (!r.ok) return { status: 'fejl', besked: `Serveren svarede ${r.status}` }
    const j = (await r.json()) as { progress: Progress }
    return { status: 'ok', progress: j.progress }
  } catch {
    return { status: 'fejl', besked: 'Ingen forbindelse' }
  }
}

// ------------------------------------------------------------ togter + arkfotos

export async function hentTogterCloud(kode: string): Promise<{ status: 'ok'; togter: GemtTogt[] } | { status: 'fejl'; besked: string }> {
  try {
    const r = await fetch(`${base(kode)}/togter`, { cache: 'no-store' })
    if (!r.ok) return { status: 'fejl', besked: `Serveren svarede ${r.status}` }
    const j = (await r.json()) as { togter: { id: string; togt: GemtTogt['togt']; updatedAt: number; slettet: boolean }[] }
    return {
      status: 'ok',
      togter: j.togter.map((t) => ({ togt: { ...t.togt, id: t.id }, updatedAt: t.updatedAt, oprettet: t.togt.oprettet ?? t.updatedAt, slettet: t.slettet })),
    }
  } catch {
    return { status: 'fejl', besked: 'Ingen forbindelse' }
  }
}

export async function gemTogtCloud(kode: string, g: GemtTogt): Promise<{ status: 'ok' } | { status: 'nyere'; gemt: GemtTogt } | { status: 'fejl' }> {
  try {
    const r = await fetch(`${base(kode)}/togter/${encodeURIComponent(g.togt.id)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ togt: { ...g.togt, oprettet: g.oprettet }, updatedAt: g.updatedAt, slettet: !!g.slettet }),
    })
    if (r.status === 409) {
      const j = (await r.json()) as { id: string; togt: GemtTogt['togt']; updatedAt: number; slettet: boolean }
      return { status: 'nyere', gemt: { togt: { ...j.togt, id: j.id }, updatedAt: j.updatedAt, oprettet: j.togt.oprettet ?? j.updatedAt, slettet: j.slettet } }
    }
    return r.ok ? { status: 'ok' } : { status: 'fejl' }
  } catch {
    return { status: 'fejl' }
  }
}

export const arkUrl = (kode: string, togtId: string) => `${base(kode)}/ark/${encodeURIComponent(togtId)}`

export async function uploadArk(kode: string, togtId: string, blob: Blob): Promise<string | null> {
  try {
    const r = await fetch(arkUrl(kode, togtId), { method: 'PUT', headers: { 'content-type': blob.type || 'image/jpeg' }, body: blob })
    if (r.ok) return null
    const j = (await r.json().catch(() => ({}))) as { fejl?: string }
    return j.fejl ?? `Serveren svarede ${r.status}`
  } catch {
    return 'Ingen forbindelse'
  }
}

export async function sletArk(kode: string, togtId: string): Promise<void> {
  try {
    await fetch(arkUrl(kode, togtId), { method: 'DELETE' })
  } catch {
    /* ignorer */
  }
}

// ------------------------------------------------------------ scanning
export interface ScanUdkast {
  togt: import('../types').Togt
  usikre: Record<string, string>
  forbrug: { inputTokens: number; outputTokens: number; prisUsd: number }
}

export async function scanArk(
  kode: string,
  req: { udbyder: string; model: string; noegle: string; billeder: { type: string; data: string }[]; arkNavn?: string; tema?: string; klasse?: number },
  signal?: AbortSignal,
): Promise<{ status: 'ok'; udkast: ScanUdkast } | { status: 'fejl'; besked: string }> {
  try {
    const r = await fetch(`${base(kode)}/scan`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(req), signal })
    const j = (await r.json().catch(() => ({}))) as Partial<ScanUdkast> & { fejl?: string }
    if (!r.ok || !j.togt) return { status: 'fejl', besked: j.fejl ?? `Serveren svarede ${r.status}` }
    return { status: 'ok', udkast: j as ScanUdkast }
  } catch (e) {
    if ((e as Error).name === 'AbortError') return { status: 'fejl', besked: 'Scanningen blev afbrudt.' }
    return { status: 'fejl', besked: 'Ingen forbindelse til serveren.' }
  }
}

// ------------------------------------------------------------ gendannelseskode
export type GendannelseSvar = { status: 'ok'; gendannelseskode: string } | { status: 'findes'; oprettet: number } | { status: 'fejl'; besked: string }

/** Lav familiens gendannelseskode (eller en ny, som erstatter den gamle). Koden vises kun denne ene gang. */
export async function lavGendannelse(kode: string, ny = false): Promise<GendannelseSvar> {
  try {
    const r = await fetch(`${base(kode)}/gendannelse`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ny }) })
    const j = (await r.json().catch(() => ({}))) as { gendannelseskode?: string; oprettet?: number; fejl?: string }
    if (r.status === 409) return { status: 'findes', oprettet: j.oprettet ?? 0 }
    if (!r.ok || !j.gendannelseskode) return { status: 'fejl', besked: j.fejl ?? `Serveren svarede ${r.status}` }
    return { status: 'ok', gendannelseskode: j.gendannelseskode }
  } catch {
    return { status: 'fejl', besked: 'Ingen forbindelse' }
  }
}

/** Find familiekoden ud fra gendannelseskoden. */
export async function gendanMedKode(gendannelseskode: string): Promise<{ status: 'ok'; kode: string } | { status: 'fejl'; besked: string }> {
  try {
    const r = await fetch('/api/gendan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ gendannelseskode }) })
    const j = (await r.json().catch(() => ({}))) as { kode?: string; fejl?: string }
    if (!r.ok || !j.kode) return { status: 'fejl', besked: j.fejl ?? `Serveren svarede ${r.status}` }
    return { status: 'ok', kode: j.kode }
  } catch {
    return { status: 'fejl', besked: 'Ingen forbindelse' }
  }
}
