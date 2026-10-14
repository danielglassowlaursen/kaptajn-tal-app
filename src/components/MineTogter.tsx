import { useRef, useState } from 'react'
import type { Togt } from '../types'

interface Props {
  togter: Togt[]
  onScan: () => void
  harKode: boolean
  onTilfoejFil: (text: string) => { ok: boolean; besked: string }
  onEksport: (t: Togt) => void
  onSlet: (t: Togt) => void
  onFoto: (t: Togt, fil: File) => Promise<string | null>
  onFjernFoto: (t: Togt) => void
}

/** Kortet "Dine togter": tilføj fra fil, arkfoto, eksport og sletning. */
export function MineTogter({ togter, onScan, harKode, onTilfoejFil, onEksport, onSlet, onFoto, onFjernFoto }: Props) {
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
      <h2 className="card-title">🗺️ Dine togter</h2>
      <p className="muted small">
        Tag et foto af dit barns regneark, så laver Polly et togt med historier og hints. Du gennemser alt, før det gemmes. Kræver familiekode og din
        egen AI-nøgle.
      </p>
      <div className="btn-row left">
        <button className="btn btn-primary" onClick={onScan}>
          📷 Scan et ark
        </button>
        <button className="btn btn-ghost btn-small" onClick={() => filRef.current?.click()}>
          📂 Tilføj togt fra fil
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
              </div>
              <div className="btn-row left">
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
                    if (window.confirm(`Slet togtet "${t.title}"? Fremgangen på togtet bliver liggende i skatten, men opgaverne forsvinder.`)) onSlet(t)
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
