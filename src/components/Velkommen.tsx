import { useState } from 'react'
import { appNavn, TEMA_LISTE, useTema, type TemaId } from '../tema'
import { KODE_RE, lavKode, normaliserKode } from '../lib/sync'
import type { ForbindResultat } from './FamilieKode'
import { KlasseVaelger } from './KlasseVaelger'

interface Props {
  navn: string
  klasse: number | undefined
  onKlasse: (k: number) => void
  onTema: (id: TemaId) => void
  onNavn: (navn: string) => void
  onForbind: (kode: string) => Promise<ForbindResultat>
  onFaerdig: (valg: 'demo' | 'scan' | 'forside') => void
}

type Trin = 'tema' | 'navn' | 'kode' | 'klar'
const TRIN: Trin[] = ['tema', 'navn', 'kode', 'klar']

/** Første gang: vælg univers, navn og familiekode – og se, hvad man kan nu. */
export function Velkommen({ navn, klasse, onKlasse, onTema, onNavn, onForbind, onFaerdig }: Props) {
  const t = useTema()
  const [trin, setTrin] = useState<Trin>('tema')
  const [kodeValg, setKodeValg] = useState<'ny' | 'har' | null>(null)
  const [kode, setKode] = useState('')
  const [travl, setTravl] = useState(false)
  const [fejl, setFejl] = useState<string | null>(null)
  const [forbundet, setForbundet] = useState<string | null>(null)
  const nr = TRIN.indexOf(trin) + 1

  async function forbind(k: string) {
    const ren = normaliserKode(k)
    if (!KODE_RE.test(ren)) {
      setFejl('Koden skal være 6–40 tegn: små bogstaver, tal og bindestreg.')
      return
    }
    setTravl(true)
    setFejl(null)
    const r = await onForbind(ren)
    setTravl(false)
    if (r.status === 'fejl') return setFejl(r.besked)
    setForbundet(ren)
    setTrin('klar')
  }

  return (
    <div className="page velkommen">
      <div className="velkommen-trin muted small">
        Trin {nr} af {TRIN.length}
      </div>

      {trin === 'tema' && (
        <div className="card center">
          <div className="big-emoji">{t.flag}</div>
          <h1 className="title">Velkommen til Kaptajn Tal</h1>
          <p className="intro">Her bliver matematik til eventyr. Hvilket univers vil dit barn helst regne i?</p>
          <div className="tema-kort">
            {TEMA_LISTE.map((x) => (
              <button key={x.id} className={`tema-kort-valg ${x.id === t.id ? 'on' : ''}`} onClick={() => onTema(x.id)} aria-pressed={x.id === t.id}>
                <span className="tema-kort-flag">{x.flag}</span>
                <b>{x.undertitel ?? 'Kaptajn Tal'}</b>
                <span className="muted small">{x.navn}</span>
                <span className="small">
                  {x.hjaelper.emoji} {x.hjaelper.art} {x.hjaelper.navn} hjælper
                </span>
                {x.klasser && <span className="muted small">{x.klasser}</span>}
              </button>
            ))}
          </div>
          <p className="muted small">Du kan altid skifte senere på forsiden.</p>
          <button className="btn btn-primary btn-big" onClick={() => setTrin('navn')}>
            Videre
          </button>
        </div>
      )}

      {trin === 'navn' && (
        <div className="card center">
          <div className="big-emoji">{t.hjaelper.emoji}</div>
          <h1 className="title">
            {t.hilsen}! Hvad hedder du, {t.titel}?
          </h1>
          <p className="muted">Kun fornavnet. Det bruges i appen og gemmes ikke andre steder.</p>
          <input className="name-input velkommen-navn" value={navn} onChange={(e) => onNavn(e.target.value)} placeholder="Skriv dit navn" maxLength={24} autoFocus />
          <KlasseVaelger klasse={klasse} onKlasse={onKlasse} />
          <p className="muted small">Klassetrinnet bruges, så historier og hints passer til alderen.</p>
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={() => setTrin('tema')}>
              ← Tilbage
            </button>
            <button className="btn btn-primary btn-big" onClick={() => setTrin('kode')}>
              Videre
            </button>
          </div>
        </div>
      )}

      {trin === 'kode' && (
        <div className="card center">
          <div className="big-emoji">☁️</div>
          <h1 className="title">Familiekode</h1>
          <p className="intro">
            Med en familiekode gemmes fremgangen i skyen, så den følger med mellem iPad, telefon og computer. Den skal også bruges for at scanne ark.
          </p>
          {kodeValg === null && (
            <div className="btn-row">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setKodeValg('ny')
                  setKode(lavKode())
                }}
              >
                Lav en ny kode
              </button>
              <button className="btn btn-ghost" onClick={() => setKodeValg('har')}>
                Jeg har allerede en kode
              </button>
            </div>
          )}
          {kodeValg === 'ny' && (
            <>
              <p>
                Jeres kode er <b className="kode-value">{kode}</b>
              </p>
              <p className="muted small">Skriv den ned. Den er nøglen til skatten – alle, der kender den, kan se og ændre fremgangen.</p>
              <div className="btn-row">
                <button className="btn btn-ghost btn-small" onClick={() => setKode(lavKode())}>
                  🎲 En anden
                </button>
                <button className="btn btn-primary btn-big" disabled={travl} onClick={() => void forbind(kode)}>
                  {travl ? 'Opretter …' : 'Brug denne kode'}
                </button>
              </div>
            </>
          )}
          {kodeValg === 'har' && (
            <div className="kode-row">
              <input
                className="name-input kode-input"
                value={kode}
                onChange={(e) => setKode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void forbind(kode)}
                placeholder="fx anker-komet-ugle-42"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoFocus
              />
              <button className="btn btn-primary" disabled={travl || !kode.trim()} onClick={() => void forbind(kode)}>
                {travl ? 'Henter …' : 'Hent'}
              </button>
            </div>
          )}
          {fejl && <div className="feedback feedback-retry">{fejl}</div>}
          <button className="btn btn-ghost btn-small" onClick={() => setTrin('klar')}>
            Spring over – kun på denne enhed
          </button>
        </div>
      )}

      {trin === 'klar' && (
        <div className="card center">
          <div className="big-emoji">{t.menu.skat[0]}</div>
          <h1 className="title">Klar, {navn.trim() || t.titel}!</h1>
          <p className="intro">{appNavn(t)} er klar. Sådan kommer I i gang:</p>
          <ul className="regler velkommen-liste">
            <li>
              <b>Prøv appen</b> med et lille {t.rejse} på fem opgaver.
            </li>
            <li>
              <b>Scan et regneark</b> fra skolen. {t.hjaelper.navn} laver det om til et {t.rejse} med historier og hints. Det kræver
              {forbundet ? '' : ' en familiekode og'} en AI-nøgle fra fx Anthropic.
            </li>
            <li>
              <b>Regn 10 minutter om dagen</b>, så kommer der en ny {t.crewMedlem}.
            </li>
          </ul>
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={() => onFaerdig('forside')}>
              Til forsiden
            </button>
            {forbundet && (
              <button className="btn btn-ghost" onClick={() => onFaerdig('scan')}>
                📷 Scan et ark
              </button>
            )}
            <button className="btn btn-primary btn-big" onClick={() => onFaerdig('demo')}>
              {t.startRejse}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
