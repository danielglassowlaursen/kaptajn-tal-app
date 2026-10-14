import { useState } from 'react'
import type { Gravested } from '../types'
import { CONFIG } from '../config'
import { Moent } from './Moent'
import { Oe } from './Oe'
import { TabelTraening } from './TabelTraening'
import { afspil } from '../lib/lyd'
import { fest } from '../lib/fest'

interface Props {
  pung: number
  onTick: (sek: number) => void
  onBegrav: (sted: Gravested) => void
  onExit: () => void
}

type Phase = 'intro' | 'drill' | 'oe' | 'done'

/** Ro i land og begrav guldet: først tabel-træning, så vælg et sted på øen. */
export function Begrav({ pung, onTick, onBegrav, onExit }: Props) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [sted, setSted] = useState<Gravested | null>(null)
  const [begravet, setBegravet] = useState(0)

  if (phase === 'intro') {
    return (
      <div className="page">
        <div className="card center">
          <div className="big-emoji">⛏️</div>
          <h1 className="title">Begrav guldet</h1>
          <p className="intro">
            Du har <Moent /> <b>{pung}</b> guldmønter i pungen. Begravet guld er din rigtige skat – men pas på: hvis du regner forkert, ser Sorte
            Sven, hvor du gravede, og snupper {CONFIG.tyveri} mønter.
          </p>
          <p className="intro">
            Før du må ro i land, skal du øve tabellerne med Polly: <b>{CONFIG.tabelSpoergsmaal} rigtige svar</b>.
          </p>
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={onExit}>
              ← Tilbage
            </button>
            <button className="btn btn-primary btn-big" onClick={() => setPhase('drill')}>
              Øv tabellerne 🦜
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'drill') {
    return (
      <div className="page">
        <header className="topbar">
          <button className="btn btn-ghost btn-small" onClick={onExit}>
            ← Afbryd
          </button>
          <div className="topbar-title">⛏️ Begrav guldet</div>
          <div className="coins">
            <Moent /> {pung}
          </div>
        </header>
        <TabelTraening onDone={() => setPhase('oe')} onTick={onTick} />
      </div>
    )
  }

  if (phase === 'oe') {
    return (
      <div className="page">
        <div className="card center">
          <h1 className="title">Vælg et gemmested</h1>
          <p className="intro">Tryk på øen, hvor du vil begrave dine {pung} guldmønter.</p>
          <Oe sted={sted} onPick={setSted} />
          <button
            className="btn btn-primary btn-big"
            disabled={!sted}
            onClick={() => {
              if (!sted) return
              setBegravet(pung)
              onBegrav(sted)
              afspil('guld')
              fest('stor')
              setPhase('done')
            }}
          >
            Grav her! ⛏️
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="card center">
        <div className="big-emoji">💰</div>
        <h1 className="title">Skatten er begravet!</h1>
        <p className="intro">
          Du begravede <Moent /> <b>{begravet}</b> guldmønter. Husk: Sorte Sven holder øje – regn rigtigt, så han ikke finder den!
        </p>
        <Oe sted={sted} compact />
        <button className="btn btn-primary btn-big" onClick={onExit}>
          Tilbage til søkortet 🗺️
        </button>
      </div>
    </div>
  )
}
