import { useState } from 'react'
import type {
  Opgave,
  TalOpgave,
  TalraekkeOpgave,
  VaelgOpgave,
  SammenlignOpgave,
  SorterOpgave,
  ValgOpgave,
  FelterOpgave,
  CifferOpgave,
  KoordinatOpgave,
  FlereOpgave,
  BroekOpgave,
  UdtrykOpgave,
} from '../types'
import { talCorrect, parseNumber, sameSet, cifferTargets, formatNumber, flereCorrect, broekCorrect, udtrykCorrect } from '../lib/check'
import { laesUdtryk } from '../lib/matematik'
import { Mat } from './Mat'

export type Status = 'open' | 'correct' | 'revealed'

interface RProps<T> {
  opgave: T
  status: Status
  onCheck: (ok: boolean) => void
}

/** Vælger den rigtige svar-komponent ud fra opgavens type. */
export function OpgaveView({ opgave, status, onCheck }: RProps<Opgave>) {
  switch (opgave.type) {
    case 'tal':
      return <Tal opgave={opgave} status={status} onCheck={onCheck} />
    case 'talraekke':
      return <Talraekke opgave={opgave} status={status} onCheck={onCheck} />
    case 'vaelg':
      return <Vaelg opgave={opgave} status={status} onCheck={onCheck} />
    case 'sammenlign':
      return <Sammenlign opgave={opgave} status={status} onCheck={onCheck} />
    case 'sorter':
      return <Sorter opgave={opgave} status={status} onCheck={onCheck} />
    case 'valg':
      return <Valg opgave={opgave} status={status} onCheck={onCheck} />
    case 'felter':
      return <Felter opgave={opgave} status={status} onCheck={onCheck} />
    case 'ciffer':
      return <Ciffer opgave={opgave} status={status} onCheck={onCheck} />
    case 'koordinat':
      return <Koordinat opgave={opgave} status={status} onCheck={onCheck} />
    case 'flere':
      return <Flere opgave={opgave} status={status} onCheck={onCheck} />
    case 'broek':
      return <Broek opgave={opgave} status={status} onCheck={onCheck} />
    case 'udtryk':
      return <Udtryk opgave={opgave} status={status} onCheck={onCheck} />
  }
}

function CheckButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button className="btn btn-primary" disabled={disabled} onClick={onClick}>
      Tjek svar ✔
    </button>
  )
}

function cls(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}

// ---------------------------------------------------------------- tal
function Tal({ opgave, status, onCheck }: RProps<TalOpgave>) {
  const [v, setV] = useState('')
  const locked = status !== 'open'
  const submit = () => {
    if (v.trim()) onCheck(talCorrect(opgave, v))
  }
  return (
    <div className="answer-row">
      <input
        className={cls('tal-input', status === 'correct' && 'is-correct', status === 'revealed' && 'is-wrong')}
        inputMode="decimal"
        value={v}
        disabled={locked}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="?"
        autoFocus
        aria-label="Dit svar"
      />
      {opgave.unit && <span className="unit">{opgave.unit}</span>}
      {!locked && <CheckButton disabled={!v.trim()} onClick={submit} />}
    </div>
  )
}

// ---------------------------------------------------------------- talrække
function Talraekke({ opgave, status, onCheck }: RProps<TalraekkeOpgave>) {
  const blanks = opgave.sequence.map((v, i) => (v === null ? i : -1)).filter((i) => i >= 0)
  const [vals, setVals] = useState<string[]>(() => blanks.map(() => ''))
  const locked = status !== 'open'
  const allFilled = vals.every((v) => v.trim() !== '')
  const submit = () => onCheck(blanks.every((_, k) => parseNumber(vals[k]) === opgave.answers[k]))
  let blankNo = -1
  return (
    <div>
      <div className="talraekke">
        {opgave.sequence.map((v, i) => {
          if (v !== null)
            return (
              <div className="tr-box" key={i}>
                {v}
              </div>
            )
          blankNo++
          const k = blankNo
          const ok = parseNumber(vals[k]) === opgave.answers[k]
          return (
            <input
              key={i}
              className={cls('tr-box tr-input', locked && ok && 'is-correct', status === 'revealed' && !ok && 'is-wrong')}
              inputMode="numeric"
              value={status === 'revealed' ? formatNumber(opgave.answers[k]) : vals[k]}
              disabled={locked}
              onChange={(e) => setVals(vals.map((x, j) => (j === k ? e.target.value : x)))}
              onKeyDown={(e) => e.key === 'Enter' && allFilled && submit()}
              aria-label={`Felt ${k + 1}`}
            />
          )
        })}
      </div>
      {!locked && <CheckButton disabled={!allFilled} onClick={submit} />}
    </div>
  )
}

