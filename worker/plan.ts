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

/** Højst så mange scanninger pr. familie pr. døgn – også med egen nøgle, for at beskytte serveren. */
export const SCAN_PR_DOEGN = 40

/** Må familien scanne et ark med den givne nøglekilde? Kaldes før hver scanning. */
export async function maaScanne(db: D1Database, familieId: string, kilde: Noeglekilde): Promise<ScanTilladelse> {
  const doegn = await db
    .prepare('SELECT count(*) AS n FROM forbrug WHERE familie_id = ? AND tid > ?')
    .bind(familieId, Date.now() - 24 * 3600_000)
    .first<{ n: number }>()
  if ((doegn?.n ?? 0) >= SCAN_PR_DOEGN) return { ok: false, grund: `I har scannet ${SCAN_PR_DOEGN} ark det seneste døgn. Prøv igen i morgen.` }
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
