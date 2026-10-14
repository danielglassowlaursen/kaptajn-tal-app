/// <reference types="@cloudflare/workers-types" />
// ---------------------------------------------------------------------------
// Kaptajn Tal – API. Kører som Cloudflare Worker foran de statiske filer.
// Alt hænger på en familie. Familiekoden i adressen slås op til familiens id.
//
//   GET  /api/f/:kode/progress          -> { progress, updatedAt } | 404
//   PUT  /api/f/:kode/progress          { progress } -> { ok } | 409 { progress }
//   GET  /api/f/:kode/historik          -> { historik: [...] }
//   POST /api/f/:kode/gendan            { id } -> { progress }
//   GET  /api/f/:kode/togter            -> { togter: [{ id, togt, updatedAt, slettet }] }
//   PUT  /api/f/:kode/togter/:id        { togt, updatedAt, slettet } -> { ok } | 409 { ... }
//   PUT  /api/f/:kode/ark/:id           (billede) -> { ok }
//   GET  /api/f/:kode/ark/:id           -> billedet
//   DELETE /api/f/:kode/ark/:id         -> { ok }
//
// PUT opretter familien, hvis koden er ny. GET på en ukendt kode giver 404.
// ---------------------------------------------------------------------------

interface Env {
  DB: D1Database
  ASSETS: Fetcher
  ARK: R2Bucket
}

const KODE_RE = /^[a-z0-9æøå-]{6,40}$/
const ID_RE = /^[a-z0-9-]{1,64}$/
const MAX_JSON = 400_000
const MAX_BILLEDE = 4_000_000
const BILLEDTYPER = new Set(['image/jpeg', 'image/png', 'image/webp'])
const HISTORIK_MAX = 200
const HISTORIK_MIN_INTERVAL = 30 * 60_000

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })

type Løs = Record<string, unknown>

// ------------------------------------------------------------ familie

async function findFamilie(env: Env, kode: string): Promise<string | null> {
  const r = await env.DB.prepare('SELECT familie_id FROM koder WHERE kode = ?').bind(kode).first<{ familie_id: string }>()
  return r?.familie_id ?? null
}

async function findEllerOpretFamilie(env: Env, kode: string): Promise<string> {
  const fundet = await findFamilie(env, kode)
  if (fundet) return fundet
  const id = crypto.randomUUID()
  const nu = Date.now()
  await env.DB.batch([
    env.DB.prepare('INSERT INTO familier (id, oprettet) VALUES (?, ?)').bind(id, nu),
    env.DB.prepare('INSERT OR IGNORE INTO koder (kode, familie_id, oprettet) VALUES (?, ?, ?)').bind(kode, id, nu),
  ])
  // Hvis to enheder oprettede samtidig, vinder den første kode-række.
  return (await findFamilie(env, kode)) ?? id
}

// ------------------------------------------------------------ progress + historik

function fingerprint(p: Løs): string {
  const togter = (p.togter ?? {}) as Record<string, { done?: Record<string, unknown> }>
  const loest = Object.values(togter).reduce((n, t) => n + Object.keys(t?.done ?? {}).length, 0)
  const crew = Array.isArray(p.crew) ? p.crew.length : 0
  return [p.pung ?? 0, p.skat ?? 0, p.stjaalet ?? 0, crew, loest, p.name ?? ''].join('|')
}

async function gemHistorik(env: Env, fid: string, text: string, updatedAt: number, fp: string, tving = false) {
  const last = await env.DB.prepare('SELECT fp, saved_at FROM progress_history WHERE familie_id = ? ORDER BY id DESC LIMIT 1')
    .bind(fid)
    .first<{ fp: string; saved_at: number }>()
  const nu = Date.now()
  if (!tving && last && last.fp === fp && nu - last.saved_at < HISTORIK_MIN_INTERVAL) return
  await env.DB.batch([
    env.DB.prepare('INSERT INTO progress_history (familie_id, data, updated_at, saved_at, fp) VALUES (?, ?, ?, ?, ?)').bind(fid, text, updatedAt, nu, fp),
    env.DB.prepare(
      'DELETE FROM progress_history WHERE familie_id = ?1 AND id NOT IN (SELECT id FROM progress_history WHERE familie_id = ?1 ORDER BY id DESC LIMIT ?2)',
    ).bind(fid, HISTORIK_MAX),
  ])
}

