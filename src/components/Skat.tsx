import type { Progress } from '../types'
import { CONFIG } from '../config'
import { Moent } from './Moent'
import { Oe } from './Oe'

interface Props {
  progress: Progress
  onBegrav: () => void
}

/** Siden "Din skat": pung, begravet guld, Sorte Sven og øen. */
export function Skat({ progress, onBegrav }: Props) {
  const name = progress.name.trim()
  return (
    <div className="page">
      <h1 className="section-title">💰 {name ? `Kaptajn ${name}s` : 'Din'} skat</h1>

      <div className="card">
        <div className="stat-grid">
          <div className="stat">
            <div className="stat-label">I pungen</div>
            <div className="stat-value">
              <Moent /> {progress.pung}
            </div>
            <div className="muted small">ikke sikkert endnu</div>
          </div>
          <div className="stat">
            <div className="stat-label">Begravet</div>
            <div className="stat-value">
              <Moent /> {progress.skat}
            </div>
            <div className="muted small">din rigtige skat</div>
          </div>
          <div className="stat">
            <div className="stat-label">Snuppet af Sorte Sven</div>
            <div className="stat-value">😈 {progress.stjaalet}</div>
            <div className="muted small">regn rigtigt!</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">🏝️ Skatteøen</h2>
        <div className="skat-row">
          <Oe sted={progress.gravested} />
          <div className="skat-actions">
            {progress.gravested ? <p>Krydset viser, hvor din skat ligger begravet.</p> : <p>Du har ikke begravet noget endnu.</p>}
            {progress.pung > 0 ? (
              <>
                <p>
                  Du har <b>{progress.pung}</b> guldmønter i pungen. Ro i land og begrav dem, før Sorte Sven finder dem!
                </p>
                <button className="btn btn-primary btn-big" onClick={onBegrav}>
                  Begrav guldet ⛏️
                </button>
                <p className="muted small">Først skal du øve tabellerne med Polly ({CONFIG.tabelSpoergsmaal} rigtige).</p>
              </>
            ) : (
              <p className="muted">Pungen er tom. Tag på togt og tjen guld – så kan du ro i land og begrave det.</p>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">📜 Reglerne</h2>
        <ul className="regler">
          <li>Rigtigt svar i første forsøg: <b>{CONFIG.guldFoersteForsoeg} guld</b> i pungen. I andet forsøg: <b>{CONFIG.guldAndetForsoeg} guld</b>.</li>
          <li>Løser du en opgave forkert, ser Sorte Sven, hvor du gravede, og snupper <b>{CONFIG.tyveri} guld</b> fra skatten.</li>
          <li>Beder du Polly om svaret, får du ingen guld – men Sorte Sven tager heller ikke noget.</li>
          <li>Guld i pungen er ikke sikkert. Begrav det, når du kan!</li>
        </ul>
      </div>
    </div>
  )
}
