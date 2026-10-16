import { useState } from 'react'
import { appNavn, useTema } from '../tema'
import { lavKodekort } from '../lib/kodekort'

interface Props {
  familiekode: string
  gendannelseskode: string
  onFaerdig: () => void
}

/** Vis familiekode og gendannelseskode én gang, og hjælp familien med at gemme dem. */
export function GemKoder({ familiekode, gendannelseskode, onFaerdig }: Props) {
  const t = useTema()
  const [gemt, setGemt] = useState(false)
  const [besked, setBesked] = useState<string | null>(null)
  const tekst = `${appNavn(t)}\nFamiliekode: ${familiekode}\nGendannelseskode: ${gendannelseskode}\n${location.origin}`

  async function kopier() {
    try {
      await navigator.clipboard.writeText(tekst)
      setBesked('Koderne er kopieret. Sæt dem ind i fx Noter.')
    } catch {
      setBesked('Kunne ikke kopiere – skriv koderne af i stedet.')
    }
  }

  async function del() {
    try {
      await navigator.share({ title: `${appNavn(t)} – koder`, text: tekst })
    } catch {
      /* brugeren lukkede delingen */
    }
  }

  async function download() {
    try {
      const blob = await lavKodekort({ appNavn: appNavn(t), flag: t.flag, familiekode, gendannelseskode, adresse: location.origin })
      const href = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      a.download = `kaptajn-tal-kodekort.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(href), 1000)
      setBesked('Kodekortet er gemt. Print det, eller læg det i Billeder.')
    } catch {
      setBesked('Kunne ikke lave kodekortet – skriv koderne af i stedet.')
    }
  }

  return (
    <div className="gem-koder">
      <h2 className="card-title">🔐 Gem jeres koder</h2>
      <p>Gendannelseskoden vises kun nu. Gem begge koder et sikkert sted, så I kan finde skatten igen, hvis I glemmer familiekoden.</p>
      <div className="kode-boks">
        <div className="stat-label">Familiekode</div>
        <div className="kode-stor">{familiekode}</div>
      </div>
      <div className="kode-boks">
        <div className="stat-label">Gendannelseskode</div>
        <div className="kode-stor">{gendannelseskode}</div>
      </div>
      <div className="btn-row left">
        <button className="btn btn-primary btn-small" onClick={() => void download()}>
          🖼️ Download kodekort
        </button>
        {'share' in navigator && (
          <button className="btn btn-ghost btn-small" onClick={() => void del()}>
            📤 Del
          </button>
        )}
        <button className="btn btn-ghost btn-small" onClick={() => void kopier()}>
          📋 Kopiér
        </button>
      </div>
      {besked && <p className="muted small">{besked}</p>}
      <label className="ingen-loesning">
        <input type="checkbox" checked={gemt} onChange={(e) => setGemt(e.target.checked)} /> Vi har gemt koderne
      </label>
      <button className="btn btn-primary" disabled={!gemt} onClick={onFaerdig}>
        Videre
      </button>
    </div>
  )
}
