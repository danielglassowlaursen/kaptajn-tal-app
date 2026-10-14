import { useRef, useState } from 'react'
import type { Progress } from '../types'
import { KODE_RE, hentHistorik, lavKode, normaliserKode, type HistorikPunkt, type SyncState } from '../lib/sync'

export type ForbindResultat = { status: 'oprettet' } | { status: 'hentet' } | { status: 'konflikt'; cloud: Progress } | { status: 'fejl'; besked: string }

interface Props {
  kode: string | null
  sync: SyncState
  onForbind: (kode: string) => Promise<ForbindResultat>
  onLoes: (valg: 'hent' | 'behold', kode: string, cloud: Progress) => void
  onAfbryd: () => void
  onEksport: () => void
  onImport: (p: Progress) => void
  /** Gendan et historikpunkt. Returnerer fejlbesked eller null. */
  onGendan: (id: number) => Promise<string | null>
}

function klokke(ms: number) {
  return new Date(ms).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })
}

function datoTid(ms: number) {
  return new Date(ms).toLocaleString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/** Accepterer både en rå Progress og API-/eksportformatet { progress }. */
function parseKopi(text: string): Progress | null {
  try {
    const j = JSON.parse(text)
    const p = j && typeof j === 'object' && 'progress' in j ? j.progress : j
    if (!p || typeof p !== 'object' || typeof p.togter !== 'object') return null
    return p as Progress
  } catch {
    return null
  }
}

/** Kortet "Familiekode": forbinder enheden til skatten i skyen. */
export function FamilieKode({ kode, sync, onForbind, onLoes, onAfbryd, onEksport, onImport, onGendan }: Props) {
  const [redigerer, setRedigerer] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [historik, setHistorik] = useState<HistorikPunkt[] | null>(null)
  const [historikBesked, setHistorikBesked] = useState<string | null>(null)
  const [historikTravl, setHistorikTravl] = useState(false)

  async function visHistorik() {
    if (!kode) return
    setHistorikTravl(true)
    const r = await hentHistorik(kode)
    setHistorikTravl(false)
    if (r.status === 'ok') {
      setHistorik(r.historik)
      setHistorikBesked(r.historik.length === 0 ? 'Ingen historik endnu.' : null)
    } else setHistorikBesked(r.besked)
  }

  async function gendan(h: HistorikPunkt) {
    if (!window.confirm(`Gendan skatten, som den var ${datoTid(h.savedAt)}? (${h.skat} begravet, ${h.pung} i pungen, ${h.loest} løst). Den nuværende version bliver også gemt i historikken.`)) return
    setHistorikTravl(true)
    const fejl = await onGendan(h.id)
    setHistorikTravl(false)
    setHistorikBesked(fejl ?? `Gendannet til ${datoTid(h.savedAt)}.`)
    if (!fejl) void visHistorik()
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const p = parseKopi(await f.text())
    if (!p) {
      setBesked('Filen ligner ikke en kopi fra Kaptajn Tal.')
      return
    }
    const loest = Object.values(p.togter).reduce((n, t) => n + Object.keys(t.done ?? {}).length, 0)
    if (!window.confirm(`Hent kopien ind? (${p.skat ?? 0} begravet, ${p.pung ?? 0} i pungen, ${loest} løst). Den erstatter skatten på denne enhed${kode ? ' og i skyen' : ''}.`)) return
    onImport(p)
    setBesked('Kopien er hentet ind.')
  }
  const [input, setInput] = useState('')
  const [travl, setTravl] = useState(false)
  const [besked, setBesked] = useState<string | null>(null)
  const [konflikt, setKonflikt] = useState<{ kode: string; cloud: Progress } | null>(null)

  async function forbind() {
    const k = normaliserKode(input)
    if (!KODE_RE.test(k)) {
      setBesked('Koden skal være 6–32 tegn: små bogstaver, tal og bindestreg.')
      return
    }
    setTravl(true)
    setBesked(null)
    const r = await onForbind(k)
    setTravl(false)
    if (r.status === 'konflikt') {
      setKonflikt({ kode: k, cloud: r.cloud })
      return
    }
    if (r.status === 'fejl') {
      setBesked(r.besked)
      return
    }
    setBesked(r.status === 'oprettet' ? `Koden ${k} er oprettet, og skatten er gemt i skyen.` : `Skatten under ${k} er hentet til denne enhed.`)
    setRedigerer(false)
    setInput('')
  }

  const status =
    sync.status === 'off' ? null : sync.status === 'syncing' ? '⏳ Gemmer …' : sync.status === 'ok' ? `☁️ Synkroniseret kl. ${klokke(sync.sidst)}` : `⚠️ ${sync.besked}`

  return (
    <div className="card kode-card">
      <h2 className="card-title">☁️ Familiekode</h2>

      {kode && !redigerer && (
        <>
          <p>
            Denne enhed er forbundet til koden <b className="kode-value">{kode}</b>. Skriv den samme kode på en anden enhed, så følger skatten med.
          </p>
          {status && <p className="muted small">{status}</p>}
          <div className="btn-row left">
            <button className="btn btn-ghost btn-small" onClick={() => setRedigerer(true)}>
              Skift kode
            </button>
            <button className="btn btn-ghost btn-small" onClick={onAfbryd}>
              Afbryd forbindelsen
            </button>
          </div>
        </>
      )}

      {(!kode || redigerer) && !konflikt && (
        <>
          {!kode && <p>Uden kode gemmes skatten kun på denne enhed. Med en familiekode gemmes den i skyen og kan hentes på iPad, telefon og computer.</p>}
          <div className="kode-row">
            <input
              className="name-input kode-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && forbind()}
              placeholder="fx kraken-482"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <button className="btn btn-primary" disabled={travl || input.trim() === ''} onClick={forbind}>
              {travl ? 'Forbinder …' : 'Forbind'}
            </button>
          </div>
          <div className="btn-row left">
            <button className="btn btn-ghost btn-small" onClick={() => setInput(lavKode())}>
              🎲 Lav en ny kode til mig
            </button>
            {redigerer && (
              <button className="btn btn-ghost btn-small" onClick={() => setRedigerer(false)}>
                Fortryd
              </button>
            )}
          </div>
          <p className="muted small">Alle, der kender koden, kan se og ændre skatten. Vælg noget, kun familien kender.</p>
        </>
      )}

      {konflikt && (
        <div className="konflikt">
          <p>
            Der ligger allerede en skat under <b>{konflikt.kode}</b> ({konflikt.cloud.skat} begravet, {konflikt.cloud.crew.length} i besætningen) – og denne enhed har også
            en. Hvilken skal gælde?
          </p>
          <div className="btn-row left">
            <button
              className="btn btn-primary"
              onClick={() => {
                onLoes('hent', konflikt.kode, konflikt.cloud)
                setKonflikt(null)
                setRedigerer(false)
                setBesked('Skatten fra skyen er hentet til denne enhed.')
              }}
            >
              Hent skatten fra koden
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                onLoes('behold', konflikt.kode, konflikt.cloud)
                setKonflikt(null)
                setRedigerer(false)
                setBesked('Denne enheds skat er nu gemt under koden.')
              }}
            >
              Behold denne enheds skat
            </button>
            <button className="btn btn-ghost btn-small" onClick={() => setKonflikt(null)}>
              Fortryd
            </button>
          </div>
        </div>
      )}

      {besked && <div className="feedback feedback-polly">{besked}</div>}

      <h3 className="card-subtitle">💾 Sikkerhedskopi</h3>
      <p className="muted small">Gem en kopi af skatten som fil på enheden, eller hent en kopi tilbage.</p>
      <div className="btn-row left">
        <button className="btn btn-ghost btn-small" onClick={onEksport}>
          💾 Gem en kopi
        </button>
        <button className="btn btn-ghost btn-small" onClick={() => fileRef.current?.click()}>
          📂 Hent fra fil
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => void handleFile(e)} />
      </div>

      {kode && (
        <>
          <h3 className="card-subtitle">🕘 Historik</h3>
          <p className="muted small">Skyen gemmer tidligere versioner af skatten. Blev noget overskrevet ved en fejl, kan du gå tilbage her.</p>
          {historik === null ? (
            <button className="btn btn-ghost btn-small" onClick={() => void visHistorik()} disabled={historikTravl}>
              {historikTravl ? 'Henter …' : 'Vis historik'}
            </button>
          ) : (
            <div className="historik">
              {historik.map((h) => (
                <div className="historik-row" key={h.id}>
                  <div className="historik-dato">{datoTid(h.savedAt)}</div>
                  <div className="historik-info muted small">
                    💰 {h.skat} begravet · {h.pung} i pungen · {h.loest} løst · 👥 {h.crew}
                  </div>
                  <button className="btn btn-ghost btn-small" onClick={() => void gendan(h)} disabled={historikTravl}>
                    Gendan
                  </button>
                </div>
              ))}
              <button className="btn btn-ghost btn-small" onClick={() => void visHistorik()} disabled={historikTravl}>
                Opdatér
              </button>
            </div>
          )}
          {historikBesked && <div className="feedback feedback-polly">{historikBesked}</div>}
        </>
      )}
    </div>
  )
}
