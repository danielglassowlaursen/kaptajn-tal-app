import { useRef, useState } from 'react'
import type { Togt } from '../types'
import { useTema } from '../tema'

interface Props {
  togter: Togt[]
  /** Antal opgaver pr. togt, som barnet har meldt forkerte. */
  rapporter: Record<string, number>
  onRet: (togtId: string) => void
  onScan: () => void
  harKode: boolean
  onTilfoejFil: (text: string) => { ok: boolean; besked: string }
  onEksport: (t: Togt) => void
  onSlet: (t: Togt) => void
  onFoto: (t: Togt, fil: File) => Promise<string | null>
  onFjernFoto: (t: Togt) => void
}

/** Kortet "Dine togter": tilføj fra fil, arkfoto, eksport og sletning. */
export function MineTogter({ togter, rapporter, onRet, onScan, harKode, onTilfoejFil, onEksport, onSlet, onFoto, onFjernFoto }: Props) {
  const t0 = useTema()
  const filRef = useRef<HTMLInputElement>(null)
  const fotoRef = useRef<HTMLInputElement>(null)
  const [fotoTil, setFotoTil] = useState<Togt | null>(null)
  const [besked, setBesked] = useState<{ ok: boolean; text: string } | null>(null)
  const [travl, setTravl] = useState<string | null>(null)

  async function handleFil(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const r = onTilfoejFil(await f.text())
    setBesked({ ok: r.ok, text: r.besked })
  }

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f || !fotoTil) return
    setTravl(fotoTil.id)
    const fejl = await onFoto(fotoTil, f)
    setTravl(null)
    setBesked(fejl ? { ok: false, text: fejl } : { ok: true, text: `Fotoet af arket er gemt til "${fotoTil.title}".` })
    setFotoTil(null)
  }

  return (
    <div className="card">
      <h2 className="card-title">
        🗺️ Dine {t0.rejser}
      </h2>
      <p className="muted small">
        Tag et foto af dit barns regneark, så laver {t0.hjaelper.navn} et {t0.rejse} med historier og hints. Du gennemser alt, før det gemmes. Kræver familiekode og din
        egen AI-nøgle.
      </p>
      <div className="btn-row left">
        <button className="btn btn-primary" onClick={onScan}>
          📷 Scan et ark
        </button>
        <button className="btn btn-ghost btn-small" onClick={() => filRef.current?.click()}>
          📂 Tilføj fra fil
        </button>
        <input ref={filRef} type="file" accept="application/json,.json" hidden onChange={(e) => void handleFil(e)} />
      </div>

      {togter.length > 0 && (
        <div className="mine-togter">
          {togter.map((t) => (
            <div className="mit-togt" key={t.id}>
              <div className="mit-togt-navn">
                {t.emoji} <b>{t.title}</b>
                <span className="muted small">
                  {' '}
                  · {t.opgaver.length} opgaver{t.ark?.foto ? ' · 📷 arkfoto' : ''}
                </span>
                {(rapporter[t.id] ?? 0) > 0 && (
                  <span className="rapport-badge">
                    🚩 {rapporter[t.id]} meldt forkert
                  </span>
                )}
              </div>
              <div className="btn-row left">
                <button className="btn btn-ghost btn-small" onClick={() => onRet(t.id)}>
                  ✏️ Ret
                </button>
                {harKode && (
                  <button
                    className="btn btn-ghost btn-small"
                    disabled={travl === t.id}
                    onClick={() => {
                      setFotoTil(t)
                      fotoRef.current?.click()
                    }}
                  >
                    {travl === t.id ? 'Gemmer …' : t.ark?.foto ? '📷 Skift arkfoto' : '📷 Tilføj arkfoto'}
                  </button>
                )}
                {t.ark?.foto && (
                  <button className="btn btn-ghost btn-small" onClick={() => onFjernFoto(t)}>
                    Fjern foto
                  </button>
                )}
                <button className="btn btn-ghost btn-small" onClick={() => onEksport(t)}>
                  💾 Eksportér
                </button>
                <button
                  className="btn btn-ghost btn-small"
                  onClick={() => {
                    if (window.confirm(`Slet "${t.title}"? Fremgangen bliver liggende i skatten, men opgaverne forsvinder.`)) onSlet(t)
                  }}
                >
                  🗑 Slet
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {!harKode && togter.length > 0 && <p className="muted small">Arkfotos kræver en familiekode, fordi de gemmes i skyen.</p>}
      <input ref={fotoRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => void handleFoto(e)} />
      {besked && <div className={`feedback ${besked.ok ? 'feedback-ok' : 'feedback-retry'}`}>{besked.text}</div>}
    </div>
  )
}