// ---------------------------------------------------------------- vælg (flere rigtige)
function Vaelg({ opgave, status, onCheck }: RProps<VaelgOpgave>) {
  const [sel, setSel] = useState<Set<string>>(new Set())
  const locked = status !== 'open'
  const toggle = (item: string) => {
    const n = new Set(sel)
    if (n.has(item)) n.delete(item)
    else n.add(item)
    setSel(n)
  }
  return (
    <div>
      <div className="chips">
        {opgave.items.map((item) => {
          const isCorrect = opgave.correct.includes(item)
          return (
            <button
              key={item}
              className={cls(
                'chip',
                sel.has(item) && 'on',
                locked && isCorrect && 'is-correct',
                status === 'revealed' && sel.has(item) && !isCorrect && 'is-wrong',
              )}
              disabled={locked}
              onClick={() => toggle(item)}
            >
              {item}
            </button>
          )
        })}
      </div>
      {!locked && <CheckButton disabled={sel.size === 0} onClick={() => onCheck(sameSet(sel, opgave.correct))} />}
    </div>
  )
}

// ---------------------------------------------------------------- sammenlign
function Sammenlign({ opgave, status, onCheck }: RProps<SammenlignOpgave>) {
  const [sym, setSym] = useState<'>' | '<' | '=' | null>(null)
  const locked = status !== 'open'
  return (
    <div>
      <div className="compare">
        <div className="compare-box">{opgave.left}</div>
        <div className="symbols">
          {(['>', '<', '='] as const).map((s) => (
            <button
              key={s}
              className={cls(
                'chip chip-sym',
                sym === s && 'on',
                locked && s === opgave.answer && 'is-correct',
                status === 'revealed' && sym === s && s !== opgave.answer && 'is-wrong',
              )}
              disabled={locked}
              onClick={() => setSym(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="compare-box">{opgave.right}</div>
      </div>
      {!locked && <CheckButton disabled={sym === null} onClick={() => onCheck(sym === opgave.answer)} />}
    </div>
  )
}

// ---------------------------------------------------------------- sortér
function Sorter({ opgave, status, onCheck }: RProps<SorterOpgave>) {
  const [order, setOrder] = useState<string[]>([])
  const locked = status !== 'open'
  const remaining = opgave.items.filter((i) => !order.includes(i))
  const shown = status === 'revealed' ? opgave.sorted : order
  return (
    <div>
      <div className="sorter-row">
        <span className="sorter-label">Mindste →</span>
        {shown.length === 0 && <span className="sorter-empty">Tryk på tallene nedenfor i rækkefølge</span>}
        {shown.map((item, i) => (
          <button
            key={item}
            className={cls('chip', locked && item === opgave.sorted[i] && 'is-correct', status === 'revealed' && 'is-correct')}
            disabled={locked}
            onClick={() => setOrder(order.filter((x) => x !== item))}
            title="Tryk for at fjerne"
          >
            {item}
          </button>
        ))}
        <span className="sorter-label">→ Største</span>
      </div>
      {!locked && (
        <div className="chips">
          {remaining.map((item) => (
            <button key={item} className="chip" onClick={() => setOrder([...order, item])}>
              {item}
            </button>
          ))}
        </div>
      )}
      {!locked && (
        <CheckButton
          disabled={order.length !== opgave.items.length}
          onClick={() => onCheck(order.every((v, i) => v === opgave.sorted[i]))}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------- valg (ét rigtigt)
function Valg({ opgave, status, onCheck }: RProps<ValgOpgave>) {
  const [sel, setSel] = useState<string | null>(null)
  const locked = status !== 'open'
  return (
    <div>
      <div className="chips">
        {opgave.options.map((o) => (
          <button
            key={o}
            className={cls(
              'chip',
              sel === o && 'on',
              locked && o === opgave.answer && 'is-correct',
              status === 'revealed' && sel === o && o !== opgave.answer && 'is-wrong',
            )}
            disabled={locked}
            onClick={() => setSel(o)}
          >
            {o}
          </button>
        ))}
      </div>
      {!locked && <CheckButton disabled={sel === null} onClick={() => onCheck(sel === opgave.answer)} />}
    </div>
  )
}

// ---------------------------------------------------------------- felter (brøkdel)
function Felter({ opgave, status, onCheck }: RProps<FelterOpgave>) {
  const [sel, setSel] = useState<Set<number>>(new Set())
  const locked = status !== 'open'
  const toggle = (i: number) => {
    const n = new Set(sel)
    if (n.has(i)) n.delete(i)
    else n.add(i)
    setSel(n)
  }
  return (
    <div>
      <div className="felter" style={{ gridTemplateColumns: `repeat(${opgave.cols}, 1fr)` }}>
        {Array.from({ length: opgave.total }, (_, i) => (
          <button
            key={i}
            className={cls(
              'felt',
              sel.has(i) && 'on',
              status === 'correct' && sel.has(i) && 'is-correct',
              status === 'revealed' && i < opgave.answer && 'is-correct',
            )}
            disabled={locked}
            onClick={() => toggle(i)}
            aria-label={`Felt ${i + 1}`}
          />
        ))}
      </div>
      <p className="felter-count">
        Du har valgt <b>{sel.size}</b> af {opgave.total} felter
      </p>
      {!locked && <CheckButton disabled={sel.size === 0} onClick={() => onCheck(sel.size === opgave.answer)} />}
    </div>
  )
}

// ---------------------------------------------------------------- ciffer (pladsværdi)
function Ciffer({ opgave, status, onCheck }: RProps<CifferOpgave>) {
  const targets = cifferTargets(opgave.numbers, opgave.place)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const locked = status !== 'open'
  const toggle = (k: string) => {
    const n = new Set(sel)
    if (n.has(k)) n.delete(k)
    else n.add(k)
    setSel(n)
  }
  return (
    <div>
      <div className="ciffer-list">
        {opgave.numbers.map((num, ni) => (
          <div className="ciffer-tal" key={ni}>
            {num.split('').map((d, di) => {
              const k = `${ni}-${di}`
              return (
                <button
                  key={k}
                  className={cls(
                    'digit',
                    sel.has(k) && 'on',
                    locked && targets.has(k) && 'is-correct',
                    status === 'revealed' && sel.has(k) && !targets.has(k) && 'is-wrong',
                  )}
                  disabled={locked}
                  onClick={() => toggle(k)}
                >
                  {d}
                </button>
              )
            })}
          </div>
        ))}
      </div>
      {!locked && <CheckButton disabled={sel.size === 0} onClick={() => onCheck(sameSet(sel, targets))} />}
    </div>
  )
}

// ---------------------------------------------------------------- koordinat
function Koordinat({ opgave, status, onCheck }: RProps<KoordinatOpgave>) {
  const [x, setX] = useState('')
  const [y, setY] = useState('')
  const locked = status !== 'open'
  const filled = x.trim() !== '' && y.trim() !== ''
  const submit = () => filled && onCheck(parseNumber(x) === opgave.answer[0] && parseNumber(y) === opgave.answer[1])
  const inputCls = (ok: boolean) => cls('tal-input tal-input-small', locked && ok && 'is-correct', status === 'revealed' && !ok && 'is-wrong')
  return (
    <div className="answer-row">
      <span className="koord-paren">(</span>
      <input
        className={inputCls(parseNumber(x) === opgave.answer[0])}
        inputMode="numeric"
        value={status === 'revealed' ? String(opgave.answer[0]) : x}
        disabled={locked}
        onChange={(e) => setX(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="x"
        aria-label="x"
        autoFocus
      />
      <span className="koord-paren">;</span>
      <input
        className={inputCls(parseNumber(y) === opgave.answer[1])}
        inputMode="numeric"
        value={status === 'revealed' ? String(opgave.answer[1]) : y}
        disabled={locked}
        onChange={(e) => setY(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="y"
        aria-label="y"
      />
      <span className="koord-paren">)</span>
      {!locked && <CheckButton disabled={!filled} onClick={submit} />}
    </div>
  )
}

// ---------------------------------------------------------------- flere løsninger
function Flere({ opgave, status, onCheck }: RProps<FlereOpgave>) {
  const [vals, setVals] = useState<string[]>(() => Array(Math.max(2, opgave.answers.length)).fill(''))
  const [ingen, setIngen] = useState(false)
  const locked = status !== 'open'
  const v = opgave.variabel ?? 'x'
  const udfyldt = ingen || vals.some((x) => x.trim() !== '')
  const submit = () => udfyldt && onCheck(flereCorrect(opgave, vals, ingen))
  return (
    <div>
      <div className="flere-felter">
        {vals.map((val, i) => (
          <label className="flere-felt" key={i}>
            <span className="koord-paren">{v} =</span>
            <input
              className={cls('tal-input tal-input-small', status === 'correct' && 'is-correct', status === 'revealed' && 'is-wrong')}
              inputMode="decimal"
              value={val}
              disabled={locked || ingen}
              onChange={(e) => setVals(vals.map((x, j) => (j === i ? e.target.value : x)))}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              aria-label={`Løsning ${i + 1}`}
              autoFocus={i === 0}
            />
            {i < vals.length - 1 && <span className="muted">eller</span>}
          </label>
        ))}
        {!locked && !ingen && vals.length < 4 && (
          <button className="btn btn-ghost btn-small" onClick={() => setVals([...vals, ''])}>
            + Flere
          </button>
        )}
      </div>
      <label className="ingen-loesning">
        <input type="checkbox" checked={ingen} disabled={locked} onChange={(e) => setIngen(e.target.checked)} /> Ingen løsning
      </label>
      <p className="muted small">Skriv hver løsning i sit eget felt. Rækkefølgen er lige meget, og tomme felter tæller ikke.</p>
      {!locked && <CheckButton disabled={!udfyldt} onClick={submit} />}
    </div>
  )
}

// ---------------------------------------------------------------- brøk
function Broek({ opgave, status, onCheck }: RProps<BroekOpgave>) {
  const [t, setT] = useState('')
  const [n, setN] = useState('')
  const locked = status !== 'open'
  const submit = () => t.trim() && onCheck(broekCorrect(opgave, t, n))
  const c = cls('tal-input tal-input-small broek-input', status === 'correct' && 'is-correct', status === 'revealed' && 'is-wrong')
  return (
    <div className="answer-row">
      <div className="broek-indtast">
        <input className={c} inputMode="numeric" value={t} disabled={locked} onChange={(e) => setT(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} aria-label="Tæller" autoFocus />
        <div className="broek-streg" />
        <input className={c} inputMode="numeric" value={n} disabled={locked} onChange={(e) => setN(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} aria-label="Nævner" placeholder="1" />
      </div>
      {opgave.forkortet && <span className="muted small">Forkort brøken mest muligt.</span>}
      {!locked && <CheckButton disabled={!t.trim()} onClick={submit} />}
    </div>
  )
}

// ---------------------------------------------------------------- udtryk
function Udtryk({ opgave, status, onCheck }: RProps<UdtrykOpgave>) {
  const [v, setV] = useState('')
  const locked = status !== 'open'
  const kanLaeses = v.trim() === '' || laesUdtryk(v) !== null
  const submit = () => v.trim() && kanLaeses && onCheck(udtrykCorrect(opgave, v))
  return (
    <div>
      <div className="answer-row">
        <input
          className={cls('tal-input udtryk-input', status === 'correct' && 'is-correct', status === 'revealed' && 'is-wrong')}
          value={v}
          disabled={locked}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="fx 5x + 3"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Dit udtryk"
          autoFocus
        />
        {!locked && <CheckButton disabled={!v.trim() || !kanLaeses} onClick={submit} />}
      </div>
      {v.trim() && kanLaeses && (
        <p className="muted small">
          Du har skrevet: <Mat tekst={v} />
        </p>
      )}
      {!kanLaeses && <p className="muted small">Udtrykket kan ikke læses endnu. Skriv x² som x^2 og √ som sqrt(…).</p>}
    </div>
  )
}
