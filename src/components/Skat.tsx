import type { Progress } from '../types'
import { CONFIG } from '../config'
import { useTema } from '../tema'
import { Moent } from './Moent'
import { Oe } from './Oe'

interface Props {
  progress: Progress
  onBegrav: () => void
}

/** Siden "Din skat" / "Dine ædelsten": pung, gemt, tyven og gemmestedet. */
export function Skat({ progress, onBegrav }: Props) {
  const t = useTema()
  const name = progress.name.trim()
  return (
    <div className="page">
      <h1 className="section-title">
        {t.menu.skat[0]} {name ? `${name}s ${t.valuta}` : t.menu.skat[1]}
      </h1>

      <div className="card">
        <div className="stat-grid">
          <div className="stat">
            <div className="stat-label">I {t.pung}</div>
            <div className="stat-value">
              <Moent /> {progress.pung}
            </div>
            <div className="muted small">ikke sikkert endnu</div>
          </div>
          <div className="stat">
            <div className="stat-label">{t.gemt}</div>
            <div className="stat-value">
              <Moent /> {progress.skat}
            </div>
            <div className="muted small">din rigtige skat</div>
          </div>
          <div className="stat">
            <div className="stat-label">Snuppet af {t.tyv.navn}</div>
            <div className="stat-value">
              {t.tyv.emoji} {progress.stjaalet}
            </div>
            <div className="muted small">regn rigtigt!</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">📍 {t.gemSted}</h2>
        <div className="skat-row">
          <Oe sted={progress.gravested} />
          <div className="skat-actions">
            {progress.gravested ? <p>Krydset viser, hvor din skat er gemt.</p> : <p>Du har ikke gemt noget endnu.</p>}
            {progress.pung > 0 ? (
              <>
                <p>
                  Du har <b>{progress.pung}</b> {t.valuta} i {t.pung}. Gem dem, før {t.tyv.navn} finder dem!
                </p>
                <button className="btn btn-primary btn-big" onClick={onBegrav}>
                  {t.gemKnap}
                </button>
                <p className="muted small">
                  Først skal du øve tabellerne med {t.hjaelper.navn} ({CONFIG.tabelSpoergsmaal} rigtige).
                </p>
              </>
            ) : (
              <p className="muted">
                {t.pung[0].toUpperCase() + t.pung.slice(1)} er tom. Tag på {t.rejse} og tjen {t.valuta}.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">📜 Reglerne</h2>
        <ul className="regler">
          <li>
            Rigtigt svar i første forsøg: <b>{CONFIG.guldFoersteForsoeg} {t.valutaKort}</b> i {t.pung}. I andet forsøg: <b>{CONFIG.guldAndetForsoeg} {t.valutaKort}</b>.
          </li>
          <li>
            Løser du en opgave forkert, finder {t.tyv.navn} din skat og tager <b>{CONFIG.tyveri} {t.valutaKort}</b>.
          </li>
          <li>
            Beder du {t.hjaelper.navn} om svaret, får du ingen {t.valutaKort} – men {t.tyv.navn} tager heller ikke noget.
          </li>
          <li>
            {t.valuta[0].toUpperCase() + t.valuta.slice(1)} i {t.pung} er ikke sikre. {t.gemTitel}, når du kan!
          </li>
        </ul>
      </div>
    </div>
  )
}
