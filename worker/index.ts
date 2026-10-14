/// <reference types="@cloudflare/workers-types" />
// ---------------------------------------------------------------------------
// Kaptajn Tal – API til familiekode-synk. Kører som Cloudflare Worker foran de
// statiske filer. Fremgangen gemmes i D1 (SQLite) under familiekoden.
//
//   GET  /api/progress/:kode           -> { progress, updatedAt } eller 404
//   PUT  /api/progress/:kode           { progress } -> { ok } eller 409 { progress }
//                                       hvis serveren har en nyere version.
//   GET  /api/progress/:kode/historik  -> { historik: [{ id, savedAt, ... }] }
//   POST /api/progress/:kode/gendan    { id } -> { progress } (gør historikpunktet
//                                       til den gældende version med nyt stempel)
//
// Historik: der gemmes et øjebliksbillede, når noget vigtigt ændrer sig
// (guld, skat, besætning, antal løste, navn) eller der er gået 30 min.
// De seneste 200 pr. kode beholdes.
// ---------------------------------------------------------------------------

interface Env {
  DB: D1Database
  ASSETS: Fetcher
}

const KODE_RE = /^[a-z0-9æøå-]{6,32}$/
const MAX_BYTES = 200_000
const HISTORIK_MAX = 200
const HISTORIK_MIN_INTERVAL = 30 * 60_000

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })

type Løs = Record<string, unknown>

/** De vigtige tal, der afgør om et nyt historikpunkt er værd at gemme. */
function fingerprint(p: Løs): string {
  const togter = (p.togter ?? {}) as Record<string, { done?: Record<string, unknown> }>
  const loest = Object.values(togter).reduce((n, t) => n + Object.keys(t?.done ?? {}).length, 0)
  const crew = Array.isArray(p.crew) ? p.crew.length : 0
  return [p.pung ?? 0, p.skat ?? 0, p.stjaalet ?? 0, crew, loest, p.name ?? ''].join('|')
}

async function gemHistorik(env: Env, kode: string, text: string, updatedAt: number, fp: string, tving = false) {
  const last = await env.DB.prepare('SELECT fp, saved_at FROM progress_history WHERE code = ? ORDER BY id DESC LIMIT 1')
    .bind(kode)
    .first<{ fp: string; saved_at: number }>()
  const now = Date.now()
  if (!tving && last && last.fp === fp && now - last.saved_at < HISTORIK_MIN_INTERVAL) return
  await env.DB.batch([
    env.DB.prepare('INSERT INTO progress_history (code, data, updated_at, saved_at, fp) VALUES (?, ?, ?, ?, ?)').bind(kode, text, updatedAt, now, fp),
    env.DB.prepare(
      'DELETE FROM progress_history WHERE code = ?1 AND id NOT IN (SELECT id FROM progress_history WHERE code = ?1 ORDER BY id DESC LIMIT ?2)',
    ).bind(kode, HISTORIK_MAX),
  ])
}

async function upsert(env: Env, kode: string, text: string, updatedAt: number) {
  await env.DB.prepare(
    'INSERT INTO progress (code, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(code) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at',
  )
    .bind(kode, text, updatedAt)
    .run()
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request)

    const m = url.pathname.match(/^\/api\/progress\/([^/]+)(?:\/(historik|gendan))?$/)
    if (!m) return json({ fejl: 'Ukendt adresse' }, 404)
    const kode = decodeURIComponent(m[1]).toLowerCase()
    const under = m[2]
    if (!KODE_RE.test(kode)) return json({ fejl: 'Ugyldig kode' }, 400)

    // ------------------------------------------------------------ historik
    if (under === 'historik') {
      if (request.method !== 'GET') return json({ fejl: 'Metode ikke tilladt' }, 405)
      const rows = await env.DB.prepare('SELECT id, saved_at, updated_at, fp FROM progress_history WHERE code = ? ORDER BY id DESC LIMIT 50')
        .bind(kode)
        .all<{ id: number; saved_at: number; updated_at: number; fp: string }>()
      const historik = rows.results.map((r) => {
        const [pung, skat, stjaalet, crew, loest, navn] = r.fp.split('|')
        return { id: r.id, savedAt: r.saved_at, updatedAt: r.updated_at, pung: +pung, skat: +skat, stjaalet: +stjaalet, crew: +crew, loest: +loest, navn }
      })
      return json({ historik })
    }

    if (under === 'gendan') {
      if (request.method !== 'POST') return json({ fejl: 'Metode ikke tilladt' }, 405)
      let body: { id?: unknown }
      try {
        body = await request.json()
      } catch {
        return json({ fejl: 'Ugyldig JSON' }, 400)
      }
      const id = Number(body.id)
      if (!Number.isInteger(id)) return json({ fejl: 'Mangler id' }, 400)
      const row = await env.DB.prepare('SELECT data FROM progress_history WHERE id = ? AND code = ?').bind(id, kode).first<{ data: string }>()
      if (!row) return json({ fejl: 'Historikpunktet findes ikke' }, 404)
      const progress = JSON.parse(row.data) as Løs
      const now = Date.now()
      progress.updatedAt = now // nyt stempel, så alle enheder henter denne version
      const text = JSON.stringify(progress)
      await upsert(env, kode, text, now)
      await gemHistorik(env, kode, text, now, fingerprint(progress), true)
      return json({ progress, updatedAt: now })
    }

    // ------------------------------------------------------------ progress
    if (request.method === 'GET') {
      const row = await env.DB.prepare('SELECT data, updated_at FROM progress WHERE code = ?').bind(kode).first<{ data: string; updated_at: number }>()
      if (!row) return json({ fejl: 'Ingen skat under den kode' }, 404)
      return json({ progress: JSON.parse(row.data), updatedAt: row.updated_at })
    }

    if (request.method === 'PUT') {
      const text = await request.text()
      if (text.length > MAX_BYTES) return json({ fejl: 'For stor' }, 413)
      let body: { progress?: Løs }
      try {
        body = JSON.parse(text)
      } catch {
        return json({ fejl: 'Ugyldig JSON' }, 400)
      }
      const progress = body.progress
      if (!progress || typeof progress !== 'object') return json({ fejl: 'Mangler progress' }, 400)
      const updatedAt = typeof progress.updatedAt === 'number' ? progress.updatedAt : 0

      const row = await env.DB.prepare('SELECT data, updated_at FROM progress WHERE code = ?').bind(kode).first<{ data: string; updated_at: number }>()
      if (row && row.updated_at > updatedAt) {
        // En anden enhed har gemt noget nyere – send det tilbage i stedet for at overskrive.
        return json({ progress: JSON.parse(row.data), updatedAt: row.updated_at }, 409)
      }
      const data = JSON.stringify(progress)
      await upsert(env, kode, data, updatedAt)
      await gemHistorik(env, kode, data, updatedAt, fingerprint(progress))
      return json({ ok: true, updatedAt })
    }

    return json({ fejl: 'Metode ikke tilladt' }, 405)
  },
}
