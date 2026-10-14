import { useEffect, useRef, useState } from 'react'
import type { Togt, Progress } from '../types'
import { OpgaveView, type Status } from './Opgave'
import { VisualView } from './Visual'
import { Kort } from './Kort'
import { Moent } from './Moent'
import { ArkOverlay } from './ArkOverlay'
import { answerText } from '../lib/check'
import { sekunderIDag, type Resultat, type Tyveri } from '../lib/spil'
import { PRAISE, POLLY_AFSLOERING, SVEN } from '../data/flaade'
import { CONFIG } from '../config'
import { afspil } from '../lib/lyd'
import { fest } from '../lib/fest'

interface Props {
  togt: Togt
  progress: Progress
  startIndex: number
  skipIntro?: boolean
  iDag: string
  onResultat: (opgaveId: string, r: Resultat) => { guld: number; tyveri: Tyveri | null }
  onTick: (sek: number) => void
  onBegrav: () => void
  onOversigt: () => void
  onExit: () => void
}

type Phase = 'intro' | 'opgave' | 'done'
type Message = { kind: 'ok' | 'retry' | 'reveal' | 'polly'; text: string }

export function nrTekst(nr: number | number[] | undefined): string {
  if (nr === undefined) return 'ekstra opgave – ikke på arket'
  return Array.isArray(nr) ? `nr. ${nr.join(' + ')}` : `nr. ${nr}`
}

/** Tæller matematik-tid, mens skærmen er synlig. */
export function useTidsTaeller(aktiv: boolean, onTick: (sek: number) => void) {
  const ref = useRef(onTick)
  ref.current = onTick
  useEffect(() => {
    if (!aktiv) return
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') ref.current(5)
    }, 5000)
    return () => window.clearInterval(id)
  }, [aktiv])
}

