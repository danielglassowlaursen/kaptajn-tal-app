import { useRef, useState } from 'react'
import type { Progress } from '../types'
import type { GemtTogt } from '../lib/togtStore'
import { KODE_RE, gendanMedKode, hentHistorik, lavGendannelse, lavKode, normaliserKode, type HistorikPunkt, type SyncState } from '../lib/sync'
import { GemKoder } from './GemKoder'

export type ForbindResultat = { status: 'oprettet' } | { status: 'hentet' } | { status: 'konflikt'; cloud: Progress } | { status: 'fejl'; besked: string }

interface Props {
  kode: string | null
  sync: SyncState
  onForbind: (kode: string) => Promise<ForbindResultat>
  onLoes: (valg: 'hent' | 'behold', kode: string, cloud: Progress) => void
  onAfbryd: () => void
  onEksport: () => void
  onImport: (p: Progress, togter?: GemtTogt[]) => void
  /** Gendan et historikpunkt. Returnerer fejlbesked eller null. */
  onGendan: (id: number) => Promise<string | null>
}

function klokke(ms: number) {
  return new Date(ms).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })
}

function datoTid(ms: number) {
  return new Date(ms).toLocaleString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/** Accepterer både en rå Progress og eksportformatet { progress, togter? }. */
function parseKopi(text: string): { p: Progress; togter?: GemtTogt[] } | null {
  try {
    const j = JSON.parse(text)
    const p = j && typeof j === 'object' && 'progress' in j ? j.progress : j
    if (!p || typeof p !== 'object' || typeof p.togter !== 'object') return null
    const togter = Array.isArray(j?.egneTogter) ? (j.egneTogter as GemtTogt[]) : undefined
    return { p: p as Progress, togter }
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
    const kopi = parseKopi(await f.text())
    if (!kopi) {
      setBesked('Filen ligner ikke en kopi fra Kaptajn Tal.')
      return
    }
    const p = kopi.p
    const loest = Object.values(p.togter).reduce((n, t) => n + Object.keys(t.done ?? {}).length, 0)
    if (!window.confirm(`Hent kopien ind? (${p.skat ?? 0} begravet, ${p.pung ?? 0} i pungen, ${loest} løst). Den erstatter skatten på denne enhed${kode ? ' og i skyen' : ''}.`)) return
    onImport(p, kopi.togter)
    setBesked('Kopien er hentet ind.')
  }
  const [input, setInput] = useState('')
  const [travl, setTravl] = useState(false)
  const [besked, setBesked] = useState<string | null>(null)
  const [konflikt, setKonflikt] = useState<{ kode: string; cloud: Progress } | null>(null)
  // Gendannelseskode
  const [visGk, setVisGk] = useState<{ familiekode: string; gk: string } | null>(null)
  const [gkFindes, setGkFindes] = useState<number | null>(null)
  const [gkBesked, setGkBesked] = useState<string | null>(null)
  const [glemt, setGlemt] = useState(false)
  const [gkInput, setGkInput] = useState('')

  async function hentGendannelse(k: string, ny = false) {
    setGkBesked(null)
    const r = await lavGendannelse(k, ny)
    if (r.status === 'ok') {
      setVisGk({ familiekode: k, gk: r.gendannelseskode })
      setGkFindes(null)
    } else if (r.status === 'findes') setGkFindes(r.oprettet)
    else setGkBesked(r.besked)
  }

  async function gendanMedGk() {
    setTravl(true)
    setBesked(null)
    const r = await gendanMedKode(gkInput)
    if (r.status === 'fejl') {
      setTravl(false)
      setBesked(r.besked)
      return
    }
    const f = await onForbind(r.kode)
    setTravl(false)
    if (f.status === 'konflikt') return setKonflikt({ kode: r.kode, cloud: f.cloud })
    if (f.status === 'fejl') return setBesked(f.besked)
    setGlemt(false)
    setGkInput('')
    setRedigerer(false)
    setBesked(`Fundet! I er forbundet til familiekoden ${r.kode} igen.`)
  }

  async function forbind() {
    const k = normaliserKode(input)
    if (!KODE_RE.test(k)) {
      setBesked('Koden skal være 6–40 tegn: små bogstaver, tal og bindestreg.')
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
    if (r.status === 'oprettet') void hentGendannelse(k)
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
              placeholder="fx anker-komet-ugle-42"
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
          {!glemt ? (
            <button className="link-btn" onClick={() => setGlemt(true)}>
              Glemt familiekoden?
            </button>
          ) : (
            <div className="glemt">
              <p className="muted small">Skriv jeres gendannelseskode fra kodekortet (16 tegn, fx ABCD-EFGH-JKLM-NPQR).</p>
              <div className="kode-row">
                <input
                  className="name-input kode-input"
                  value={gkInput}
                  onChange={(e) => setGkInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void gendanMedGk()}
                  placeholder="ABCD-EFGH-JKLM-NPQR"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <button className="btn btn-primary" disabled={travl || gkInput.replace(/[^a-z0-9]/gi, '').length !== 16} onClick={() => void gendanMedGk()}>
                  Find koden
                </button>
              </div>
              <p className="muted small">Har I hverken familiekoden eller gendannelseskoden, kan skatten desværre ikke findes igen – appen gemmer ingen e-mail eller konto.</p>
            </div>
          )}
        </>
      )}

      {kode && !redigerer && !visGk && (
        <div className="gk-sektion">
          {gkFindes === null ? (
            <button className="btn btn-ghost btn-small" onClick={() => void hentGendannelse(kode)}>
              🔐 Gendannelseskode
            </button>
          ) : (
            <div className="glemt">
              <p className="muted small">
                I lavede en gendannelseskode {new Date(gkFindes).toLocaleDateString('da-DK')}. Af sikkerhedshensyn kan den ikke vises igen. Har I mistet den, så lav en ny –
                den gamle holder så op med at virke.
              </p>
              <div className="btn-row left">
                <button
                  className="btn btn-ghost btn-small"
                  onClick={() => window.confirm('Lav en ny gendannelseskode? Den gamle holder op med at virke.') && void hentGendannelse(kode, true)}
                >
                  Lav en ny gendannelseskode
                </button>
                <button className="btn btn-ghost btn-small" onClick={() => setGkFindes(null)}>
                  Luk
                </button>
              </div>
            </div>
          )}
          {gkBesked && <p className="muted small">{gkBesked}</p>}
        </div>
      )}
      {visGk && <GemKoder familiekode={visGk.familiekode} gendannelseskode={visGk.gk} onFaerdig={() => setVisGk(null)} />}

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
