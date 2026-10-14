import { useState } from 'react'
import { UDBYDER_INFO, maskeret, type AiIndstillinger as Ai, type Udbyder } from '../lib/ai'

interface Props {
  ai: Ai
  onGem: (a: Ai) => void
}

/** Vælg udbyder, model og indsæt egen nøgle. Gemmes kun på enheden. */
export function AiIndstillingerKort({ ai, onGem }: Props) {
  const [udkast, setUdkast] = useState<Ai>(ai)
  const [visNoegle, setVisNoegle] = useState(false)
  const u = udkast.udbyder
  const info = UDBYDER_INFO[u]
  const noegle = udkast.noegler[u] ?? ''
  const aendret = JSON.stringify(udkast) !== JSON.stringify(ai)

  return (
    <div className="card">
      <h2 className="card-title">🔑 AI-nøgle</h2>
      <p className="muted small">
        Scanningen bruger din egen nøgle hos en AI-udbyder, så du betaler selv forbruget direkte til dem. Nøglen gemmes kun på denne enhed. Den sendes
        gennem appens server ved hver scanning og gemmes ikke der.
      </p>

      <div className="udbyder-valg" role="radiogroup" aria-label="AI-udbyder">
        {(Object.keys(UDBYDER_INFO) as Udbyder[]).map((k) => (
          <button key={k} className={`chip ${u === k ? 'on' : ''}`} role="radio" aria-checked={u === k} onClick={() => setUdkast({ ...udkast, udbyder: k })}>
            {UDBYDER_INFO[k].navn}
          </button>
        ))}
      </div>

      <label className="felt-label">
        Model
        <input
          className="name-input"
          list={`modeller-${u}`}
          value={udkast.modeller[u]}
          placeholder="modellens navn"
          onChange={(e) => setUdkast({ ...udkast, modeller: { ...udkast.modeller, [u]: e.target.value.trim() } })}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <datalist id={`modeller-${u}`}>
          {info.modelForslag.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </label>
      <p className="muted small">{info.modelHjaelp}</p>

      <label className="felt-label">
        API-nøgle
        <div className="kode-row">
          <input
            className="name-input kode-input"
            type={visNoegle ? 'text' : 'password'}
            value={noegle}
            placeholder={noegle ? maskeret(noegle) : 'indsæt nøglen her'}
            onChange={(e) => setUdkast({ ...udkast, noegler: { ...udkast.noegler, [u]: e.target.value.trim() } })}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="off"
          />
          <button className="btn btn-ghost btn-small" onClick={() => setVisNoegle(!visNoegle)}>
            {visNoegle ? 'Skjul' : 'Vis'}
          </button>
        </div>
      </label>
      <p className="muted small">
        Lav en nøgle på{' '}
        <a href={info.noegleSide} target="_blank" rel="noreferrer">
          {new URL(info.noegleSide).host}
        </a>
        . Sæt gerne et månedligt beløbsloft dér.
      </p>

      <div className="btn-row left">
        <button className="btn btn-primary" disabled={!aendret} onClick={() => onGem(udkast)}>
          Gem
        </button>
        {noegle && (
          <button className="btn btn-ghost btn-small" onClick={() => setUdkast({ ...udkast, noegler: { ...udkast.noegler, [u]: undefined } })}>
            Fjern nøglen
          </button>
        )}
      </div>
    </div>
  )
}
