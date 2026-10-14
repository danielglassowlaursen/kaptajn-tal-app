import type { ReactNode } from 'react'
import type { Progress, Togt } from '../types'
import { doneIds, togtCoins } from '../lib/progress'
import { Moent } from './Moent'
import { appNavn, TEMA_LISTE, useTema, type TemaId } from '../tema'

interface Props {
  progress: Progress
  togter: Togt[]
  kodeKort?: ReactNode
  mineTogter?: ReactNode
  onName: (name: string) => void
  onTema: (id: TemaId) => void
  onStart: (togtId: string, startIndex: number) => void
  onOversigt: (togtId: string) => void
}

/** Forsiden: hilsen + togter. Skat og besætning har deres egne sider i topmenuen. */
export function Home({ progress, togter, kodeKort, mineTogter, onName, onTema, onStart, onOversigt }: Props) {
  const tm = useTema()
  const name = progress.name.trim()
  return (
    <div className="page">
      <header className="hero">
        <div className="hero-flag">{tm.flag}</div>
        <h1 className="title title-xl">Kaptajn Tal</h1>
        {tm.undertitel && <div className="hero-undertitel">{tm.undertitel}</div>}
        <p className="hero-sub">{name ? `${tm.hilsen}, ${tm.titel} ${name}! ${tm.slogan}` : tm.slogan}</p>
      </header>

      <div className="card">
        <label className="name-row">
          <span>
            {tm.hilsen}! Hvad hedder du, {tm.titel}?
          </span>
          <input className="name-input" value={progress.name} onChange={(e) => onName(e.target.value)} placeholder="Skriv dit navn" maxLength={24} />
        </label>
        <div className="tema-valg">
          <span className="felt-label">Vælg tema</span>
          <div className="udbyder-valg" role="radiogroup" aria-label="Tema">
            {TEMA_LISTE.map((x) => (
              <button key={x.id} className={`chip tema-chip ${x.id === tm.id ? 'on' : ''}`} role="radio" aria-checked={x.id === tm.id} onClick={() => onTema(x.id)}>
                {x.flag} {x.navn}
              </button>
            ))}
          </div>
          <span className="muted small">Du spiller: {appNavn(tm)}</span>
        </div>
      </div>

      {kodeKort}

      {mineTogter}

      <h2 className="section-title">Vælg et {tm.rejse}</h2>
      <div className="togt-list">
        {togter.map((t) => {
          const done = doneIds(progress, t.id)
          const doneCount = t.opgaver.filter((o) => done.has(o.id)).length
          const total = t.opgaver.length
          const firstOpen = t.opgaver.findIndex((o) => !done.has(o.id))
          const startIndex = firstOpen === -1 ? 0 : firstOpen
          const label = doneCount === 0 ? tm.startRejse : doneCount < total ? tm.fortsaetRejse : 'Øv igen 🔁'
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
