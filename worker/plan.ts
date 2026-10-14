/// <reference types="@cloudflare/workers-types" />
// ---------------------------------------------------------------------------
// Krog til planer og loft. I dag: kun egen nøgle, ingen loft.
// Når den betalte plan bygges, er det her plan og månedens forbrug tjekkes.
// ---------------------------------------------------------------------------

export type Noeglekilde = 'egen' | 'vores'

export interface ScanTilladelse {
  ok: boolean
  grund?: string
}

/** Må familien scanne et ark med den givne nøglekilde? Kaldes før hver scanning (fase 2). */
export async function maaScanne(db: D1Database, familieId: string, kilde: Noeglekilde): Promise<ScanTilladelse> {
  if (kilde === 'egen') return { ok: true }
  const f = await db.prepare('SELECT plan FROM familier WHERE id = ?').bind(familieId).first<{ plan: string }>()
  if (f?.plan !== 'betalt') return { ok: false, grund: 'Kræver betalt plan' }
  // TODO (betalt plan): tjek månedens antal scanninger mod loftet i tabellen forbrug.
  return { ok: true }
}

/** Log forbrug efter en scanning. */
export async function logForbrug(
  db: D1Database,
  r: { familieId: string; kilde: Noeglekilde; udbyder: string; model: string; inputTokens: number; outputTokens: number; prisUsd: number },
) {
  await db
    .prepare('INSERT INTO forbrug (familie_id, tid, noeglekilde, udbyder, model, input_tokens, output_tokens, pris_usd) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(r.familieId, Date.now(), r.kilde, r.udbyder, r.model, r.inputTokens, r.outputTokens, r.prisUsd)
    .run()
}
