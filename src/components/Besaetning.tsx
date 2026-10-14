import type { Progress } from '../types'
import { CONFIG } from '../config'
import { CREW_EMOJI, SKIBE } from '../data/flaade'
import { flaade, naesteSkib, sekunderIDag, streak } from '../lib/spil'

interface Props {
  progress: Progress
  iDag: string
}

/** Siden "Din besætning": streak, dagens minutter, besætning og flåde. */
export function Besaetning({ progress, iDag }: Props) {
  const sek = sekunderIDag(progress, iDag)
  const maalMin = CONFIG.dagligtMaalSek / 60
  const minIDag = Math.min(maalMin, Math.floor(sek / 60))
  const dageITraek = streak(progress, iDag)
  const skibe = flaade(progress.crew.length)
  const naeste = naesteSkib(progress.crew.length)
  const mangler = naeste ? naeste.crew - progress.crew.length : 0

  return (
    <div className="page">
      <h1 className="section-title">⚓ Din besætning</h1>

      <div className="card">
        <div className="stat-grid">
          <div className="stat">
            <div className="stat-label">Dage i træk</div>
            <div className="stat-value">🔥 {dageITraek}</div>
            <div className="muted small">{maalMin} min matematik om dagen</div>
          </div>
          <div className="stat">
            <div className="stat-label">I dag</div>
            <div className="stat-value">
              ⏱ {minIDag}/{maalMin} min
            </div>
            <div className="progress">
              <div className="progress-bar" style={{ width: `${Math.min(100, (sek / CONFIG.dagligtMaalSek) * 100)}%` }} />
            </div>
          </div>
          <div className="stat">
            <div className="stat-label">Besætning</div>
            <div className="stat-value">👥 {progress.crew.length}</div>
            <div className="muted small">+1 for hver dag du når målet</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">👥 Ombord</h2>
        {progress.crew.length === 0 ? (
          <p className="muted">Ingen ombord endnu. Regn {maalMin} minutter i dag, så går det første besætningsmedlem ombord!</p>
        ) : (
          <div className="crew">
            {progress.crew.map((navn, i) => (
              <span className="crew-chip" key={navn}>
                {CREW_EMOJI[i % CREW_EMOJI.length]} {navn}
              </span>
            ))}
          </div>
        )}
        <p className="muted small">Glemmer du en dag, springer det sidste besætningsmedlem fra.</p>
      </div>

      <div className="card">
        <h2 className="card-title">🚢 Din flåde</h2>
        <div className="flaade">
          {skibe.map((s) => (
            <div className="skib" key={s.navn}>
              <span className="skib-emoji">{s.emoji}</span>
              <span className="skib-navn">{s.navn}</span>
            </div>
          ))}
        </div>
        {naeste && (
          <p className="muted small">
            Næste skib: {naeste.emoji} <b>{naeste.navn}</b> – du mangler {mangler} besætningsmedlem{mangler === 1 ? '' : 'mer'}.
          </p>
        )}
        <details className="flaade-liste">
          <summary>Alle skibe</summary>
          <ul className="regler">
            {SKIBE.map((s) => (
              <li key={s.navn} className={s.crew <= progress.crew.length ? 'is-done' : ''}>
                {s.emoji} <b>{s.navn}</b> – {s.crew === 0 ? 'har du fra start' : `kræver ${s.crew} i besætningen`}
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  )
}
