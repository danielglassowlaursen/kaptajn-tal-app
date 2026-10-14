import type { Progress, Opgave, Svar, Togt } from '../types'
import { answerText } from '../lib/check'
import { nrTekst } from './TogtView'

interface Props {
  progress: Progress
  togter: Togt[]
  /** Togt der skal være foldet ud fra start. */
  fokus?: string
  onStart: (togtId: string, startIndex: number) => void
}

type Status = 'foerste' | 'andet' | 'polly' | 'forkert' | 'loest' | 'aaben'

const STATUS: Record<Status, { ikon: string; tekst: string }> = {
  foerste: { ikon: '✅', tekst: 'Selv, første forsøg' },
  andet: { ikon: '✅', tekst: 'Selv, med et hint' },
  polly: { ikon: '🦜', tekst: 'Polly sagde svaret' },
  forkert: { ikon: '❌', tekst: 'Forkert – svaret blev vist' },
  loest: { ikon: '✅', tekst: 'Løst' },
  aaben: { ikon: '⬜', tekst: 'Ikke løst endnu' },
}

function statusFor(progress: Progress, togt: Togt, o: Opgave): { status: Status; svar?: Svar } {
  const tp = progress.togter[togt.id]
  if (!tp || !(o.id in tp.done)) return { status: 'aaben' }
  const svar = tp.svar?.[o.id]
  if (svar) return { status: svar.r, svar }
  // Gamle data uden detaljer: gæt ud fra guldet.
  const guld = tp.done[o.id]
  return { status: guld >= 10 ? 'foerste' : guld >= 5 ? 'andet' : 'loest' }
}

/** Kort beskrivelse af opgaven til listen. */
function label(o: Opgave): string {
  if (o.regnestykke) return o.regnestykke
  const q = o.question.replace(/\s*\(.*?\)\s*$/, '')
  return q.length > 60 ? q.slice(0, 57) + '…' : q
}

/** Siden "Oversigt": facit og hjælp pr. opgave, så svarene kan skrives over på arket bagefter. */
export function Oversigt({ progress, togter, fokus, onStart }: Props) {
  return (
    <div className="page">
      <h1 className="section-title">📋 Oversigt</h1>
      <p className="oversigt-intro">
        Her står facit og hvordan du fandt det – så du kan regne uden hæftet og skrive tallene over på arket bagefter. Facit vises kun for
        opgaver, du har været igennem.
      </p>

      {togter.map((togt) => {
        const rows = togt.opgaver.map((o) => ({ o, ...statusFor(progress, togt, o) }))
        const antal = (s: Status) => rows.filter((r) => r.status === s).length
        const loest = rows.filter((r) => r.status !== 'aaben').length
        const foersteAabne = rows.findIndex((r) => r.status === 'aaben')
        return (
          <details className="card oversigt-togt" key={togt.id} open={fokus ? fokus === togt.id : loest > 0}>
            <summary>
              <span className="oversigt-togt-title">
                {togt.emoji} {togt.title}
              </span>
              <span className="muted small">
                {togt.ark ? `📄 ${togt.ark.navn} · ` : ''}
                {loest}/{togt.opgaver.length} løst
              </span>
            </summary>

            <div className="oversigt-sum">
              <span>✅ {antal('foerste') + antal('andet') + antal('loest')} selv</span>
              <span>🦜 {antal('polly')} Polly</span>
              <span>❌ {antal('forkert')} forkert</span>
              <span>⬜ {antal('aaben')} mangler</span>
            </div>

            <div className="oversigt-rows">
              {rows.map(({ o, status }, i) => (
                <div className={`oversigt-row status-${status}`} key={o.id}>
                  <div className="ov-nr">
                    <b>{nrTekst(o.nr).replace('ekstra opgave – ikke på arket', 'ekstra')}</b>
                    <span className="muted small">app {i + 1}</span>
                  </div>
                  <div className="ov-opgave">
                    <div>{label(o)}</div>
                    {status !== 'aaben' && o.papir && <div className="ov-papir">✏️ {o.papir}</div>}
                  </div>
                  <div className="ov-facit">{status === 'aaben' ? <span className="muted">–</span> : <b>{answerText(o)}</b>}</div>
                  <div className="ov-status" title={STATUS[status].tekst}>
                    <span className="ov-ikon">{STATUS[status].ikon}</span>
                    <span className="ov-status-tekst">{STATUS[status].tekst}</span>
                  </div>
                </div>
              ))}
            </div>

            {togt.ark?.kunPapir?.map((k) => (
              <p className="muted small" key={k}>
                ✏️ Kun på papiret: {k}
              </p>
            ))}

            {foersteAabne !== -1 && (
              <button className="btn btn-primary" onClick={() => onStart(togt.id, foersteAabne)}>
                {loest === 0 ? 'Sejl ud! ⛵' : 'Fortsæt togtet ⛵'}
              </button>
            )}
          </details>
        )
      })}
    </div>
  )
}
