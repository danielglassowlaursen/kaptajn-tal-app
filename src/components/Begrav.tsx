import { useState } from 'react'
import type { Gravested } from '../types'
import { CONFIG } from '../config'
import { Moent } from './Moent'
import { Oe } from './Oe'
import { TabelTraening } from './TabelTraening'
import { afspil } from '../lib/lyd'
import { fest } from '../lib/fest'
import { useTema } from '../tema'

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
  const t = useTema()

  if (phase === 'intro') {
    return (
      <div className="page">
        <div className="card center">
          <div className="big-emoji">{t.gemKnap.split(' ').pop()}</div>
          <h1 className="title">{t.gemTitel}</h1>
          <p className="intro">
            Du har <Moent /> <b>{pung}</b> {t.valuta} i {t.pung}. Gemte {t.valuta} er din rigtige skat – men pas på: hvis du regner forkert, finder {t.tyv.navn} dem og tager {CONFIG.tyveri}.
          </p>
          <p className="intro">
            Før du må {t.gaaTilGemmested}, skal du øve tabellerne med {t.hjaelper.navn}: <b>{CONFIG.tabelSpoergsmaal} rigtige svar</b>.
          </p>
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={onExit}>
              ← Tilbage
            </button>
            <button className="btn btn-primary btn-big" onClick={() => setPhase('drill')}>
              Øv tabellerne {t.hjaelper.emoji}
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
          <div className="topbar-title">{t.gemTitel}</div>
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
          <p className="intro">
            Tryk på kortet, hvor du vil {t.gemVerbum} dine {pung} {t.valuta}.
          </p>
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
            Gem her! {t.gemKnap.split(' ').pop()}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="card center">
        <div className="big-emoji">{t.menu.skat[0]}</div>
        <h1 className="title">{t.gemFaerdig}</h1>
        <p className="intro">
          Du gemte <Moent /> <b>{begravet}</b> {t.valuta}. Husk: {t.tyv.navn} holder øje – regn rigtigt!
        </p>
        <Oe sted={sted} compact />
        <button className="btn btn-primary btn-big" onClick={onExit}>
          Tilbage til forsiden 🗺️
        </button>
      </div>
    </div>
  )
}
