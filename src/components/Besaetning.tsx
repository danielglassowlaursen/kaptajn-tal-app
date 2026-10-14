import type { Progress } from '../types'
import { CONFIG } from '../config'
import { flaade, naesteSkib, sekunderIDag, streak } from '../lib/spil'
import { crewNavn, useTema } from '../tema'

interface Props {
  progress: Progress
  iDag: string
}

/** Siden "Din besætning" / "Dit hof": streak, dagens minutter, besætning og samling. */
export function Besaetning({ progress, iDag }: Props) {
  const t = useTema()
  const sek = sekunderIDag(progress, iDag)
  const maalMin = CONFIG.dagligtMaalSek / 60
  const minIDag = Math.min(maalMin, Math.floor(sek / 60))
  const dageITraek = streak(progress, iDag)
  const antal = progress.crew.length
  const samling = flaade(antal, t)
  const naeste = naesteSkib(antal, t)
  const mangler = naeste ? naeste.crew - antal : 0

  return (
    <div className="page">
      <h1 className="section-title">
        {t.menu.crew[0]} {t.crewTitel}
      </h1>

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
            <div className="stat-label">{t.crewOrd}</div>
            <div className="stat-value">👥 {antal}</div>
            <div className="muted small">+1 for hver dag du når målet</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">👥 {t.ombord}</h2>
        {antal === 0 ? (
          <p className="muted">
            Ingen endnu. Regn {maalMin} minutter i dag, så kommer den første {t.crewMedlem}!
          </p>
        ) : (
          <div className="crew">
            {progress.crew.map((_, i) => (
              <span className="crew-chip" key={i}>
                {t.crewEmoji[i % t.crewEmoji.length]} {crewNavn(t, i)}
              </span>
            ))}
          </div>
        )}
        <p className="muted small">Glemmer du en dag, forsvinder den sidste {t.crewMedlem}.</p>
      </div>

      <div className="card">
        <h2 className="card-title">✨ {t.samlingTitel}</h2>
        <div className="flaade">
          {samling.map((s) => (
            <div className="skib" key={s.navn}>
              <span className="skib-emoji">{s.emoji}</span>
              <span className="skib-navn">{s.navn}</span>
            </div>
          ))}
        </div>
        {naeste && (
          <p className="muted small">
            Næste: {naeste.emoji} <b>{naeste.navn}</b> – du mangler {mangler} {mangler === 1 ? t.crewMedlem : t.crewMedlemmer}.
          </p>
        )}
        <details className="flaade-liste">
          <summary>Alle {t.samlingFlertal}</summary>
          <ul className="regler">
            {t.samling.map((s) => (
              <li key={s.navn} className={s.crew <= antal ? 'is-done' : ''}>
                {s.emoji} <b>{s.navn}</b> – {s.crew === 0 ? 'har du fra start' : `kræver ${s.crew} i dit ${t.crewOrd}`}
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  )
}
