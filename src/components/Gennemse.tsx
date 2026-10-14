import { useMemo, useState } from 'react'
import type { Opgave, Togt } from '../types'
import { answerText } from '../lib/check'
import { tjekUdkast, type Fund } from '../lib/facitTjek'

interface Props {
  togt: Togt
  usikre: Record<string, string>
  fotoUrls: string[]
  forbrug: { prisUsd: number; inputTokens: number; outputTokens: number }
  onGem: (t: Togt) => void
  onKasser: () => void
}

const TYPENAVN: Record<Opgave['type'], string> = {
  tal: 'Tal',
  talraekke: 'Talrække',
  vaelg: 'Vælg flere',
  sammenlign: 'Sammenlign',
  sorter: 'Sortér',
  valg: 'Ét valg',
  felter: 'Brøkdel',
  ciffer: 'Pladsværdi',
  koordinat: 'Koordinat',
}

/** Rediger facit for de typer, hvor det kan gøres med et enkelt felt. */
function FacitFelt({ o, onChange }: { o: Opgave; onChange: (o: Opgave) => void }) {
  switch (o.type) {
    case 'tal':
      return (
        <div className="facit-row">
          <input
            className="tal-input tal-input-small"
            inputMode="decimal"
            value={Number.isFinite(o.answer) ? String(o.answer).replace('.', ',') : ''}
            onChange={(e) => onChange({ ...o, answer: Number(e.target.value.replace(',', '.')) })}
            aria-label="Facit"
          />
          <input className="name-input enhed-input" value={o.unit ?? ''} placeholder="enhed" onChange={(e) => onChange({ ...o, unit: e.target.value || undefined })} />
        </div>
      )
    case 'sammenlign':
      return (
        <div className="facit-row">
          <span>{o.left}</span>
          <select value={o.answer} onChange={(e) => onChange({ ...o, answer: e.target.value as '>' | '<' | '=' })} aria-label="Facit">
            <option value=">">&gt;</option>
            <option value="<">&lt;</option>
            <option value="=">=</option>
          </select>
          <span>{o.right}</span>
        </div>
      )
    case 'valg':
      return (
        <select value={o.answer} onChange={(e) => onChange({ ...o, answer: e.target.value })} aria-label="Facit">
          {o.options.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      )
    case 'talraekke':
      return (
        <input
          className="name-input"
          value={o.answers.join(', ')}
          onChange={(e) => onChange({ ...o, answers: e.target.value.split(/[,;\s]+/).filter(Boolean).map(Number) })}
          aria-label="Manglende tal"
        />
      )
    case 'felter':
      return (
        <input
          className="tal-input tal-input-small"
          inputMode="numeric"
          value={String(o.answer)}
          onChange={(e) => onChange({ ...o, answer: Number(e.target.value) })}
          aria-label="Antal felter"
        />
      )
    case 'koordinat':
      return (
        <div className="facit-row">
          ({' '}
          <input
            className="tal-input tal-input-small"
            inputMode="numeric"
            value={o.answer[0]}
            onChange={(e) => {
              const x = Number(e.target.value)
              onChange({ ...o, answer: [x, o.answer[1]], visual: { kind: 'koordinat', size: Math.max(5, x, o.answer[1]), marker: [x, o.answer[1]] } })
            }}
            aria-label="x"
          />{' '}
          ;{' '}
          <input
            className="tal-input tal-input-small"
            inputMode="numeric"
            value={o.answer[1]}
            onChange={(e) => {
              const y = Number(e.target.value)
              onChange({ ...o, answer: [o.answer[0], y], visual: { kind: 'koordinat', size: Math.max(5, o.answer[0], y), marker: [o.answer[0], y] } })
            }}
            aria-label="y"
          />{' '}
          )
        </div>
      )
    default:
      return <b>{answerText(o)}</b>
  }
}

/** En voksen gennemser AI'ens udkast: ret tekster og facit, slet opgaver, og gem. */
export function Gennemse({ togt: start, usikre, fotoUrls, forbrug, onGem, onKasser }: Props) {
  const [togt, setTogt] = useState<Togt>(start)
  const [visFoto, setVisFoto] = useState(0)

  const fund = useMemo(() => togt.opgaver.map((o, i) => tjekUdkast(o, i + 1, usikre[o.id])), [togt, usikre])
  const fejl = fund.reduce((n, f) => n + f.filter((x) => x.niveau === 'fejl').length, 0)
  const advarsler = fund.reduce((n, f) => n + f.filter((x) => x.niveau === 'advarsel').length, 0)

  const setOpgave = (i: number, o: Opgave) => setTogt({ ...togt, opgaver: togt.opgaver.map((x, j) => (j === i ? o : x)) })
  const sletOpgave = (i: number) => setTogt({ ...togt, opgaver: togt.opgaver.filter((_, j) => j !== i) })
  const setHint = (i: number, h: number, v: string) => {
    const o = togt.opgaver[i]
    const hints = [...(o.hints ?? ['', ''])]
    hints[h] = v
    setOpgave(i, { ...o, hints })
  }

  return (
    <div className="page page-wide">
      <h1 className="section-title">🔍 Gennemse togtet</h1>
      <p className="oversigt-intro">
        Tjek facit og tekster mod arket, før togtet gemmes. Gule markeringer er ting, appen eller AI'en er i tvivl om.
        {forbrug.prisUsd > 0 && ` Scanningen kostede ca. ${(forbrug.prisUsd * 7).toFixed(2).replace('.', ',')} kr.`}
      </p>

      <div className="gennemse">
        <aside className="gennemse-foto">
          {fotoUrls.length > 1 && (
            <div className="btn-row left">
              {fotoUrls.map((_, i) => (
                <button key={i} className={`chip ${visFoto === i ? 'on' : ''}`} onClick={() => setVisFoto(i)}>
                  Foto {i + 1}
                </button>
              ))}
            </div>
          )}
          {fotoUrls[visFoto] && <img src={fotoUrls[visFoto]} alt="Arket" className="ark-img" />}
        </aside>

        <div className="gennemse-liste">
          <div className="card">
            <div className="togt-felter">
              <label className="felt-label">
                Emoji
                <input className="name-input emoji-input" value={togt.emoji} onChange={(e) => setTogt({ ...togt, emoji: e.target.value })} />
              </label>
              <label className="felt-label grow">
                Togtets navn
                <input className="name-input" value={togt.title} onChange={(e) => setTogt({ ...togt, title: e.target.value })} />
              </label>
              <label className="felt-label grow">
                Arkets navn
                <input
                  className="name-input"
                  value={togt.ark?.navn ?? ''}
                  onChange={(e) => setTogt({ ...togt, ark: { ...togt.ark, navn: e.target.value } })}
                />
              </label>
            </div>
            <label className="felt-label">
              Intro
              <textarea className="tekstfelt" rows={2} value={togt.intro} onChange={(e) => setTogt({ ...togt, intro: e.target.value })} />
            </label>
            {togt.ark?.kunPapir?.length ? (
              <div>
                <b>Kun på papiret</b>
                <ul className="regler">
                  {togt.ark.kunPapir.map((k) => (
                    <li key={k}>{k}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {togt.opgaver.map((o, i) => (
            <div className={`card udkast ${fund[i].some((f) => f.niveau === 'fejl') ? 'har-fejl' : fund[i].length ? 'har-advarsel' : ''}`} key={o.id}>
              <div className="card-head">
                <div className="card-meta">
                  {o.nr !== undefined ? `Nr. ${Array.isArray(o.nr) ? o.nr.join('+') : o.nr}` : 'Uden nr.'} · {TYPENAVN[o.type]}
                </div>
                <button className="btn btn-ghost btn-small" onClick={() => sletOpgave(i)}>
                  🗑 Slet opgave
                </button>
              </div>
              {fund[i].length > 0 && (
                <ul className="fund">
                  {fund[i].map((f: Fund, k) => (
                    <li key={k} className={`fund-${f.niveau}`}>
                      {f.niveau === 'fejl' ? '⛔' : '⚠️'} {f.tekst}
                    </li>
                  ))}
                </ul>
              )}
              <label className="felt-label">
                Historie
                <textarea className="tekstfelt" rows={2} value={o.story} onChange={(e) => setOpgave(i, { ...o, story: e.target.value })} />
              </label>
              <div className="togt-felter">
                <label className="felt-label grow">
                  Spørgsmål
                  <input className="name-input" value={o.question} onChange={(e) => setOpgave(i, { ...o, question: e.target.value })} />
                </label>
                <label className="felt-label">
                  Regnestykke
                  <input className="name-input" value={o.regnestykke ?? ''} onChange={(e) => setOpgave(i, { ...o, regnestykke: e.target.value || undefined })} />
                </label>
              </div>
              <div className="felt-label">
                Facit
                <FacitFelt o={o} onChange={(n) => setOpgave(i, n)} />
              </div>
              <label className="felt-label">
                Hint 1 (lille skub)
                <input className="name-input" value={o.hints?.[0] ?? ''} onChange={(e) => setHint(i, 0, e.target.value)} />
              </label>
              <label className="felt-label">
                Hint 2 (metode, uden facit)
                <textarea className="tekstfelt" rows={2} value={o.hints?.[1] ?? ''} onChange={(e) => setHint(i, 1, e.target.value)} />
              </label>
            </div>
          ))}

          <div className="card gem-bar">
            <div>
              <b>{togt.opgaver.length} opgaver</b>
              <span className="muted small">
                {' '}
                · {fejl} fejl · {advarsler} advarsler
              </span>
            </div>
            <div className="btn-row left">
              <button className="btn btn-ghost" onClick={() => window.confirm('Kassér udkastet? Scanningen er allerede betalt.') && onKasser()}>
                Kassér
              </button>
              <button className="btn btn-primary btn-big" disabled={fejl > 0 || togt.opgaver.length === 0 || !togt.title.trim()} onClick={() => onGem(togt)}>
                Gem togtet ⛵
              </button>
            </div>
            {fejl > 0 && <p className="muted small">Ret eller slet opgaverne med ⛔, før togtet kan gemmes.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
