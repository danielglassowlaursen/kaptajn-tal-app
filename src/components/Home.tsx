import type { ReactNode } from 'react'
import type { Progress, Togt } from '../types'
import { doneIds, togtCoins } from '../lib/progress'
import { Moent } from './Moent'

interface Props {
  progress: Progress
  togter: Togt[]
  kodeKort?: ReactNode
  mineTogter?: ReactNode
  onName: (name: string) => void
  onStart: (togtId: string, startIndex: number) => void
  onOversigt: (togtId: string) => void
}

/** Forsiden: hilsen + togter. Skat og besætning har deres egne sider i topmenuen. */
export function Home({ progress, togter, kodeKort, mineTogter, onName, onStart, onOversigt }: Props) {
  const name = progress.name.trim()
  return (
    <div className="page">
      <header className="hero">
        <div className="hero-flag">🏴‍☠️</div>
        <h1 className="title title-xl">Kaptajn Tal</h1>
        <p className="hero-sub">{name ? `Ohøj, kaptajn ${name}! Regn dig frem til skatten!` : 'Regn dig frem til skatten!'}</p>
      </header>

      <div className="card">
        <label className="name-row">
          <span>Ohøj! Hvad hedder du, kaptajn?</span>
          <input className="name-input" value={progress.name} onChange={(e) => onName(e.target.value)} placeholder="Skriv dit navn" maxLength={24} />
        </label>
      </div>

      {kodeKort}

      {mineTogter}

      <h2 className="section-title">Vælg et togt</h2>
      <div className="togt-list">
        {togter.map((t) => {
          const done = doneIds(progress, t.id)
          const doneCount = t.opgaver.filter((o) => done.has(o.id)).length
          const total = t.opgaver.length
          const firstOpen = t.opgaver.findIndex((o) => !done.has(o.id))
          const startIndex = firstOpen === -1 ? 0 : firstOpen
          const label = doneCount === 0 ? 'Sejl ud! ⛵' : doneCount < total ? 'Fortsæt ⛵' : 'Øv igen 🔁'
          return (
            <div className="card togt-card" key={t.id}>
              <div className="togt-emoji">{t.emoji}</div>
              <div className="togt-info">
                <div className="togt-title">{t.title}</div>
                <div className="muted">
                  {t.subtitle} · {total} opgaver{t.ark && ` · 📄 ${t.ark.navn}`}
                </div>
                <div className="progress">
                  <div className="progress-bar" style={{ width: `${(doneCount / total) * 100}%` }} />
                </div>
                <div className="muted small">
                  {doneCount}/{total} løst · <Moent size={16} /> {togtCoins(progress, t.id)} tjent ·{' '}
                  <button className="link-btn" onClick={() => onOversigt(t.id)}>
                    📋 Oversigt
                  </button>
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => onStart(t.id, startIndex)}>
                {label}
              </button>
            </div>
          )
        })}
      </div>

    </div>
  )
}