export function TogtView({ togt, progress, startIndex, skipIntro, iDag, onResultat, onTick, onBegrav, onOversigt, onExit }: Props) {
  const [phase, setPhase] = useState<Phase>(skipIntro ? 'opgave' : 'intro')
  const [index, setIndex] = useState(Math.min(startIndex, togt.opgaver.length - 1))
  const [attempts, setAttempts] = useState(0)
  const [status, setStatus] = useState<Status>('open')
  const [hintLevel, setHintLevel] = useState(0)
  const [pollyComment, setPollyComment] = useState<string | null>(null)
  const [message, setMessage] = useState<Message | null>(null)
  const [sessionGuld, setSessionGuld] = useState(0)
  const [visArk, setVisArk] = useState(false)
  // Var opgaven allerede løst, da den blev åbnet? (Låses ved start, så mærket ikke dukker op midt i opgaven.)
  const [replayIds] = useState(() => new Set(Object.keys(progress.togter[togt.id]?.done ?? {})))
  const nextBtn = useRef<HTMLButtonElement>(null)

  useTidsTaeller(phase === 'opgave', onTick)

  // Fokusér "Videre" lidt forsinket, så det Enter-tryk der tjekkede svaret
  // ikke også aktiverer knappen (Chrome sender keypress til den nye fokus).
  useEffect(() => {
    if (status === 'open') return
    const id = window.setTimeout(() => nextBtn.current?.focus(), 500)
    return () => window.clearTimeout(id)
  }, [status])

  const total = togt.opgaver.length
  const opgave = togt.opgaver[index]
  const hints = opgave.hints ?? []
  const isReplay = replayIds.has(opgave.id)
  const sekIDag = sekunderIDag(progress, iDag)
  const maalMin = CONFIG.dagligtMaalSek / 60

  function handleCheck(ok: boolean) {
    if (ok) {
      const r: Resultat = attempts === 0 ? 'foerste' : 'andet'
      const { guld } = onResultat(opgave.id, r)
      if (guld > 0) afspil('guld')
      fest('guld')
      setStatus('correct')
      setSessionGuld((s) => s + guld)
      setMessage({
        kind: 'ok',
        text: isReplay ? 'God øvelse! Du har tjent guldet her én gang, så der er intet på spil.' : `${PRAISE[index % PRAISE.length]} +${guld} guldmønter i pungen`,
      })
    } else if (attempts === 0) {
      setAttempts(1)
      setHintLevel((h) => Math.max(h, 1))
      setMessage({ kind: 'retry', text: 'Ikke helt, kaptajn. Prøv én gang til – Polly har et hint til dig!' })
    } else {
      const { tyveri } = onResultat(opgave.id, 'forkert')
      setStatus('revealed')
      setHintLevel(hints.length)
      const sven = tyveri ? ` ${SVEN.emoji} ${tyveri.besked}` : ''
      setMessage({ kind: 'reveal', text: `Det rigtige svar er: ${answerText(opgave)}.${sven}` })
    }
  }

  function pollyClick() {
    afspil('polly')
    if (hintLevel < hints.length) {
      setHintLevel(hintLevel + 1)
      return
    }
    // Alle hints er brugt: Polly kommer med en frisk bemærkning og afslører svaret.
    onResultat(opgave.id, 'polly')
    setPollyComment(POLLY_AFSLOERING[Math.floor(Math.random() * POLLY_AFSLOERING.length)])
    setStatus('revealed')
    setMessage({ kind: 'polly', text: 'Polly sagde svaret, så der er ingen guld denne gang – men du lærte noget! Skriv det på papiret.' })
  }

  function next() {
    if (index + 1 >= total) {
      setPhase('done')
      fest('stor')
      return
    }
    setIndex((i) => i + 1)
    setAttempts(0)
    setStatus('open')
    setHintLevel(0)
    setPollyComment(null)
    setMessage(null)
  }

  const pollyLabel =
    hintLevel === 0 ? '🦜 Spørg Polly om et hint' : hintLevel < hints.length ? '🦜 Polly, hjælp lidt mere' : '🦜 Polly, sig bare svaret'

  const arkOverlay = visArk && togt.ark?.billede && (
    <ArkOverlay navn={togt.ark.navn} billede={togt.ark.billede} nr={phase === 'opgave' ? nrTekst(opgave.nr) : undefined} onClose={() => setVisArk(false)} />
  )

  if (phase === 'intro') {
    return (
      <div className="page">
        <div className="card center">
          <div className="big-emoji">{togt.emoji}</div>
          <h1 className="title">{togt.title}</h1>
          <p className="intro">{togt.intro}</p>
          {togt.ark && (
            <div className="ark-info">
              <p>
                📄 Togtet følger arket <b>{togt.ark.navn}</b>. Hav det ved siden af, så du kan skrive svarene på papiret – appen viser nummeret på hver opgave.
              </p>
              {togt.ark.kunPapir?.map((t) => (
                <p className="muted small" key={t}>
                  ✏️ Kun på papiret: {t}
                </p>
              ))}
              {togt.ark.billede && (
                <button className="btn btn-ghost btn-small" onClick={() => setVisArk(true)}>
                  Vis arket
                </button>
              )}
            </div>
          )}
          <p className="muted">
            {total} opgaver · {CONFIG.guldFoersteForsoeg} guldmønter for hvert rigtigt svar
          </p>
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={onExit}>
              ← Tilbage
            </button>
            <button className="btn btn-primary btn-big" onClick={() => setPhase('opgave')}>
              {startIndex > 0 ? 'Fortsæt togtet ⛵' : 'Sejl ud! ⛵'}
            </button>
          </div>
        </div>
        {arkOverlay}
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="page">
        <div className="card center">
          <div className="big-emoji">💰</div>
          <h1 className="title">Togtet er slut!</h1>
          <p className="intro">
            Du tjente <b>{sessionGuld}</b> guldmønter på dette togt.
          </p>
          <p className="muted">
            I pungen nu: <Moent /> {progress.pung} · Begravet: <Moent /> {progress.skat}
          </p>
          {progress.pung > 0 && (
            <p className="intro">Guldet i pungen er ikke sikkert, før det er begravet. Ro i land og grav det ned!</p>
          )}
          <p className="muted small">Skal svarene over på arket? Oversigten viser facit og hvordan du fandt dem.</p>
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={onExit}>
              Tilbage til søkortet 🗺️
            </button>
            <button className="btn btn-ghost" onClick={onOversigt}>
              Se oversigten 📋
            </button>
            {progress.pung > 0 && (
              <button className="btn btn-primary btn-big" onClick={onBegrav}>
                Begrav guldet ⛏️
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="topbar">
        <button className="btn btn-ghost btn-small" onClick={onExit}>
          ← Søkort
        </button>
        <div className="topbar-title">
          {togt.emoji} {togt.title}
        </div>
        <div className="pills">
          <div className="coins" title="Guld i pungen">
            <Moent /> {progress.pung}
          </div>
          <div className="pill" title="Matematik i dag">
            ⏱ {Math.floor(sekIDag / 60)}/{maalMin}
          </div>
        </div>
      </header>

      <Kort progress={index / total} />

      <div className="card">
        <div className="card-head">
          <div className="card-meta">
            Opgave {index + 1} af {total}
            {isReplay && <span className="replay-badge">Øvelse</span>}
          </div>
          {togt.ark &&
            (togt.ark.billede ? (
              <button className="papir-badge" onClick={() => setVisArk(true)} title="Vis arket">
                📄 {togt.ark.navn} · {nrTekst(opgave.nr)}
              </button>
            ) : (
              <span className="papir-badge papir-badge-tekst">
                📄 {togt.ark.navn} · {nrTekst(opgave.nr)}
              </span>
            ))}
        </div>

        <p className="story">
          <span className="story-icon">📜</span>
          {opgave.story}
        </p>

        {opgave.visual && (
          <div className="visual">
            <VisualView visual={opgave.visual} />
          </div>
        )}

        <p className="question">{opgave.question}</p>
        {opgave.regnestykke && (
          <div className="regnestykke">
            Regnestykke: <b>{opgave.regnestykke}</b>
          </div>
        )}
        {opgave.papir && <p className="papir-note">✏️ {opgave.papir}</p>}

        <div className="answer">
          <OpgaveView key={opgave.id} opgave={opgave} status={status} onCheck={handleCheck} />
        </div>

        {hints.slice(0, hintLevel).map((h, i) => (
          <div className="hint" key={i}>
            <b>🦜 Polly siger{i > 0 ? ' også' : ''}:</b> {h}
          </div>
        ))}
        {pollyComment && (
          <div className="hint hint-polly">
            <b>🦜 Polly:</b> {pollyComment} <b>{answerText(opgave)}</b>
          </div>
        )}

        {status === 'open' && hints.length > 0 && (
          <button className="btn btn-ghost btn-small" onClick={pollyClick}>
            {pollyLabel}
          </button>
        )}

        {message && <div className={`feedback feedback-${message.kind}`}>{message.text}</div>}

        {status !== 'open' && (
          <button ref={nextBtn} className="btn btn-primary btn-big" onClick={next}>
            {index + 1 >= total ? 'Afslut togtet 🏁' : 'Videre ⛵'}
          </button>
        )}
      </div>
      {arkOverlay}
    </div>
  )
}
