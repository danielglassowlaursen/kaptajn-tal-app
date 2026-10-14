import { useState } from 'react'
import { CONFIG } from '../config'
import { parseNumber } from '../lib/check'
import { useTidsTaeller } from './TogtView'
import { fest } from '../lib/fest'
import { useTema } from '../tema'

interface Spm {
  a: number
  b: number
}

function lavSpoergsmaal(n: number): Spm[] {
  const alle: Spm[] = []
  for (const a of CONFIG.tabeller) for (let b = 1; b <= 10; b++) alle.push({ a, b })
  // bland
  for (let i = alle.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[alle[i], alle[j]] = [alle[j], alle[i]]
  }
  return alle.slice(0, n)
}

interface Props {
  onDone: () => void
  onTick: (sek: number) => void
}

/** Polly hører dig i tabellerne. Forkerte svar kommer igen, til alle er rigtige. */
export function TabelTraening({ onDone, onTick }: Props) {
  const maal = CONFIG.tabelSpoergsmaal
  const t = useTema()
  const [koe, setKoe] = useState<Spm[]>(() => lavSpoergsmaal(maal))
  const [rigtige, setRigtige] = useState(0)
  const [v, setV] = useState('')
  const [fb, setFb] = useState<{ ok: boolean; text: string } | null>(null)
  useTidsTaeller(true, onTick)

  const spm = koe[0]

  function submit() {
    if (!spm || v.trim() === '') return
    const facit = spm.a * spm.b
    const ok = parseNumber(v) === facit
    if (ok) {
      const n = rigtige + 1
      setRigtige(n)
      setFb({ ok: true, text: `Rigtigt! ${spm.a} · ${spm.b} = ${facit}` })
      setKoe(koe.slice(1))
      setV('')
      if (n >= maal) {
        fest('guld')
        window.setTimeout(onDone, 600)
      }
    } else {
      setFb({ ok: false, text: `Ikke helt. ${spm.a} · ${spm.b} = ${facit}. Den kommer igen om lidt!` })
      setKoe([...koe.slice(1), spm])
      setV('')
    }
  }

  return (
    <div className="card center drill">
      <div className="big-emoji">{t.hjaelper.emoji}</div>
      <h2 className="title">Tabel-træning</h2>
      <p className="muted">
        {t.hjaelper.navn} hører dig i tabellerne, før du må {t.gaaTilGemmested}.
      </p>
      <div className="progress drill-progress">
        <div className="progress-bar" style={{ width: `${(rigtige / maal) * 100}%` }} />
      </div>
      <div className="muted small">
        {rigtige} af {maal} rigtige
      </div>
      {spm && rigtige < maal && (
        <>
          <div className="drill-spm">
            {spm.a} · {spm.b} = ?
          </div>
          <div className="answer-row answer-center">
            <input
              className="tal-input"
              inputMode="numeric"
              value={v}
              onChange={(e) => setV(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="?"
              aria-label="Dit svar"
              autoFocus
            />
            <button className="btn btn-primary" disabled={v.trim() === ''} onClick={submit}>
              Svar ✔
            </button>
          </div>
        </>
      )}
      {fb && <div className={`feedback ${fb.ok ? 'feedback-ok' : 'feedback-retry'}`}>{fb.text}</div>}
      {rigtige >= maal && <div className="feedback feedback-ok">Flot! Nu må du {t.gaaTilGemmested}. ✨</div>}
    </div>
  )
}