async function upsertProgress(env: Env, fid: string, text: string, updatedAt: number) {
  await env.DB.prepare(
    'INSERT INTO progress (familie_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(familie_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at',
  )
    .bind(fid, text, updatedAt)
    .run()
}

async function laesJson<T>(request: Request): Promise<T | Response> {
  const text = await request.text()
  if (text.length > MAX_JSON) return json({ fejl: 'For stor' }, 413)
  try {
    return JSON.parse(text) as T
  } catch {
    return json({ fejl: 'Ugyldig JSON' }, 400)
  }
}

// ------------------------------------------------------------ router

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request)

    const m = url.pathname.match(/^\/api\/f\/([^/]+)\/(progress|historik|gendan|togter|ark)(?:\/([^/]+))?$/)
    if (!m) return json({ fejl: 'Ukendt adresse' }, 404)
    const kode = decodeURIComponent(m[1]).toLowerCase()
    const del = m[2]
    const id = m[3] ? decodeURIComponent(m[3]).toLowerCase() : undefined
    if (!KODE_RE.test(kode)) return json({ fejl: 'Ugyldig kode' }, 400)
    if (id !== undefined && !ID_RE.test(id)) return json({ fejl: 'Ugyldigt id' }, 400)
    const metode = request.method

    // Læsning på en ukendt kode opretter ikke noget.
    const skriver = metode === 'PUT' || metode === 'POST' || metode === 'DELETE'
    const fid = skriver ? await findEllerOpretFamilie(env, kode) : await findFamilie(env, kode)

    // ---------------- progress
    if (del === 'progress' && !id) {
      if (metode === 'GET') {
        if (!fid) return json({ fejl: 'Ingen skat under den kode' }, 404)
        const row = await env.DB.prepare('SELECT data, updated_at FROM progress WHERE familie_id = ?').bind(fid).first<{ data: string; updated_at: number }>()
        if (!row) return json({ fejl: 'Ingen skat under den kode' }, 404)
        return json({ progress: JSON.parse(row.data), updatedAt: row.updated_at })
      }
      if (metode === 'PUT' && fid) {
        const body = await laesJson<{ progress?: Løs }>(request)
        if (body instanceof Response) return body
        const progress = body.progress
        if (!progress || typeof progress !== 'object') return json({ fejl: 'Mangler progress' }, 400)
        const updatedAt = typeof progress.updatedAt === 'number' ? progress.updatedAt : 0
        const row = await env.DB.prepare('SELECT data, updated_at FROM progress WHERE familie_id = ?').bind(fid).first<{ data: string; updated_at: number }>()
        if (row && row.updated_at > updatedAt) return json({ progress: JSON.parse(row.data), updatedAt: row.updated_at }, 409)
        const data = JSON.stringify(progress)
        await upsertProgress(env, fid, data, updatedAt)
        await gemHistorik(env, fid, data, updatedAt, fingerprint(progress))
        return json({ ok: true, updatedAt })
      }
    }

    // ---------------- historik
    if (del === 'historik' && !id && metode === 'GET') {
      if (!fid) return json({ historik: [] })
      const rows = await env.DB.prepare('SELECT id, saved_at, updated_at, fp FROM progress_history WHERE familie_id = ? ORDER BY id DESC LIMIT 50')
        .bind(fid)
        .all<{ id: number; saved_at: number; updated_at: number; fp: string }>()
      const historik = rows.results.map((r) => {
        const [pung, skat, stjaalet, crew, loest, navn] = r.fp.split('|')
        return { id: r.id, savedAt: r.saved_at, updatedAt: r.updated_at, pung: +pung, skat: +skat, stjaalet: +stjaalet, crew: +crew, loest: +loest, navn }
      })
      return json({ historik })
    }

    if (del === 'gendan' && !id && metode === 'POST' && fid) {
      const body = await laesJson<{ id?: unknown }>(request)
      if (body instanceof Response) return body
      const hid = Number(body.id)
      if (!Number.isInteger(hid)) return json({ fejl: 'Mangler id' }, 400)
      const row = await env.DB.prepare('SELECT data FROM progress_history WHERE id = ? AND familie_id = ?').bind(hid, fid).first<{ data: string }>()
      if (!row) return json({ fejl: 'Historikpunktet findes ikke' }, 404)
      const progress = JSON.parse(row.data) as Løs
      const nu = Date.now()
      progress.updatedAt = nu
      const text = JSON.stringify(progress)
      await upsertProgress(env, fid, text, nu)
      await gemHistorik(env, fid, text, nu, fingerprint(progress), true)
      return json({ progress, updatedAt: nu })
    }

    // ---------------- togter
    if (del === 'togter') {
      if (!id && metode === 'GET') {
        if (!fid) return json({ togter: [] })
        const rows = await env.DB.prepare('SELECT togt_id, data, updated_at, slettet FROM togter WHERE familie_id = ?')
          .bind(fid)
          .all<{ togt_id: string; data: string; updated_at: number; slettet: number }>()
        return json({ togter: rows.results.map((r) => ({ id: r.togt_id, togt: JSON.parse(r.data), updatedAt: r.updated_at, slettet: r.slettet === 1 })) })
      }
      if (id && metode === 'PUT' && fid) {
        const body = await laesJson<{ togt?: Løs; updatedAt?: unknown; slettet?: unknown }>(request)
        if (body instanceof Response) return body
        const updatedAt = typeof body.updatedAt === 'number' ? body.updatedAt : 0
        const slettet = body.slettet === true
        if (!slettet && (!body.togt || typeof body.togt !== 'object' || !Array.isArray(body.togt.opgaver))) return json({ fejl: 'Mangler togt' }, 400)
        const row = await env.DB.prepare('SELECT data, updated_at, slettet FROM togter WHERE familie_id = ? AND togt_id = ?')
          .bind(fid, id)
          .first<{ data: string; updated_at: number; slettet: number }>()
        if (row && row.updated_at > updatedAt) {
          return json({ id, togt: JSON.parse(row.data), updatedAt: row.updated_at, slettet: row.slettet === 1 }, 409)
        }
        const data = slettet ? '{"opgaver":[]}' : JSON.stringify(body.togt)
        await env.DB.prepare(
          'INSERT INTO togter (familie_id, togt_id, data, updated_at, slettet) VALUES (?, ?, ?, ?, ?) ON CONFLICT(familie_id, togt_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at, slettet = excluded.slettet',
        )
          .bind(fid, id, data, updatedAt, slettet ? 1 : 0)
          .run()
        if (slettet) await env.ARK.delete(`${fid}/${id}`)
        return json({ ok: true })
      }
    }

    // ---------------- arkfotos (private, kun via familiekoden)
    if (del === 'ark' && id) {
      const key = `${fid}/${id}`
      if (metode === 'GET') {
        if (!fid) return json({ fejl: 'Ikke fundet' }, 404)
        const obj = await env.ARK.get(key)
        if (!obj) return json({ fejl: 'Ikke fundet' }, 404)
        return new Response(obj.body, {
          headers: { 'content-type': obj.httpMetadata?.contentType ?? 'image/jpeg', 'cache-control': 'private, max-age=3600' },
        })
      }
      if (metode === 'PUT' && fid) {
        const type = (request.headers.get('content-type') ?? '').split(';')[0].trim()
        if (!BILLEDTYPER.has(type)) return json({ fejl: 'Kun JPEG, PNG eller WebP' }, 415)
        const buf = await request.arrayBuffer()
        if (buf.byteLength > MAX_BILLEDE) return json({ fejl: 'Billedet er for stort' }, 413)
        await env.ARK.put(key, buf, { httpMetadata: { contentType: type } })
        return json({ ok: true })
      }
      if (metode === 'DELETE' && fid) {
        await env.ARK.delete(key)
        return json({ ok: true })
      }
    }

    return json({ fejl: 'Metode ikke tilladt' }, 405)
  },
}
