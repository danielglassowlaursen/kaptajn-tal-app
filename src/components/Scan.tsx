import { useEffect, useRef, useState } from 'react'
import type { Togt } from '../types'
import { klarTilScan, UDBYDER_INFO, type AiIndstillinger as Ai } from '../lib/ai'
import { komprimer, tilBase64 } from '../lib/billede'
import { scanArk, type ScanUdkast } from '../lib/sync'
import { AiIndstillingerKort } from './AiIndstillinger'
import { Gennemse } from './Gennemse'

interface Props {
  kode: string | null
  ai: Ai
  onGemAi: (a: Ai) => void
  /** Gem det godkendte togt sammen med det første foto. */
  onGem: (t: Togt, foto: Blob | null) => void
  onExit: () => void
}

interface Foto {
  blob: Blob
  url: string
}

const MAKS_FOTOS = 4
const POLLY_VENTER = [
  'Polly læser arket med sin kikkert …',
  'Polly tæller opgaverne …',
  'Polly regner facit efter …',
  'Polly skriver historierne …',
  'Næsten færdig – Polly tjekker hintene …',
]

/** Scan et ark: fotos → AI → gennemse → gem. */
export function Scan({ kode, ai, onGemAi, onGem, onExit }: Props) {
  const [fotos, setFotos] = useState<Foto[]>([])
  const [arkNavn, setArkNavn] = useState('')
  const [fase, setFase] = useState<'fotos' | 'scanner' | 'gennemse'>('fotos')
  const [fejl, setFejl] = useState<string | null>(null)
  const [udkast, setUdkast] = useState<ScanUdkast | null>(null)
  const [venteTekst, setVenteTekst] = useState(0)
  const fotoRef = useRef<HTMLInputElement>(null)
  const abort = useRef<AbortController | null>(null)

  useEffect(() => () => fotos.forEach((f) => URL.revokeObjectURL(f.url)), []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (fase !== 'scanner') return
    const id = window.setInterval(() => setVenteTekst((v) => Math.min(v + 1, POLLY_VENTER.length - 1)), 12000)
    return () => window.clearInterval(id)
  }, [fase])

  const mangler = klarTilScan(ai)

  async function tilfoejFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const filer = Array.from(e.target.files ?? []).slice(0, MAKS_FOTOS - fotos.length)
    e.target.value = ''
    setFejl(null)
    const nye: Foto[] = []
    for (const f of filer) {
      try {
        const blob = await komprimer(f)
        nye.push({ blob, url: URL.createObjectURL(blob) })
      } catch {
        setFejl(`"${f.name}" kunne ikke læses som billede.`)
      }
    }
    setFotos((p) => [...p, ...nye])
  }

  async function start() {
    if (!kode) return
    setFejl(null)
    setFase('scanner')
    setVenteTekst(0)
    abort.current = new AbortController()
    const billeder = await Promise.all(fotos.map(async (f) => ({ type: 'image/jpeg', data: await tilBase64(f.blob) })))
    const r = await scanArk(
      kode,
      { udbyder: ai.udbyder, model: ai.modeller[ai.udbyder], noegle: ai.noegler[ai.udbyder] ?? '', billeder, arkNavn: arkNavn.trim() || undefined, tema: 'pirat' },
      abort.current.signal,
    )
    if (r.status === 'fejl') {
      setFejl(r.besked)
      setFase('fotos')
      return
    }
    setUdkast(r.udkast)
    setFase('gennemse')
  }

  if (fase === 'gennemse' && udkast) {
    return (
      <Gennemse
        togt={udkast.togt}
        usikre={udkast.usikre}
        fotoUrls={fotos.map((f) => f.url)}
        forbrug={udkast.forbrug}
        onGem={(t) => onGem(t, fotos[0]?.blob ?? null)}
        onKasser={onExit}
      />
    )
  }

  if (fase === 'scanner') {
    return (
      <div className="page">
        <div className="card center">
          <div className="big-emoji polly-hop">🦜</div>
          <h1 className="title">Polly arbejder</h1>
          <p className="intro">{POLLY_VENTER[venteTekst]}</p>
          <p className="muted small">Det tager typisk et til tre minutter. Lad skærmen være åben.</p>
          <button
            className="btn btn-ghost"
            onClick={() => {
              abort.current?.abort()
              setFase('fotos')
            }}
          >
            Afbryd
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <h1 className="section-title">📷 Scan et ark</h1>

      {!kode && (
        <div className="card">
          <p>Scanning kræver en familiekode, så togtet og fotoet kan gemmes. Opret en på forsiden først.</p>
          <button className="btn btn-primary" onClick={onExit}>
            Til forsiden
          </button>
        </div>
      )}

      {kode && mangler && <AiIndstillingerKort ai={ai} onGem={onGemAi} />}

      {kode && !mangler && (
        <>
          <div className="card">
            <h2 className="card-title">1. Tag et billede af arket</h2>
            <p className="muted small">
              Læg arket fladt i godt lys, og tag hele arket med. Er det to sider, så tag et billede af hver (højst {MAKS_FOTOS}).
            </p>
            {fotos.length > 0 && (
              <div className="foto-raekke">
                {fotos.map((f, i) => (
                  <div className="foto-mini" key={f.url}>
                    <img src={f.url} alt={`Foto ${i + 1}`} />
                    <button
                      className="btn btn-ghost btn-small"
                      onClick={() => {
                        URL.revokeObjectURL(f.url)
                        setFotos(fotos.filter((_, j) => j !== i))
                      }}
                    >
                      Fjern
                    </button>
                  </div>
                ))}
              </div>
            )}
            {fotos.length < MAKS_FOTOS && (
              <button className="btn btn-primary" onClick={() => fotoRef.current?.click()}>
                {fotos.length === 0 ? '📷 Tag eller vælg foto' : '📷 Tilføj endnu et foto'}
              </button>
            )}
            <input ref={fotoRef} type="file" accept="image/*" capture="environment" multiple hidden onChange={(e) => void tilfoejFotos(e)} />
            <label className="felt-label">
              Arkets navn (valgfrit)
              <input className="name-input" value={arkNavn} placeholder="fx Uge 42 eller Samu-regn 5" onChange={(e) => setArkNavn(e.target.value)} />
            </label>
          </div>

          <div className="card">
            <h2 className="card-title">2. Lad Polly lave togtet</h2>
            <p className="muted small">
              Bruger {UDBYDER_INFO[ai.udbyder].navn} med modellen <b>{ai.modeller[ai.udbyder]}</b>. Fotoet sendes til {UDBYDER_INFO[ai.udbyder].navn}. Bagefter
              gennemser du alt, før det gemmes.
            </p>
            <div className="btn-row left">
              <button className="btn btn-primary btn-big" disabled={fotos.length === 0} onClick={() => void start()}>
                Lav togtet 🦜
              </button>
              <button className="btn btn-ghost btn-small" onClick={() => onGemAi({ ...ai, noegler: { ...ai.noegler, [ai.udbyder]: undefined } })}>
                Skift nøgle eller udbyder
              </button>
            </div>
          </div>
        </>
      )}

      {fejl && <div className="feedback feedback-retry">{fejl}</div>}
      <button className="btn btn-ghost" onClick={onExit}>
        ← Tilbage
      </button>
    </div>
  )
}
